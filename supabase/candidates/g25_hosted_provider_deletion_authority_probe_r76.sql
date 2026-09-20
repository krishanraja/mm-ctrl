-- G25 R76 hosted pgcrypto, Vault and role-isolation probe.
-- Apply only after R68 in the named disposable Supabase branch.
-- This fixture writes synthetic rows and is not a product migration.

create temporary table r76_authority_probe (
  token text not null,
  invalid_token text not null,
  handle jsonb not null,
  handle_id uuid not null,
  authority_id uuid not null
) on commit drop;

do $$
declare
  workspace_id constant uuid := '76000000-0000-4000-8000-000000000001';
  receipt_id constant uuid := '76000000-0000-4000-8100-000000000001';
  handle_id constant uuid := '76000000-0000-4000-8200-000000000001';
  authority_id constant uuid := '76000000-0000-4000-8300-000000000001';
  actor_id constant uuid := '76000000-0000-4000-8400-000000000001';
  job_id constant uuid := '76000000-0000-4000-8500-000000000001';
  issued_at constant timestamptz := statement_timestamp() - interval '1 second';
  expires_at constant timestamptz := statement_timestamp() + interval '4 minutes';
  cipher_envelope jsonb;
  handle jsonb;
  authority jsonb;
  header jsonb;
  header_segment text;
  authority_segment text;
  signature_segment text;
  token text;
  signing_secret text;
  exchange_result jsonb;
  exchange_event_result jsonb;
begin
  exchange_result := private.brain_record_provider_exchange(jsonb_build_object(
    'schema_version', 'ctrl.provider-exchange-receipt.r51',
    'receipt_id', receipt_id,
    'workspace_id', workspace_id,
    'provider', 'elevenlabs',
    'processor_kind', 'audio',
    'callsite', 'supabase/functions/generate-tts/index.ts',
    'purpose_family', 'briefing_and_coaching',
    'data_classes', jsonb_build_array('public_web_content'),
    'request_sha256', repeat('1', 64),
    'idempotency_key_sha256', repeat('2', 64),
    'query_minimization_sha256', null,
    'control_mode', 'public_policy_default',
    'control_evidence_sha256', repeat('3', 64),
    'occurred_at', statement_timestamp() - interval '10 seconds'
  ));
  if exchange_result ->> 'status' <> 'recorded' then
    raise exception 'r76_authority_exchange_not_recorded';
  end if;
  exchange_event_result := private.brain_append_provider_exchange_event(jsonb_build_object(
    'schema_version', 'ctrl.provider-exchange-lifecycle-event.r51',
    'event_id', '76000000-0000-4000-8110-000000000001'::uuid,
    'receipt_id', receipt_id,
    'event_kind', 'accepted',
    'idempotency_key_sha256', repeat('6', 64),
    'provider_request_identity_hmac', repeat('7', 64),
    'evidence_sha256', repeat('8', 64),
    'occurred_at', statement_timestamp() - interval '5 seconds'
  ));
  if exchange_event_result ->> 'status' <> 'recorded' then
    raise exception 'r76_authority_exchange_event_not_recorded';
  end if;

  cipher_envelope := jsonb_build_object(
    'v', '1',
    'alg', 'A256GCM',
    'kid', 'r76-envelope',
    'iv', repeat('A', 16),
    'ciphertext', repeat('B', 32),
    'aad_sha256', repeat('4', 64)
  );
  handle := jsonb_build_object(
    'schema_version', 'ctrl.provider-deletion-handle.r65',
    'handle_id', handle_id,
    'receipt_id', receipt_id,
    'provider', 'elevenlabs',
    'retention_class', 'exchange_window',
    'cipher_envelope', cipher_envelope,
    'registration_idempotency_sha256', repeat('5', 64),
    'created_at', issued_at,
    'expires_at', issued_at + interval '30 days'
  );
  authority := jsonb_build_object(
    'schema_version', 'ctrl.provider-deletion-handle-authority.r66',
    'authority_id', authority_id,
    'workspace_id', workspace_id,
    'receipt_id', receipt_id,
    'handle_id', handle_id,
    'provider', 'elevenlabs',
    'actor_id', actor_id,
    'job_id', job_id,
    'issued_at', issued_at,
    'expires_at', expires_at,
    'role', 'provider_handle_crypto_writer',
    'operation', 'register',
    'cipher_envelope_sha256', private.brain_provider_deletion_handle_envelope_fingerprint_r68(cipher_envelope)
  );
  header := jsonb_build_object(
    'alg', 'HS256',
    'kid', 'r76test',
    'schema_version', 'ctrl.provider-deletion-handle-authority-token.r68',
    'typ', 'CTRL-PHAT',
    'v', '2'
  );
  header_segment := rtrim(translate(replace(encode(convert_to(header::text, 'UTF8'), 'base64'), chr(10), ''), '+/', '-_'), '=');
  authority_segment := rtrim(translate(replace(encode(convert_to(authority::text, 'UTF8'), 'base64'), chr(10), ''), '+/', '-_'), '=');
  select decrypted_secret into signing_secret
  from vault.decrypted_secrets
  where name = 'ctrl_provider_handle_authority_r76test';
  if signing_secret is null then raise exception 'r76_authority_vault_key_missing'; end if;
  signature_segment := rtrim(translate(replace(encode(
    extensions.hmac(
      convert_to(header_segment || '.' || authority_segment, 'UTF8'),
      private.brain_provider_handle_base64url_decode(signing_secret),
      'sha256'
    ),
    'base64'
  ), chr(10), ''), '+/', '-_'), '=');
  token := header_segment || '.' || authority_segment || '.' || signature_segment;

  insert into r76_authority_probe(token, invalid_token, handle, handle_id, authority_id)
  values (token, left(token, length(token) - 1) || case right(token, 1) when 'A' then 'B' else 'A' end, handle, handle_id, authority_id);
end;
$$;

grant select on r76_authority_probe to provider_handle_crypto_writer;
grant provider_handle_crypto_writer to postgres;

set local role provider_handle_crypto_writer;

do $$
declare
  probe r76_authority_probe%rowtype;
  result jsonb;
  rejected boolean := false;
begin
  select * into probe from r76_authority_probe;
  result := private.brain_verified_register_provider_deletion_handle(probe.token, probe.handle);
  if result ->> 'status' <> 'recorded' then
    raise exception 'r76_authority_valid_token_not_recorded';
  end if;
  begin
    perform private.brain_verified_register_provider_deletion_handle(probe.invalid_token, probe.handle);
  exception when others then
    rejected := sqlerrm in (
      'provider_handle_authority_signature_invalid',
      'provider_handle_authority_token_decode_invalid'
    );
  end;
  if not rejected then raise exception 'r76_authority_invalid_token_not_rejected'; end if;
end;
$$;

reset role;
revoke provider_handle_crypto_writer from postgres;

do $$
declare
  probe r76_authority_probe%rowtype;
begin
  select * into probe from r76_authority_probe;
  if not exists (
    select 1 from private.brain_provider_deletion_handles
    where id = probe.handle_id and state = 'active'
  ) then raise exception 'r76_authority_handle_missing'; end if;
  if not exists (
    select 1 from private.brain_provider_handle_authority_spends
    where authority_id = probe.authority_id
      and operation = 'register'
      and role = 'provider_handle_crypto_writer'
  ) then raise exception 'r76_authority_spend_missing'; end if;
end;
$$;
