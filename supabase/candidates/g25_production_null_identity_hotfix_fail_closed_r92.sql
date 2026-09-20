-- G25 production null-identity hotfix fail-closed control R92
-- Emergency control only. Disables affected customer actions while retaining required service routes.

BEGIN;

DO $preflight$
DECLARE
  v_expected jsonb := jsonb_build_object(
    'public.get_pending_verifications(uuid)', 'ff5645d77ee87cf085fe0199dcedb056',
    'public.has_role(uuid,app_role)', '69b10171b9fc6bd483b03f5cb5bf7809',
    'public.fix_memory_fact(uuid)', '51d901710dd937d1cf29b1437c5f2bb6',
    'public.touch_memory_fact(uuid)', '84e289e5cf89baab91b9250d6ffe7e16',
    'public.touch_memory_facts(uuid[])', '6d57896b69cc7727e4113b843ab64b31',
    'public.verify_memory_fact(uuid,text,boolean)', 'd65b21eb6b5d329355613fba323c5e80',
    'public.pin_decision(uuid)', '4e4fe71601c7b580d0a9a53bb5c58247'
  );
  v_signature text;
  v_oid regprocedure;
BEGIN
  FOR v_signature IN SELECT jsonb_object_keys(v_expected) LOOP
    v_oid := to_regprocedure(v_signature);
    IF v_oid IS NULL OR md5(pg_get_functiondef(v_oid)) IS DISTINCT FROM v_expected->>v_signature THEN
      RAISE EXCEPTION 'R92 fail-closed preflight drift for %', v_signature;
    END IF;
  END LOOP;
END
$preflight$;

REVOKE EXECUTE ON FUNCTION public.get_pending_verifications(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.fix_memory_fact(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.touch_memory_fact(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.touch_memory_facts(uuid[]) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.verify_memory_fact(uuid, text, boolean) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.pin_decision(uuid) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_pending_verifications(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_memory_fact(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_memory_facts(uuid[]) TO service_role;

COMMIT;
