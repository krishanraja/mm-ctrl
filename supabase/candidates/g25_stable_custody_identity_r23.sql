-- G25 R23 stable custody identity candidate.
-- This is not a migration and must not be applied to a linked database.
-- It separates authentication access, transferable custody, Brain subject identity,
-- and immutable historical receipt identity without rewriting existing UUID bytes.

create table private.brain_subject_principals (
  id uuid primary key,
  created_at timestamptz not null default now(),
  erased_at timestamptz,
  check (erased_at is null or erased_at >= created_at)
);

create table private.brain_subject_auth_links (
  subject_principal_id uuid not null
    references private.brain_subject_principals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (subject_principal_id, user_id),
  check (revoked_at is null or revoked_at >= linked_at)
);

create unique index brain_subject_auth_links_active_user_idx
  on private.brain_subject_auth_links (user_id)
  where revoked_at is null;

create table private.brain_operator_principals (
  id uuid primary key default gen_random_uuid(),
  legacy_auth_alias uuid unique,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  check (retired_at is null or retired_at >= created_at)
);

create table private.brain_operator_auth_links (
  operator_principal_id uuid not null
    references private.brain_operator_principals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (operator_principal_id, user_id),
  check (revoked_at is null or revoked_at >= linked_at)
);

create unique index brain_operator_auth_links_active_user_idx
  on private.brain_operator_auth_links (user_id)
  where revoked_at is null;

create table private.brain_historical_principals (
  id uuid primary key,
  origin text not null check (origin in ('legacy_auth_alias', 'workspace_scoped_v2')),
  created_at timestamptz not null default now()
);

create table private.brain_custody_principals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique
    references public.brain_workspaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  closure_authorization_sha256 text,
  check (closed_at is null or closed_at >= created_at),
  check (
    (closed_at is null and closure_authorization_sha256 is null)
    or
    (closed_at is not null and closure_authorization_sha256 ~ '^[0-9a-f]{64}$')
  )
);

create table private.brain_custody_assignments (
  custody_principal_id uuid not null
    references private.brain_custody_principals(id) on delete cascade,
  operator_principal_id uuid not null
    references private.brain_operator_principals(id) on delete restrict,
  accepted_at timestamptz not null,
  ended_at timestamptz,
  authorization_kind text not null
    check (authorization_kind in ('legacy_backfill', 'customer_authorized_transfer')),
  authorization_sha256 text,
  primary key (custody_principal_id, operator_principal_id, accepted_at),
  check (ended_at is null or ended_at >= accepted_at),
  check (
    (authorization_kind = 'legacy_backfill' and authorization_sha256 is null)
    or
    (authorization_kind = 'customer_authorized_transfer' and authorization_sha256 ~ '^[0-9a-f]{64}$')
  )
);

create unique index brain_custody_assignments_one_current_idx
  on private.brain_custody_assignments (custody_principal_id)
  where ended_at is null;

create index brain_custody_assignments_operator_idx
  on private.brain_custody_assignments (operator_principal_id, custody_principal_id);

insert into private.brain_subject_principals (id)
select subject_id from public.brain_workspaces
union
select subject_id from public.brain_items
union
select subject_id from public.brain_sources
union
select subject_id from public.brain_prepared_receipts
union
select subject_id from public.brain_prepared_authority_corrections
union
select subject_id from public.brain_prepared_subject_erasure_tombstones;

insert into private.brain_subject_auth_links (subject_principal_id, user_id)
select principal.id, auth_user.id
from private.brain_subject_principals principal
join auth.users auth_user on auth_user.id = principal.id;

insert into private.brain_historical_principals (id, origin)
select owner_id, 'legacy_auth_alias'
from public.brain_workspaces
union
select owner_id, 'legacy_auth_alias'
from public.brain_prepared_receipts
union
select owner_id, 'legacy_auth_alias'
from public.brain_prepared_authority_corrections
union
select owner_id, 'legacy_auth_alias'
from public.brain_prepared_subject_erasure_tombstones;

insert into private.brain_operator_principals (legacy_auth_alias)
select distinct owner_id from public.brain_workspaces;

insert into private.brain_operator_auth_links (operator_principal_id, user_id)
select principal.id, auth_user.id
from private.brain_operator_principals principal
join auth.users auth_user on auth_user.id = principal.legacy_auth_alias;

insert into private.brain_custody_principals (workspace_id)
select id from public.brain_workspaces;

insert into private.brain_custody_assignments (
  custody_principal_id,
  operator_principal_id,
  accepted_at,
  authorization_kind
)
select custody.id, operator.id, now(), 'legacy_backfill'
from private.brain_custody_principals custody
join public.brain_workspaces workspace on workspace.id = custody.workspace_id
join private.brain_operator_principals operator
  on operator.legacy_auth_alias = workspace.owner_id;

alter table public.brain_workspaces
  drop constraint brain_workspaces_subject_id_fkey,
  add constraint brain_workspaces_subject_id_fkey
    foreign key (subject_id) references private.brain_subject_principals(id) on delete restrict,
  drop constraint brain_workspaces_owner_id_fkey,
  add constraint brain_workspaces_owner_id_fkey
    foreign key (owner_id) references private.brain_historical_principals(id) on delete restrict;

alter table public.brain_items
  drop constraint brain_items_subject_id_fkey,
  add constraint brain_items_subject_id_fkey
    foreign key (subject_id) references private.brain_subject_principals(id) on delete restrict;

alter table public.brain_sources
  drop constraint brain_sources_subject_id_fkey,
  add constraint brain_sources_subject_id_fkey
    foreign key (subject_id) references private.brain_subject_principals(id) on delete restrict;

alter table public.brain_prepared_receipts
  drop constraint brain_prepared_receipts_subject_id_fkey,
  add constraint brain_prepared_receipts_subject_id_fkey
    foreign key (subject_id) references private.brain_subject_principals(id) on delete restrict,
  drop constraint brain_prepared_receipts_owner_id_fkey,
  add constraint brain_prepared_receipts_owner_id_fkey
    foreign key (owner_id) references private.brain_historical_principals(id) on delete restrict;

alter table public.brain_prepared_authority_corrections
  drop constraint brain_prepared_authority_corrections_subject_id_fkey,
  add constraint brain_prepared_authority_corrections_subject_id_fkey
    foreign key (subject_id) references private.brain_subject_principals(id) on delete restrict,
  drop constraint brain_prepared_authority_corrections_owner_id_fkey,
  add constraint brain_prepared_authority_corrections_owner_id_fkey
    foreign key (owner_id) references private.brain_historical_principals(id) on delete restrict;

alter table public.brain_prepared_subject_erasure_tombstones
  drop constraint brain_prepared_subject_erasure_tombstones_subject_id_fkey,
  add constraint brain_prepared_subject_erasure_tombstones_subject_id_fkey
    foreign key (subject_id) references private.brain_subject_principals(id) on delete restrict,
  drop constraint brain_prepared_subject_erasure_tombstones_owner_id_fkey,
  add constraint brain_prepared_subject_erasure_tombstones_owner_id_fkey
    foreign key (owner_id) references private.brain_historical_principals(id) on delete restrict;

comment on column public.brain_workspaces.owner_id is
  'Immutable legacy historical-principal identity. Never use for current access or transferable custody.';
comment on column public.brain_prepared_receipts.owner_id is
  'Immutable historical-principal identity retained for authority-fingerprint and ciphertext compatibility.';
comment on column public.brain_prepared_authority_corrections.owner_id is
  'Immutable historical-principal identity retained for correction-chain compatibility.';
comment on column public.brain_prepared_subject_erasure_tombstones.owner_id is
  'Immutable historical-principal identity retained for erasure-receipt compatibility.';

create or replace function private.brain_transfer_workspace_custody(
  p_workspace_id uuid,
  p_from_operator_principal_id uuid,
  p_to_operator_principal_id uuid,
  p_authorization_sha256 text,
  p_transferred_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  custody_id uuid;
  ended_count integer;
begin
  if p_from_operator_principal_id = p_to_operator_principal_id then
    raise exception 'custody_transfer_same_operator';
  end if;
  if p_authorization_sha256 is null or p_authorization_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'custody_transfer_authorization_invalid';
  end if;

  select custody.id
  into custody_id
  from private.brain_custody_principals custody
  where custody.workspace_id = p_workspace_id
    and custody.closed_at is null
  for update;

  if custody_id is null then
    raise exception 'custody_workspace_unavailable';
  end if;

  update private.brain_custody_assignments assignment
  set ended_at = p_transferred_at
  where assignment.custody_principal_id = custody_id
    and assignment.operator_principal_id = p_from_operator_principal_id
    and assignment.ended_at is null;
  get diagnostics ended_count = row_count;

  if ended_count <> 1 then
    raise exception 'custody_transfer_source_mismatch';
  end if;

  insert into private.brain_custody_assignments (
    custody_principal_id,
    operator_principal_id,
    accepted_at,
    authorization_kind,
    authorization_sha256
  ) values (
    custody_id,
    p_to_operator_principal_id,
    p_transferred_at,
    'customer_authorized_transfer',
    p_authorization_sha256
  );

  return custody_id;
end;
$$;

revoke all on function private.brain_transfer_workspace_custody(uuid, uuid, uuid, text, timestamptz)
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on
  private.brain_subject_principals,
  private.brain_subject_auth_links,
  private.brain_operator_principals,
  private.brain_operator_auth_links,
  private.brain_historical_principals,
  private.brain_custody_principals,
  private.brain_custody_assignments
  to service_role;
grant execute on function private.brain_transfer_workspace_custody(uuid, uuid, uuid, text, timestamptz)
  to service_role;
