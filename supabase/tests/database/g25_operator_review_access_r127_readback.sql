select json_build_object(
  'operator_tables', (
    select count(*) from information_schema.tables
    where table_schema = 'private'
      and table_name in ('brain_operator_principals', 'brain_operator_auth_links')
  ),
  'review_projection_columns', (
    select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'standard_change_review_packets'
      and column_name in (
        'workspace_id', 'subject_id',
        'operator_projection_audience', 'operator_projection_purpose'
      )
  ),
  'new_constraints', (
    select count(*) from pg_constraint
    where conname in (
      'brain_workspaces_id_subject_owner_unique',
      'standard_change_review_packets_operator_scope_all_or_none',
      'standard_change_review_packets_workspace_subject_owner_fk'
    )
  ),
  'access_receipt_table', exists(
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'brain_access_receipts'
  ),
  'access_receipt_rls', (
    select relrowsecurity and relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'brain_access_receipts'
  ),
  'authenticated_receipt_table_access', has_table_privilege(
    'authenticated', 'public.brain_access_receipts', 'select,insert,update,delete'
  ),
  'service_receipt_table_access', has_table_privilege(
    'service_role', 'public.brain_access_receipts', 'select,insert,update,delete'
  ),
  'authenticated_rpc_execute', has_function_privilege(
    'authenticated', 'public.get_operator_pending_standard_change_review_v1(uuid)', 'execute'
  ),
  'anonymous_rpc_execute', has_function_privilege(
    'anon', 'public.get_operator_pending_standard_change_review_v1(uuid)', 'execute'
  ),
  'service_rpc_execute', has_function_privilege(
    'service_role', 'public.get_operator_pending_standard_change_review_v1(uuid)', 'execute'
  ),
  'operator_identity_rows', (
    (select count(*) from private.brain_operator_principals) +
    (select count(*) from private.brain_operator_auth_links)
  ),
  'bound_packet_rows', (
    select count(*) from public.standard_change_review_packets
    where workspace_id is not null
       or subject_id is not null
       or operator_projection_audience is not null
       or operator_projection_purpose is not null
  ),
  'access_receipt_rows', (select count(*) from public.brain_access_receipts),
  'owner_queue_v4', exists(
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_pending_standard_change_review_v4'
  ),
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
    where version = '20260920170000'
  )
) as result;
