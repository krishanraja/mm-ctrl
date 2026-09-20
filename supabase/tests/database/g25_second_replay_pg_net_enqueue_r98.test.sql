-- G25 second replay pg_net enqueue proof R98.
-- The verification and cleanup companion must run after the worker consumes this request.

DO $test$
DECLARE
  v_request_id bigint;
BEGIN
  IF to_regclass('private.g25_r98_pg_net_probe') IS NOT NULL THEN
    RAISE EXCEPTION 'R98 pg_net probe table already exists';
  END IF;

  CREATE TABLE private.g25_r98_pg_net_probe (
    request_id bigint PRIMARY KEY,
    enqueued_at timestamptz NOT NULL DEFAULT now()
  );

  SELECT net.http_post(
    url := 'http://127.0.0.1:1/g25-r98',
    body := '{"probe":"g25-r98"}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 1000
  ) INTO v_request_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'R98 pg_net did not return a request ID';
  END IF;

  INSERT INTO private.g25_r98_pg_net_probe (request_id)
  VALUES (v_request_id);

  IF NOT EXISTS (
    SELECT 1
    FROM net.http_request_queue
    WHERE id = v_request_id
      AND method = 'POST'
      AND url = 'http://127.0.0.1:1/g25-r98'
      AND timeout_milliseconds = 1000
  ) THEN
    RAISE EXCEPTION 'R98 pg_net queue shape drifted';
  END IF;
END;
$test$;

SELECT
  probe.request_id,
  queue.method,
  queue.url,
  queue.timeout_milliseconds
FROM private.g25_r98_pg_net_probe AS probe
JOIN net.http_request_queue AS queue ON queue.id = probe.request_id;
