-- G25 R68 database-verifiable provider deletion-handle authority candidate.
-- Supabase-only design: requires pgcrypto in extensions and a Vault secret named
-- ctrl_provider_handle_authority_<kid>. This is not an authorised migration.

create extension if not exists pgcrypto with schema extensions;

create or replace function private.brain_provider_handle_base64url_decode(p_value text)
returns bytea
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  decoded bytea;
  canonical text;
begin
  if p_value !~ '^[A-Za-z0-9_-]+$' then raise exception 'provider_handle_authority_token_encoding_invalid'; end if;
  decoded := pg_catalog.decode(
    pg_catalog.translate(p_value, '-_', '+/') || pg_catalog.repeat('=', (4 - pg_catalog.length(p_value) % 4) % 4),
    'base64'
  );
  canonical := pg_catalog.rtrim(pg_catalog.translate(
    pg_catalog.replace(pg_catalog.encode(decoded, 'base64'), pg_catalog.chr(10), ''), '+/', '-_'
  ), '=');
  if canonical <> p_value then raise exception 'provider_handle_authority_token_encoding_invalid'; end if;
  return decoded;
exception when others then
  raise exception 'provider_handle_authority_token_encoding_invalid';
end;
$$;

create or replace function private.brain_verify_provider_handle_db_authority(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  segments text[];
  header jsonb;
  authority jsonb;
  key_id text;
  signing_secret text;
  supplied_signature bytea;
  expected_signature bytea;
  token_sha256 text;
begin
  if pg_catalog.length(p_token) not between 256 and 8192
  then raise exception 'provider_handle_authority_token_size_invalid'; end if;
  segments := pg_catalog.string_to_array(p_token, '.');
  if pg_catalog.array_length(segments, 1) <> 3
  then raise exception 'provider_handle_authority_token_shape_invalid'; end if;

  begin
    header := pg_catalog.convert_from(private.brain_provider_handle_base64url_decode(segments[1]), 'UTF8')::jsonb;
    authority := pg_catalog.convert_from(private.brain_provider_handle_base64url_decode(segments[2]), 'UTF8')::jsonb;
    supplied_signature := private.brain_provider_handle_base64url_decode(segments[3]);
  exception when others then
    raise exception 'provider_handle_authority_token_decode_invalid';
  end;
  if jsonb_typeof(header) <> 'object' or (select count(*) from jsonb_object_keys(header)) <> 5
    or not (header ?& array['alg', 'kid', 'schema_version', 'typ', 'v'])
    or header ->> 'alg' <> 'HS256'
    or header ->> 'schema_version' <> 'ctrl.provider-deletion-handle-authority-token.r68'
    or header ->> 'typ' <> 'CTRL-PHAT'
    or header ->> 'v' <> '2'
    or header ->> 'kid' !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
  then raise exception 'provider_handle_authority_header_invalid'; end if;
  if jsonb_typeof(authority) <> 'object'
  then raise exception 'provider_handle_authority_payload_invalid'; end if;
  if pg_catalog.octet_length(supplied_signature) <> 32
  then raise exception 'provider_handle_authority_signature_invalid'; end if;

  key_id := header ->> 'kid';
  select v.decrypted_secret into signing_secret
  from vault.decrypted_secrets v
  where v.name = 'ctrl_provider_handle_authority_' || key_id;
  if not found or signing_secret is null or signing_secret !~ '^[A-Za-z0-9_-]{43}$'
  then raise exception 'provider_handle_authority_verification_key_unavailable'; end if;

  expected_signature := extensions.hmac(
    pg_catalog.convert_to(segments[1] || '.' || segments[2], 'UTF8'),
    private.brain_provider_handle_base64url_decode(signing_secret),
    'sha256'
  );
  if supplied_signature <> expected_signature
  then raise exception 'provider_handle_authority_signature_invalid'; end if;
  token_sha256 := pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
  return jsonb_build_object('authority', authority, 'token_sha256', token_sha256);
end;
$$;

create or replace function private.brain_provider_deletion_handle_envelope_fingerprint_r68(p_envelope jsonb)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
begin
  if jsonb_typeof(p_envelope) <> 'object'
    or (select count(*) from jsonb_object_keys(p_envelope)) <> 6
    or not (p_envelope ?& array['v', 'alg', 'kid', 'iv', 'ciphertext', 'aad_sha256'])
    or p_envelope ->> 'v' <> '1'
    or p_envelope ->> 'alg' <> 'A256GCM'
    or p_envelope ->> 'kid' !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
    or pg_catalog.length(p_envelope ->> 'iv') <> 16
    or p_envelope ->> 'iv' !~ '^[A-Za-z0-9_-]+$'
    or pg_catalog.length(p_envelope ->> 'ciphertext') not between 23 and 1024
    or p_envelope ->> 'ciphertext' !~ '^[A-Za-z0-9_-]+$'
    or p_envelope ->> 'aad_sha256' !~ '^[0-9a-f]{64}$'
  then raise exception 'provider_deletion_handle_cipher_envelope_invalid'; end if;
  return pg_catalog.encode(extensions.digest(pg_catalog.convert_to(pg_catalog.concat_ws(
    pg_catalog.chr(31),
    'ctrl.provider-deletion-handle-envelope-fingerprint.r68',
    p_envelope ->> 'v', p_envelope ->> 'alg', p_envelope ->> 'kid',
    p_envelope ->> 'iv', p_envelope ->> 'ciphertext', p_envelope ->> 'aad_sha256'
  ), 'UTF8'), 'sha256'), 'hex');
end;
$$;

create or replace function private.brain_verified_register_provider_deletion_handle(
  p_token text,
  p_handle jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  verification jsonb;
  authority jsonb;
  command jsonb;
begin
  if jsonb_typeof(p_handle) <> 'object' or (select count(*) from jsonb_object_keys(p_handle)) <> 9
    or not (p_handle ?& array[
      'schema_version', 'handle_id', 'receipt_id', 'provider', 'retention_class',
      'cipher_envelope', 'registration_idempotency_sha256', 'created_at', 'expires_at'
    ])
  then raise exception 'provider_handle_verified_registration_shape_invalid'; end if;
  verification := private.brain_verify_provider_handle_db_authority(p_token);
  authority := verification -> 'authority';
  command := p_handle || jsonb_build_object(
    'cipher_envelope_sha256',
    private.brain_provider_deletion_handle_envelope_fingerprint_r68(p_handle -> 'cipher_envelope')
  );
  return private.brain_authorized_register_provider_deletion_handle(
    authority, verification ->> 'token_sha256', command
  );
end;
$$;

create or replace function private.brain_verified_lease_provider_deletion_handle(
  p_token text,
  p_lease jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  verification jsonb;
begin
  verification := private.brain_verify_provider_handle_db_authority(p_token);
  return private.brain_authorized_lease_provider_deletion_handle(
    verification -> 'authority', verification ->> 'token_sha256', p_lease
  );
end;
$$;

create or replace function private.brain_verified_destroy_provider_deletion_handle(
  p_token text,
  p_destroy jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  verification jsonb;
begin
  verification := private.brain_verify_provider_handle_db_authority(p_token);
  return private.brain_authorized_destroy_provider_deletion_handle(
    verification -> 'authority', verification ->> 'token_sha256', p_destroy
  );
end;
$$;

revoke all on function private.brain_provider_handle_base64url_decode(text)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_verify_provider_handle_db_authority(text)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_provider_deletion_handle_envelope_fingerprint_r68(jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
revoke all on function private.brain_authorized_register_provider_deletion_handle(jsonb, text, jsonb)
  from provider_handle_crypto_writer;
revoke all on function private.brain_authorized_lease_provider_deletion_handle(jsonb, text, jsonb)
  from provider_deletion_worker;
revoke all on function private.brain_authorized_destroy_provider_deletion_handle(jsonb, text, jsonb)
  from provider_deletion_worker;
revoke all on function private.brain_verified_register_provider_deletion_handle(text, jsonb)
  from public, anon, authenticated, service_role, provider_deletion_worker;
revoke all on function private.brain_verified_lease_provider_deletion_handle(text, jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer;
revoke all on function private.brain_verified_destroy_provider_deletion_handle(text, jsonb)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer;

grant execute on function private.brain_verified_register_provider_deletion_handle(text, jsonb)
  to provider_handle_crypto_writer;
grant execute on function private.brain_verified_lease_provider_deletion_handle(text, jsonb)
  to provider_deletion_worker;
grant execute on function private.brain_verified_destroy_provider_deletion_handle(text, jsonb)
  to provider_deletion_worker;
