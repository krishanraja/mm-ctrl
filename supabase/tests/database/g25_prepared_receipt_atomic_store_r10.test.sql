-- G25 R10 atomic prepared-receipt store canary.
-- Run only after the non-migration R10 candidate in a disposable database.

begin;

create table public.g25_current_authority_fixture (
  authority_kind text not null,
  authority_record_id uuid not null,
  authority_version text not null,
  authority_sha256 text not null,
  workspace_id uuid not null,
  owner_id uuid not null,
  subject_id uuid not null,
  audience text not null,
  purpose text not null,
  primary key (authority_kind, authority_record_id)
);
grant select on table public.g25_current_authority_fixture to service_role;

create or replace function private.brain_prepared_authority_current(
  p_authority_kind text,
  p_authority_record_id uuid,
  p_authority_version text,
  p_authority_sha256 text,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_subject_id uuid,
  p_audience text,
  p_purpose text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.g25_current_authority_fixture authority_row
    where authority_row.authority_kind = p_authority_kind
      and authority_row.authority_record_id = p_authority_record_id
      and authority_row.authority_version = p_authority_version
      and authority_row.authority_sha256 = p_authority_sha256
      and authority_row.workspace_id = p_workspace_id
      and authority_row.owner_id = p_owner_id
      and authority_row.subject_id = p_subject_id
      and authority_row.audience = p_audience
      and authority_row.purpose = p_purpose
  )
$$;

create or replace function private.g25_r10_receipt_fixture(
  p_receipt_id uuid,
  p_ingest_key text,
  p_request_sha256 text,
  p_dependencies jsonb
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'receipt_id', p_receipt_id,
    'workspace_id', 'b2000000-0000-4000-8000-000000000001',
    'owner_id', 'b1000000-0000-4000-8000-000000000001',
    'subject_id', 'b1000000-0000-4000-8000-000000000001',
    'ingest_key', p_ingest_key,
    'request_sha256', p_request_sha256,
    'kind', 'prepared_intelligence',
    'audience', 'person_private',
    'purpose', 'prepared_intelligence',
    'authority_fingerprint', private.brain_prepared_authority_fingerprint(
      p_receipt_id,
      'b2000000-0000-4000-8000-000000000001',
      'b1000000-0000-4000-8000-000000000001',
      'b1000000-0000-4000-8000-000000000001',
      'person_private',
      'prepared_intelligence',
      p_dependencies
    ),
    'content_fingerprint', repeat('c', 64),
    'payload_ciphertext', 'ciphertext:prepared-receipt:r10',
    'encryption_version', 1,
    'produced_at', '2026-09-17T09:00:00Z',
    'expires_at', '2026-10-17T09:00:00Z'
  )
$$;

insert into auth.users (id, email)
values
  ('b1000000-0000-4000-8000-000000000001', 'g25-r10-owner@example.test'),
  ('b1000000-0000-4000-8000-000000000002', 'g25-r10-other-purpose@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values (
  'b2000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'g25-r10-atomic-store'
);

insert into public.brain_workspace_roles (workspace_id, user_id, role, granted_by)
values
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'owner', 'b1000000-0000-4000-8000-000000000001'),
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'viewer', 'b1000000-0000-4000-8000-000000000001');

insert into public.brain_audience_grants (
  id, workspace_id, grantee_user_id, audience, purpose, granted_by
)
values
  ('b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence', 'b1000000-0000-4000-8000-000000000001'),
  ('b3000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'person_private', 'decision_support', 'b1000000-0000-4000-8000-000000000001');

insert into public.g25_current_authority_fixture (
  authority_kind, authority_record_id, authority_version, authority_sha256,
  workspace_id, owner_id, subject_id, audience, purpose
)
values (
  'brain_item_version',
  'b4000000-0000-4000-8000-000000000001',
  '3',
  repeat('a', 64),
  'b2000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001',
  'person_private',
  'prepared_intelligence'
);

create or replace function private.g25_r10_fail_event_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.receipt_id = 'b5000000-0000-4000-8000-000000000002'::uuid then
    raise exception using errcode = '23514', message = 'g25_forced_event_failure';
  end if;
  return new;
end;
$$;

create trigger g25_r10_force_event_failure
before insert on public.brain_prepared_receipt_events
for each row execute function private.g25_r10_fail_event_insert();

set local role service_role;

do $$
declare
  dependencies jsonb := jsonb_build_array(jsonb_build_object(
    'authority_kind', 'brain_item_version',
    'authority_record_id', 'b4000000-0000-4000-8000-000000000001',
    'authority_version', '3',
    'authority_sha256', repeat('a', 64),
    'observed_at', '2026-09-17T08:59:00Z',
    'workspace_id', 'b2000000-0000-4000-8000-000000000001',
    'owner_id', 'b1000000-0000-4000-8000-000000000001',
    'subject_id', 'b1000000-0000-4000-8000-000000000001',
    'audience', 'person_private',
    'purpose', 'prepared_intelligence'
  ));
  stale_dependencies jsonb;
  future_dependencies jsonb;
  wrong_scope_dependencies jsonb;
  unsupported_dependencies jsonb;
  receipt jsonb;
  result jsonb;
  expected_failure boolean;
begin
  receipt := private.g25_r10_receipt_fixture(
    'b5000000-0000-4000-8000-000000000001',
    'g25-r10-ingest-1',
    repeat('b', 64),
    dependencies
  );
  result := private.brain_store_prepared_receipt(receipt, dependencies);
  if result ->> 'status' <> 'created' then raise exception 'first receipt was not created: %', result; end if;

  result := private.brain_store_prepared_receipt(receipt, dependencies);
  if result ->> 'status' <> 'idempotent' then raise exception 'exact replay was not idempotent: %', result; end if;
  if (select count(*) from public.brain_prepared_receipts) <> 1
    or (select count(*) from public.brain_prepared_receipt_dependencies) <> 1
    or (select count(*) from public.brain_prepared_receipt_events) <> 1
  then raise exception 'exact replay duplicated durable rows'; end if;

  expected_failure := false;
  begin
    perform private.brain_store_prepared_receipt(
      jsonb_set(receipt, '{request_sha256}', to_jsonb(repeat('d', 64))),
      dependencies
    );
  exception when others then
    if position('receipt_identity_conflict' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'conflicting replay was accepted'; end if;

  expected_failure := false;
  begin
    perform private.brain_store_prepared_receipt(
      jsonb_set(
        private.g25_r10_receipt_fixture(
          'b5000000-0000-4000-8000-000000000006',
          'g25-r10-ingest-fingerprint',
          repeat('6', 64),
          dependencies
        ),
        '{authority_fingerprint}',
        to_jsonb(repeat('f', 64))
      ),
      dependencies
    );
  exception when others then
    if position('authority_fingerprint_mismatch' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'authority fingerprint mismatch was accepted'; end if;

  stale_dependencies := jsonb_set(dependencies, '{0,authority_sha256}', to_jsonb(repeat('d', 64)));
  expected_failure := false;
  begin
    perform private.brain_store_prepared_receipt(
      private.g25_r10_receipt_fixture(
        'b5000000-0000-4000-8000-000000000003',
        'g25-r10-ingest-stale',
        repeat('3', 64),
        stale_dependencies
      ),
      stale_dependencies
    );
  exception when others then
    if position('authority_dependency_not_current' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'stale authority dependency was accepted'; end if;

  future_dependencies := jsonb_set(dependencies, '{0,observed_at}', '"2026-09-18T09:00:00Z"'::jsonb);
  expected_failure := false;
  begin
    perform private.brain_store_prepared_receipt(
      private.g25_r10_receipt_fixture(
        'b5000000-0000-4000-8000-000000000007',
        'g25-r10-ingest-future-authority',
        repeat('7', 64),
        future_dependencies
      ),
      future_dependencies
    );
  exception when others then
    if position('authority_dependency_observed_after_receipt' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'future authority observation was accepted'; end if;

  wrong_scope_dependencies := jsonb_set(dependencies, '{0,purpose}', '"decision_support"'::jsonb);
  expected_failure := false;
  begin
    perform private.brain_store_prepared_receipt(
      private.g25_r10_receipt_fixture(
        'b5000000-0000-4000-8000-000000000004',
        'g25-r10-ingest-scope',
        repeat('4', 64),
        wrong_scope_dependencies
      ),
      wrong_scope_dependencies
    );
  exception when others then
    if position('authority_dependency_scope_mismatch' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'cross-purpose authority dependency was accepted'; end if;

  unsupported_dependencies := jsonb_set(dependencies, '{0,authority_kind}', '"decision_case_snapshot"'::jsonb);
  expected_failure := false;
  begin
    perform private.brain_store_prepared_receipt(
      private.g25_r10_receipt_fixture(
        'b5000000-0000-4000-8000-000000000005',
        'g25-r10-ingest-unsupported',
        repeat('5', 64),
        unsupported_dependencies
      ),
      unsupported_dependencies
    );
  exception when others then
    if position('authority_kind_adapter_unavailable' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'unmapped authority kind was accepted'; end if;
end;
$$;

do $$
declare
  dependencies jsonb := jsonb_build_array(jsonb_build_object(
    'authority_kind', 'brain_item_version',
    'authority_record_id', 'b4000000-0000-4000-8000-000000000001',
    'authority_version', '3',
    'authority_sha256', repeat('a', 64),
    'observed_at', '2026-09-17T08:59:00Z',
    'workspace_id', 'b2000000-0000-4000-8000-000000000001',
    'owner_id', 'b1000000-0000-4000-8000-000000000001',
    'subject_id', 'b1000000-0000-4000-8000-000000000001',
    'audience', 'person_private',
    'purpose', 'prepared_intelligence'
  ));
  expected_failure boolean := false;
begin
  begin
    perform private.brain_store_prepared_receipt(
      private.g25_r10_receipt_fixture(
        'b5000000-0000-4000-8000-000000000002',
        'g25-r10-ingest-atomic',
        repeat('2', 64),
        dependencies
      ),
      dependencies
    );
  exception when check_violation then
    if position('g25_forced_event_failure' in sqlerrm) = 0 then raise; end if;
    expected_failure := true;
  end;
  if not expected_failure then raise exception 'forced final write failure did not occur'; end if;
  if exists (select 1 from public.brain_prepared_receipts where id = 'b5000000-0000-4000-8000-000000000002')
    or exists (select 1 from public.brain_prepared_receipt_dependencies where receipt_id = 'b5000000-0000-4000-8000-000000000002')
    or exists (select 1 from public.brain_prepared_receipt_events where receipt_id = 'b5000000-0000-4000-8000-000000000002')
  then raise exception 'forced final write failure left partial rows'; end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":false}', true);

do $$
declare
  visible_receipts integer;
  visible_dependencies integer;
  visible_events integer;
  denied boolean;
begin
  select count(*) into visible_receipts from public.brain_prepared_receipts;
  select count(*) into visible_dependencies from public.brain_prepared_receipt_dependencies;
  select count(*) into visible_events from public.brain_prepared_receipt_events;
  if visible_receipts <> 1 or visible_dependencies <> 1 or visible_events <> 1 then
    raise exception 'exact-scope reader did not receive one complete bundle: %, %, %', visible_receipts, visible_dependencies, visible_events;
  end if;

  denied := false;
  begin
    insert into public.brain_prepared_receipts (id) values ('b5000000-0000-4000-8000-000000000099');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'authenticated direct write unexpectedly succeeded'; end if;

  denied := false;
  begin
    perform private.brain_store_prepared_receipt('{}'::jsonb, '[]'::jsonb);
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'authenticated function execution unexpectedly succeeded'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'b1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":false}', true);

do $$
begin
  if (select count(*) from public.brain_prepared_receipts) <> 0
    or (select count(*) from public.brain_prepared_receipt_dependencies) <> 0
    or (select count(*) from public.brain_prepared_receipt_events) <> 0
  then raise exception 'different-purpose reader crossed the prepared receipt boundary'; end if;
end;
$$;

reset role;

select jsonb_build_object(
  'status', 'passed',
  'created_bundle_rows', 3,
  'exact_replay_idempotent', true,
  'conflicting_replay_closed', true,
  'authority_fingerprint_recomputed', true,
  'stale_authority_closed', true,
  'future_authority_observation_closed', true,
  'cross_purpose_dependency_closed', true,
  'unmapped_authority_closed', true,
  'forced_final_write_rolled_back', true,
  'authenticated_write_closed', true,
  'exact_scope_read_required', true
) as g25_atomic_store_result;

rollback;
