-- G25 R8 exact-purpose RLS canary.
-- Test-only and rollback-only. This file is not a migration.

begin;

create table public.g25_prepared_receipt_purpose_canary (
  id uuid primary key,
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('person_private', 'delivery_team_private')),
  purpose text not null check (purpose in ('prepared_intelligence', 'decision_support')),
  payload_ciphertext text not null check (char_length(payload_ciphertext) > 0)
);

alter table public.g25_prepared_receipt_purpose_canary enable row level security;
alter table public.g25_prepared_receipt_purpose_canary force row level security;

create policy g25_prepared_receipt_exact_purpose_select
on public.g25_prepared_receipt_purpose_canary for select to authenticated
using (
  ((select auth.jwt()) ->> 'is_anonymous')::boolean is not true
  and exists (
    select 1
    from public.brain_workspace_roles role_row
    where role_row.workspace_id = g25_prepared_receipt_purpose_canary.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1
    from public.brain_audience_grants grant_row
    where grant_row.workspace_id = g25_prepared_receipt_purpose_canary.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = g25_prepared_receipt_purpose_canary.audience
      and grant_row.purpose = g25_prepared_receipt_purpose_canary.purpose
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

revoke all on table public.g25_prepared_receipt_purpose_canary from anon, authenticated;
grant select on table public.g25_prepared_receipt_purpose_canary to authenticated;

insert into auth.users (id, email)
values
  ('a1000000-0000-4000-8000-000000000001', 'g25-purpose-prepared@example.test'),
  ('a1000000-0000-4000-8000-000000000002', 'g25-purpose-decision@example.test'),
  ('a1000000-0000-4000-8000-000000000003', 'g25-purpose-no-membership@example.test');

insert into public.brain_workspaces (id, subject_id, owner_id, tenant_key)
values (
  'a2000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'g25-purpose-canary'
);

insert into public.brain_workspace_roles (workspace_id, user_id, role, granted_by)
values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'owner', 'a1000000-0000-4000-8000-000000000001'),
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'viewer', 'a1000000-0000-4000-8000-000000000001');

insert into public.brain_audience_grants (
  id, workspace_id, grantee_user_id, audience, purpose, granted_by
)
values
  ('a3000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002', 'person_private', 'decision_support', 'a1000000-0000-4000-8000-000000000001'),
  ('a3000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'person_private', 'prepared_intelligence', 'a1000000-0000-4000-8000-000000000001');

insert into public.g25_prepared_receipt_purpose_canary (
  id, workspace_id, subject_id, audience, purpose, payload_ciphertext
)
values
  ('a4000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'person_private', 'prepared_intelligence', 'cipher:prepared'),
  ('a4000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'person_private', 'decision_support', 'cipher:decision');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":false}', true);

do $$
declare
  visible_ids uuid[];
begin
  select array_agg(id order by id) into visible_ids
  from public.g25_prepared_receipt_purpose_canary;
  if visible_ids is distinct from array['a4000000-0000-4000-8000-000000000001'::uuid] then
    raise exception 'Prepared-intelligence grant crossed the exact-purpose boundary: %', visible_ids;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated","is_anonymous":false}', true);

do $$
declare
  visible_ids uuid[];
begin
  select array_agg(id order by id) into visible_ids
  from public.g25_prepared_receipt_purpose_canary;
  if visible_ids is distinct from array['a4000000-0000-4000-8000-000000000002'::uuid] then
    raise exception 'Decision-support grant crossed the exact-purpose boundary: %', visible_ids;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000003","role":"authenticated","is_anonymous":false}', true);

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.g25_prepared_receipt_purpose_canary;
  if visible_count <> 0 then
    raise exception 'Purpose grant without workspace membership did not fail closed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":true}', true);

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.g25_prepared_receipt_purpose_canary;
  if visible_count <> 0 then
    raise exception 'Anonymous-auth purpose read did not fail closed';
  end if;

  begin
    insert into public.g25_prepared_receipt_purpose_canary (
      id, workspace_id, subject_id, audience, purpose, payload_ciphertext
    ) values (
      'a4000000-0000-4000-8000-000000000099',
      'a2000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      'person_private',
      'prepared_intelligence',
      'cipher:write-must-fail'
    );
    raise exception 'Authenticated purpose-canary write unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

select jsonb_build_object(
  'status', 'passed',
  'workspace_membership_required', true,
  'audience_match_required', true,
  'exact_purpose_match_required', true,
  'anonymous_auth_closed', true,
  'authenticated_write_closed', true,
  'test_residue', 0
) as g25_purpose_canary_result;

rollback;
