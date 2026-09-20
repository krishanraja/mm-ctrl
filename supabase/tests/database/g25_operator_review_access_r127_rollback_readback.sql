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
  'access_receipt_table', exists(
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'brain_access_receipts'
  ),
  'operator_rpc', exists(
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_operator_pending_standard_change_review_v1'
  ),
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
