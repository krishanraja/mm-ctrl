create temporary table r145_candidate_row_counts (
  table_name text primary key,
  row_count bigint not null
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'brain_subject_profiles',
    'brain_decision_cases',
    'brain_decision_versions',
    'brain_decision_routes',
    'brain_decision_human_priors',
    'brain_decision_questions',
    'brain_decision_answers',
    'brain_decision_calls',
    'brain_decision_outcomes',
    'brain_decision_evidence_atoms',
    'brain_decision_evidence_links',
    'brain_decision_authority_events',
    'brain_decision_authority_revocations',
    'brain_decision_events'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format(
        'insert into r145_candidate_row_counts(table_name, row_count) select %L, count(*) from public.%I',
        table_name,
        table_name
      );
    end if;
  end loop;
end;
$$;

with candidate_tables(table_name) as (
  values
    ('brain_subject_profiles'),
    ('brain_decision_cases'),
    ('brain_decision_versions'),
    ('brain_decision_routes'),
    ('brain_decision_human_priors'),
    ('brain_decision_questions'),
    ('brain_decision_answers'),
    ('brain_decision_calls'),
    ('brain_decision_outcomes'),
    ('brain_decision_evidence_atoms'),
    ('brain_decision_evidence_links'),
    ('brain_decision_authority_events'),
    ('brain_decision_authority_revocations'),
    ('brain_decision_events')
), candidate_routines(routine_name) as (
  values
    ('brain_decision_cipher_aad_sha256'),
    ('brain_decision_validate_ciphertext'),
    ('brain_decision_cipher_guard'),
    ('brain_decision_content_hash_guard'),
    ('brain_decision_authority_revocation_guard'),
    ('brain_decision_artifact_scope_guard'),
    ('brain_decision_draft_guard'),
    ('brain_decision_version_immutable_guard'),
    ('brain_decision_append_only_guard'),
    ('brain_decision_case_identity_guard'),
    ('brain_decision_owned_record_transition_guard'),
    ('brain_decision_timestamp_token'),
    ('brain_decision_evidence_atom_sha256'),
    ('brain_decision_materialize_evidence_atom'),
    ('brain_decision_validate_evidence_atom'),
    ('brain_decision_human_prior_admission_guard'),
    ('brain_decision_source_atom_guard'),
    ('brain_decision_evidence_link_atom_guard'),
    ('brain_decision_referenced_assertion_guard'),
    ('brain_decision_referenced_source_guard'),
    ('brain_decision_snapshot_sha256'),
    ('brain_decision_call_input_sha256'),
    ('brain_decision_call_version_guard'),
    ('brain_decision_call_authority_guard'),
    ('brain_decision_call_event_append'),
    ('brain_decision_case_chronology_guard'),
    ('brain_decision_answer_chronology_guard'),
    ('brain_decision_outcome_chronology_guard'),
    ('brain_decision_case_event_append'),
    ('brain_decision_answer_event_append'),
    ('brain_decision_outcome_event_append'),
    ('seal_brain_decision_version_v1')
), table_catalogue as (
  select
    relation.oid,
    relation.relname,
    relation.relrowsecurity,
    relation.relforcerowsecurity
  from pg_catalog.pg_class relation
  join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
  join candidate_tables candidate on candidate.table_name = relation.relname
  where namespace.nspname = 'public' and relation.relkind = 'r'
), routine_catalogue as (
  select
    routine.oid,
    namespace.nspname,
    routine.proname,
    pg_get_function_identity_arguments(routine.oid) as identity_arguments
  from pg_catalog.pg_proc routine
  join pg_catalog.pg_namespace namespace on namespace.oid = routine.pronamespace
  join candidate_routines candidate on candidate.routine_name = routine.proname
  where namespace.nspname in ('private', 'public')
), trigger_catalogue as (
  select trigger.oid, trigger.tgname, trigger.tgrelid, trigger.tgfoid
  from pg_catalog.pg_trigger trigger
  where not trigger.tgisinternal
    and trigger.tgfoid in (select oid from routine_catalogue)
), catalogue_lines as (
  select 'table|' || relname || '|' || relrowsecurity || '|' || relforcerowsecurity as line
  from table_catalogue
  union all
  select 'function|' || nspname || '.' || proname || '(' || identity_arguments || ')|' || pg_get_functiondef(oid)
  from routine_catalogue
  union all
  select 'trigger|' || tgname || '|' || pg_get_triggerdef(oid, true)
  from trigger_catalogue
  union all
  select 'constraint|' || constraint_row.conname || '|' || pg_get_constraintdef(constraint_row.oid, true)
  from pg_catalog.pg_constraint constraint_row
  where constraint_row.conrelid in (select oid from table_catalogue)
  union all
  select 'index|' || index_row.indexrelid::regclass::text || '|' || pg_get_indexdef(index_row.indexrelid)
  from pg_catalog.pg_index index_row
  where index_row.indrelid in (select oid from table_catalogue)
     or index_row.indexrelid in (
       coalesce(to_regclass('public.brain_workspaces_scope_unique')::oid, 0::oid),
       coalesce(to_regclass('public.brain_assertions_scope_unique')::oid, 0::oid)
     )
), catalogue_digest as (
  select encode(
    sha256(convert_to(coalesce(string_agg(line, E'\n' order by line), ''), 'UTF8')),
    'hex'
  ) as sha256
  from catalogue_lines
)
select jsonb_build_object(
  'candidate_tables', (select count(*) from table_catalogue),
  'candidate_routines', (select count(*) from routine_catalogue),
  'candidate_triggers', (select count(*) from trigger_catalogue),
  'rls_enabled_tables', (select count(*) from table_catalogue where relrowsecurity),
  'rls_forced_tables', (select count(*) from table_catalogue where relforcerowsecurity),
  'candidate_rows', coalesce((select sum(row_count) from r145_candidate_row_counts), 0),
  'shared_scope_indexes',
    (case when to_regclass('public.brain_workspaces_scope_unique') is null then 0 else 1 end)
    + (case when to_regclass('public.brain_assertions_scope_unique') is null then 0 else 1 end),
  'service_select_tables', (
    select count(*) from candidate_tables
    where to_regclass(format('public.%I', table_name)) is not null
      and has_table_privilege('service_role', format('public.%I', table_name), 'SELECT')
  ),
  'service_insert_tables', (
    select count(*) from candidate_tables
    where to_regclass(format('public.%I', table_name)) is not null
      and has_table_privilege('service_role', format('public.%I', table_name), 'INSERT')
  ),
  'ordinary_table_privileges', (
    select count(*)
    from candidate_tables
    cross join (values ('anon'), ('authenticated')) roles(role_name)
    where to_regclass(format('public.%I', table_name)) is not null
      and has_table_privilege(role_name, format('public.%I', table_name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  ),
  'authenticated_rpc_execute', case
    when to_regprocedure('public.seal_brain_decision_version_v1(uuid,uuid,text,text)') is null then false
    else has_function_privilege('authenticated', 'public.seal_brain_decision_version_v1(uuid,uuid,text,text)', 'EXECUTE')
  end,
  'anonymous_rpc_execute', case
    when to_regprocedure('public.seal_brain_decision_version_v1(uuid,uuid,text,text)') is null then false
    else has_function_privilege('anon', 'public.seal_brain_decision_version_v1(uuid,uuid,text,text)', 'EXECUTE')
  end,
  'service_rpc_execute', case
    when to_regprocedure('public.seal_brain_decision_version_v1(uuid,uuid,text,text)') is null then false
    else has_function_privilege('service_role', 'public.seal_brain_decision_version_v1(uuid,uuid,text,text)', 'EXECUTE')
  end,
  'migration_history_rows', (
    select count(*) from supabase_migrations.schema_migrations where version = '20260921100000'
  ),
  'r115_tables', (
    select count(*) from (values
      ('standard_change_requests'),
      ('standard_change_stage_runs'),
      ('standard_change_compilations'),
      ('standard_change_builds'),
      ('standard_change_checks')
    ) preserved(table_name)
    where to_regclass(format('public.%I', table_name)) is not null
  ),
  'catalogue_sha256', (select sha256 from catalogue_digest)
) as result;
