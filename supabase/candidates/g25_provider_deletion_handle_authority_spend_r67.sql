-- G25 R67 provider deletion-handle authority-spend candidate.
-- Apply only after dormant R49, R51, R53, R63 and R65 candidates in an empty,
-- disposable database. This is not an authorised migration.

do $$ begin
  create role provider_handle_crypto_writer nologin;
exception when duplicate_object then null;
end $$;
do $$ begin
  create role provider_deletion_worker nologin;
exception when duplicate_object then null;
end $$;

create table private.brain_provider_handle_authority_spends (
  authority_id uuid primary key,
  schema_version text not null check (schema_version = 'ctrl.provider-deletion-handle-authority.r66'),
  token_sha256 text not null unique check (token_sha256 ~ '^[0-9a-f]{64}$'),
  role text not null check (role in ('provider_handle_crypto_writer', 'provider_deletion_worker')),
  operation text not null check (operation in ('register', 'lease', 'destroy')),
  workspace_id uuid not null,
  receipt_id uuid not null,
  handle_id uuid not null,
  provider text not null check (provider in ('elevenlabs', 'stripe')),
  actor_id uuid not null,
  job_id uuid not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  operation_binding jsonb not null,
  consumed_at timestamptz not null default statement_timestamp(),
  constraint brain_provider_handle_authority_role_operation_r67_check check (
    (role = 'provider_handle_crypto_writer' and operation = 'register')
    or (role = 'provider_deletion_worker' and operation in ('lease', 'destroy'))
  ),
  constraint brain_provider_handle_authority_lifetime_r67_check check (
    expires_at > issued_at and expires_at <= issued_at + interval '5 minutes'
  )
);

alter table private.brain_provider_handle_authority_spends enable row level security;
alter table private.brain_provider_handle_authority_spends force row level security;

create or replace function private.brain_spend_provider_handle_authority(
  p_authority jsonb,
  p_token_sha256 text,
  p_expected_role text,
  p_expected_operation text
)
returns private.brain_provider_handle_authority_spends
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  authority_id uuid;
  role text;
  operation text;
  workspace_id uuid;
  receipt_id uuid;
  handle_id uuid;
  provider text;
  actor_id uuid;
  job_id uuid;
  issued_at timestamptz;
  expires_at timestamptz;
  operation_binding jsonb;
  expected_key_count integer;
  existing private.brain_provider_handle_authority_spends%rowtype;
begin
  if jsonb_typeof(p_authority) <> 'object' then raise exception 'provider_handle_authority_object_required'; end if;
  operation := p_authority ->> 'operation';
  expected_key_count := case operation when 'register' then 13 when 'lease' then 13 when 'destroy' then 14 else 0 end;
  if expected_key_count = 0 or (
    select count(*) <> expected_key_count
      or count(*) filter (where key = any(array[
        'schema_version', 'authority_id', 'workspace_id', 'receipt_id', 'handle_id',
        'provider', 'actor_id', 'job_id', 'issued_at', 'expires_at', 'role', 'operation',
        'cipher_envelope_sha256', 'lease_seconds', 'destruction_reason', 'success_fact_id'
      ])) <> expected_key_count
    from jsonb_object_keys(p_authority) as member(key)
  ) then raise exception 'provider_handle_authority_shape_invalid'; end if;
  if not (p_authority ?& array[
    'schema_version', 'authority_id', 'workspace_id', 'receipt_id', 'handle_id',
    'provider', 'actor_id', 'job_id', 'issued_at', 'expires_at', 'role', 'operation'
  ]) then raise exception 'provider_handle_authority_shape_invalid'; end if;
  if operation = 'register' and (
    not (p_authority ? 'cipher_envelope_sha256')
    or p_authority ?| array['lease_seconds', 'destruction_reason', 'success_fact_id']
  ) then raise exception 'provider_handle_authority_shape_invalid'; end if;
  if operation = 'lease' and (
    not (p_authority ? 'lease_seconds')
    or p_authority ?| array['cipher_envelope_sha256', 'destruction_reason', 'success_fact_id']
  ) then raise exception 'provider_handle_authority_shape_invalid'; end if;
  if operation = 'destroy' and (
    not (p_authority ?& array['destruction_reason', 'success_fact_id'])
    or p_authority ?| array['cipher_envelope_sha256', 'lease_seconds']
  ) then raise exception 'provider_handle_authority_shape_invalid'; end if;
  if p_authority ->> 'schema_version' <> 'ctrl.provider-deletion-handle-authority.r66'
  then raise exception 'provider_handle_authority_schema_invalid'; end if;
  if p_token_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'provider_handle_authority_token_digest_invalid'; end if;

  authority_id := (p_authority ->> 'authority_id')::uuid;
  workspace_id := (p_authority ->> 'workspace_id')::uuid;
  receipt_id := (p_authority ->> 'receipt_id')::uuid;
  handle_id := (p_authority ->> 'handle_id')::uuid;
  provider := p_authority ->> 'provider';
  actor_id := (p_authority ->> 'actor_id')::uuid;
  job_id := (p_authority ->> 'job_id')::uuid;
  issued_at := (p_authority ->> 'issued_at')::timestamptz;
  expires_at := (p_authority ->> 'expires_at')::timestamptz;
  role := p_authority ->> 'role';

  if role <> p_expected_role or operation <> p_expected_operation
  then raise exception 'provider_handle_authority_role_operation_mismatch'; end if;
  if provider is null or provider not in ('elevenlabs', 'stripe') then raise exception 'provider_handle_authority_provider_invalid'; end if;
  if issued_at > statement_timestamp() or expires_at <= statement_timestamp()
    or expires_at <= issued_at or expires_at > issued_at + interval '5 minutes'
  then raise exception 'provider_handle_authority_time_invalid'; end if;

  if operation = 'register' then
    if p_authority ->> 'cipher_envelope_sha256' !~ '^[0-9a-f]{64}$'
    then raise exception 'provider_handle_authority_cipher_digest_invalid'; end if;
    operation_binding := jsonb_build_object('cipher_envelope_sha256', p_authority ->> 'cipher_envelope_sha256');
  elsif operation = 'lease' then
    if (p_authority ->> 'lease_seconds')::integer not between 1 and 300
    then raise exception 'provider_handle_authority_lease_invalid'; end if;
    operation_binding := jsonb_build_object('lease_seconds', (p_authority ->> 'lease_seconds')::integer);
  else
    if p_authority ->> 'destruction_reason' not in (
      'exchange_expired', 'operational_deletion_succeeded', 'account_closure_succeeded'
    ) then raise exception 'provider_handle_authority_destruction_reason_invalid'; end if;
    if p_authority ->> 'destruction_reason' = 'exchange_expired' and (
      provider <> 'elevenlabs' or p_authority -> 'success_fact_id' <> 'null'::jsonb
    ) then raise exception 'provider_handle_authority_destruction_evidence_invalid'; end if;
    if p_authority ->> 'destruction_reason' in ('operational_deletion_succeeded', 'account_closure_succeeded') and (
      p_authority -> 'success_fact_id' = 'null'::jsonb
      or (p_authority ->> 'success_fact_id')::uuid is null
    ) then raise exception 'provider_handle_authority_destruction_evidence_invalid'; end if;
    if p_authority ->> 'destruction_reason' = 'account_closure_succeeded' and provider <> 'stripe'
    then raise exception 'provider_handle_authority_destruction_evidence_invalid'; end if;
    operation_binding := jsonb_build_object(
      'destruction_reason', p_authority ->> 'destruction_reason',
      'success_fact_id', p_authority -> 'success_fact_id'
    );
  end if;

  insert into private.brain_provider_handle_authority_spends (
    authority_id, schema_version, token_sha256, role, operation, workspace_id,
    receipt_id, handle_id, provider, actor_id, job_id, issued_at, expires_at,
    operation_binding
  ) values (
    authority_id, 'ctrl.provider-deletion-handle-authority.r66', p_token_sha256,
    role, operation, workspace_id, receipt_id, handle_id, provider, actor_id,
    job_id, issued_at, expires_at, operation_binding
  ) on conflict on constraint brain_provider_handle_authority_spends_pkey do nothing;

  select * into existing
  from private.brain_provider_handle_authority_spends s
  where s.authority_id = authority_id;
  if not found then raise exception 'provider_handle_authority_spend_failed'; end if;
  if existing.token_sha256 <> p_token_sha256
    or existing.role <> role or existing.operation <> operation
    or existing.workspace_id <> workspace_id or existing.receipt_id <> receipt_id
    or existing.handle_id <> handle_id or existing.provider <> provider
    or existing.actor_id <> actor_id or existing.job_id <> job_id
    or existing.issued_at <> issued_at or existing.expires_at <> expires_at
    or existing.operation_binding <> operation_binding
  then raise exception 'provider_handle_authority_replay_conflict'; end if;
  return existing;
end;
$$;

create or replace function private.brain_authorized_register_provider_deletion_handle(
  p_authority jsonb,
  p_token_sha256 text,
  p_handle jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  exchange_workspace_id uuid;
  result jsonb;
begin
  if jsonb_typeof(p_handle) <> 'object' or not (p_handle ? 'cipher_envelope_sha256')
  then raise exception 'provider_handle_authorized_registration_shape_invalid'; end if;
  if p_handle ->> 'cipher_envelope_sha256' <> p_authority ->> 'cipher_envelope_sha256'
  then raise exception 'provider_handle_authority_cipher_digest_mismatch'; end if;
  if p_handle ->> 'handle_id' <> p_authority ->> 'handle_id'
    or p_handle ->> 'receipt_id' <> p_authority ->> 'receipt_id'
    or p_handle ->> 'provider' <> p_authority ->> 'provider'
  then raise exception 'provider_handle_authority_registration_binding_mismatch'; end if;
  select e.workspace_id into exchange_workspace_id
  from private.brain_provider_exchanges e
  where e.id = (p_handle ->> 'receipt_id')::uuid;
  if not found or exchange_workspace_id <> (p_authority ->> 'workspace_id')::uuid
  then raise exception 'provider_handle_authority_workspace_mismatch'; end if;

  perform private.brain_spend_provider_handle_authority(
    p_authority, p_token_sha256, 'provider_handle_crypto_writer', 'register'
  );
  select private.brain_register_provider_deletion_handle(p_handle - 'cipher_envelope_sha256') into result;
  return result;
end;
$$;

create or replace function private.brain_authorized_lease_provider_deletion_handle(
  p_authority jsonb,
  p_token_sha256 text,
  p_lease jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing private.brain_provider_deletion_handles%rowtype;
  exchange_workspace_id uuid;
  result jsonb;
begin
  select h.* into existing
  from private.brain_provider_deletion_handles h
  where h.id = (p_lease ->> 'handle_id')::uuid;
  if not found then raise exception 'provider_deletion_handle_not_found'; end if;
  select e.workspace_id into exchange_workspace_id
  from private.brain_provider_exchanges e where e.id = existing.exchange_id;
  if p_authority ->> 'handle_id' <> existing.id::text
    or p_authority ->> 'receipt_id' <> existing.exchange_id::text
    or p_authority ->> 'provider' <> existing.provider
    or (p_authority ->> 'workspace_id')::uuid <> exchange_workspace_id
    or (p_authority ->> 'lease_seconds')::integer <> (p_lease ->> 'lease_seconds')::integer
  then raise exception 'provider_handle_authority_lease_binding_mismatch'; end if;

  perform private.brain_spend_provider_handle_authority(
    p_authority, p_token_sha256, 'provider_deletion_worker', 'lease'
  );
  select private.brain_lease_provider_deletion_handle(p_lease) into result;
  return result;
end;
$$;

create or replace function private.brain_authorized_destroy_provider_deletion_handle(
  p_authority jsonb,
  p_token_sha256 text,
  p_destroy jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing private.brain_provider_deletion_handles%rowtype;
  exchange_workspace_id uuid;
  expected_reason text;
  expected_fact_id uuid;
  result jsonb;
begin
  select h.* into existing
  from private.brain_provider_deletion_handles h
  where h.id = (p_destroy ->> 'handle_id')::uuid;
  if not found then raise exception 'provider_deletion_handle_not_found'; end if;
  select e.workspace_id into exchange_workspace_id
  from private.brain_provider_exchanges e where e.id = existing.exchange_id;
  expected_reason := case p_authority ->> 'destruction_reason'
    when 'operational_deletion_succeeded' then 'operational_deletion'
    when 'account_closure_succeeded' then 'account_closure'
    when 'exchange_expired' then 'exchange_expired'
    else null
  end;
  expected_fact_id := case when p_authority -> 'success_fact_id' = 'null'::jsonb
    then null else (p_authority ->> 'success_fact_id')::uuid end;
  if p_authority ->> 'handle_id' <> existing.id::text
    or p_authority ->> 'receipt_id' <> existing.exchange_id::text
    or p_authority ->> 'provider' <> existing.provider
    or (p_authority ->> 'workspace_id')::uuid <> exchange_workspace_id
    or expected_reason is null or expected_reason <> p_destroy ->> 'destroy_reason'
    or expected_fact_id is distinct from (
      case when p_destroy -> 'closure_fact_id' = 'null'::jsonb then null else (p_destroy ->> 'closure_fact_id')::uuid end
    )
  then raise exception 'provider_handle_authority_destroy_binding_mismatch'; end if;

  perform private.brain_spend_provider_handle_authority(
    p_authority, p_token_sha256, 'provider_deletion_worker', 'destroy'
  );
  select private.brain_destroy_provider_deletion_handle(p_destroy) into result;
  return result;
end;
$$;

revoke all on table private.brain_provider_handle_authority_spends
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke select on table private.brain_provider_deletion_handles from service_role;
revoke all on function private.brain_spend_provider_handle_authority(jsonb, text, text, text)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_register_provider_deletion_handle(jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_lease_provider_deletion_handle(jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_destroy_provider_deletion_handle(jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_authorized_register_provider_deletion_handle(jsonb, text, jsonb)
  from public, anon, authenticated, service_role, provider_deletion_worker;
revoke all on function private.brain_authorized_lease_provider_deletion_handle(jsonb, text, jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer;
revoke all on function private.brain_authorized_destroy_provider_deletion_handle(jsonb, text, jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer;

grant usage on schema private to provider_handle_crypto_writer, provider_deletion_worker;
grant execute on function private.brain_authorized_register_provider_deletion_handle(jsonb, text, jsonb)
  to provider_handle_crypto_writer;
grant execute on function private.brain_authorized_lease_provider_deletion_handle(jsonb, text, jsonb)
  to provider_deletion_worker;
grant execute on function private.brain_authorized_destroy_provider_deletion_handle(jsonb, text, jsonb)
  to provider_deletion_worker;
