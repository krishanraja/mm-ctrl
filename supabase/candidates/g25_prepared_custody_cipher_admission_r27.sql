-- G25 R27 custody-native ciphertext admission candidate.
-- This is a non-migration overlay for R25 and R26.
-- It validates envelope structure and authenticated-context identity without key access.

create or replace function private.brain_prepared_custody_cipher_aad_sha256(
  p_workspace_id uuid,
  p_custody_principal_id uuid,
  p_subject_id uuid,
  p_record_id uuid,
  p_audience text,
  p_purpose text,
  p_authority_fingerprint text
)
returns text
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select encode(sha256(convert_to(
    '{"v":2'
      || ',"schema_version":"ctrl.brain-prepared-custody-cipher-context.r26"'
      || ',"workspace_id":' || to_jsonb(lower(p_workspace_id::text))::text
      || ',"custody_principal_id":' || to_jsonb(lower(p_custody_principal_id::text))::text
      || ',"subject_id":' || to_jsonb(lower(p_subject_id::text))::text
      || ',"record_kind":"prepared_custody_receipt"'
      || ',"record_id":' || to_jsonb(lower(p_record_id::text))::text
      || ',"field":"payload"'
      || ',"audience":' || to_jsonb(p_audience)::text
      || ',"purpose":' || to_jsonb(p_purpose)::text
      || ',"authority_fingerprint":' || to_jsonb(p_authority_fingerprint)::text
      || '}',
    'UTF8'
  )), 'hex')
$$;

create or replace function private.brain_prepared_custody_cipher_admission()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  envelope jsonb;
  expected_aad_sha256 text;
begin
  if new.encryption_version <> 2 then
    raise exception 'custody_cipher_version_invalid';
  end if;
  begin
    envelope := new.payload_ciphertext::jsonb;
  exception when others then
    raise exception 'custody_cipher_envelope_invalid';
  end;
  if jsonb_typeof(envelope) <> 'object' or (
    select count(*) <> 6
      or count(*) filter (where key = any(array[
        'v', 'alg', 'kid', 'iv', 'ciphertext', 'aad_sha256'
      ])) <> 6
    from jsonb_object_keys(envelope) as member(key)
  ) then raise exception 'custody_cipher_envelope_invalid'; end if;
  if envelope ->> 'v' <> '2'
    or envelope ->> 'alg' <> 'A256GCM'
    or envelope ->> 'kid' !~ '^[a-z0-9][a-z0-9._-]{2,63}$'
    or envelope ->> 'iv' !~ '^[A-Za-z0-9+/_-]+={0,2}$'
    or envelope ->> 'ciphertext' !~ '^[A-Za-z0-9+/_-]+={0,2}$'
    or envelope ->> 'aad_sha256' !~ '^[0-9a-f]{64}$'
  then raise exception 'custody_cipher_envelope_invalid'; end if;

  expected_aad_sha256 := private.brain_prepared_custody_cipher_aad_sha256(
    new.workspace_id,
    new.custody_principal_id,
    new.subject_id,
    new.id,
    new.audience,
    new.purpose,
    new.authority_fingerprint
  );
  if envelope ->> 'aad_sha256' <> expected_aad_sha256 then
    raise exception 'custody_cipher_context_mismatch';
  end if;
  return new;
end;
$$;

create trigger brain_prepared_custody_cipher_admission
before insert on public.brain_prepared_custody_receipts
for each row execute function private.brain_prepared_custody_cipher_admission();

revoke all on function private.brain_prepared_custody_cipher_aad_sha256(uuid, uuid, uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function private.brain_prepared_custody_cipher_admission()
  from public, anon, authenticated;
grant execute on function private.brain_prepared_custody_cipher_aad_sha256(uuid, uuid, uuid, uuid, text, text, text)
  to service_role;
