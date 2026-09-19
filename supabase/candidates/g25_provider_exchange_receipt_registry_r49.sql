-- G25 R49 provider exchange receipt registry candidate.
-- This is a non-migration overlay and must not be applied to a linked database.
-- It stores digests and lifecycle evidence, never prompts, queries, email bodies,
-- recipient addresses, Brain content or raw provider request identifiers.

create schema if not exists private;

create table private.brain_provider_exchanges (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.provider-exchange-receipt.r49'),
  workspace_id uuid not null
    references public.brain_workspaces(id) on delete restrict,
  provider text not null check (provider in (
    'openai', 'anthropic', 'google_ai', 'xai', 'elevenlabs',
    'perplexity', 'exa', 'brave', 'tavily', 'newsapi', 'builtwith',
    'people_data_labs', 'artificial_analysis', 'tranco', 'gdelt',
    'hacker_news_algolia', 'fixed_rss_publishers', 'resend', 'stripe',
    'configured_downstream'
  )),
  processor_kind text not null check (processor_kind in (
    'model', 'audio', 'research', 'delivery', 'billing', 'configured_downstream'
  )),
  callsite text not null check (callsite ~ '^[a-zA-Z0-9_./:-]{3,240}$'),
  purpose_family text not null check (purpose_family in (
    'memory_and_intake', 'decision_support', 'briefing_and_coaching',
    'research_and_enrichment', 'email_delivery', 'billing', 'configured_downstream'
  )),
  data_classes text[] not null check (
    cardinality(data_classes) between 1 and 16
    and data_classes <@ array[
      'account_identity', 'billing_metadata', 'brain_memory', 'company_context',
      'company_identifier', 'decision_content', 'email_address', 'email_body',
      'generated_content', 'inferred_traits', 'leader_context',
      'leader_source_text', 'public_web_content', 'search_query',
      'telemetry_metadata', 'unknown_configured_payload'
    ]::text[]
  ),
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  query_minimization_sha256 text
    check (query_minimization_sha256 is null or query_minimization_sha256 ~ '^[0-9a-f]{64}$'),
  control_mode text not null check (control_mode in (
    'unverified', 'public_policy_default', 'contractual_zdr',
    'request_verified_zdr', 'provider_policy_retention',
    'regulated_retention', 'fixed_public_fetch'
  )),
  control_evidence_sha256 text not null check (control_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (workspace_id, callsite, request_sha256)
);

create index brain_provider_exchanges_workspace_time_idx
  on private.brain_provider_exchanges (workspace_id, occurred_at desc);

create table private.brain_provider_exchange_events (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.provider-exchange-lifecycle-event.r49'),
  exchange_id uuid not null
    references private.brain_provider_exchanges(id) on delete restrict,
  event_kind text not null check (event_kind in (
    'accepted', 'rejected', 'outcome_unknown', 'delivered', 'expiry_pending',
    'expired', 'operationally_deleted', 'residual_retention', 'verification_failed'
  )),
  provider_request_identity_hmac text
    check (
      provider_request_identity_hmac is null
      or provider_request_identity_hmac ~ '^[0-9a-f]{64}$'
    ),
  evidence_sha256 text not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index brain_provider_exchange_events_exchange_time_idx
  on private.brain_provider_exchange_events (exchange_id, occurred_at, recorded_at);

alter table private.brain_provider_exchanges enable row level security;
alter table private.brain_provider_exchanges force row level security;
alter table private.brain_provider_exchange_events enable row level security;
alter table private.brain_provider_exchange_events force row level security;

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
    select count(*) <> 13
      or count(*) filter (where key = any(array[
        'schema_version', 'receipt_id', 'workspace_id', 'provider',
        'processor_kind', 'callsite', 'purpose_family', 'data_classes',
        'request_sha256', 'query_minimization_sha256', 'control_mode',
        'control_evidence_sha256', 'occurred_at'
      ])) <> 13
    from jsonb_object_keys(p_exchange) as member(key)
  ) then raise exception 'provider_exchange_shape_invalid'; end if;
  if p_exchange ->> 'schema_version' <> 'ctrl.provider-exchange-receipt.r49'
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
  query_minimization_sha256 := nullif(p_exchange ->> 'query_minimization_sha256', '');
  control_mode := p_exchange ->> 'control_mode';
  control_evidence_sha256 := p_exchange ->> 'control_evidence_sha256';
  occurred_at := (p_exchange ->> 'occurred_at')::timestamptz;

  if occurred_at > statement_timestamp() then raise exception 'provider_exchange_time_in_future'; end if;
  if not exists (select 1 from public.brain_workspaces w where w.id = workspace_id)
  then raise exception 'provider_exchange_workspace_not_found'; end if;
  if cardinality(data_classes) <> (
    select count(distinct value)::int from unnest(data_classes) as item(value)
  )
  then raise exception 'provider_exchange_duplicate_data_class'; end if;

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

  select * into existing from private.brain_provider_exchanges e where e.id = exchange_id;
  if found then
    if existing.workspace_id = workspace_id
      and existing.request_sha256 = request_sha256
      and existing.callsite = callsite
    then return jsonb_build_object('status', 'idempotent', 'receipt_id', existing.id); end if;
    raise exception 'provider_exchange_receipt_identity_conflict';
  end if;

  insert into private.brain_provider_exchanges (
    id, schema_version, workspace_id, provider, processor_kind, callsite,
    purpose_family, data_classes, request_sha256, query_minimization_sha256,
    control_mode, control_evidence_sha256, occurred_at
  ) values (
    exchange_id, 'ctrl.provider-exchange-receipt.r49', workspace_id, provider,
    processor_kind, callsite, purpose_family, data_classes, request_sha256,
    query_minimization_sha256, control_mode, control_evidence_sha256, occurred_at
  ) returning * into existing;

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
  provider_request_identity_hmac text;
  evidence_sha256 text;
  occurred_at timestamptz;
  exchange_row private.brain_provider_exchanges%rowtype;
  existing private.brain_provider_exchange_events%rowtype;
  previous_kind text;
begin
  if jsonb_typeof(p_event) <> 'object' then raise exception 'provider_event_object_required'; end if;
  if (
    select count(*) <> 7
      or count(*) filter (where key = any(array[
        'schema_version', 'event_id', 'receipt_id', 'event_kind',
        'provider_request_identity_hmac', 'evidence_sha256', 'occurred_at'
      ])) <> 7
    from jsonb_object_keys(p_event) as member(key)
  ) then raise exception 'provider_event_shape_invalid'; end if;
  if p_event ->> 'schema_version' <> 'ctrl.provider-exchange-lifecycle-event.r49'
  then raise exception 'provider_event_schema_version_invalid'; end if;

  event_id := (p_event ->> 'event_id')::uuid;
  exchange_id := (p_event ->> 'receipt_id')::uuid;
  event_kind := p_event ->> 'event_kind';
  provider_request_identity_hmac := nullif(p_event ->> 'provider_request_identity_hmac', '');
  evidence_sha256 := p_event ->> 'evidence_sha256';
  occurred_at := (p_event ->> 'occurred_at')::timestamptz;

  select * into existing from private.brain_provider_exchange_events e where e.id = event_id;
  if found then
    if existing.exchange_id = exchange_id
      and existing.event_kind = event_kind
      and existing.evidence_sha256 = evidence_sha256
    then return jsonb_build_object('status', 'idempotent', 'event_id', existing.id); end if;
    raise exception 'provider_event_identity_conflict';
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
    'expiry_pending', 'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind = 'outcome_unknown' and event_kind not in (
    'accepted', 'rejected', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind = 'expiry_pending' and event_kind not in (
    'expired', 'operationally_deleted', 'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_transition_invalid'; end if;
  if previous_kind in (
    'rejected', 'expired', 'operationally_deleted',
    'residual_retention', 'verification_failed'
  ) then raise exception 'provider_event_terminal_state'; end if;

  insert into private.brain_provider_exchange_events (
    id, schema_version, exchange_id, event_kind,
    provider_request_identity_hmac, evidence_sha256, occurred_at
  ) values (
    event_id, 'ctrl.provider-exchange-lifecycle-event.r49', exchange_id,
    event_kind, provider_request_identity_hmac, evidence_sha256, occurred_at
  ) returning * into existing;

  return jsonb_build_object(
    'status', 'recorded', 'event_id', existing.id,
    'receipt_id', existing.exchange_id, 'event_kind', existing.event_kind
  );
end;
$$;

revoke all on table private.brain_provider_exchanges
  from public, anon, authenticated, service_role;
revoke all on table private.brain_provider_exchange_events
  from public, anon, authenticated, service_role;
grant select on table private.brain_provider_exchanges to service_role;
grant select on table private.brain_provider_exchange_events to service_role;
grant usage on schema private to service_role;

revoke all on function private.brain_record_provider_exchange(jsonb)
  from public, anon, authenticated;
revoke all on function private.brain_append_provider_exchange_event(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_record_provider_exchange(jsonb) to service_role;
grant execute on function private.brain_append_provider_exchange_event(jsonb) to service_role;
