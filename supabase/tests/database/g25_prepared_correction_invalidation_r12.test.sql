-- G25 R12 correction invalidation canary.
-- Run after R10, R11 and R12 candidates in a disposable database.

begin;

insert into auth.users (id, email)
values ('d1000000-0000-4000-8000-000000000001', 'g25-r12-subject@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values (
  'd2000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'g25-r12-correction'
);

insert into public.brain_items (
  id, workspace_id, subject_id, item_key, semantic_type, created_at, created_by
)
values
  (
    'd3000000-0000-4000-8000-000000000001',
    'd2000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'quality.final-mile', 'standard', '2026-09-16T08:00:00Z',
    'd1000000-0000-4000-8000-000000000001'
  ),
  (
    'd3000000-0000-4000-8000-000000000002',
    'd2000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'quality.causal-check', 'standard', '2026-09-16T08:00:00Z',
    'd1000000-0000-4000-8000-000000000001'
  );

insert into public.brain_item_versions (
  id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
  encryption_version, human_views, epistemic_basis, maturity, standing, audience,
  consequence_permission, applicability, exclusions, evidence_quality, corroboration,
  recency, transfer, human_confirmation, valid_from, recorded_at, created_by
)
values
  (
    'd4000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    1, 'Old final-mile standard', 'ciphertext:old-one', 1, array['how_i_judge'],
    'user_demonstrated', 'trusted', 'current', 'person_private', 'suggest_or_retrieve',
    '{}'::jsonb, '[]'::jsonb, 0.9, 0.8, 0.9, 0.7, 0.9,
    '2026-09-16T08:00:00Z', '2026-09-16T08:01:00Z', 'd1000000-0000-4000-8000-000000000001'
  ),
  (
    'd4000000-0000-4000-8000-000000000003', 'd3000000-0000-4000-8000-000000000002',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    1, 'Old causal standard', 'ciphertext:old-two', 1, array['how_i_decide'],
    'user_demonstrated', 'trusted', 'current', 'person_private', 'suggest_or_retrieve',
    '{}'::jsonb, '[]'::jsonb, 0.9, 0.8, 0.9, 0.7, 0.9,
    '2026-09-16T08:00:00Z', '2026-09-16T08:02:00Z', 'd1000000-0000-4000-8000-000000000001'
  );

insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, captured_at, purpose, audience,
  retention_expires_at, integrity_sha256, external_locator, recorded_at, created_by
)
values (
  'd5000000-0000-4000-8000-000000000001',
  'd2000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'external', '2026-09-16T08:00:00Z', 'prepared_intelligence', 'person_private',
  '2026-10-17T08:00:00Z', repeat('e', 64), 'https://example.test/evidence/r12',
  '2026-09-16T08:03:00Z', 'd1000000-0000-4000-8000-000000000001'
);

set local role service_role;

do $$
declare
  old_one jsonb;
  old_two jsonb;
  source_authority jsonb;
  dependency jsonb;
  receipt jsonb;
  result jsonb;
  observed_at timestamptz := '2026-09-17T08:59:00Z';
begin
  old_one := private.brain_current_prepared_authority(
    'brain_item_version', 'd4000000-0000-4000-8000-000000000001',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );
  old_two := private.brain_current_prepared_authority(
    'brain_item_version', 'd4000000-0000-4000-8000-000000000003',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );
  source_authority := private.brain_current_prepared_authority(
    'external_source_receipt', 'd5000000-0000-4000-8000-000000000001',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );

  for dependency, receipt in
    values
      (
        jsonb_build_array((old_one - 'recorded_at') || jsonb_build_object('observed_at', '2026-09-17T08:59:00Z')),
        jsonb_build_object('receipt_id', 'd6000000-0000-4000-8000-000000000001', 'ingest_key', 'r12-affected-one', 'request_sha256', repeat('1', 64), 'content_fingerprint', repeat('a', 64), 'payload_ciphertext', 'ciphertext:affected-one')
      ),
      (
        jsonb_build_array((source_authority - 'recorded_at') || jsonb_build_object('observed_at', '2026-09-17T08:59:00Z')),
        jsonb_build_object('receipt_id', 'd6000000-0000-4000-8000-000000000002', 'ingest_key', 'r12-unrelated', 'request_sha256', repeat('2', 64), 'content_fingerprint', repeat('b', 64), 'payload_ciphertext', 'ciphertext:unrelated')
      ),
      (
        jsonb_build_array((old_two - 'recorded_at') || jsonb_build_object('observed_at', '2026-09-17T08:59:00Z')),
        jsonb_build_object('receipt_id', 'd6000000-0000-4000-8000-000000000003', 'ingest_key', 'r12-rollback-target', 'request_sha256', repeat('3', 64), 'content_fingerprint', repeat('c', 64), 'payload_ciphertext', 'ciphertext:rollback-target')
      )
  loop
    receipt := receipt || jsonb_build_object(
      'workspace_id', 'd2000000-0000-4000-8000-000000000001',
      'owner_id', 'd1000000-0000-4000-8000-000000000001',
      'subject_id', 'd1000000-0000-4000-8000-000000000001',
      'kind', 'prepared_intelligence', 'audience', 'person_private', 'purpose', 'prepared_intelligence',
      'authority_fingerprint', private.brain_prepared_authority_fingerprint(
        (receipt ->> 'receipt_id')::uuid,
        'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
        'd1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence', dependency
      ),
      'encryption_version', 1, 'produced_at', '2026-09-17T09:00:00Z', 'expires_at', '2026-10-17T09:00:00Z'
    );
    result := private.brain_store_prepared_receipt(receipt, dependency);
    if result ->> 'status' <> 'created' then raise exception 'fixture receipt was not created'; end if;
  end loop;
end;
$$;

update public.brain_item_versions
set standing = 'superseded', valid_until = '2026-09-17T09:30:00Z', superseded_by_version_id = case id
  when 'd4000000-0000-4000-8000-000000000001' then 'd4000000-0000-4000-8000-000000000002'::uuid
  else 'd4000000-0000-4000-8000-000000000004'::uuid
end
where id in ('d4000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000003');

insert into public.brain_item_versions (
  id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
  encryption_version, human_views, epistemic_basis, maturity, standing, audience,
  consequence_permission, applicability, exclusions, evidence_quality, corroboration,
  recency, transfer, human_confirmation, valid_from, predecessor_version_id, recorded_at, created_by
)
values
  (
    'd4000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000001',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    2, 'Corrected final-mile standard', 'ciphertext:new-one', 1, array['how_i_judge'],
    'user_demonstrated', 'trusted', 'current', 'person_private', 'suggest_or_retrieve',
    '{}'::jsonb, '[]'::jsonb, 0.95, 0.9, 0.95, 0.8, 0.95,
    '2026-09-17T09:30:00Z', 'd4000000-0000-4000-8000-000000000001',
    '2026-09-17T09:31:00Z', 'd1000000-0000-4000-8000-000000000001'
  ),
  (
    'd4000000-0000-4000-8000-000000000004', 'd3000000-0000-4000-8000-000000000002',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    2, 'Corrected causal standard', 'ciphertext:new-two', 1, array['how_i_decide'],
    'user_demonstrated', 'trusted', 'current', 'person_private', 'suggest_or_retrieve',
    '{}'::jsonb, '[]'::jsonb, 0.95, 0.9, 0.95, 0.8, 0.95,
    '2026-09-17T09:30:00Z', 'd4000000-0000-4000-8000-000000000003',
    '2026-09-17T09:32:00Z', 'd1000000-0000-4000-8000-000000000001'
  );

do $$
declare
  replacement jsonb;
  correction jsonb;
  result jsonb;
begin
  replacement := private.brain_current_prepared_authority(
    'brain_item_version', 'd4000000-0000-4000-8000-000000000002',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );
  begin
    perform private.brain_invalidate_prepared_receipts_for_correction(jsonb_build_object(
      'correction_id', 'd7000000-0000-4000-8000-000000000099',
      'workspace_id', 'd2000000-0000-4000-8000-000000000001',
      'owner_id', 'd1000000-0000-4000-8000-000000000001',
      'subject_id', 'd1000000-0000-4000-8000-000000000001',
      'audience', 'person_private', 'purpose', 'prepared_intelligence', 'correction_mode', 'replaced',
      'affected_authority_kind', 'brain_item_version',
      'affected_authority_record_id', 'd4000000-0000-4000-8000-000000000001',
      'replacement_authority_record_id', 'd4000000-0000-4000-8000-000000000001',
      'replacement_authority_version', '1',
      'replacement_authority_sha256', (
        select authority_sha256 from public.brain_prepared_receipt_dependencies
        where receipt_id = 'd6000000-0000-4000-8000-000000000001'
      ),
      'request_sha256', repeat('8', 64), 'occurred_at', '2026-09-17T10:00:00Z'
    ));
    raise exception 'superseded replacement authority was accepted';
  exception when others then
    if sqlerrm not like '%replacement_authority_not_current%' then raise; end if;
  end;
  correction := jsonb_build_object(
    'correction_id', 'd7000000-0000-4000-8000-000000000001',
    'workspace_id', 'd2000000-0000-4000-8000-000000000001',
    'owner_id', 'd1000000-0000-4000-8000-000000000001',
    'subject_id', 'd1000000-0000-4000-8000-000000000001',
    'audience', 'person_private', 'purpose', 'prepared_intelligence', 'correction_mode', 'replaced',
    'affected_authority_kind', 'brain_item_version',
    'affected_authority_record_id', 'd4000000-0000-4000-8000-000000000001',
    'replacement_authority_record_id', replacement ->> 'authority_record_id',
    'replacement_authority_version', replacement ->> 'authority_version',
    'replacement_authority_sha256', replacement ->> 'authority_sha256',
    'request_sha256', repeat('4', 64), 'occurred_at', '2026-09-17T10:00:00Z'
  );

  result := private.brain_invalidate_prepared_receipts_for_correction(correction);
  if result ->> 'status' <> 'invalidated' or (result ->> 'affected_receipt_count')::integer <> 1 then
    raise exception 'correction did not invalidate exactly one receipt: %', result;
  end if;
  if (select invalidated_at is null from public.brain_prepared_receipts where id = 'd6000000-0000-4000-8000-000000000001') then
    raise exception 'affected receipt remained current';
  end if;
  if (select invalidated_at is not null from public.brain_prepared_receipts where id = 'd6000000-0000-4000-8000-000000000002') then
    raise exception 'unrelated receipt was invalidated';
  end if;
  if (select count(*) from public.brain_prepared_receipt_events where receipt_id = 'd6000000-0000-4000-8000-000000000001' and event_type = 'invalidated') <> 1 then
    raise exception 'invalidation event missing or duplicated';
  end if;

  result := private.brain_invalidate_prepared_receipts_for_correction(correction);
  if result ->> 'status' <> 'idempotent' or (result ->> 'affected_receipt_count')::integer <> 1 then
    raise exception 'exact correction replay did not preserve the original result: %', result;
  end if;

  begin
    perform private.brain_invalidate_prepared_receipts_for_correction(
      correction || jsonb_build_object('request_sha256', repeat('9', 64))
    );
    raise exception 'conflicting correction replay was accepted';
  exception when others then
    if sqlerrm not like '%correction_identity_conflict%' then raise; end if;
  end;
end;
$$;

reset role;

create function private.g25_r12_force_event_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.event_type = 'invalidated' and new.receipt_id = 'd6000000-0000-4000-8000-000000000003' then
    raise exception 'forced_r12_event_failure';
  end if;
  return new;
end;
$$;

create trigger g25_r12_force_event_failure
before insert on public.brain_prepared_receipt_events
for each row execute function private.g25_r12_force_event_failure();

set local role service_role;

do $$
declare
  replacement jsonb;
  correction jsonb;
begin
  replacement := private.brain_current_prepared_authority(
    'brain_item_version', 'd4000000-0000-4000-8000-000000000004',
    'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );
  correction := jsonb_build_object(
    'correction_id', 'd7000000-0000-4000-8000-000000000002',
    'workspace_id', 'd2000000-0000-4000-8000-000000000001',
    'owner_id', 'd1000000-0000-4000-8000-000000000001',
    'subject_id', 'd1000000-0000-4000-8000-000000000001',
    'audience', 'person_private', 'purpose', 'prepared_intelligence', 'correction_mode', 'replaced',
    'affected_authority_kind', 'brain_item_version',
    'affected_authority_record_id', 'd4000000-0000-4000-8000-000000000003',
    'replacement_authority_record_id', replacement ->> 'authority_record_id',
    'replacement_authority_version', replacement ->> 'authority_version',
    'replacement_authority_sha256', replacement ->> 'authority_sha256',
    'request_sha256', repeat('5', 64), 'occurred_at', '2026-09-17T10:01:00Z'
  );
  begin
    perform private.brain_invalidate_prepared_receipts_for_correction(correction);
    raise exception 'forced correction failure unexpectedly committed';
  exception when others then
    if sqlerrm not like '%forced_r12_event_failure%' then raise; end if;
  end;
  if (select invalidated_at is not null from public.brain_prepared_receipts where id = 'd6000000-0000-4000-8000-000000000003') then
    raise exception 'failed event left receipt invalidated';
  end if;
  if exists (select 1 from public.brain_prepared_authority_corrections where id = 'd7000000-0000-4000-8000-000000000002') then
    raise exception 'failed event left correction receipt';
  end if;
end;
$$;

reset role;
drop trigger g25_r12_force_event_failure on public.brain_prepared_receipt_events;
drop function private.g25_r12_force_event_failure();

set local role authenticated;

do $$
begin
  begin
    perform private.brain_invalidate_prepared_receipts_for_correction('{}'::jsonb);
    raise exception 'authenticated correction execution unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.brain_prepared_receipts
    set invalidated_at = now()
    where id = 'd6000000-0000-4000-8000-000000000002';
    raise exception 'authenticated direct invalidation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select jsonb_build_object(
  'status', 'passed',
  'replacement_authority_required', true,
  'superseded_replacement_closed', true,
  'different_version_row_supported', true,
  'exact_scope_invalidation', true,
  'unrelated_receipt_preserved', true,
  'payload_free_event_written', true,
  'exact_replay_idempotent', true,
  'conflicting_replay_closed', true,
  'forced_event_failure_rolled_back', true,
  'authenticated_invalidation_closed', true
) as g25_correction_invalidation_result;

rollback;
