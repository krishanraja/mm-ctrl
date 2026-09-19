-- G25 R76 hosted Supabase repair for the R68 authority verifier.
-- R68 used key_id as a PL/pgSQL variable while Supabase Vault also exposes a
-- key_id column. Hosted PostgreSQL therefore rejected the secret lookup as
-- ambiguous. Preserve R68 as evidence and apply this forward-only candidate.
-- This is not an authorised product migration.

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
  authority_key_id text;
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

  authority_key_id := header ->> 'kid';
  select v.decrypted_secret into signing_secret
  from vault.decrypted_secrets v
  where v.name = 'ctrl_provider_handle_authority_' || authority_key_id;
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

revoke all on function private.brain_verify_provider_handle_db_authority(text)
  from public, anon, authenticated, service_role, provider_handle_crypto_writer, provider_deletion_worker;
