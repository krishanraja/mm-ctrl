-- G25 R51 correction overlay for the dormant R49 provider registry.
-- Apply only after g25_provider_exchange_receipt_registry_r49.sql in an empty
-- disposable database. R49 has never been authorised as a migration.

do $$
begin
  if exists (select 1 from private.brain_provider_exchanges)
    or exists (select 1 from private.brain_provider_exchange_events)
  then raise exception 'provider_exchange_r51_requires_empty_r49_registry'; end if;
end;
$$;

alter table private.brain_provider_exchanges
  drop constraint brain_provider_exchanges_schema_version_check;
alter table private.brain_provider_exchanges
  add constraint brain_provider_exchanges_schema_version_r51_check
  check (schema_version = 'ctrl.provider-exchange-receipt.r51');
alter table private.brain_provider_exchange_events
  drop constraint brain_provider_exchange_events_schema_version_check;
alter table private.brain_provider_exchange_events
  add constraint brain_provider_exchange_events_schema_version_r51_check
  check (schema_version = 'ctrl.provider-exchange-lifecycle-event.r51');

do $$
declare
  old_unique text;
begin
  select c.conname into old_unique
  from pg_constraint c
  where c.conrelid = 'private.brain_provider_exchanges'::regclass
    and c.contype = 'u';
  if old_unique is null then raise exception 'provider_exchange_r49_unique_missing'; end if;
  execute format('alter table private.brain_provider_exchanges drop constraint %I', old_unique);
end;
$$;

alter table private.brain_provider_exchanges
  add column idempotency_key_sha256 text not null
  check (idempotency_key_sha256 ~ '^[0-9a-f]{64}$');
alter table private.brain_provider_exchanges
  add constraint brain_provider_exchanges_operation_identity_r51_unique
  unique (workspace_id, callsite, idempotency_key_sha256);

alter table private.brain_provider_exchange_events
  add column idempotency_key_sha256 text not null
  check (idempotency_key_sha256 ~ '^[0-9a-f]{64}$');
alter table private.brain_provider_exchange_events
  add constraint brain_provider_exchange_events_operation_identity_r51_unique
  unique (exchange_id, idempotency_key_sha256);

create or replace function private.brain_record_provider_exchange(p_exchange jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  exchange_id uuid;
  workspace_id uuid;
  provider text;
  processor_kind text;
  callsite text;
  purpose_family text;
  data_classes text[];
  request_sha256 text;
  idempotency_key_sha256 text;
  query_minimization_sha256 text;
  control_mode text;
  control_evidence_sha256 text;
  occurred_at timestamptz;
  existing private.brain_provider_exchanges%rowtype;
  private_classes constant text[] := array[
    'account_identity', 'billing_metadata', 'brain_memory', 'company_context',
    'decision_content', 'email_address', 'email_body', 'generated_content',
    'inferred_traits', 'leader_context', 'leader_source_text',
    'unknown_configured_payload'
  ]::text[];
begin
  if jsonb_typeof(p_exchange) <> 'object' then raise exception 'provider_exchange_object_required'; end if;
  if (
    select count(*) <> 14
      or count(*) filter (where key = any(array[
        'schema_version', 'receipt_id', 'workspace_id', 'provider',
        'processor_kind', 'callsite', 'purpose_family', 'data_classes',
        'request_sha256', 'idempotency_key_sha256', 'query_minimization_sha256',
        'control_mode', 'control_evidence_sha256', 'occurred_at'
      ])) <> 14
    from jsonb_object_keys(p_exchange) as member(key)
  ) then raise exception 'provider_exchange_shape_invalid'; end if;
  if p_exchange ->> 'schema_version' <> 'ctrl.provider-exchange-receipt.r51'
  then raise exception 'provider_exchange_schema_version_invalid'; end if;
  if jsonb_typeof(p_exchange -> 'data_classes') <> 'array'
  then raise exception 'provider_exchange_data_classes_array_required'; end if;

  exchange_id := (p_exchange ->> 'receipt_id')::uuid;
  workspace_id := (p_exchange ->> 'workspace_id')::uuid;
  provider := p_exchange ->> 'provider';
  processor_kind := p_exchange ->> 'processor_kind';
  callsite := p_exchange ->> 'callsite';
  purpose_family := p_exchange ->> 'purpose_family';
  select array_agg(value order by value) into data_classes
  from jsonb_array_elements_text(p_exchange -> 'data_classes') as item(value);
  request_sha256 := p_exchange ->> 'request_sha256';
  idempotency_key_sha256 := p_exchange ->> 'idempotency_key_sha256';
  query_minimization_sha256 := nullif(p_exchange ->> 'query_minimization_sha256', '');
  control_mode := p_exchange ->> 'control_mode';
  control_evidence_sha256 := p_exchange ->> 'control_evidence_sha256';
  occurred_at := (p_exchange ->> 'occurred_at')::timestamptz;

  if idempotency_key_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_exchange_idempotency_key_invalid'; end if;
  if occurred_at > statement_timestamp() then raise exception 'provider_exchange_time_in_future'; end if;
  if not exists (select 1 from public.brain_workspaces w where w.id = workspace_id)
  then raise exception 'provider_exchange_workspace_not_found'; end if;
  if cardinality(data_classes) <> (
    select count(distinct value)::int from unnest(data_classes) as item(value)
  ) then raise exception 'provider_exchange_duplicate_data_class'; end if;

  if processor_kind = 'research' then
    if data_classes && private_classes then
      raise exception 'provider_exchange_private_research_payload_forbidden';
    end if;
    if control_mode <> 'fixed_public_fetch' and query_minimization_sha256 is null then
      raise exception 'provider_exchange_query_minimization_required';
    end if;
  end if;
  if processor_kind in ('model', 'audio')
    and data_classes && private_classes
    and control_mode not in ('contractual_zdr', 'request_verified_zdr')
  then raise exception 'provider_exchange_private_model_control_unverified'; end if;
  if processor_kind = 'delivery'
    and control_mode not in ('provider_policy_retention', 'contractual_zdr', 'request_verified_zdr')
  then raise exception 'provider_exchange_delivery_control_invalid'; end if;
  if processor_kind = 'billing' and control_mode <> 'regulated_retention'
  then raise exception 'provider_exchange_billing_control_invalid'; end if;
  if processor_kind = 'configured_downstream' and control_mode = 'unverified'
  then raise exception 'provider_exchange_configured_downstream_unverified'; end if;

  select * into existing
  from private.brain_provider_exchanges e
  where e.id = exchange_id
    or (
      e.workspace_id = workspace_id
      and e.callsite = callsite
      and e.idempotency_key_sha256 = idempotency_key_sha256
    )
  order by (e.id = exchange_id) desc
  limit 1;
  if found then
    if existing.workspace_id = workspace_id
      and existing.provider = provider
      and existing.processor_kind = processor_kind
      and existing.callsite = callsite
      and existing.purpose_family = purpose_family
      and existing.data_classes = data_classes
      and existing.request_sha256 = request_sha256
      and existing.idempotency_key_sha256 = idempotency_key_sha256
      and existing.query_minimization_sha256 is not distinct from query_minimization_sha256
      and existing.control_mode = control_mode
      and existing.control_evidence_sha256 = control_evidence_sha256
      and existing.occurred_at = occurred_at
    then return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id); end if;
    raise exception 'provider_exchange_operation_identity_conflict';
  end if;

  begin
    insert into private.brain_provider_exchanges (
      id, schema_version, workspace_id, provider, processor_kind, callsite,
      purpose_family, data_classes, request_sha256, idempotency_key_sha256,
      query_minimization_sha256, control_mode, control_evidence_sha256, occurred_at
    ) values (
      exchange_id, 'ctrl.provider-exchange-receipt.r51', workspace_id, provider,
      processor_kind, callsite, purpose_family, data_classes, request_sha256,
      idempotency_key_sha256, query_minimization_sha256, control_mode,
      control_evidence_sha256, occurred_at
    ) returning * into existing;
  exception when unique_violation then
    select * into existing
    from private.brain_provider_exchanges e
    where e.workspace_id = workspace_id
      and e.callsite = callsite
      and e.idempotency_key_sha256 = idempotency_key_sha256;
    if found
      and existing.provider = provider
      and existing.processor_kind = processor_kind
      and existing.purpose_family = purpose_family
      and existing.data_classes = data_classes
      and existing.request_sha256 = request_sha256
      and existing.query_minimization_sha256 is not distinct from query_minimization_sha256
      and existing.control_mode = control_mode
      and existing.control_evidence_sha256 = control_evidence_sha256
      and existing.occurred_at = occurred_at
    then return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id); end if;
    raise exception 'provider_exchange_operation_identity_conflict';
  end;

  return jsonb_build_object(
    'status', 'recorded', 'receipt_id', existing.id,
    'workspace_id', existing.workspace_id, 'provider', existing.provider
  );
end;
$$;

create or replace function private.brain_append_provider_exchange_event(p_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  event_id uuid;
  exchange_id uuid;
  event_kind text;
  idempotency_key_sha256 text;
  provider_request_identity_hmac text;
  evidence_sha256 text;
  occurred_at timestamptz;
  exchange_row private.brain_provider_exchanges%rowtype;
  existing private.brain_provider_exchange_events%rowtype;
  previous_kind text;
begin
  if jsonb_typeof(p_event) <> 'object' then raise exception 'provider_event_object_required'; end if;
  if (
    select count(*) <> 8
      or count(*) filter (where key = any(array[
        'schema_version', 'event_id', 'receipt_id', 'event_kind',
        'idempotency_key_sha256', 'provider_request_identity_hmac',
        'evidence_sha256', 'occurred_at'
      ])) <> 8
    from jsonb_object_keys(p_event) as member(key)
  ) then raise exception 'provider_event_shape_invalid'; end if;
  if p_event ->> 'schema_version' <> 'ctrl.provider-exchange-lifecycle-event.r51'
  then raise exception 'provider_event_schema_version_invalid'; end if;

  event_id := (p_event ->> 'event_id')::uuid;
  exchange_id := (p_event ->> 'receipt_id')::uuid;
  event_kind := p_event ->> 'event_kind';
  idempotency_key_sha256 := p_event ->> 'idempotency_key_sha256';
  provider_request_identity_hmac := nullif(p_event ->> 'provider_request_identity_hmac', '');
  evidence_sha256 := p_event ->> 'evidence_sha256';
  occurred_at := (p_event ->> 'occurred_at')::timestamptz;
  if idempotency_key_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_event_idempotency_key_invalid'; end if;

  select * into existing
  from private.brain_provider_exchange_events e
  where e.id = event_id
    or (e.exchange_id = exchange_id and e.idempotency_key_sha256 = idempotency_key_sha256)
  order by (e.id = event_id) desc
  limit 1;
  if found then
    if existing.exchange_id = exchange_id
      and existing.event_kind = event_kind
      and existing.idempotency_key_sha256 = idempotency_key_sha256
      and existing.provider_request_identity_hmac is not distinct from provider_request_identity_hmac
      and existing.evidence_sha256 = evidence_sha256
      and existing.occurred_at = occurred_at
    then return jsonb_build_object('status', 'idempotent', 'event_id', existing.id); end if;
    raise exception 'provider_event_operation_identity_conflict';
  end if;

  select * into exchange_row
  from private.brain_provider_exchanges e
  where e.id = exchange_id
  for update;
  if not found then raise exception 'provider_event_receipt_not_found'; end if;
  if occurred_at < exchange_row.occurred_at then raise exception 'provider_event_before_exchange'; end if;
  if occurred_at > statement_timestamp() then raise exception 'provider_event_time_in_future'; end if;

  select e.event_kind into previous_kind
  from private.brain_provider_exchange_events e
  where e.exchange_id = exchange_id
  order by e.occurred_at desc, e.recorded_at desc
  limit 1;

  if previous_kind is null and event_kind not in ('accepted', 'rejected', 'outcome_unknown')
  then raise exception 'provider_event_initial_transition_invalid'; end if;
  if previous_kind = 'accepted' and event_kind not in (
    'delivered', 'expiry_pending', 'operationally_deleted',
    'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind = 'delivered' and event_kind not in (
    'expiry_pending', 'operationally_deleted', 'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind = 'expiry_pending' and event_kind not in (
    'expired', 'operationally_deleted', 'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind = 'outcome_unknown' and event_kind not in (
    'accepted', 'rejected', 'delivered', 'expiry_pending',
    'operationally_deleted', 'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind in ('rejected', 'expired', 'operationally_deleted', 'residual_retention', 'verification_failed')
  then raise exception 'provider_event_terminal_state'; end if;

  begin
    insert into private.brain_provider_exchange_events (
      id, schema_version, exchange_id, event_kind, idempotency_key_sha256,
      provider_request_identity_hmac, evidence_sha256, occurred_at
    ) values (
      event_id, 'ctrl.provider-exchange-lifecycle-event.r51', exchange_id,
      event_kind, idempotency_key_sha256, provider_request_identity_hmac,
      evidence_sha256, occurred_at
    ) returning * into existing;
  exception when unique_violation then
    select * into existing
    from private.brain_provider_exchange_events e
    where e.exchange_id = exchange_id and e.idempotency_key_sha256 = idempotency_key_sha256;
    if found
      and existing.event_kind = event_kind
      and existing.provider_request_identity_hmac is not distinct from provider_request_identity_hmac
      and existing.evidence_sha256 = evidence_sha256
      and existing.occurred_at = occurred_at
    then return jsonb_build_object('status', 'idempotent', 'event_id', existing.id); end if;
    raise exception 'provider_event_operation_identity_conflict';
  end;

  return jsonb_build_object(
    'status', 'recorded', 'event_id', existing.id,
    'receipt_id', existing.exchange_id, 'event_kind', existing.event_kind
  );
end;
$$;
