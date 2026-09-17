-- G25 R28 stable-principal login-removal context candidate.
-- This is not a migration and must not be applied to a linked database.
-- It reads authentication, subject identity, operator identity, custody and access
-- as separate relationships. It never proposes or performs subject erasure.

create or replace function private.brain_stable_principal_removal_context(
  p_target_auth_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  context_without_evidence jsonb;
  context_observed_at timestamptz := statement_timestamp();
begin
  if p_target_auth_user_id is null then
    raise exception 'stable_principal_removal_input_required';
  end if;

  perform 1
  from auth.users target_user
  where target_user.id = p_target_auth_user_id
  for key share;

  if not found then
    raise exception 'stable_principal_removal_auth_user_not_found';
  end if;

  with
  target_subjects as (
    select subject_link.subject_principal_id
    from private.brain_subject_auth_links subject_link
    where subject_link.user_id = p_target_auth_user_id
      and subject_link.revoked_at is null
  ),
  target_operators as (
    select operator_link.operator_principal_id
    from private.brain_operator_auth_links operator_link
    where operator_link.user_id = p_target_auth_user_id
      and operator_link.revoked_at is null
  ),
  workspace_state as (
    select
      workspace.id as workspace_id,
      workspace.subject_id as subject_principal_id,
      custody.id as custody_principal_id,
      custody.closed_at,
      assignment.operator_principal_id as current_operator_principal_id,
      coalesce(
        (
          select jsonb_agg(to_jsonb(active_link.user_id::text) order by active_link.user_id)
          from private.brain_operator_auth_links active_link
          where active_link.operator_principal_id = assignment.operator_principal_id
            and active_link.revoked_at is null
        ),
        '[]'::jsonb
      ) as current_operator_active_auth_user_ids,
      exists (
        select 1
        from public.brain_workspace_roles role_row
        where role_row.workspace_id = workspace.id
          and role_row.user_id = p_target_auth_user_id
          and role_row.revoked_at is null
      ) as target_has_current_role,
      exists (
        select 1
        from public.brain_audience_grants grant_row
        where grant_row.workspace_id = workspace.id
          and grant_row.grantee_user_id = p_target_auth_user_id
          and grant_row.revoked_at is null
          and (grant_row.expires_at is null or grant_row.expires_at > context_observed_at)
      ) as target_has_current_grant
    from public.brain_workspaces workspace
    join private.brain_custody_principals custody
      on custody.workspace_id = workspace.id
    left join private.brain_custody_assignments assignment
      on assignment.custody_principal_id = custody.id
      and assignment.ended_at is null
  ),
  related_workspaces as (
    select state.*
    from workspace_state state
    where state.subject_principal_id in (select subject_principal_id from target_subjects)
      or state.current_operator_principal_id in (select operator_principal_id from target_operators)
      or state.target_has_current_role
      or state.target_has_current_grant
  ),
  workspace_context as (
    select
      state.workspace_id,
      jsonb_build_object(
        'workspace_id', state.workspace_id::text,
        'subject_principal_id', state.subject_principal_id::text,
        'custody_principal_id', state.custody_principal_id::text,
        'custody_status', case
          when state.closed_at is not null then 'closed'
          when state.current_operator_principal_id is null
            or jsonb_array_length(state.current_operator_active_auth_user_ids) = 0
            then 'transfer_required'
          else 'active'
        end,
        'current_operator_principal_id', case
          when state.current_operator_principal_id is null then null
          else to_jsonb(state.current_operator_principal_id::text)
        end,
        'current_operator_active_auth_user_ids', state.current_operator_active_auth_user_ids,
        'target_has_current_role', state.target_has_current_role,
        'target_has_current_grant', state.target_has_current_grant
      ) as value
    from related_workspaces state
  )
  select jsonb_build_object(
    'schema_version', 'ctrl.stable-principal-removal-context.r28',
    'standing', 'verified_complete',
    'observed_at', to_char(
      context_observed_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
    ),
    'target_auth_user_id', p_target_auth_user_id::text,
    'target_subject_principal_ids', coalesce(
      (
        select jsonb_agg(to_jsonb(subject_principal_id::text) order by subject_principal_id)
        from target_subjects
      ),
      '[]'::jsonb
    ),
    'target_operator_principal_ids', coalesce(
      (
        select jsonb_agg(to_jsonb(operator_principal_id::text) order by operator_principal_id)
        from target_operators
      ),
      '[]'::jsonb
    ),
    'workspace_count', (select count(*) from workspace_context),
    'workspaces', coalesce(
      (
        select jsonb_agg(value order by workspace_id)
        from workspace_context
      ),
      '[]'::jsonb
    )
  )
  into context_without_evidence;

  return context_without_evidence || jsonb_build_object(
    'evidence_ref', encode(
      sha256(convert_to(
        'stable-principal-removal-context-r28' || chr(10)
          || private.brain_canonical_jsonb(context_without_evidence),
        'UTF8'
      )),
      'hex'
    )
  );
end;
$$;

revoke all on function private.brain_stable_principal_removal_context(uuid)
  from public, anon, authenticated;
grant execute on function private.brain_stable_principal_removal_context(uuid)
  to service_role;
