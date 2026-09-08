begin;

insert into auth.users (id, email)
values
  ('91000000-0000-4000-8000-000000000001', 'brain-canary-owner-a@example.test'),
  ('91000000-0000-4000-8000-000000000002', 'brain-canary-owner-b@example.test'),
  ('91000000-0000-4000-8000-000000000003', 'brain-canary-operator@example.test'),
  ('91000000-0000-4000-8000-000000000004', 'brain-canary-grant-only@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'brain-canary-a'),
  ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'brain-canary-b');

insert into public.brain_workspace_roles (workspace_id, user_id, role, granted_by)
values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'owner', '91000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000003', 'operator', '91000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'owner', '91000000-0000-4000-8000-000000000002');

insert into public.brain_audience_grants (id, workspace_id, grantee_user_id, audience, purpose, granted_by)
values
  ('93000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'person_private', 'Canary subject access', '91000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000003', 'delivery_team_private', 'Canary operator access', '91000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'person_private', 'Canary subject access', '91000000-0000-4000-8000-000000000002'),
  ('93000000-0000-4000-8000-000000000004', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000004', 'person_private', 'Grant without membership must fail closed', '91000000-0000-4000-8000-000000000001');

insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, content_ciphertext, encryption_version, created_by
)
values
  ('94000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'voice', '91000000-0000-4000-8000-000000000001', now(), 'Canary private source', 'person_private', repeat('a', 64), 'cipher:a-private', 1, '91000000-0000-4000-8000-000000000001'),
  ('94000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'text', '91000000-0000-4000-8000-000000000003', now(), 'Canary delivery source', 'delivery_team_private', repeat('b', 64), 'cipher:a-delivery', 1, '91000000-0000-4000-8000-000000000003'),
  ('94000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'voice', '91000000-0000-4000-8000-000000000002', now(), 'Canary private source', 'person_private', repeat('c', 64), 'cipher:b-private', 1, '91000000-0000-4000-8000-000000000002');

insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256, created_by
)
values
  ('95000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', '94000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'user_stated', 'person_private', 'cipher:assertion-a-private', 1, repeat('d', 64), '91000000-0000-4000-8000-000000000001'),
  ('95000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', '94000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000003', 'observed', 'delivery_team_private', 'cipher:assertion-a-delivery', 1, repeat('e', 64), '91000000-0000-4000-8000-000000000003'),
  ('95000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', '94000000-0000-4000-8000-000000000003', '91000000-0000-4000-8000-000000000002', 'user_stated', 'person_private', 'cipher:assertion-b-private', 1, repeat('f', 64), '91000000-0000-4000-8000-000000000002');

insert into public.brain_items (id, workspace_id, subject_id, item_key, semantic_type, created_by)
values
  ('96000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'canary.a.private', 'standard', '91000000-0000-4000-8000-000000000001'),
  ('96000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'canary.a.delivery.one', 'pattern', '91000000-0000-4000-8000-000000000003'),
  ('96000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'canary.a.delivery.two', 'tension', '91000000-0000-4000-8000-000000000003'),
  ('96000000-0000-4000-8000-000000000004', '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'canary.b.private', 'standard', '91000000-0000-4000-8000-000000000002');

insert into public.brain_item_versions (
  id, brain_item_id, workspace_id, subject_id, version, title, meaning_ciphertext,
  encryption_version, human_views, epistemic_basis, maturity, standing, audience,
  consequence_permission, valid_from, created_by
)
values
  ('97000000-0000-4000-8000-000000000001', '96000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 1, 'A private', 'cipher:item-a-private', 1, array['how_i_judge'], 'user_stated', 'trusted', 'current', 'person_private', 'confirm_before_consequential_use', now(), '91000000-0000-4000-8000-000000000001'),
  ('97000000-0000-4000-8000-000000000002', '96000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 1, 'A delivery one', 'cipher:item-a-delivery-one', 1, array['how_i_judge'], 'observed', 'held', 'current', 'delivery_team_private', 'shape_reversible_work', now(), '91000000-0000-4000-8000-000000000003'),
  ('97000000-0000-4000-8000-000000000003', '96000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 1, 'A delivery two', 'cipher:item-a-delivery-two', 1, array['unresolved'], 'observed', 'held', 'current', 'delivery_team_private', 'shape_reversible_work', now(), '91000000-0000-4000-8000-000000000003'),
  ('97000000-0000-4000-8000-000000000004', '96000000-0000-4000-8000-000000000004', '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 1, 'B private', 'cipher:item-b-private', 1, array['how_i_judge'], 'user_stated', 'trusted', 'current', 'person_private', 'confirm_before_consequential_use', now(), '91000000-0000-4000-8000-000000000002');

insert into public.brain_item_version_assertions (
  item_version_id, assertion_id, workspace_id, audience, evidence_role, linked_by
)
values
  ('97000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000001', 'person_private', 'supporting', '91000000-0000-4000-8000-000000000001'),
  ('97000000-0000-4000-8000-000000000002', '95000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', 'delivery_team_private', 'supporting', '91000000-0000-4000-8000-000000000003'),
  ('97000000-0000-4000-8000-000000000003', '95000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000001', 'delivery_team_private', 'supporting', '91000000-0000-4000-8000-000000000003'),
  ('97000000-0000-4000-8000-000000000004', '95000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000002', 'person_private', 'supporting', '91000000-0000-4000-8000-000000000002');

insert into public.brain_relationships (
  id, workspace_id, subject_id, relationship_key, from_item_id, to_item_id, created_by
)
values (
  '98000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  'canary.a.delivery.link',
  '96000000-0000-4000-8000-000000000002',
  '96000000-0000-4000-8000-000000000003',
  '91000000-0000-4000-8000-000000000003'
);

insert into public.brain_relationship_versions (
  id, relationship_id, workspace_id, subject_id, version, from_item_version_id,
  to_item_version_id, relation_type, explanation_ciphertext, encryption_version,
  epistemic_basis, maturity, standing, audience, consequence_permission, valid_from, created_by
)
values (
  '99000000-0000-4000-8000-000000000001',
  '98000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  '91000000-0000-4000-8000-000000000001',
  1,
  '97000000-0000-4000-8000-000000000002',
  '97000000-0000-4000-8000-000000000003',
  'in_tension_with',
  'cipher:relationship-a-delivery',
  1,
  'observed',
  'held',
  'current',
  'delivery_team_private',
  'shape_reversible_work',
  now(),
  '91000000-0000-4000-8000-000000000003'
);

insert into public.brain_relationship_version_assertions (
  relationship_version_id, assertion_id, workspace_id, audience, linked_by
)
values (
  '99000000-0000-4000-8000-000000000001',
  '95000000-0000-4000-8000-000000000002',
  '92000000-0000-4000-8000-000000000001',
  'delivery_team_private',
  '91000000-0000-4000-8000-000000000003'
);

do $$
begin
  begin
    insert into public.brain_item_version_assertions (
      item_version_id, assertion_id, workspace_id, audience, evidence_role, linked_by
    ) values (
      '97000000-0000-4000-8000-000000000001',
      '95000000-0000-4000-8000-000000000002',
      '92000000-0000-4000-8000-000000000001',
      'person_private',
      'contrary',
      '91000000-0000-4000-8000-000000000001'
    );
    raise exception 'Cross-audience item evidence unexpectedly succeeded';
  exception
    when raise_exception then
      if sqlerrm = 'Cross-audience item evidence unexpectedly succeeded' then
        raise;
      end if;
      if sqlerrm <> 'Brain item evidence cannot cross workspace or audience boundaries' then
        raise;
      end if;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);

do $$
declare
  source_count integer;
  version_count integer;
  relationship_count integer;
begin
  select count(*) into source_count from public.brain_sources;
  select count(*) into version_count from public.brain_item_versions;
  select count(*) into relationship_count from public.brain_relationship_versions;
  if source_count <> 1 or version_count <> 1 or relationship_count <> 0 then
    raise exception 'Subject A audience boundary failed';
  end if;

  begin
    insert into public.brain_workspaces (subject_id, owner_id, tenant_key)
    values ((select auth.uid()), (select auth.uid()), 'authenticated-write-must-fail');
    raise exception 'Authenticated write unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000003', true);

do $$
declare
  source_count integer;
  version_count integer;
  item_count integer;
  relationship_count integer;
begin
  select count(*) into source_count from public.brain_sources;
  select count(*) into version_count from public.brain_item_versions;
  select count(*) into item_count from public.brain_items;
  select count(*) into relationship_count from public.brain_relationship_versions;
  if source_count <> 1 or version_count <> 2 or item_count <> 2 or relationship_count <> 1 then
    raise exception 'Operator audience boundary failed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000002', true);

do $$
declare
  source_count integer;
  version_count integer;
  relationship_count integer;
begin
  select count(*) into source_count from public.brain_sources;
  select count(*) into version_count from public.brain_item_versions;
  select count(*) into relationship_count from public.brain_relationship_versions;
  if source_count <> 1 or version_count <> 1 or relationship_count <> 0 then
    raise exception 'Subject B workspace boundary failed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000004', true);

do $$
declare
  workspace_count integer;
  source_count integer;
begin
  select count(*) into workspace_count from public.brain_workspaces;
  select count(*) into source_count from public.brain_sources;
  if workspace_count <> 0 or source_count <> 0 then
    raise exception 'Audience grant without workspace membership did not fail closed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '91000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":true}',
  true
);

do $$
declare
  workspace_count integer;
  source_count integer;
begin
  select count(*) into workspace_count from public.brain_workspaces;
  select count(*) into source_count from public.brain_sources;
  if workspace_count <> 0 or source_count <> 0 then
    raise exception 'Anonymous-auth session did not fail closed';
  end if;
end;
$$;

reset role;

do $$
begin
  if has_table_privilege('anon', 'public.brain_sources', 'select')
    or has_table_privilege('anon', 'public.brain_sources', 'insert')
    or has_table_privilege('authenticated', 'public.brain_sources', 'insert')
    or has_table_privilege('authenticated', 'public.brain_sources', 'update')
    or has_table_privilege('authenticated', 'public.brain_sources', 'delete') then
    raise exception 'Brain table privilege boundary failed';
  end if;
end;
$$;

select jsonb_build_object(
  'status', 'passed',
  'workspace_isolation', true,
  'audience_isolation', true,
  'membership_required', true,
  'authenticated_write_closed', true,
  'anon_closed', true,
  'anonymous_auth_closed', true,
  'cross_audience_evidence_closed', true,
  'test_residue', 0
) as brain_canary_result;

rollback;
