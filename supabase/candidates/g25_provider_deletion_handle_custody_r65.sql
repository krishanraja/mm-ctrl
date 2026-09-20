-- G25 R65 encrypted provider deletion-handle custody candidate.
-- Apply only after dormant R49, R51, R53 and R63 candidates in an empty,
-- disposable database. This is not an authorised migration.

create table private.brain_provider_deletion_handles (
  id uuid primary key,
  schema_version text not null
    check (schema_version = 'ctrl.provider-deletion-handle.r65'),
  exchange_id uuid not null unique
    references private.brain_provider_exchanges(id) on delete restrict,
  provider text not null check (provider in ('elevenlabs', 'stripe')),
  retention_class text not null check (retention_class in ('exchange_window', 'account_lifetime')),
  cipher_envelope jsonb,
  registration_idempotency_sha256 text not null
    check (registration_idempotency_sha256 ~ '^[0-9a-f]{64}$'),
  state text not null default 'active' check (state in ('active', 'leased', 'destroyed')),
  created_at timestamptz not null,
  expires_at timestamptz,
  lease_token_hmac text check (lease_token_hmac is null or lease_token_hmac ~ '^[0-9a-f]{64}$'),
  lease_expires_at timestamptz,
  destroyed_at timestamptz,
  destroy_reason text check (destroy_reason is null or destroy_reason in (
    'operational_deletion', 'exchange_expired', 'account_closure'
  )),
  closure_fact_id uuid references private.brain_provider_closure_facts(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  constraint brain_provider_deletion_handle_class_r65_check check (
    (provider = 'elevenlabs' and retention_class = 'exchange_window' and expires_at is not null)
    or (provider = 'stripe' and retention_class = 'account_lifetime' and expires_at is null)
  ),
  constraint brain_provider_deletion_handle_state_r65_check check (
    (state = 'active' and cipher_envelope is not null and lease_token_hmac is null and lease_expires_at is null and destroyed_at is null and destroy_reason is null)
    or (state = 'leased' and cipher_envelope is not null and lease_token_hmac is not null and lease_expires_at is not null and destroyed_at is null and destroy_reason is null)
    or (state = 'destroyed' and cipher_envelope is null and lease_token_hmac is null and lease_expires_at is null and destroyed_at is not null and destroy_reason is not null)
  )
);

create unique index brain_provider_deletion_handles_registration_r65_idx
  on private.brain_provider_deletion_handles (exchange_id, registration_idempotency_sha256);

alter table private.brain_provider_deletion_handles enable row level security;
alter table private.brain_provider_deletion_handles force row level security;

create or replace function private.brain_register_provider_deletion_handle(p_handle jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  handle_id uuid;
  exchange_id uuid;
  provider text;
  retention_class text;
  cipher_envelope jsonb;
  registration_idempotency_sha256 text;
  created_at timestamptz;
  expires_at timestamptz;
  exchange_row private.brain_provider_exchanges%rowtype;
  existing private.brain_provider_deletion_handles%rowtype;
begin
  if jsonb_typeof(p_handle) <> 'object' then raise exception 'provider_deletion_handle_object_required'; end if;
  if (
    select count(*) <> 9
      or count(*) filter (where key = any(array[
        'schema_version', 'handle_id', 'receipt_id', 'provider', 'retention_class',
        'cipher_envelope', 'registration_idempotency_sha256', 'created_at', 'expires_at'
      ])) <> 9
    from jsonb_object_keys(p_handle) as member(key)
  ) then raise exception 'provider_deletion_handle_shape_invalid'; end if;
  if p_handle ->> 'schema_version' <> 'ctrl.provider-deletion-handle.r65'
  then raise exception 'provider_deletion_handle_schema_version_invalid'; end if;

  handle_id := (p_handle ->> 'handle_id')::uuid;
  exchange_id := (p_handle ->> 'receipt_id')::uuid;
  provider := p_handle ->> 'provider';
  retention_class := p_handle ->> 'retention_class';
  cipher_envelope := p_handle -> 'cipher_envelope';
  registration_idempotency_sha256 := p_handle ->> 'registration_idempotency_sha256';
  created_at := (p_handle ->> 'created_at')::timestamptz;
  expires_at := case when p_handle -> 'expires_at' = 'null'::jsonb then null else (p_handle ->> 'expires_at')::timestamptz end;

  if registration_idempotency_sha256 !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_deletion_handle_idempotency_invalid'; end if;
  if jsonb_typeof(cipher_envelope) <> 'object'
    or (select count(*) from jsonb_object_keys(cipher_envelope)) <> 6
    or not (cipher_envelope ?& array['v', 'alg', 'kid', 'iv', 'ciphertext', 'aad_sha256'])
    or cipher_envelope ->> 'v' <> '1'
    or cipher_envelope ->> 'alg' <> 'A256GCM'
    or cipher_envelope ->> 'kid' !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
    or length(cipher_envelope ->> 'iv') <> 16
    or cipher_envelope ->> 'iv' !~ '^[A-Za-z0-9_-]+$'
    or length(cipher_envelope ->> 'ciphertext') not between 23 and 1024
    or cipher_envelope ->> 'ciphertext' !~ '^[A-Za-z0-9_-]+$'
    or cipher_envelope ->> 'aad_sha256' !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_deletion_handle_cipher_envelope_invalid'; end if;
  if created_at > statement_timestamp() then raise exception 'provider_deletion_handle_time_in_future'; end if;
  if provider = 'elevenlabs' and (
    retention_class <> 'exchange_window' or expires_at is null
    or expires_at <= created_at or expires_at > created_at + interval '35 days'
  ) then raise exception 'provider_deletion_handle_exchange_window_invalid'; end if;
  if provider = 'stripe' and (retention_class <> 'account_lifetime' or expires_at is not null)
  then raise exception 'provider_deletion_handle_account_lifetime_invalid'; end if;

  select * into existing
  from private.brain_provider_deletion_handles h
  where h.id = handle_id or h.exchange_id = exchange_id
  order by (h.id = handle_id) desc
  limit 1;
  if found then
    if existing.exchange_id = exchange_id
      and existing.provider = provider
      and existing.retention_class = retention_class
      and existing.cipher_envelope = cipher_envelope
      and existing.registration_idempotency_sha256 = registration_idempotency_sha256
      and existing.created_at = created_at
      and existing.expires_at is not distinct from expires_at
    then return jsonb_build_object('status', 'idempotent', 'handle_id', existing.id); end if;
    raise exception 'provider_deletion_handle_operation_identity_conflict';
  end if;

  select * into exchange_row
  from private.brain_provider_exchanges e
  where e.id = exchange_id
  for update;
  if not found then raise exception 'provider_deletion_handle_exchange_not_found'; end if;
  if exchange_row.provider <> provider then raise exception 'provider_deletion_handle_provider_mismatch'; end if;
  if provider not in ('elevenlabs', 'stripe') then raise exception 'provider_deletion_handle_provider_unsupported'; end if;
  if created_at < exchange_row.occurred_at then raise exception 'provider_deletion_handle_before_exchange'; end if;
  if not exists (
    select 1 from private.brain_provider_exchange_events e
    where e.exchange_id = exchange_id and e.event_kind = 'accepted'
  ) then raise exception 'provider_deletion_handle_exchange_not_accepted'; end if;

  insert into private.brain_provider_deletion_handles (
    id, schema_version, exchange_id, provider, retention_class, cipher_envelope,
    registration_idempotency_sha256, created_at, expires_at
  ) values (
    handle_id, 'ctrl.provider-deletion-handle.r65', exchange_id, provider,
    retention_class, cipher_envelope, registration_idempotency_sha256,
    created_at, expires_at
  ) returning * into existing;

  return jsonb_build_object('status', 'recorded', 'handle_id', existing.id, 'receipt_id', existing.exchange_id);
end;
$$;

create or replace function private.brain_lease_provider_deletion_handle(p_lease jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  handle_id uuid;
  lease_token_hmac text;
  lease_seconds integer;
  existing private.brain_provider_deletion_handles%rowtype;
begin
  if jsonb_typeof(p_lease) <> 'object' then raise exception 'provider_deletion_lease_object_required'; end if;
  if (
    select count(*) <> 4
      or count(*) filter (where key = any(array[
        'schema_version', 'handle_id', 'lease_token_hmac', 'lease_seconds'
      ])) <> 4
    from jsonb_object_keys(p_lease) as member(key)
  ) then raise exception 'provider_deletion_lease_shape_invalid'; end if;
  if p_lease ->> 'schema_version' <> 'ctrl.provider-deletion-handle-lease.r65'
  then raise exception 'provider_deletion_lease_schema_version_invalid'; end if;
  handle_id := (p_lease ->> 'handle_id')::uuid;
  lease_token_hmac := p_lease ->> 'lease_token_hmac';
  lease_seconds := (p_lease ->> 'lease_seconds')::integer;
  if lease_token_hmac !~ '^[0-9a-f]{64}$' then raise exception 'provider_deletion_lease_token_invalid'; end if;
  if lease_seconds < 1 or lease_seconds > 300 then raise exception 'provider_deletion_lease_duration_invalid'; end if;

  select * into existing
  from private.brain_provider_deletion_handles h
  where h.id = handle_id
  for update;
  if not found then raise exception 'provider_deletion_handle_not_found'; end if;
  if existing.state = 'destroyed' then raise exception 'provider_deletion_handle_destroyed'; end if;
  if existing.retention_class = 'exchange_window' and existing.expires_at <= statement_timestamp() then
    update private.brain_provider_deletion_handles h set
      state = 'destroyed', cipher_envelope = null, lease_token_hmac = null,
      lease_expires_at = null, destroyed_at = statement_timestamp(),
      destroy_reason = 'exchange_expired'
    where h.id = handle_id returning * into existing;
    return jsonb_build_object('status', 'expired_and_destroyed', 'handle_id', existing.id);
  end if;
  if existing.state = 'leased' and existing.lease_expires_at > statement_timestamp() then
    if existing.lease_token_hmac = lease_token_hmac then
      return jsonb_build_object(
        'status', 'idempotent', 'handle_id', existing.id,
        'lease_expires_at', existing.lease_expires_at,
        'cipher_envelope', existing.cipher_envelope
      );
    end if;
    raise exception 'provider_deletion_handle_already_leased';
  end if;

  update private.brain_provider_deletion_handles h set
    state = 'leased', lease_token_hmac = lease_token_hmac,
    lease_expires_at = statement_timestamp() + make_interval(secs => lease_seconds)
  where h.id = handle_id returning * into existing;
  return jsonb_build_object(
    'status', 'leased', 'handle_id', existing.id,
    'lease_expires_at', existing.lease_expires_at,
    'cipher_envelope', existing.cipher_envelope
  );
end;
$$;

create or replace function private.brain_destroy_provider_deletion_handle(p_destroy jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  handle_id uuid;
  lease_token_hmac text;
  destroy_reason text;
  closure_fact_id uuid;
  existing private.brain_provider_deletion_handles%rowtype;
begin
  if jsonb_typeof(p_destroy) <> 'object' then raise exception 'provider_deletion_destroy_object_required'; end if;
  if (
    select count(*) <> 5
      or count(*) filter (where key = any(array[
        'schema_version', 'handle_id', 'lease_token_hmac', 'destroy_reason', 'closure_fact_id'
      ])) <> 5
    from jsonb_object_keys(p_destroy) as member(key)
  ) then raise exception 'provider_deletion_destroy_shape_invalid'; end if;
  if p_destroy ->> 'schema_version' <> 'ctrl.provider-deletion-handle-destroy.r65'
  then raise exception 'provider_deletion_destroy_schema_version_invalid'; end if;
  handle_id := (p_destroy ->> 'handle_id')::uuid;
  lease_token_hmac := nullif(p_destroy ->> 'lease_token_hmac', '');
  destroy_reason := p_destroy ->> 'destroy_reason';
  closure_fact_id := case when p_destroy -> 'closure_fact_id' = 'null'::jsonb then null else (p_destroy ->> 'closure_fact_id')::uuid end;

  select * into existing
  from private.brain_provider_deletion_handles h
  where h.id = handle_id
  for update;
  if not found then raise exception 'provider_deletion_handle_not_found'; end if;
  if existing.state = 'destroyed' then
    if existing.destroy_reason = destroy_reason and existing.closure_fact_id is not distinct from closure_fact_id
    then return jsonb_build_object('status', 'idempotent', 'handle_id', existing.id); end if;
    raise exception 'provider_deletion_handle_destroy_conflict';
  end if;

  if destroy_reason = 'exchange_expired' then
    if existing.retention_class <> 'exchange_window' or existing.expires_at > statement_timestamp()
    then raise exception 'provider_deletion_handle_not_expired'; end if;
    if closure_fact_id is not null or lease_token_hmac is not null
    then raise exception 'provider_deletion_handle_expiry_shape_invalid'; end if;
  elsif destroy_reason in ('operational_deletion', 'account_closure') then
    if existing.state <> 'leased' or existing.lease_expires_at <= statement_timestamp()
      or existing.lease_token_hmac <> lease_token_hmac
    then raise exception 'provider_deletion_handle_lease_invalid'; end if;
    if destroy_reason = 'account_closure' and existing.provider <> 'stripe'
    then raise exception 'provider_deletion_handle_account_closure_provider_invalid'; end if;
    if closure_fact_id is null or not exists (
      select 1 from private.brain_provider_closure_facts f
      where f.id = closure_fact_id
        and f.exchange_id = existing.exchange_id
        and f.fact_kind = 'operational_deletion_succeeded'
        and f.scope = 'provider_object'
    ) then raise exception 'provider_deletion_handle_success_fact_required'; end if;
  else
    raise exception 'provider_deletion_handle_destroy_reason_invalid';
  end if;

  update private.brain_provider_deletion_handles h set
    state = 'destroyed', cipher_envelope = null, lease_token_hmac = null,
    lease_expires_at = null, destroyed_at = statement_timestamp(),
    destroy_reason = destroy_reason, closure_fact_id = closure_fact_id
  where h.id = handle_id returning * into existing;
  return jsonb_build_object(
    'status', 'destroyed', 'handle_id', existing.id,
    'destroy_reason', existing.destroy_reason
  );
end;
$$;

revoke all on table private.brain_provider_deletion_handles
  from public, anon, authenticated, service_role;
grant select on table private.brain_provider_deletion_handles to service_role;
revoke all on function private.brain_register_provider_deletion_handle(jsonb)
  from public, anon, authenticated;
revoke all on function private.brain_lease_provider_deletion_handle(jsonb)
  from public, anon, authenticated;
revoke all on function private.brain_destroy_provider_deletion_handle(jsonb)
  from public, anon, authenticated;
grant execute on function private.brain_register_provider_deletion_handle(jsonb) to service_role;
grant execute on function private.brain_lease_provider_deletion_handle(jsonb) to service_role;
grant execute on function private.brain_destroy_provider_deletion_handle(jsonb) to service_role;
