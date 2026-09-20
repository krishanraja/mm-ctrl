select json_build_object(
  'binding_columns', (
    select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'standard_change_review_packets'
      and column_name in ('operator_projection_bound_at', 'operator_projection_bound_by')
  ),
  'six_field_scope_constraint', exists(
    select 1 from pg_constraint
    where conrelid = 'public.standard_change_review_packets'::regclass
      and conname = 'standard_change_review_packets_operator_scope_all_or_none'
      and pg_get_constraintdef(oid) like '%operator_projection_bound_at%'
      and pg_get_constraintdef(oid) like '%operator_projection_bound_by%'
  ),
  'authenticated_rpc_execute', has_function_privilege(
    'authenticated',
    'public.prepare_and_bind_standard_change_operator_projection_v1(uuid,text,uuid)',
    'execute'
  ),
  'anonymous_rpc_execute', has_function_privilege(
    'anon',
    'public.prepare_and_bind_standard_change_operator_projection_v1(uuid,text,uuid)',
    'execute'
  ),
  'service_rpc_execute', has_function_privilege(
    'service_role',
    'public.prepare_and_bind_standard_change_operator_projection_v1(uuid,text,uuid)',
    'execute'
  ),
  'bound_packet_rows', (
    select count(*) from public.standard_change_review_packets
    where operator_projection_bound_at is not null
       or operator_projection_bound_by is not null
  ),
  'r127_operator_tables', (
    select count(*) from information_schema.tables
    where table_schema = 'private'
      and table_name in ('brain_operator_principals', 'brain_operator_auth_links')
  ),
  'r127_operator_rpc', to_regprocedure(
    'public.get_operator_pending_standard_change_review_v1(uuid)'
  ) is not null,
  'r123_owner_queue', to_regprocedure(
    'public.get_pending_standard_change_review_v4()'
  ) is not null,
  'r115_tables', (
    select count(*) from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'standard_change_requests', 'standard_change_stage_runs',
        'standard_change_compilations', 'standard_change_builds',
        'standard_change_checks'
      )
  ),
  'migration_history_rows', (
    select count(*) from supabase_migrations.schema_migrations
    where version = '20260920190000'
  )
) as result;
