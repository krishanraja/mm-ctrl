begin;

do $$
declare
  routine_row record;
begin
  for routine_row in
    select
      namespace.nspname,
      routine.proname,
      pg_get_function_identity_arguments(routine.oid) as identity_arguments
    from pg_catalog.pg_proc routine
    join pg_catalog.pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname in ('private', 'public')
      and routine.proname in (
        'brain_decision_cipher_aad_sha256',
        'brain_decision_validate_ciphertext',
        'brain_decision_cipher_guard',
        'brain_decision_content_hash_guard',
        'brain_decision_authority_revocation_guard',
        'brain_decision_artifact_scope_guard',
        'brain_decision_draft_guard',
        'brain_decision_version_immutable_guard',
        'brain_decision_append_only_guard',
        'brain_decision_case_identity_guard',
        'brain_decision_owned_record_transition_guard',
        'brain_decision_timestamp_token',
        'brain_decision_evidence_atom_sha256',
        'brain_decision_materialize_evidence_atom',
        'brain_decision_validate_evidence_atom',
        'brain_decision_human_prior_admission_guard',
        'brain_decision_source_atom_guard',
        'brain_decision_evidence_link_atom_guard',
        'brain_decision_referenced_assertion_guard',
        'brain_decision_referenced_source_guard',
        'brain_decision_snapshot_sha256',
        'brain_decision_call_input_sha256',
        'brain_decision_call_version_guard',
        'brain_decision_call_authority_guard',
        'brain_decision_call_event_append',
        'brain_decision_case_chronology_guard',
        'brain_decision_answer_chronology_guard',
        'brain_decision_outcome_chronology_guard',
        'brain_decision_case_event_append',
        'brain_decision_answer_event_append',
        'brain_decision_outcome_event_append',
        'seal_brain_decision_version_v1'
      )
  loop
    execute format(
      'drop function if exists %I.%I(%s) cascade',
      routine_row.nspname,
      routine_row.proname,
      routine_row.identity_arguments
    );
  end loop;
end;
$$;

drop table if exists public.brain_decision_events cascade;
drop table if exists public.brain_decision_authority_revocations cascade;
drop table if exists public.brain_decision_authority_events cascade;
drop table if exists public.brain_decision_evidence_links cascade;
drop table if exists public.brain_decision_outcomes cascade;
drop table if exists public.brain_decision_calls cascade;
drop table if exists public.brain_decision_answers cascade;
drop table if exists public.brain_decision_questions cascade;
drop table if exists public.brain_decision_human_priors cascade;
drop table if exists public.brain_decision_evidence_atoms cascade;
drop table if exists public.brain_decision_routes cascade;
drop table if exists public.brain_decision_versions cascade;
drop table if exists public.brain_decision_cases cascade;
drop table if exists public.brain_subject_profiles cascade;

drop index if exists public.brain_workspaces_scope_unique;
drop index if exists public.brain_assertions_scope_unique;

commit;
