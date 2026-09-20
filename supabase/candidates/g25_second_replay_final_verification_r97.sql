-- G25 second blank replay final verification R97
-- Read only. Returns compact evidence after all ordered replay stages complete.

with expected_extensions(name, schema_name) as (
  values
    ('pg_cron', 'pg_catalog'),
    ('pg_net', 'public'),
    ('pg_stat_statements', 'extensions'),
    ('pgcrypto', 'extensions'),
    ('plpgsql', 'pg_catalog'),
    ('supabase_vault', 'vault'),
    ('uuid-ossp', 'extensions'),
    ('vector', 'public')
), extension_evidence as (
  select
    count(*) as expected_count,
    count(n.nspname) as matched_count
  from expected_extensions x
  left join pg_extension e on e.extname = x.name
  left join pg_namespace n on n.oid = e.extnamespace and n.nspname = x.schema_name
), expected_functions(signature, expected_digest, expect_anon, expect_service) as (
  values
    ('public.get_pending_verifications(uuid)', 'ff5645d77ee87cf085fe0199dcedb056', false, true),
    ('public.has_role(uuid,app_role)', '69b10171b9fc6bd483b03f5cb5bf7809', true, true),
    ('public.fix_memory_fact(uuid)', '51d901710dd937d1cf29b1437c5f2bb6', false, false),
    ('public.touch_memory_fact(uuid)', '84e289e5cf89baab91b9250d6ffe7e16', false, true),
    ('public.touch_memory_facts(uuid[])', '6d57896b69cc7727e4113b843ab64b31', false, true),
    ('public.verify_memory_fact(uuid,text,boolean)', 'd65b21eb6b5d329355613fba323c5e80', false, false),
    ('public.pin_decision(uuid)', '4e4fe71601c7b580d0a9a53bb5c58247', false, false)
), function_evidence as (
  select
    count(*) as expected_count,
    count(*) filter (
      where to_regprocedure(signature) is not null
        and md5(pg_get_functiondef(to_regprocedure(signature))) = expected_digest
        and has_function_privilege('anon', to_regprocedure(signature), 'execute') = expect_anon
        and has_function_privilege('authenticated', to_regprocedure(signature), 'execute')
        and has_function_privilege('service_role', to_regprocedure(signature), 'execute') = expect_service
        and not exists (
          select 1
          from pg_proc p
          cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
          where p.oid = to_regprocedure(signature)
            and acl.grantee = 0
            and acl.privilege_type = 'EXECUTE'
        )
    ) as matched_count
  from expected_functions
), expected_storage_policies(policy_name) as (
  values
    ('Anyone can view QR codes via signed URL'),
    ('Facilitators can upload QR codes'),
    ('Facilitators can view QR codes'),
    ('Public read access to QR codes'),
    ('Users can delete their own briefing audio'),
    ('Users can delete their own documents'),
    ('Users can delete their own skill packages'),
    ('Users can read their own briefing audio'),
    ('Users can read their own documents'),
    ('Users can read their own skill packages'),
    ('Users can upload their own briefing audio'),
    ('Users can upload their own documents')
), safe_plane as (
  select
    (select count(*) from storage.buckets where id in ('ctrl-briefings', 'documents', 'post-session-qr', 'pre-workshop-qr', 'skill-packages')) as bucket_count,
    (select count(*)
      from expected_storage_policies x
      join pg_policies p
        on p.schemaname = 'storage'
        and p.tablename = 'objects'
        and p.policyname = x.policy_name) as policy_count,
    (select count(*)
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename in ('bottleneck_submissions', 'effortless_map_items', 'voting_results')) as realtime_table_count
)
select
  extension_evidence.expected_count as expected_extension_count,
  extension_evidence.matched_count as matched_extension_count,
  function_evidence.expected_count as expected_function_count,
  function_evidence.matched_count as matched_function_count,
  safe_plane.bucket_count,
  safe_plane.policy_count,
  safe_plane.realtime_table_count,
  (select count(*) from auth.users) as auth_user_count,
  (select count(*) from public.profiles) as profile_count
from extension_evidence, function_evidence, safe_plane;
