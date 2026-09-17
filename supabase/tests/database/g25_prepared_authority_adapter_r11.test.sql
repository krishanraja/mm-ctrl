-- G25 R11 real Brain current-authority adapter canary.
-- Run after R10 and R11 candidates in a disposable database.

begin;

insert into auth.users (id, email)
values ('c1000000-0000-4000-8000-000000000001', 'g25-r11-subject@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values (
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'g25-r11-authority-adapter'
);

insert into public.brain_items (
  id, workspace_id, subject_id, item_key, semantic_type, created_at, created_by
)
values (
  'c3000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'quality.final-mile',
  'standard',
  '2026-09-16T08:00:00Z',
  'c1000000-0000-4000-8000-000000000001'
);

insert into public.brain_item_versions (
  id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
  encryption_version, human_views, epistemic_basis, maturity, standing, audience,
  consequence_permission, applicability, exclusions, evidence_quality, corroboration,
  recency, transfer, human_confirmation, valid_from, recorded_at, created_by
)
values (
  'c4000000-0000-4000-8000-000000000001',
  'c3000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  3,
  'The final mile preserves judgement',
  'ciphertext:item-version:r11',
  1,
  array['how_i_judge'],
  'user_demonstrated',
  'trusted',
  'current',
  'person_private',
  'suggest_or_retrieve',
  '{"decision_altitude":"consequential"}'::jsonb,
  '[]'::jsonb,
  0.910,
  0.820,
  0.950,
  0.740,
  0.900,
  '2026-09-16T08:30:00Z',
  '2026-09-16T08:31:00Z',
  'c1000000-0000-4000-8000-000000000001'
);

insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, captured_at, purpose, audience,
  retention_expires_at, integrity_sha256, external_locator, recorded_at, created_by
)
values (
  'c5000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'external',
  '2026-09-16T09:00:00Z',
  'prepared_intelligence',
  'person_private',
  '2026-10-17T09:00:00Z',
  repeat('e', 64),
  'https://example.test/evidence/r11',
  '2026-09-16T09:01:00Z',
  'c1000000-0000-4000-8000-000000000001'
);

set local role service_role;

do $$
declare
  item_authority jsonb;
  source_authority jsonb;
  changed_authority jsonb;
  dependencies jsonb;
  receipt jsonb;
  result jsonb;
  observed_at timestamptz := '2026-09-17T08:59:00Z';
begin
  item_authority := private.brain_current_prepared_authority(
    'brain_item_version',
    'c4000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'person_private',
    'prepared_intelligence'
  );
  source_authority := private.brain_current_prepared_authority(
    'external_source_receipt',
    'c5000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'person_private',
    'prepared_intelligence'
  );

  if item_authority is null or source_authority is null then raise exception 'real authority snapshot missing'; end if;
  if item_authority ? 'meaning_ciphertext' or source_authority ? 'content_ciphertext' then
    raise exception 'authority snapshot leaked content';
  end if;
  if item_authority ->> 'authority_version' <> '3' or source_authority ->> 'authority_version' <> '1' then
    raise exception 'authority version mapping is wrong';
  end if;

  dependencies := jsonb_build_array(
    (item_authority - 'recorded_at') || jsonb_build_object('observed_at', to_char(observed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
    (source_authority - 'recorded_at') || jsonb_build_object('observed_at', to_char(observed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
  );
  receipt := jsonb_build_object(
    'receipt_id', 'c6000000-0000-4000-8000-000000000001',
    'workspace_id', 'c2000000-0000-4000-8000-000000000001',
    'owner_id', 'c1000000-0000-4000-8000-000000000001',
    'subject_id', 'c1000000-0000-4000-8000-000000000001',
    'ingest_key', 'g25-r11-real-authority',
    'request_sha256', repeat('b', 64),
    'kind', 'prepared_intelligence',
    'audience', 'person_private',
    'purpose', 'prepared_intelligence',
    'authority_fingerprint', private.brain_prepared_authority_fingerprint(
      'c6000000-0000-4000-8000-000000000001',
      'c2000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000001',
      'c1000000-0000-4000-8000-000000000001',
      'person_private',
      'prepared_intelligence',
      dependencies
    ),
    'content_fingerprint', repeat('c', 64),
    'payload_ciphertext', 'ciphertext:real-authority:r11',
    'encryption_version', 1,
    'produced_at', '2026-09-17T09:00:00Z',
    'expires_at', '2026-10-17T09:00:00Z'
  );
  result := private.brain_store_prepared_receipt(receipt, dependencies);
  if result ->> 'status' <> 'created' then raise exception 'real-authority receipt was not created: %', result; end if;
  if (select count(*) from public.brain_prepared_receipt_dependencies where receipt_id = 'c6000000-0000-4000-8000-000000000001') <> 2 then
    raise exception 'real-authority receipt lost a dependency';
  end if;

  if not private.brain_prepared_authority_current(
    item_authority ->> 'authority_kind',
    (item_authority ->> 'authority_record_id')::uuid,
    item_authority ->> 'authority_version',
    item_authority ->> 'authority_sha256',
    observed_at,
    (item_authority ->> 'workspace_id')::uuid,
    (item_authority ->> 'owner_id')::uuid,
    (item_authority ->> 'subject_id')::uuid,
    item_authority ->> 'audience',
    item_authority ->> 'purpose'
  ) then raise exception 'exact item authority did not validate'; end if;

  if private.brain_prepared_authority_current(
    'brain_item_version',
    'c4000000-0000-4000-8000-000000000001',
    '2',
    item_authority ->> 'authority_sha256',
    observed_at,
    'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'person_private',
    'prepared_intelligence'
  ) then raise exception 'stale item version was accepted'; end if;

  if private.brain_prepared_authority_current(
    'brain_item_version',
    'c4000000-0000-4000-8000-000000000001',
    '3',
    item_authority ->> 'authority_sha256',
    '2026-09-16T08:30:00Z',
    'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'person_private',
    'prepared_intelligence'
  ) then raise exception 'authority was accepted before it was recorded'; end if;

  if private.brain_prepared_authority_current(
    'brain_item_version',
    'c4000000-0000-4000-8000-000000000001',
    '3',
    item_authority ->> 'authority_sha256',
    observed_at,
    'c2000000-0000-4000-8000-000000000099',
    'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'person_private',
    'prepared_intelligence'
  ) then raise exception 'cross-workspace item authority was accepted'; end if;

  update public.brain_item_versions
  set title = 'Changed meaning title'
  where id = 'c4000000-0000-4000-8000-000000000001';
  changed_authority := private.brain_current_prepared_authority(
    'brain_item_version', 'c4000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );
  if changed_authority ->> 'authority_sha256' = item_authority ->> 'authority_sha256' then
    raise exception 'semantic item change did not move the authority fingerprint';
  end if;
  update public.brain_item_versions
  set title = 'The final mile preserves judgement'
  where id = 'c4000000-0000-4000-8000-000000000001';

  update public.brain_item_versions
  set standing = 'superseded', valid_until = '2026-09-17T08:58:00Z'
  where id = 'c4000000-0000-4000-8000-000000000001';
  if private.brain_current_prepared_authority(
    'brain_item_version', 'c4000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  ) is not null then raise exception 'superseded item authority was accepted'; end if;
  update public.brain_item_versions
  set standing = 'current', valid_until = null
  where id = 'c4000000-0000-4000-8000-000000000001';

  update public.brain_item_versions
  set consequence_permission = 'prohibited_in_context'
  where id = 'c4000000-0000-4000-8000-000000000001';
  if private.brain_current_prepared_authority(
    'brain_item_version', 'c4000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  ) is not null then raise exception 'prohibited item authority was accepted'; end if;
  update public.brain_item_versions
  set consequence_permission = 'suggest_or_retrieve'
  where id = 'c4000000-0000-4000-8000-000000000001';

  update public.brain_sources
  set retention_expires_at = '2026-09-16T09:00:00Z'
  where id = 'c5000000-0000-4000-8000-000000000001';
  if private.brain_current_prepared_authority(
    'external_source_receipt', 'c5000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  ) is not null then raise exception 'expired external source authority was accepted'; end if;
  update public.brain_sources
  set retention_expires_at = '2026-10-17T09:00:00Z'
  where id = 'c5000000-0000-4000-8000-000000000001';

  update public.brain_sources set purpose = 'decision_support'
  where id = 'c5000000-0000-4000-8000-000000000001';
  if private.brain_current_prepared_authority(
    'external_source_receipt', 'c5000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  ) is not null then raise exception 'wrong-purpose external source authority was accepted'; end if;
  update public.brain_sources set purpose = 'prepared_intelligence'
  where id = 'c5000000-0000-4000-8000-000000000001';

  update public.brain_sources set integrity_sha256 = null
  where id = 'c5000000-0000-4000-8000-000000000001';
  if private.brain_current_prepared_authority(
    'external_source_receipt', 'c5000000-0000-4000-8000-000000000001',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  ) is not null then raise exception 'unverified external source authority was accepted'; end if;
  update public.brain_sources set integrity_sha256 = repeat('e', 64)
  where id = 'c5000000-0000-4000-8000-000000000001';

  if private.brain_current_prepared_authority(
    'decision_case_snapshot', 'c4000000-0000-4000-8000-000000000099',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  ) is not null then raise exception 'unmapped decision authority was accepted'; end if;
end;
$$;

reset role;

select jsonb_build_object(
  'status', 'passed',
  'brain_item_version_adapter', true,
  'external_source_receipt_adapter', true,
  'content_free_authority_projection', true,
  'semantic_fingerprint_sensitivity', true,
  'stale_version_closed', true,
  'pre_observation_closed', true,
  'cross_workspace_closed', true,
  'superseded_item_closed', true,
  'prohibited_item_closed', true,
  'expired_source_closed', true,
  'wrong_purpose_source_closed', true,
  'unverified_source_closed', true,
  'decision_authority_remains_closed', true,
  'atomic_store_used_real_authority', true
) as g25_authority_adapter_result;

rollback;
