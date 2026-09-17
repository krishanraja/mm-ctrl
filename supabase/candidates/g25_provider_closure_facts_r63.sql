-- G25 R63 append-only provider closure facts candidate.
-- Apply only after the dormant R49, R51 and R53 candidates in an empty,
-- disposable database. This is not an authorised migration.

create table private.brain_provider_closure_facts (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.provider-closure-fact.r63'),
  exchange_id uuid not null
    references private.brain_provider_exchanges(id) on delete restrict,
  fact_kind text not null check (fact_kind in (
    'no_retention_verified', 'policy_expiry_pending', 'policy_expired',
    'operational_deletion_succeeded', 'operational_deletion_failed',
    'residual_retention_confirmed', 'external_copy_confirmed',
    'verification_failed', 'verification_recovered'
  )),
  scope text not null check (scope in (
    'exchange_payload', 'provider_object', 'regulated_record', 'external_copy'
  )),
  idempotency_key_sha256 text not null
    check (idempotency_key_sha256 ~ '^[0-9a-f]{64}$'),
  evidence_sha256 text not null
    check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint brain_provider_closure_fact_scope_r63_check check (
    (fact_kind in ('no_retention_verified', 'policy_expiry_pending', 'policy_expired')
      and scope = 'exchange_payload')
    or (fact_kind in ('operational_deletion_succeeded', 'operational_deletion_failed')
      and scope = 'provider_object')
    or (fact_kind = 'residual_retention_confirmed' and scope = 'regulated_record')
    or (fact_kind = 'external_copy_confirmed' and scope = 'external_copy')
    or fact_kind in ('verification_failed', 'verification_recovered')
  ),
  constraint brain_provider_closure_fact_operation_r63_unique
    unique (exchange_id, idempotency_key_sha256)
);

create index brain_provider_closure_facts_exchange_time_r63_idx
  on private.brain_provider_closure_facts (exchange_id, occurred_at, recorded_at);

alter table private.brain_provider_closure_facts enable row level security;
alter table private.brain_provider_closure_facts force row level security;

create or replace function private.brain_append_provider_closure_fact(p_fact jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  fact_id uuid;
  exchange_id uuid;
  fact_kind text;
  scope text;
  idempotency_key_sha256 text;
  evidence_sha256 text;
  occurred_at timestamptz;
  exchange_row private.brain_provider_exchanges%rowtype;
  existing private.brain_provider_closure_facts%rowtype;
begin
  if jsonb_typeof(p_fact) <> 'object' then raise exception 'provider_closure_fact_object_required'; end if;
  if (
    select count(*) <> 8
      or count(*) filter (where key = any(array[
        'schema_version', 'fact_id', 'receipt_id', 'fact_kind', 'scope',
        'idempotency_key_sha256', 'evidence_sha256', 'occurred_at'
      ])) <> 8
    from jsonb_object_keys(p_fact) as member(key)
  ) then raise exception 'provider_closure_fact_shape_invalid'; end if;
  if p_fact ->> 'schema_version' <> 'ctrl.provider-closure-fact.r63'
  then raise exception 'provider_closure_fact_schema_version_invalid'; end if;

  fact_id := (p_fact ->> 'fact_id')::uuid;
  exchange_id := (p_fact ->> 'receipt_id')::uuid;
  fact_kind := p_fact ->> 'fact_kind';
  scope := p_fact ->> 'scope';
  idempotency_key_sha256 := p_fact ->> 'idempotency_key_sha256';
  evidence_sha256 := p_fact ->> 'evidence_sha256';
  occurred_at := (p_fact ->> 'occurred_at')::timestamptz;

  if idempotency_key_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_closure_fact_idempotency_key_invalid'; end if;
  if evidence_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_closure_fact_evidence_invalid'; end if;

  select * into existing
  from private.brain_provider_closure_facts f
  where f.id = fact_id
    or (f.exchange_id = exchange_id and f.idempotency_key_sha256 = idempotency_key_sha256)
  order by (f.id = fact_id) desc
  limit 1;
  if found then
    if existing.exchange_id = exchange_id
      and existing.fact_kind = fact_kind
      and existing.scope = scope
      and existing.idempotency_key_sha256 = idempotency_key_sha256
      and existing.evidence_sha256 = evidence_sha256
      and existing.occurred_at = occurred_at
    then return jsonb_build_object('status', 'idempotent', 'fact_id', existing.id); end if;
    raise exception 'provider_closure_fact_operation_identity_conflict';
  end if;

  select * into exchange_row
  from private.brain_provider_exchanges e
  where e.id = exchange_id
  for update;
  if not found then raise exception 'provider_closure_fact_exchange_not_found'; end if;
  if occurred_at < exchange_row.occurred_at then raise exception 'provider_closure_fact_before_exchange'; end if;
  if occurred_at > statement_timestamp() then raise exception 'provider_closure_fact_time_in_future'; end if;
  if not exists (
    select 1 from private.brain_provider_exchange_events e
    where e.exchange_id = exchange_id
      and e.event_kind in (
        'accepted', 'delivered', 'expiry_pending', 'expired',
        'operationally_deleted', 'residual_retention', 'verification_failed'
      )
  ) then raise exception 'provider_closure_fact_exchange_not_accepted'; end if;

  if fact_kind = 'verification_recovered' and not exists (
    select 1 from private.brain_provider_closure_facts f
    where f.exchange_id = exchange_id
      and f.scope = scope
      and f.fact_kind = 'verification_failed'
      and f.occurred_at < occurred_at
  ) then raise exception 'provider_closure_fact_recovery_without_failure'; end if;

  if fact_kind = 'operational_deletion_failed' and exists (
    select 1 from private.brain_provider_closure_facts f
    where f.exchange_id = exchange_id
      and f.fact_kind = 'operational_deletion_succeeded'
  ) then raise exception 'provider_closure_fact_failure_after_success'; end if;

  if fact_kind in ('no_retention_verified', 'policy_expired') and exists (
    select 1 from private.brain_provider_closure_facts f
    where f.exchange_id = exchange_id
      and f.scope = 'exchange_payload'
      and f.fact_kind in ('no_retention_verified', 'policy_expired')
      and f.fact_kind <> fact_kind
  ) then raise exception 'provider_closure_fact_payload_disposition_conflict'; end if;

  if fact_kind in (
    'no_retention_verified', 'policy_expired', 'operational_deletion_succeeded',
    'residual_retention_confirmed', 'external_copy_confirmed'
  ) and exists (
    select 1 from private.brain_provider_closure_facts f
    where f.exchange_id = exchange_id
      and f.fact_kind = fact_kind
      and f.scope = scope
  ) then raise exception 'provider_closure_fact_already_recorded'; end if;

  begin
    insert into private.brain_provider_closure_facts (
      id, schema_version, exchange_id, fact_kind, scope,
      idempotency_key_sha256, evidence_sha256, occurred_at
    ) values (
      fact_id, 'ctrl.provider-closure-fact.r63', exchange_id, fact_kind, scope,
      idempotency_key_sha256, evidence_sha256, occurred_at
    ) returning * into existing;
  exception when unique_violation then
    select * into existing
    from private.brain_provider_closure_facts f
    where f.exchange_id = exchange_id
      and f.idempotency_key_sha256 = idempotency_key_sha256;
    if found
      and existing.fact_kind = fact_kind
      and existing.scope = scope
      and existing.evidence_sha256 = evidence_sha256
      and existing.occurred_at = occurred_at
    then return jsonb_build_object('status', 'idempotent', 'fact_id', existing.id); end if;
    raise exception 'provider_closure_fact_operation_identity_conflict';
  end;

  return jsonb_build_object(
    'status', 'recorded', 'fact_id', existing.id,
    'receipt_id', existing.exchange_id, 'fact_kind', existing.fact_kind,
    'scope', existing.scope
  );
end;
$$;

revoke all on table private.brain_provider_closure_facts
  from public, anon, authenticated, service_role;
grant select on table private.brain_provider_closure_facts to service_role;
revoke all on function private.brain_append_provider_closure_fact(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_append_provider_closure_fact(jsonb)
  to service_role;
