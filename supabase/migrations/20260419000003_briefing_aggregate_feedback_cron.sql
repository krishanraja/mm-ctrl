-- Briefing v2 Item 4 (continued): in-database aggregation + nightly cron.
--
-- This makes the "3+ not_usefuls on the same lens signature auto-promote to
-- a -0.4 weight delta" loop run without an HTTP roundtrip or a service-role
-- key stored in postgres. The TypeScript edge function (briefing-aggregate-
-- feedback) remains for ad-hoc / admin invocation — both call the same
-- logical rules, but pg_cron uses the native SQL function.

-- 1. Aggregator function. SECURITY DEFINER so it can write to
--    briefing_lens_feedback regardless of the invoker's RLS context. Owned
--    by postgres so only the role that owns it can modify — cron runs under
--    the postgres role on Supabase.
CREATE OR REPLACE FUNCTION public.sp_aggregate_briefing_feedback(
  window_days integer DEFAULT 30,
  promote_threshold integer DEFAULT 3
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $fn$
DECLARE
  scanned_rows integer := 0;
  bucket_count integer := 0;
  promoted_count integer := 0;
  touched_users integer := 0;
  since_ts timestamptz;
BEGIN
  since_ts := now() - make_interval(days => window_days);

  WITH v2_briefings AS (
    SELECT
      b.id,
      b.user_id,
      b.context_snapshot->'lens' AS lens
    FROM briefings b
    WHERE b.context_snapshot IS NOT NULL
      AND jsonb_typeof(b.context_snapshot->'lens') = 'array'
  ),
  feedback_rows AS (
    SELECT f.lens_item_id, f.briefing_id
    FROM briefing_feedback f
    WHERE f.reaction = 'not_useful'
      AND f.lens_item_id IS NOT NULL
      AND f.created_at >= since_ts
  ),
  joined AS (
    SELECT
      b.user_id,
      li->>'type' AS lens_item_type,
      li->>'text' AS lens_item_text
    FROM feedback_rows f
    JOIN v2_briefings b ON b.id = f.briefing_id
    CROSS JOIN LATERAL jsonb_array_elements(b.lens) AS li
    WHERE li->>'id' = f.lens_item_id
      AND li->>'text' IS NOT NULL
      AND li->>'type' IS NOT NULL
  ),
  signature_counts AS (
    SELECT
      user_id,
      lens_item_type,
      lens_item_text,
      encode(digest(
        CASE
          WHEN lens_item_type = 'interest_beat'   THEN 'interest_beat'
          WHEN lens_item_type = 'interest_entity' THEN 'interest_entity'
          WHEN lens_item_type = 'watchlist'       THEN 'entity'
          WHEN lens_item_type = 'pattern'         THEN 'pattern'
          ELSE 'goal'
        END
        || '|'
        || regexp_replace(lower(btrim(lens_item_text)), '\s+', ' ', 'g'),
        'sha256'
      ), 'hex') AS signature,
      COUNT(*) AS cnt
    FROM joined
    GROUP BY user_id, lens_item_type, lens_item_text
  ),
  -- Pick the most-frequent (type, text) per (user, signature) so the stored
  -- row is stable even when the same logical signature appears with slight
  -- text variations (e.g. capitalisation drift).
  best_per_signature AS (
    SELECT DISTINCT ON (user_id, signature)
      user_id, signature, lens_item_type, lens_item_text, cnt
    FROM signature_counts
    ORDER BY user_id, signature, cnt DESC
  ),
  promoted_rows AS (
    INSERT INTO briefing_lens_feedback AS target
      (user_id, lens_item_signature, lens_item_type, lens_item_text,
       weight_delta, source, evidence_count, is_active, updated_at)
    SELECT
      user_id,
      signature,
      lens_item_type,
      lens_item_text,
      -0.4,
      'not_useful_aggregate',
      cnt,
      true,
      now()
    FROM best_per_signature
    WHERE cnt >= promote_threshold
    ON CONFLICT (user_id, lens_item_signature, source)
    DO UPDATE SET
      evidence_count = EXCLUDED.evidence_count,
      lens_item_text = EXCLUDED.lens_item_text,
      weight_delta = EXCLUDED.weight_delta,
      is_active = true,
      updated_at = now()
    RETURNING user_id
  )
  SELECT
    (SELECT COUNT(*) FROM joined),
    (SELECT COUNT(*) FROM best_per_signature),
    (SELECT COUNT(*) FROM promoted_rows),
    (SELECT COUNT(DISTINCT user_id) FROM promoted_rows)
  INTO scanned_rows, bucket_count, promoted_count, touched_users;

  RETURN jsonb_build_object(
    'scanned_feedback_rows', scanned_rows,
    'buckets', bucket_count,
    'promoted', promoted_count,
    'users_touched', touched_users,
    'window_days', window_days,
    'promote_threshold', promote_threshold,
    'run_at', now()
  );
END;
$fn$;

COMMENT ON FUNCTION public.sp_aggregate_briefing_feedback IS
  'Promotes lens signatures with >= promote_threshold not_useful reactions in the last window_days to a -0.4 weight delta. Idempotent; safe to re-run.';

-- Revoke from PUBLIC so end users cannot run the aggregator; allow postgres
-- (which pg_cron runs as) to execute.
REVOKE ALL ON FUNCTION public.sp_aggregate_briefing_feedback(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sp_aggregate_briefing_feedback(integer, integer) TO postgres;

-- 2. Schedule it nightly at 03:07 UTC. Off-the-hour to dodge the horde of
--    other cron jobs that fire exactly on the hour. Idempotent schedule:
--    remove any prior schedule with the same name before re-adding.
DO $$
BEGIN
  PERFORM cron.unschedule('briefing-aggregate-feedback-nightly')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'briefing-aggregate-feedback-nightly'
  );
END $$;

SELECT cron.schedule(
  'briefing-aggregate-feedback-nightly',
  '7 3 * * *',
  $cron$ SELECT public.sp_aggregate_briefing_feedback(); $cron$
);
