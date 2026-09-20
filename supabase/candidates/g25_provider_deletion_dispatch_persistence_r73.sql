-- G25 R73 provider deletion dispatch and lifecycle persistence candidate.
-- Apply only after dormant R49 and R51 candidates in an empty, disposable
-- database. This is not an authorised migration.

do $$ begin create role provider_dispatch_issuer nologin; exception when duplicate_object then null; end $$;
do $$ begin create role provider_handle_crypto_writer nologin; exception when duplicate_object then null; end $$;
do $$ begin create role provider_deletion_worker nologin; exception when duplicate_object then null; end $$;
do $$ begin create role provider_deletion_operator nologin; exception when duplicate_object then null; end $$;

create table private.brain_provider_deletion_dispatches (
  id uuid primary key,
  schema_version text not null check (schema_version = 'ctrl.provider-deletion-dispatch-record.r73'),
  topology_sha256 text not null check (topology_sha256 ~ '^[0-9a-f]{64}$'),
  target_cell text not null check (target_cell in ('crypto_writer', 'deletion_worker')),
  attempt integer not null check (attempt between 1 and 5),
  predecessor_dispatch_id uuid references private.brain_provider_deletion_dispatches(id) on delete restrict,
  authority_token_sha256 text not null check (authority_token_sha256 ~ '^[0-9a-f]{64}$'),
  envelope_sha256 text not null unique check (envelope_sha256 ~ '^[0-9a-f]{64}$'),
  workspace_id uuid not null references public.brain_workspaces(id) on delete restrict,
  receipt_id uuid not null references private.brain_provider_exchanges(id) on delete restrict,
  handle_id uuid not null,
  provider text not null check (provider in ('elevenlabs', 'stripe')),
  job_id uuid not null,
  operation text not null check (operation in ('register', 'lease', 'destroy')),
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  current_state text,
  latest_event_id uuid,
  event_count integer not null default 0 check (event_count >= 0),
  automatic_terminal boolean not null default false,
  operator_attention_required boolean not null default false,
  closed boolean not null default false,
  next_dispatch_id uuid,
  recorded_at timestamptz not null default statement_timestamp(),
  unique (job_id, operation, attempt),
  constraint brain_provider_deletion_dispatch_target_r73_check check (
    (operation = 'register' and target_cell = 'crypto_writer')
    or (operation in ('lease', 'destroy') and target_cell = 'deletion_worker')
  ),
  constraint brain_provider_deletion_dispatch_retry_r73_check check (
    (attempt = 1 and predecessor_dispatch_id is null)
    or (attempt > 1 and predecessor_dispatch_id is not null)
  ),
  constraint brain_provider_deletion_dispatch_time_r73_check check (
    expires_at > issued_at and expires_at <= issued_at + interval '5 minutes'
  )
);

create table private.brain_provider_deletion_dispatch_events (
  id uuid primary key,
  schema_version text not null check (schema_version = 'ctrl.provider-deletion-dispatch-event.r71'),
  dispatch_id uuid not null references private.brain_provider_deletion_dispatches(id) on delete restrict,
  event_kind text not null check (event_kind in (
    'dispatched', 'accepted', 'completed', 'failed_retryable', 'failed_terminal',
    'retry_requested', 'dead_lettered', 'operator_recovery_requested', 'operator_recovery_linked'
  )),
  actor_cell text not null check (actor_cell in ('authority_issuer', 'crypto_writer', 'deletion_worker', 'operator')),
  attempt integer not null check (attempt between 1 and 5),
  predecessor_event_id uuid references private.brain_provider_deletion_dispatch_events(id) on delete restrict,
  occurred_at timestamptz not null,
  result_receipt_sha256 text check (result_receipt_sha256 is null or result_receipt_sha256 ~ '^[0-9a-f]{64}$'),
  failure_code text check (failure_code is null or failure_code ~ '^[a-z][a-z0-9_]{2,63}$'),
  failure_evidence_sha256 text check (failure_evidence_sha256 is null or failure_evidence_sha256 ~ '^[0-9a-f]{64}$'),
  next_dispatch_id uuid,
  recovery_note_sha256 text check (recovery_note_sha256 is null or recovery_note_sha256 ~ '^[0-9a-f]{64}$'),
  recorded_at timestamptz not null default statement_timestamp(),
  unique (dispatch_id, predecessor_event_id),
  constraint brain_provider_deletion_dispatch_event_detail_r73_check check (
    (event_kind = 'completed' and result_receipt_sha256 is not null and failure_code is null and failure_evidence_sha256 is null and next_dispatch_id is null and recovery_note_sha256 is null)
    or (event_kind in ('failed_retryable', 'failed_terminal') and result_receipt_sha256 is null and failure_code is not null and failure_evidence_sha256 is not null and next_dispatch_id is null and recovery_note_sha256 is null)
    or (event_kind = 'retry_requested' and result_receipt_sha256 is null and failure_code is null and failure_evidence_sha256 is null and next_dispatch_id is not null and recovery_note_sha256 is null)
    or (event_kind = 'operator_recovery_requested' and result_receipt_sha256 is null and failure_code is null and failure_evidence_sha256 is null and next_dispatch_id is null and recovery_note_sha256 is not null)
    or (event_kind = 'operator_recovery_linked' and result_receipt_sha256 is null and failure_code is null and failure_evidence_sha256 is null and next_dispatch_id is not null and recovery_note_sha256 is not null)
    or (event_kind in ('dispatched', 'accepted', 'dead_lettered') and result_receipt_sha256 is null and failure_code is null and failure_evidence_sha256 is null and next_dispatch_id is null and recovery_note_sha256 is null)
  )
);

alter table private.brain_provider_deletion_dispatches enable row level security;
alter table private.brain_provider_deletion_dispatches force row level security;
alter table private.brain_provider_deletion_dispatch_events enable row level security;
alter table private.brain_provider_deletion_dispatch_events force row level security;

create or replace function private.brain_record_provider_deletion_dispatch(p_dispatch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  dispatch_id uuid;
  predecessor_dispatch_id uuid;
  attempt integer;
  existing private.brain_provider_deletion_dispatches%rowtype;
  operation_existing private.brain_provider_deletion_dispatches%rowtype;
  predecessor private.brain_provider_deletion_dispatches%rowtype;
  exchange_row private.brain_provider_exchanges%rowtype;
begin
  if jsonb_typeof(p_dispatch) <> 'object' then raise exception 'provider_deletion_dispatch_object_required'; end if;
  if (
    select count(*) <> 16 or count(*) filter (where key = any(array[
      'schema_version', 'dispatch_id', 'topology_sha256', 'target_cell', 'attempt',
      'predecessor_dispatch_id', 'authority_token_sha256', 'envelope_sha256',
      'workspace_id', 'receipt_id', 'handle_id', 'provider', 'job_id', 'operation',
      'issued_at', 'expires_at'
    ])) <> 16 from jsonb_object_keys(p_dispatch) as member(key)
  ) then raise exception 'provider_deletion_dispatch_shape_invalid'; end if;
  if p_dispatch ->> 'schema_version' <> 'ctrl.provider-deletion-dispatch-record.r73'
  then raise exception 'provider_deletion_dispatch_schema_invalid'; end if;
  dispatch_id := (p_dispatch ->> 'dispatch_id')::uuid;
  attempt := (p_dispatch ->> 'attempt')::integer;
  predecessor_dispatch_id := case when p_dispatch -> 'predecessor_dispatch_id' = 'null'::jsonb
    then null else (p_dispatch ->> 'predecessor_dispatch_id')::uuid end;
  if p_dispatch ->> 'topology_sha256' !~ '^[0-9a-f]{64}$'
    or p_dispatch ->> 'authority_token_sha256' !~ '^[0-9a-f]{64}$'
    or p_dispatch ->> 'envelope_sha256' !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_deletion_dispatch_digest_invalid'; end if;
  if attempt not between 1 and 5
    or (attempt = 1 and predecessor_dispatch_id is not null)
    or (attempt > 1 and predecessor_dispatch_id is null)
  then raise exception 'provider_deletion_dispatch_attempt_invalid'; end if;
  if (p_dispatch ->> 'issued_at')::timestamptz > statement_timestamp()
    or (p_dispatch ->> 'expires_at')::timestamptz <= statement_timestamp()
    or (p_dispatch ->> 'expires_at')::timestamptz > (p_dispatch ->> 'issued_at')::timestamptz + interval '5 minutes'
  then raise exception 'provider_deletion_dispatch_time_invalid'; end if;

  select * into existing from private.brain_provider_deletion_dispatches d where d.id = dispatch_id;
  if found then
    if existing.topology_sha256 = p_dispatch ->> 'topology_sha256'
      and existing.target_cell = p_dispatch ->> 'target_cell'
      and existing.attempt = attempt
      and existing.predecessor_dispatch_id is not distinct from predecessor_dispatch_id
      and existing.authority_token_sha256 = p_dispatch ->> 'authority_token_sha256'
      and existing.envelope_sha256 = p_dispatch ->> 'envelope_sha256'
      and existing.workspace_id = (p_dispatch ->> 'workspace_id')::uuid
      and existing.receipt_id = (p_dispatch ->> 'receipt_id')::uuid
      and existing.handle_id = (p_dispatch ->> 'handle_id')::uuid
      and existing.provider = p_dispatch ->> 'provider'
      and existing.job_id = (p_dispatch ->> 'job_id')::uuid
      and existing.operation = p_dispatch ->> 'operation'
      and existing.issued_at = (p_dispatch ->> 'issued_at')::timestamptz
      and existing.expires_at = (p_dispatch ->> 'expires_at')::timestamptz
    then return jsonb_build_object('status', 'idempotent', 'dispatch_id', existing.id); end if;
    raise exception 'provider_deletion_dispatch_identity_conflict';
  end if;

  select * into operation_existing from private.brain_provider_deletion_dispatches d
  where d.job_id = (p_dispatch ->> 'job_id')::uuid
    and d.operation = p_dispatch ->> 'operation'
    and d.attempt = attempt;
  if found then raise exception 'provider_deletion_dispatch_operation_identity_conflict'; end if;

  select * into exchange_row from private.brain_provider_exchanges e
  where e.id = (p_dispatch ->> 'receipt_id')::uuid;
  if not found then raise exception 'provider_deletion_dispatch_exchange_not_found'; end if;
  if exchange_row.workspace_id <> (p_dispatch ->> 'workspace_id')::uuid
    or exchange_row.provider <> p_dispatch ->> 'provider'
  then raise exception 'provider_deletion_dispatch_exchange_scope_mismatch'; end if;
  if (p_dispatch ->> 'operation' = 'register' and p_dispatch ->> 'target_cell' <> 'crypto_writer')
    or (p_dispatch ->> 'operation' in ('lease', 'destroy') and p_dispatch ->> 'target_cell' <> 'deletion_worker')
  then raise exception 'provider_deletion_dispatch_target_invalid'; end if;

  if predecessor_dispatch_id is not null then
    select * into predecessor from private.brain_provider_deletion_dispatches d
    where d.id = predecessor_dispatch_id for update;
    if not found then raise exception 'provider_deletion_dispatch_predecessor_not_found'; end if;
    if predecessor.job_id <> (p_dispatch ->> 'job_id')::uuid
      or predecessor.operation <> p_dispatch ->> 'operation'
      or predecessor.attempt <> attempt - 1
      or predecessor.next_dispatch_id <> dispatch_id
      or not predecessor.closed
      or predecessor.workspace_id <> (p_dispatch ->> 'workspace_id')::uuid
      or predecessor.receipt_id <> (p_dispatch ->> 'receipt_id')::uuid
      or predecessor.handle_id <> (p_dispatch ->> 'handle_id')::uuid
      or predecessor.provider <> p_dispatch ->> 'provider'
      or predecessor.topology_sha256 <> p_dispatch ->> 'topology_sha256'
      or predecessor.target_cell <> p_dispatch ->> 'target_cell'
    then raise exception 'provider_deletion_dispatch_predecessor_invalid'; end if;
  end if;

  insert into private.brain_provider_deletion_dispatches (
    id, schema_version, topology_sha256, target_cell, attempt, predecessor_dispatch_id,
    authority_token_sha256, envelope_sha256, workspace_id, receipt_id, handle_id,
    provider, job_id, operation, issued_at, expires_at
  ) values (
    dispatch_id, 'ctrl.provider-deletion-dispatch-record.r73', p_dispatch ->> 'topology_sha256',
    p_dispatch ->> 'target_cell', attempt, predecessor_dispatch_id,
    p_dispatch ->> 'authority_token_sha256', p_dispatch ->> 'envelope_sha256',
    (p_dispatch ->> 'workspace_id')::uuid, (p_dispatch ->> 'receipt_id')::uuid,
    (p_dispatch ->> 'handle_id')::uuid, p_dispatch ->> 'provider',
    (p_dispatch ->> 'job_id')::uuid, p_dispatch ->> 'operation',
    (p_dispatch ->> 'issued_at')::timestamptz, (p_dispatch ->> 'expires_at')::timestamptz
  );
  return jsonb_build_object('status', 'recorded', 'dispatch_id', dispatch_id);
end;
$$;

create or replace function private.brain_append_provider_deletion_dispatch_event_core(
  p_event jsonb,
  p_expected_actor text,
  p_expected_target text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  event_id uuid;
  dispatch_id uuid;
  predecessor_event_id uuid;
  event_kind text;
  next_dispatch_id uuid;
  dispatch private.brain_provider_deletion_dispatches%rowtype;
  previous private.brain_provider_deletion_dispatch_events%rowtype;
  existing private.brain_provider_deletion_dispatch_events%rowtype;
  transition_valid boolean := false;
  automatic_terminal boolean := false;
  attention_required boolean := false;
  is_closed boolean := false;
begin
  if jsonb_typeof(p_event) <> 'object' then raise exception 'provider_deletion_dispatch_event_object_required'; end if;
  if (
    select count(*) <> 13 or count(*) filter (where key = any(array[
      'schema_version', 'event_id', 'dispatch_id', 'event_kind', 'actor_cell', 'attempt',
      'predecessor_event_id', 'occurred_at', 'result_receipt_sha256', 'failure_code',
      'failure_evidence_sha256', 'next_dispatch_id', 'recovery_note_sha256'
    ])) <> 13 from jsonb_object_keys(p_event) as member(key)
  ) then raise exception 'provider_deletion_dispatch_event_shape_invalid'; end if;
  if p_event ->> 'schema_version' <> 'ctrl.provider-deletion-dispatch-event.r71'
  then raise exception 'provider_deletion_dispatch_event_schema_invalid'; end if;
  event_id := (p_event ->> 'event_id')::uuid;
  dispatch_id := (p_event ->> 'dispatch_id')::uuid;
  event_kind := p_event ->> 'event_kind';
  predecessor_event_id := case when p_event -> 'predecessor_event_id' = 'null'::jsonb
    then null else (p_event ->> 'predecessor_event_id')::uuid end;
  next_dispatch_id := case when p_event -> 'next_dispatch_id' = 'null'::jsonb
    then null else (p_event ->> 'next_dispatch_id')::uuid end;

  select * into existing from private.brain_provider_deletion_dispatch_events e where e.id = event_id;
  if found then
    if existing.dispatch_id = dispatch_id and existing.event_kind = event_kind
      and existing.actor_cell = p_event ->> 'actor_cell'
      and existing.attempt = (p_event ->> 'attempt')::integer
      and existing.predecessor_event_id is not distinct from predecessor_event_id
      and existing.occurred_at = (p_event ->> 'occurred_at')::timestamptz
      and existing.result_receipt_sha256 is not distinct from nullif(p_event ->> 'result_receipt_sha256', '')
      and existing.failure_code is not distinct from nullif(p_event ->> 'failure_code', '')
      and existing.failure_evidence_sha256 is not distinct from nullif(p_event ->> 'failure_evidence_sha256', '')
      and existing.next_dispatch_id is not distinct from next_dispatch_id
      and existing.recovery_note_sha256 is not distinct from nullif(p_event ->> 'recovery_note_sha256', '')
    then return jsonb_build_object('status', 'idempotent', 'event_id', existing.id); end if;
    raise exception 'provider_deletion_dispatch_event_identity_conflict';
  end if;

  select * into dispatch from private.brain_provider_deletion_dispatches d
  where d.id = dispatch_id for update;
  if not found then raise exception 'provider_deletion_dispatch_not_found'; end if;
  if dispatch.attempt <> (p_event ->> 'attempt')::integer then raise exception 'provider_deletion_dispatch_event_attempt_mismatch'; end if;
  if p_event ->> 'actor_cell' <> p_expected_actor then raise exception 'provider_deletion_dispatch_event_actor_invalid'; end if;
  if p_expected_target is not null and dispatch.target_cell <> p_expected_target
  then raise exception 'provider_deletion_dispatch_event_target_invalid'; end if;
  if next_dispatch_id = dispatch_id then raise exception 'provider_deletion_dispatch_next_identity_invalid'; end if;

  if dispatch.latest_event_id is null then
    if event_kind <> 'dispatched' or predecessor_event_id is not null
    then raise exception 'provider_deletion_dispatch_initial_event_invalid'; end if;
    transition_valid := true;
  else
    select * into previous from private.brain_provider_deletion_dispatch_events e
    where e.id = dispatch.latest_event_id;
    if predecessor_event_id <> previous.id then raise exception 'provider_deletion_dispatch_event_chain_invalid'; end if;
    transition_valid := case previous.event_kind
      when 'dispatched' then event_kind in ('accepted', 'failed_retryable', 'failed_terminal')
      when 'accepted' then event_kind in ('completed', 'failed_retryable', 'failed_terminal')
      when 'failed_retryable' then event_kind in ('retry_requested', 'dead_lettered')
      when 'failed_terminal' then event_kind = 'dead_lettered'
      when 'dead_lettered' then event_kind = 'operator_recovery_requested'
      when 'operator_recovery_requested' then event_kind = 'operator_recovery_linked'
      else false
    end;
    if not transition_valid then raise exception 'provider_deletion_dispatch_event_transition_invalid'; end if;
    if (p_event ->> 'occurred_at')::timestamptz < previous.occurred_at
    then raise exception 'provider_deletion_dispatch_event_time_regressed'; end if;
    if event_kind = 'dead_lettered' and previous.event_kind = 'failed_retryable' and dispatch.attempt < 5
    then raise exception 'provider_deletion_dispatch_dead_letter_premature'; end if;
  end if;
  if (p_event ->> 'occurred_at')::timestamptz < dispatch.issued_at
  then raise exception 'provider_deletion_dispatch_event_before_dispatch'; end if;
  if event_kind = 'retry_requested' and dispatch.attempt >= 5
  then raise exception 'provider_deletion_dispatch_retry_limit_reached'; end if;

  insert into private.brain_provider_deletion_dispatch_events (
    id, schema_version, dispatch_id, event_kind, actor_cell, attempt,
    predecessor_event_id, occurred_at, result_receipt_sha256, failure_code,
    failure_evidence_sha256, next_dispatch_id, recovery_note_sha256
  ) values (
    event_id, 'ctrl.provider-deletion-dispatch-event.r71', dispatch_id, event_kind,
    p_event ->> 'actor_cell', (p_event ->> 'attempt')::integer, predecessor_event_id,
    (p_event ->> 'occurred_at')::timestamptz,
    nullif(p_event ->> 'result_receipt_sha256', ''), nullif(p_event ->> 'failure_code', ''),
    nullif(p_event ->> 'failure_evidence_sha256', ''), next_dispatch_id,
    nullif(p_event ->> 'recovery_note_sha256', '')
  );

  automatic_terminal := event_kind in ('completed', 'retry_requested', 'dead_lettered', 'operator_recovery_requested', 'operator_recovery_linked');
  attention_required := event_kind in ('dead_lettered', 'operator_recovery_requested');
  is_closed := event_kind in ('completed', 'retry_requested', 'operator_recovery_linked');
  update private.brain_provider_deletion_dispatches d set
    current_state = event_kind, latest_event_id = event_id, event_count = d.event_count + 1,
    automatic_terminal = automatic_terminal, operator_attention_required = attention_required,
    closed = is_closed, next_dispatch_id = next_dispatch_id
  where d.id = dispatch_id;
  return jsonb_build_object('status', 'recorded', 'event_id', event_id, 'state', event_kind);
end;
$$;

create or replace function private.brain_append_provider_deletion_dispatch_issuer_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_event ->> 'event_kind' not in ('dispatched', 'failed_retryable', 'failed_terminal', 'retry_requested', 'dead_lettered')
  then raise exception 'provider_deletion_dispatch_issuer_event_invalid'; end if;
  return private.brain_append_provider_deletion_dispatch_event_core(p_event, 'authority_issuer', null);
end;
$$;

create or replace function private.brain_append_provider_deletion_dispatch_writer_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_event ->> 'event_kind' not in ('accepted', 'completed', 'failed_retryable', 'failed_terminal')
  then raise exception 'provider_deletion_dispatch_target_event_invalid'; end if;
  return private.brain_append_provider_deletion_dispatch_event_core(p_event, 'crypto_writer', 'crypto_writer');
end;
$$;

create or replace function private.brain_append_provider_deletion_dispatch_worker_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_event ->> 'event_kind' not in ('accepted', 'completed', 'failed_retryable', 'failed_terminal')
  then raise exception 'provider_deletion_dispatch_target_event_invalid'; end if;
  return private.brain_append_provider_deletion_dispatch_event_core(p_event, 'deletion_worker', 'deletion_worker');
end;
$$;

create or replace function private.brain_append_provider_deletion_dispatch_operator_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_event ->> 'event_kind' not in ('operator_recovery_requested', 'operator_recovery_linked')
  then raise exception 'provider_deletion_dispatch_operator_event_invalid'; end if;
  return private.brain_append_provider_deletion_dispatch_event_core(p_event, 'operator', null);
end;
$$;

revoke all on table private.brain_provider_deletion_dispatches, private.brain_provider_deletion_dispatch_events
  from public, anon, authenticated, service_role, provider_dispatch_issuer,
    provider_handle_crypto_writer, provider_deletion_worker, provider_deletion_operator;
revoke all on function private.brain_append_provider_deletion_dispatch_event_core(jsonb, text, text)
  from public, anon, authenticated, service_role, provider_dispatch_issuer,
    provider_handle_crypto_writer, provider_deletion_worker, provider_deletion_operator;
revoke all on function private.brain_record_provider_deletion_dispatch(jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer,
    provider_deletion_worker, provider_deletion_operator;
revoke all on function private.brain_append_provider_deletion_dispatch_issuer_event(jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer,
    provider_deletion_worker, provider_deletion_operator;
revoke all on function private.brain_append_provider_deletion_dispatch_writer_event(jsonb)
  from public, anon, authenticated, service_role, provider_dispatch_issuer,
    provider_deletion_worker, provider_deletion_operator;
revoke all on function private.brain_append_provider_deletion_dispatch_worker_event(jsonb)
  from public, anon, authenticated, service_role, provider_dispatch_issuer,
    provider_handle_crypto_writer, provider_deletion_operator;
revoke all on function private.brain_append_provider_deletion_dispatch_operator_event(jsonb)
  from public, anon, authenticated, service_role, provider_dispatch_issuer,
    provider_handle_crypto_writer, provider_deletion_worker;

grant usage on schema private to provider_dispatch_issuer, provider_handle_crypto_writer,
  provider_deletion_worker, provider_deletion_operator;
grant execute on function private.brain_record_provider_deletion_dispatch(jsonb) to provider_dispatch_issuer;
grant execute on function private.brain_append_provider_deletion_dispatch_issuer_event(jsonb) to provider_dispatch_issuer;
grant execute on function private.brain_append_provider_deletion_dispatch_writer_event(jsonb) to provider_handle_crypto_writer;
grant execute on function private.brain_append_provider_deletion_dispatch_worker_event(jsonb) to provider_deletion_worker;
grant execute on function private.brain_append_provider_deletion_dispatch_operator_event(jsonb) to provider_deletion_operator;
