-- G25 second replay pg_net worker verification and cleanup R98.

DO $test$
DECLARE
  v_request_id bigint;
  v_queue_rows integer;
  v_response_rows integer;
  v_error text;
BEGIN
  IF to_regclass('private.g25_r98_pg_net_probe') IS NULL THEN
    RAISE EXCEPTION 'R98 pg_net probe table is absent';
  END IF;

  SELECT request_id
  INTO v_request_id
  FROM private.g25_r98_pg_net_probe;

  SELECT count(*)
  INTO v_queue_rows
  FROM net.http_request_queue
  WHERE id = v_request_id;

  SELECT count(*), max(error_msg)
  INTO v_response_rows, v_error
  FROM net._http_response
  WHERE id = v_request_id;

  IF v_queue_rows <> 0 THEN
    RAISE EXCEPTION 'R98 pg_net worker did not consume the request';
  END IF;

  IF v_response_rows <> 1 OR coalesce(length(v_error), 0) = 0 THEN
    RAISE EXCEPTION 'R98 pg_net worker did not record the expected loopback error';
  END IF;

  DELETE FROM net._http_response
  WHERE id = v_request_id;

  DELETE FROM net.http_request_queue
  WHERE id = v_request_id;

  DROP TABLE private.g25_r98_pg_net_probe;

  IF to_regclass('private.g25_r98_pg_net_probe') IS NOT NULL
    OR EXISTS (SELECT 1 FROM net._http_response WHERE id = v_request_id)
    OR EXISTS (SELECT 1 FROM net.http_request_queue WHERE id = v_request_id) THEN
    RAISE EXCEPTION 'R98 pg_net fixture cleanup failed';
  END IF;
END;
$test$;

SELECT
  to_regclass('private.g25_r98_pg_net_probe') IS NULL AS probe_table_clean;
