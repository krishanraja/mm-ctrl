-- Stripe webhook idempotency table.
--
-- Stripe is "at least once" — networks blip, our function 5xx's mid-process,
-- Stripe retries up to 3 days. Without this table, a replayed event would
-- re-grant subscriptions / re-unlock diagnostics on every retry. The
-- function should INSERT ON CONFLICT DO NOTHING and short-circuit if the
-- row already existed.
--
-- We deliberately keep this table small: just (event_id, type, when).
-- It's append-only and has an obvious cleanup story (drop rows older than
-- ~30 days; Stripe's retry window is shorter than that).

CREATE TABLE IF NOT EXISTS public.stripe_events_processed (
  event_id      TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_events_processed_processed_at_idx
  ON public.stripe_events_processed(processed_at);

-- This table is service-role only; the webhook function inserts and reads
-- with the service role key. No end-user access.
ALTER TABLE public.stripe_events_processed ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; explicit policy here just
-- guarantees no path for an authenticated end-user to read it.
CREATE POLICY "service_role_only_stripe_events_processed"
  ON public.stripe_events_processed
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.stripe_events_processed IS
  'Idempotency log for Stripe webhook events. Insert-on-conflict-do-nothing pattern: if the event_id already exists, the webhook has already been processed and the handler should short-circuit.';
