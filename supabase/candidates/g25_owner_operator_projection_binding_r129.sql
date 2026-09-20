-- R129 local candidate: one owner-controlled preparation and projection binding.
-- Binding does not grant an operator role, create an audience grant, decide a
-- review, mutate the active standard or send a notification.

alter table public.standard_change_review_packets
  add column if not exists operator_projection_bound_at timestamptz,
  add column if not exists operator_projection_bound_by uuid;

alter table public.standard_change_review_packets
  drop constraint if exists standard_change_review_packets_operator_scope_all_or_none;

alter table public.standard_change_review_packets
  add constraint standard_change_review_packets_operator_scope_all_or_none
  check (
    (
      workspace_id is null
      and subject_id is null
      and operator_projection_audience is null
      and operator_projection_purpose is null
      and operator_projection_bound_at is null
      and operator_projection_bound_by is null
    )
    or
    (
      workspace_id is not null
      and subject_id is not null
      and operator_projection_audience is not null
      and operator_projection_purpose is not null
      and operator_projection_bound_at is not null
      and operator_projection_bound_by is not null
      and operator_projection_bound_by = user_id
    )
  );

create or replace function public.prepare_and_bind_standard_change_operator_projection_v1(
  p_check_id uuid,
  p_expected_result_sha256 text,
  p_workspace_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_user_id uuid := auth.uid();
  v_workspace public.brain_workspaces%rowtype;
  v_prepare_result jsonb;
  v_review public.standard_change_review_packets%rowtype;
  v_idempotent boolean := false;
begin
  if v_user_id is null then
    raise exception 'standard_change_operator_projection_auth_required' using errcode = '42501';
  end if;
  if p_workspace_id is null or p_check_id is null
     or nullif(btrim(p_expected_result_sha256), '') is null then
    raise exception 'standard_change_operator_projection_input_invalid' using errcode = '22023';
  end if;

  select * into v_workspace
  from public.brain_workspaces
  where id = p_workspace_id;
  if not found or v_workspace.owner_id is distinct from v_user_id then
    raise exception 'standard_change_operator_projection_workspace_not_available' using errcode = 'P0001';
  end if;
  if v_workspace.lifecycle_state <> 'active' then
    raise exception 'standard_change_operator_projection_workspace_not_active' using errcode = 'P0001';
  end if;

  v_prepare_result := public.prepare_standard_change_review_v2(
    p_check_id,
    p_expected_result_sha256
  );

  select * into v_review
  from public.standard_change_review_packets
  where id = (v_prepare_result->>'review_packet_id')::uuid
    and user_id = v_user_id
  for update;
  if not found then
    raise exception 'standard_change_operator_projection_review_not_available' using errcode = 'P0001';
  end if;
  if v_review.state <> 'ready'
     or v_review.packet_sha256 <> public.standard_change_json_sha256(v_review.packet)
     or v_review.packet_sha256 <> v_prepare_result->>'review_packet_sha256'
     or v_review.packet->>'schema' <> 'ctrl.standard-change.owner-review.v1'
     or v_review.packet->'presentation'->>'schema' <>
        'ctrl.standard-change.owner-review.presentation.v1'
     or nullif(btrim(v_review.packet->'presentation'->>'question'), '') is null
     or nullif(btrim(v_review.packet->'presentation'->>'headline'), '') is null
     or nullif(btrim(v_review.packet->'presentation'->>'consequence'), '') is null then
    raise exception 'standard_change_operator_projection_review_changed' using errcode = 'P0001';
  end if;

  if v_review.workspace_id is null then
    update public.standard_change_review_packets
    set workspace_id = v_workspace.id,
        subject_id = v_workspace.subject_id,
        operator_projection_audience = 'delivery_team_private',
        operator_projection_purpose = 'standard_change_review_preparation',
        operator_projection_bound_at = v_now,
        operator_projection_bound_by = v_user_id
    where id = v_review.id and user_id = v_user_id;
  elsif v_review.workspace_id = v_workspace.id
     and v_review.subject_id = v_workspace.subject_id
     and v_review.operator_projection_audience = 'delivery_team_private'
     and v_review.operator_projection_purpose = 'standard_change_review_preparation'
     and v_review.operator_projection_bound_by = v_user_id
     and v_review.operator_projection_bound_at is not null then
    v_idempotent := true;
  else
    raise exception 'standard_change_operator_projection_rebind_forbidden' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'schema', 'ctrl.standard-change.operator-projection-binding.v1',
    'review_packet_id', v_review.id,
    'workspace_id', v_workspace.id,
    'subject_id', v_workspace.subject_id,
    'audience', 'delivery_team_private',
    'purpose', 'standard_change_review_preparation',
    'presentation_complete', true,
    'idempotent', v_idempotent,
    'operator_access_granted', false,
    'decision_authority_granted', false,
    'active_standard_mutated', false,
    'notification_sent', false
  );
end;
$$;

revoke all on function public.prepare_and_bind_standard_change_operator_projection_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.prepare_and_bind_standard_change_operator_projection_v1(uuid, text, uuid)
  to authenticated;

comment on function public.prepare_and_bind_standard_change_operator_projection_v1(uuid, text, uuid) is
  'Owner-only atomic presentation completion and immutable operator-projection binding. Creates no access grant.';
