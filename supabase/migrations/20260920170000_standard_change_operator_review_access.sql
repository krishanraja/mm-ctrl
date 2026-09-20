-- R127: smallest additive operator-review access slice.
--
-- Isolated rehearsal only at this gate. This migration does not seed an
-- operator, bind an existing packet, grant decision authority or touch
-- production data.

create schema if not exists private;

create table if not exists private.brain_operator_principals (
  id uuid primary key default gen_random_uuid(),
  legacy_auth_alias uuid unique,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  check (retired_at is null or retired_at >= created_at)
);

create table if not exists private.brain_operator_auth_links (
  operator_principal_id uuid not null
    references private.brain_operator_principals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (operator_principal_id, user_id),
  check (revoked_at is null or revoked_at >= linked_at)
);

create unique index if not exists brain_operator_auth_links_active_user_idx
  on private.brain_operator_auth_links(user_id)
  where revoked_at is null;

revoke all on table private.brain_operator_principals
  from public, anon, authenticated;
revoke all on table private.brain_operator_auth_links
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on
  private.brain_operator_principals,
  private.brain_operator_auth_links
  to service_role;

comment on table private.brain_operator_principals is
  'Stable operator identity. Authentication links may rotate without changing this principal.';
comment on table private.brain_operator_auth_links is
  'Revocable mapping from one authenticated user to one stable operator principal.';

-- Operator-safe pending review retrieval with access receipts.
-- Existing unbound review packets remain owner-only.

alter table public.brain_workspace_roles
  add column if not exists granted_at timestamptz not null default now();

alter table public.brain_workspaces
  add column if not exists lifecycle_state text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brain_workspaces_id_subject_owner_unique'
      and conrelid = 'public.brain_workspaces'::regclass
  ) then
    alter table public.brain_workspaces
      add constraint brain_workspaces_id_subject_owner_unique
      unique (id, subject_id, owner_id);
  end if;
end $$;

alter table public.standard_change_review_packets
  add column if not exists workspace_id uuid,
  add column if not exists subject_id uuid,
  add column if not exists operator_projection_audience text,
  add column if not exists operator_projection_purpose text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'standard_change_review_packets_operator_scope_all_or_none'
      and conrelid = 'public.standard_change_review_packets'::regclass
  ) then
    alter table public.standard_change_review_packets
      add constraint standard_change_review_packets_operator_scope_all_or_none
      check (
        (workspace_id is null and subject_id is null
          and operator_projection_audience is null and operator_projection_purpose is null)
        or
        (workspace_id is not null and subject_id is not null
          and operator_projection_audience is not null and operator_projection_purpose is not null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'standard_change_review_packets_workspace_subject_owner_fk'
      and conrelid = 'public.standard_change_review_packets'::regclass
  ) then
    alter table public.standard_change_review_packets
      add constraint standard_change_review_packets_workspace_subject_owner_fk
      foreign key (workspace_id, subject_id, user_id)
      references public.brain_workspaces(id, subject_id, owner_id)
      on delete restrict;
  end if;
end $$;

create index if not exists standard_change_review_packets_operator_queue_idx
  on public.standard_change_review_packets(workspace_id, state, created_at, id)
  where workspace_id is not null;

create table if not exists public.brain_access_receipts (
  id uuid primary key default gen_random_uuid(),
  observed_at timestamptz not null,
  authenticated_user_id uuid,
  operator_principal_id uuid,
  selected_workspace_id uuid not null,
  workspace_id uuid,
  subject_id uuid,
  owner_id uuid,
  role text not null check (role = 'operator'),
  role_granted_by uuid,
  audience_grant_id uuid,
  audience text not null,
  purpose text not null,
  resource_kind text not null check (resource_kind = 'standard_change_review_projection'),
  review_packet_id uuid,
  outcome text not null check (outcome in ('allowed', 'denied')),
  reason text not null check (length(reason) between 1 and 120),
  returned_fields text[] not null default '{}'::text[],
  receipt_payload jsonb not null check (jsonb_typeof(receipt_payload) = 'object'),
  receipt_sha256 text not null unique check (receipt_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists brain_access_receipts_workspace_observed_idx
  on public.brain_access_receipts(workspace_id, observed_at desc);
create index if not exists brain_access_receipts_actor_observed_idx
  on public.brain_access_receipts(authenticated_user_id, observed_at desc);

alter table public.brain_access_receipts enable row level security;
alter table public.brain_access_receipts force row level security;
revoke all on table public.brain_access_receipts from public, anon, authenticated, service_role;

create or replace function public.get_operator_pending_standard_change_review_v1(
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
  v_operator_principal_id uuid;
  v_workspace public.brain_workspaces%rowtype;
  v_role public.brain_workspace_roles%rowtype;
  v_grant public.brain_audience_grants%rowtype;
  v_review public.standard_change_review_packets%rowtype;
  v_reason text := 'allowed';
  v_ready_count integer := 0;
  v_receipt_id uuid := gen_random_uuid();
  v_returned_fields text[] := '{}'::text[];
  v_receipt_payload jsonb;
  v_receipt_sha256 text;
  v_response jsonb;
begin
  if v_user_id is null then
    raise exception 'operator_review_auth_required' using errcode = '42501';
  end if;

  select principal.id into v_operator_principal_id
  from private.brain_operator_auth_links link
  join private.brain_operator_principals principal
    on principal.id = link.operator_principal_id
  where link.user_id = v_user_id
    and link.revoked_at is null
    and principal.retired_at is null
  limit 1;
  if not found then v_reason := 'stable_operator_identity_required'; end if;

  select * into v_workspace
  from public.brain_workspaces
  where id = p_workspace_id;
  if v_reason = 'allowed' and not found then v_reason := 'workspace_not_available'; end if;
  if v_reason = 'allowed' and v_workspace.lifecycle_state <> 'active' then
    v_reason := 'workspace_not_active';
  end if;
  if v_reason = 'allowed' and v_workspace.owner_id = v_user_id then
    v_reason := 'owner_must_use_owner_route';
  end if;

  if v_reason = 'allowed' then
    select * into v_role
    from public.brain_workspace_roles
    where workspace_id = p_workspace_id
      and user_id = v_user_id
      and role = 'operator'
    order by granted_at desc
    limit 1;
    if not found then
      v_reason := 'operator_role_missing';
    elsif v_role.revoked_at is not null then
      v_reason := 'operator_role_revoked';
    elsif v_role.granted_by is distinct from v_workspace.owner_id then
      v_reason := 'operator_role_not_owner_granted';
    elsif v_role.granted_at > v_now then
      v_reason := 'operator_role_invalid';
    end if;
  end if;

  if v_reason = 'allowed' then
    select * into v_grant
    from public.brain_audience_grants
    where workspace_id = p_workspace_id
      and grantee_user_id = v_user_id
    order by
      (audience = 'delivery_team_private'
        and purpose = 'standard_change_review_preparation') desc,
      granted_at desc
    limit 1;
    if not found then
      v_reason := 'audience_grant_missing';
    elsif v_grant.audience <> 'delivery_team_private'
       or v_grant.purpose <> 'standard_change_review_preparation'
       or v_grant.granted_at > v_now then
      v_reason := 'audience_grant_invalid';
    elsif v_grant.revoked_at is not null then
      v_reason := 'audience_grant_revoked';
    elsif v_grant.expires_at is null then
      v_reason := 'audience_grant_expiry_required';
    elsif v_grant.expires_at <= v_now then
      v_reason := 'audience_grant_expired';
    elsif v_grant.granted_by is distinct from v_workspace.owner_id then
      v_reason := 'audience_grant_not_owner_granted';
    end if;
  end if;

  if v_reason = 'allowed' then
    select * into v_review
    from public.standard_change_review_packets
    where user_id = v_workspace.owner_id
      and workspace_id = v_workspace.id
      and subject_id = v_workspace.subject_id
      and operator_projection_audience = 'delivery_team_private'
      and operator_projection_purpose = 'standard_change_review_preparation'
      and state = 'ready'
    order by created_at asc, id asc
    limit 1;
    if not found then
      v_reason := 'review_not_available';
    elsif v_review.packet_sha256 <> public.standard_change_json_sha256(v_review.packet)
       or v_review.packet->>'schema' <> 'ctrl.standard-change.owner-review.v1'
       or v_review.packet->'presentation'->>'schema' <>
          'ctrl.standard-change.owner-review.presentation.v1'
       or nullif(btrim(v_review.packet->'presentation'->>'question'), '') is null
       or nullif(btrim(v_review.packet->'presentation'->>'headline'), '') is null
       or nullif(btrim(v_review.packet->'presentation'->>'consequence'), '') is null then
      v_reason := 'review_packet_changed';
    end if;
  end if;

  if v_reason = 'allowed' then
    select count(*)::integer into v_ready_count
    from public.standard_change_review_packets
    where workspace_id = v_workspace.id
      and subject_id = v_workspace.subject_id
      and user_id = v_workspace.owner_id
      and operator_projection_audience = 'delivery_team_private'
      and operator_projection_purpose = 'standard_change_review_preparation'
      and state = 'ready';
    v_returned_fields := array[
      'review_packet_id', 'question', 'headline', 'consequence', 'ready_since'
    ];
    v_response := jsonb_build_object(
      'schema', 'ctrl.standard-change.operator-pending-review.v1',
      'available', true,
      'ready_count', v_ready_count,
      'next', jsonb_build_object(
        'review_packet_id', v_review.id,
        'question', v_review.packet->'presentation'->>'question',
        'headline', v_review.packet->'presentation'->>'headline',
        'consequence', v_review.packet->'presentation'->>'consequence',
        'ready_since', v_review.created_at
      ),
      'selection', jsonb_build_object(
        'method', 'oldest_ready_first',
        'materiality_inferred', false
      ),
      'decision_authority_granted', false,
      'active_standard_mutated', false,
      'notification_sent', false
    );
  else
    v_response := jsonb_build_object(
      'schema', 'ctrl.standard-change.operator-pending-review.v1',
      'available', false,
      'reason', 'not_available',
      'ready_count', 0,
      'next', null,
      'decision_authority_granted', false,
      'active_standard_mutated', false,
      'notification_sent', false
    );
  end if;

  v_receipt_payload := jsonb_build_object(
    'schema', 'ctrl.standard-change.operator-access-receipt.v1',
    'receipt_id', v_receipt_id,
    'observed_at', v_now,
    'authenticated_user_id', v_user_id,
    'operator_principal_id', v_operator_principal_id,
    'selected_workspace_id', p_workspace_id,
    'workspace_id', case when v_workspace.id is null then null else v_workspace.id end,
    'subject_id', case when v_workspace.id is null then null else v_workspace.subject_id end,
    'owner_id', case when v_workspace.id is null then null else v_workspace.owner_id end,
    'role', 'operator',
    'role_granted_by', v_role.granted_by,
    'audience_grant_id', v_grant.id,
    'audience', 'delivery_team_private',
    'purpose', 'standard_change_review_preparation',
    'resource_kind', 'standard_change_review_projection',
    'review_packet_id', v_review.id,
    'outcome', case when v_reason = 'allowed' then 'allowed' else 'denied' end,
    'reason', v_reason,
    'returned_fields', to_jsonb(v_returned_fields),
    'decision_authority_granted', false,
    'active_standard_mutated', false,
    'notification_sent', false
  );
  v_receipt_sha256 := public.standard_change_json_sha256(v_receipt_payload);

  insert into public.brain_access_receipts (
    id, observed_at, authenticated_user_id, operator_principal_id,
    selected_workspace_id, workspace_id, subject_id, owner_id,
    role, role_granted_by, audience_grant_id, audience, purpose,
    resource_kind, review_packet_id, outcome, reason, returned_fields,
    receipt_payload, receipt_sha256
  ) values (
    v_receipt_id, v_now, v_user_id, v_operator_principal_id,
    p_workspace_id,
    case when v_workspace.id is null then null else v_workspace.id end,
    case when v_workspace.id is null then null else v_workspace.subject_id end,
    case when v_workspace.id is null then null else v_workspace.owner_id end,
    'operator', v_role.granted_by, v_grant.id, 'delivery_team_private',
    'standard_change_review_preparation', 'standard_change_review_projection',
    v_review.id,
    case when v_reason = 'allowed' then 'allowed' else 'denied' end,
    v_reason, v_returned_fields, v_receipt_payload, v_receipt_sha256
  );

  return v_response;
end;
$$;

revoke all on function public.get_operator_pending_standard_change_review_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_operator_pending_standard_change_review_v1(uuid)
  to authenticated;

comment on table public.brain_access_receipts is
  'Append-only receipts for allowed and denied Brain access. Stores scope and outcome, never private plaintext.';
comment on function public.get_operator_pending_standard_change_review_v1(uuid) is
  'Pull-only operator read of one exact customer review projection. Grants no owner decision authority.';

