-- R101 target-neutral recovery packet for the eight approved repository-backed jobs.
--
-- This candidate deliberately reads a base URL and a dedicated cron credential
-- from Vault at execution time. It never stores a service-role key in cron.job.
-- The values must be provisioned separately under these names:
--   ctrl_edge_base_url
--   ctrl_cron_secret
--
-- detect-trends-weekly is deliberately absent because detect-trends remains a
-- contained no-op. kit-nudges-email is absent because its function source is not
-- in the repository. Six additional production jobs remain fingerprint-only.

begin;

do $$
declare
  missing text[] := array[]::text[];
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    missing := array_append(missing, 'extension:pg_cron');
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    missing := array_append(missing, 'extension:pg_net');
  end if;
  if to_regprocedure('public.run_brain_adapt(integer)') is null then
    missing := array_append(missing, 'routine:public.run_brain_adapt(integer)');
  end if;
  if to_regprocedure('public.snapshot_north_star()') is null then
    missing := array_append(missing, 'routine:public.snapshot_north_star()');
  end if;
  if (select count(*) from vault.decrypted_secrets where name = 'ctrl_edge_base_url') <> 1 then
    missing := array_append(missing, 'vault:ctrl_edge_base_url');
  end if;
  if (select count(*) from vault.decrypted_secrets where name = 'ctrl_cron_secret') <> 1 then
    missing := array_append(missing, 'vault:ctrl_cron_secret');
  end if;
  if cardinality(missing) > 0 then
    raise exception 'R101 preflight failed: %', array_to_string(missing, ', ');
  end if;
end
$$;

select cron.unschedule(jobid)
from cron.job
where jobname in (
  'brain-adapt-nightly',
  'capture-week',
  'daily-briefing-email',
  'live-headlines-prewarm',
  'memory-sweep-nightly',
  'north-star-daily-snapshot',
  'reactivation-nudge',
  'retention-cleanup'
);

select cron.schedule(
  'memory-sweep-nightly',
  '0 3 * * *',
  $CRON$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_edge_base_url'), '/') || '/functions/v1/memory-sweep',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-CTRL-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $CRON$
);

select cron.schedule(
  'retention-cleanup',
  '0 4 * * *',
  $CRON$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_edge_base_url'), '/') || '/functions/v1/cleanup-expired-data',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-CTRL-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $CRON$
);

select cron.schedule('brain-adapt-nightly', '30 3 * * *', 'select public.run_brain_adapt();');
select cron.schedule('north-star-daily-snapshot', '0 6 * * *', 'select public.snapshot_north_star();');

select cron.schedule(
  'live-headlines-prewarm',
  '30 10 * * *',
  $CRON$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_edge_base_url'), '/') || '/functions/v1/live-headlines?force=1',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-CTRL-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $CRON$
);

select cron.schedule(
  'daily-briefing-email',
  '0 12 * * *',
  $CRON$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_edge_base_url'), '/') || '/functions/v1/send-daily-briefing',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-CTRL-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $CRON$
);

select cron.schedule(
  'reactivation-nudge',
  '0 13 * * *',
  $CRON$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_edge_base_url'), '/') || '/functions/v1/send-reactivation-nudge',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-CTRL-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $CRON$
);

select cron.schedule(
  'capture-week',
  '0 20 * * 0',
  $CRON$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_edge_base_url'), '/') || '/functions/v1/capture-week',
    headers := jsonb_build_object('Content-Type', 'application/json', 'X-CTRL-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'ctrl_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $CRON$
);

commit;
