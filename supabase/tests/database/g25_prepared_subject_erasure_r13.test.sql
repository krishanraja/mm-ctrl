-- G25 R13 prepared-subject erasure canary.
-- Run after R10 through R13 candidates in a disposable database.

begin;

insert into auth.users (id, email)
values ('e1000000-0000-4000-8000-000000000001', 'g25-r13-subject@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values
  (
    'e2000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'g25-r13-erasure-one'
  ),
  (
    'e2000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001',
    'g25-r13-erasure-two'
  );

insert into public.brain_items (
  id, workspace_id, subject_id, item_key, semantic_type, created_at, created_by
)
values
  (
    'e3000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001', 'quality.erasure-one', 'standard',
    '2026-09-16T08:00:00Z', 'e1000000-0000-4000-8000-000000000001'
  ),
  (
    'e3000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000001', 'quality.erasure-two', 'standard',
    '2026-09-16T08:00:00Z', 'e1000000-0000-4000-8000-000000000001'
  );

insert into public.brain_item_versions (
  id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
  encryption_version, human_views, epistemic_basis, maturity, standing, audience,
  consequence_permission, applicability, exclusions, evidence_quality, corroboration,
  recency, transfer, human_confirmation, valid_from, recorded_at, created_by
)
values
  (
    'e4000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
    1, 'Erasure standard one', 'ciphertext:authority-one', 1, array['how_i_judge'],
    'user_demonstrated', 'trusted', 'current', 'person_private', 'suggest_or_retrieve',
    '{}'::jsonb, '[]'::jsonb, 0.9, 0.8, 0.9, 0.7, 0.9,
    '2026-09-16T08:00:00Z', '2026-09-16T08:01:00Z', 'e1000000-0000-4000-8000-000000000001'
  ),
  (
    'e4000000-0000-4000-8000-000000000002', 'e3000000-0000-4000-8000-000000000002',
    'e2000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001',
    1, 'Erasure standard two', 'ciphertext:authority-two', 1, array['how_i_judge'],
    'user_demonstrated', 'trusted', 'current', 'person_private', 'suggest_or_retrieve',
    '{}'::jsonb, '[]'::jsonb, 0.9, 0.8, 0.9, 0.7, 0.9,
    '2026-09-16T08:00:00Z', '2026-09-16T08:02:00Z', 'e1000000-0000-4000-8000-000000000001'
  );

set local role service_role;

do $$
declare
  workspace_id uuid;
  authority_id uuid;
  receipt_id uuid;
  authority jsonb;
  dependency jsonb;
  receipt jsonb;
  result jsonb;
begin
  for workspace_id, authority_id, receipt_id in
    values
      ('e2000000-0000-4000-8000-000000000001'::uuid, 'e4000000-0000-4000-8000-000000000001'::uuid, 'e6000000-0000-4000-8000-000000000001'::uuid),
      ('e2000000-0000-4000-8000-000000000002'::uuid, 'e4000000-0000-4000-8000-000000000002'::uuid, 'e6000000-0000-4000-8000-000000000002'::uuid)
  loop
    authority := private.brain_current_prepared_authority(
      'brain_item_version', authority_id, workspace_id,
      'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
      'person_private', 'prepared_intelligence'
    );
    dependency := jsonb_build_array(
      (authority - 'recorded_at') || jsonb_build_object('observed_at', '2026-09-17T08:59:00Z')
    );
    receipt := jsonb_build_object(
      'receipt_id', receipt_id,
      'workspace_id', workspace_id,
      'owner_id', 'e1000000-0000-4000-8000-000000000001',
      'subject_id', 'e1000000-0000-4000-8000-000000000001',
      'ingest_key', 'r13-' || workspace_id::text,
      'request_sha256', repeat(case when workspace_id::text like '%0001' then '1' else '2' end, 64),
      'kind', 'prepared_intelligence', 'audience', 'person_private', 'purpose', 'prepared_intelligence',
      'authority_fingerprint', private.brain_prepared_authority_fingerprint(
        receipt_id, workspace_id, 'e1000000-0000-4000-8000-000000000001',
        'e1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence', dependency
      ),
      'content_fingerprint', repeat(case when workspace_id::text like '%0001' then 'a' else 'b' end, 64),
      'payload_ciphertext', 'ciphertext:prepared:' || workspace_id::text,
      'encryption_version', 1,
      'produced_at', '2026-09-17T09:00:00Z', 'expires_at', '2026-10-17T09:00:00Z'
    );
    result := private.brain_store_prepared_receipt(receipt, dependency);
    if result ->> 'status' <> 'created' then raise exception 'fixture receipt was not created'; end if;
  end loop;
end;
$$;

do $$
declare
  erasure jsonb := jsonb_build_object(
    'erasure_id', 'e7000000-0000-4000-8000-000000000001',
    'workspace_id', 'e2000000-0000-4000-8000-000000000001',
    'owner_id', 'e1000000-0000-4000-8000-000000000001',
    'subject_id', 'e1000000-0000-4000-8000-000000000001',
    'request_sha256', repeat('3', 64),
    'occurred_at', '2026-09-17T10:00:00Z'
  );
  result jsonb;
  replacement_authority jsonb;
  dependency jsonb;
  replacement_receipt jsonb;
begin
  result := private.brain_erase_prepared_subject(erasure);
  if result ->> 'status' <> 'erased' or (result ->> 'erased_receipt_count')::integer <> 1 then
    raise exception 'subject erasure did not erase exactly one receipt: %', result;
  end if;
  if not private.brain_prepared_subject_erased(
    'e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001'
  ) then raise exception 'erasure tombstone did not close subject recreation'; end if;
  if exists (
    select 1 from public.brain_prepared_receipts
    where id = 'e6000000-0000-4000-8000-000000000001'
      and (payload_ciphertext is not null or encryption_version is not null or ingest_key not like 'erased:%')
  ) then raise exception 'erased receipt retained recoverable payload or ingest identity'; end if;
  if exists (
    select 1 from public.brain_prepared_receipts
    where id = 'e6000000-0000-4000-8000-000000000001'
      and not (request_sha256 = authority_fingerprint and authority_fingerprint = content_fingerprint)
  ) then raise exception 'erased receipt retained original fingerprints'; end if;
  if exists (
    select 1 from public.brain_prepared_receipt_dependencies
    where receipt_id = 'e6000000-0000-4000-8000-000000000001'
  ) then raise exception 'erased receipt retained authority dependencies'; end if;
  if (select count(*) from public.brain_prepared_receipt_events where receipt_id = 'e6000000-0000-4000-8000-000000000001') <> 1
    or not exists (
      select 1 from public.brain_prepared_receipt_events
      where receipt_id = 'e6000000-0000-4000-8000-000000000001' and event_type = 'erased'
    )
  then raise exception 'erased receipt retained non-erasure events or lost its tombstone event'; end if;
  if (select payload_ciphertext is null from public.brain_prepared_receipts where id = 'e6000000-0000-4000-8000-000000000002') then
    raise exception 'cross-workspace receipt was erased';
  end if;

  result := private.brain_erase_prepared_subject(erasure);
  if result ->> 'status' <> 'idempotent' or (result ->> 'erased_receipt_count')::integer <> 1 then
    raise exception 'exact erasure replay did not preserve original result: %', result;
  end if;

  begin
    perform private.brain_erase_prepared_subject(erasure || jsonb_build_object('request_sha256', repeat('9', 64)));
    raise exception 'conflicting erasure replay was accepted';
  exception when others then
    if sqlerrm not like '%erasure_identity_conflict%' then raise; end if;
  end;

  replacement_authority := private.brain_current_prepared_authority(
    'brain_item_version', 'e4000000-0000-4000-8000-000000000001',
    'e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence'
  );
  dependency := jsonb_build_array(
    (replacement_authority - 'recorded_at') || jsonb_build_object('observed_at', '2026-09-17T10:01:00Z')
  );
  replacement_receipt := jsonb_build_object(
    'receipt_id', 'e6000000-0000-4000-8000-000000000099',
    'workspace_id', 'e2000000-0000-4000-8000-000000000001',
    'owner_id', 'e1000000-0000-4000-8000-000000000001',
    'subject_id', 'e1000000-0000-4000-8000-000000000001',
    'ingest_key', 'r13-silent-revival', 'request_sha256', repeat('4', 64),
    'kind', 'prepared_intelligence', 'audience', 'person_private', 'purpose', 'prepared_intelligence',
    'authority_fingerprint', private.brain_prepared_authority_fingerprint(
      'e6000000-0000-4000-8000-000000000099', 'e2000000-0000-4000-8000-000000000001',
      'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
      'person_private', 'prepared_intelligence', dependency
    ),
    'content_fingerprint', repeat('c', 64), 'payload_ciphertext', 'ciphertext:revived',
    'encryption_version', 1, 'produced_at', '2026-09-17T10:02:00Z', 'expires_at', '2026-10-17T10:02:00Z'
  );
  begin
    perform private.brain_store_prepared_receipt(replacement_receipt, dependency);
    raise exception 'silent subject revival was accepted';
  exception when others then
    if sqlerrm not like '%prepared_subject_erased%' then raise; end if;
  end;
end;
$$;

reset role;

create function private.g25_r13_force_event_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.event_type = 'erased' and new.receipt_id = 'e6000000-0000-4000-8000-000000000002' then
    raise exception 'forced_r13_event_failure';
  end if;
  return new;
end;
$$;

create trigger g25_r13_force_event_failure
before insert on public.brain_prepared_receipt_events
for each row execute function private.g25_r13_force_event_failure();

set local role service_role;

do $$
begin
  begin
    perform private.brain_erase_prepared_subject(jsonb_build_object(
      'erasure_id', 'e7000000-0000-4000-8000-000000000002',
      'workspace_id', 'e2000000-0000-4000-8000-000000000002',
      'owner_id', 'e1000000-0000-4000-8000-000000000001',
      'subject_id', 'e1000000-0000-4000-8000-000000000001',
      'request_sha256', repeat('5', 64), 'occurred_at', '2026-09-17T10:03:00Z'
    ));
    raise exception 'forced erasure failure unexpectedly committed';
  exception when others then
    if sqlerrm not like '%forced_r13_event_failure%' then raise; end if;
  end;
  if (select payload_ciphertext is null from public.brain_prepared_receipts where id = 'e6000000-0000-4000-8000-000000000002') then
    raise exception 'failed event erased the payload';
  end if;
  if not exists (
    select 1 from public.brain_prepared_receipt_dependencies where receipt_id = 'e6000000-0000-4000-8000-000000000002'
  ) then raise exception 'failed event erased dependencies'; end if;
  if exists (
    select 1 from public.brain_prepared_subject_erasure_tombstones
    where workspace_id = 'e2000000-0000-4000-8000-000000000002'
  ) then raise exception 'failed event left a subject tombstone'; end if;
end;
$$;

reset role;
drop trigger g25_r13_force_event_failure on public.brain_prepared_receipt_events;
drop function private.g25_r13_force_event_failure();

set local role authenticated;

do $$
begin
  begin
    perform private.brain_erase_prepared_subject('{}'::jsonb);
    raise exception 'authenticated erasure execution unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.brain_prepared_receipts
    set payload_ciphertext = null, encryption_version = null, erased_at = now()
    where id = 'e6000000-0000-4000-8000-000000000002';
    raise exception 'authenticated direct erasure unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select jsonb_build_object(
  'status', 'passed',
  'ciphertext_destroyed', true,
  'encryption_version_destroyed', true,
  'identifying_hashes_replaced', true,
  'authority_dependencies_destroyed', true,
  'prior_events_destroyed', true,
  'payload_free_erasure_event_retained', true,
  'subject_tombstone_blocks_revival', true,
  'cross_workspace_isolation', true,
  'exact_replay_idempotent', true,
  'conflicting_replay_closed', true,
  'forced_event_failure_rolled_back', true,
  'authenticated_erasure_closed', true
) as g25_subject_erasure_result;

rollback;
