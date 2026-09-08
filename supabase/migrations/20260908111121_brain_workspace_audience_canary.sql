-- G13 Living Brain workspace-and-audience canary.
-- Additive only: no legacy rows are read, rewritten, or migrated.

create table public.brain_workspaces (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_key text not null,
  workspace_kind text not null default 'personal'
    check (workspace_kind in ('personal', 'company', 'project')),
  lifecycle_state text not null default 'active'
    check (lifecycle_state in ('active', 'paused', 'archived')),
  default_retention_days integer
    check (default_retention_days is null or default_retention_days between 1 and 3650),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_key),
  check (workspace_kind <> 'personal' or subject_id = owner_id)
);

create table public.brain_workspace_roles (
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('owner', 'operator', 'contributor', 'viewer', 'approver')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (workspace_id, user_id, role),
  check (revoked_at is null or revoked_at >= granted_at)
);

create table public.brain_audience_grants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  grantee_user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  purpose text not null check (char_length(btrim(purpose)) between 1 and 160),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  check (expires_at is null or expires_at > granted_at),
  check (revoked_at is null or revoked_at >= granted_at)
);

create unique index brain_audience_grants_active_unique
  on public.brain_audience_grants (workspace_id, grantee_user_id, audience, purpose)
  where revoked_at is null;

create table public.brain_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null
    check (source_type in (
      'voice',
      'text',
      'meeting',
      'document',
      'correction',
      'observed_action',
      'external'
    )),
  actor_user_id uuid references auth.users(id) on delete set null,
  speaker_label text,
  captured_at timestamptz not null,
  purpose text not null check (char_length(btrim(purpose)) between 1 and 160),
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  retention_expires_at timestamptz,
  integrity_sha256 text,
  external_locator text,
  content_ciphertext text,
  encryption_version smallint,
  recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  check (retention_expires_at is null or retention_expires_at > captured_at),
  check (integrity_sha256 is null or integrity_sha256 ~ '^[0-9a-f]{64}$'),
  check (integrity_sha256 is not null or nullif(btrim(external_locator), '') is not null),
  check (
    (content_ciphertext is null and encryption_version is null)
    or (content_ciphertext is not null and encryption_version is not null and encryption_version > 0)
  )
);

create table public.brain_assertions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.brain_sources(id) on delete cascade,
  speaker_user_id uuid references auth.users(id) on delete set null,
  epistemic_basis text not null
    check (epistemic_basis in (
      'user_stated',
      'user_demonstrated',
      'observed',
      'inferred',
      'outcome_tested',
      'external_claim'
    )),
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  statement_ciphertext text not null check (char_length(statement_ciphertext) > 0),
  encryption_version smallint not null check (encryption_version > 0),
  source_span_start integer,
  source_span_end integer,
  source_span_sha256 text,
  valid_at timestamptz,
  recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  check (source_span_start is null or source_span_start >= 0),
  check (source_span_end is null or source_span_end > 0),
  check (source_span_sha256 is null or source_span_sha256 ~ '^[0-9a-f]{64}$'),
  check (
    (source_span_start is not null and source_span_end is not null and source_span_end > source_span_start)
    or source_span_sha256 is not null
  )
);

create table public.brain_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (item_key ~ '^[a-z0-9][a-z0-9._-]{2,95}$'),
  semantic_type text not null
    check (semantic_type in ('aim', 'standard', 'preference', 'pattern', 'example', 'tension', 'context')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (workspace_id, item_key),
  unique (id, workspace_id, subject_id)
);

create table public.brain_item_versions (
  id uuid primary key default gen_random_uuid(),
  brain_item_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  version integer not null check (version > 0),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  meaning_ciphertext text not null check (char_length(meaning_ciphertext) > 0),
  encryption_version smallint not null check (encryption_version > 0),
  human_views text[] not null,
  epistemic_basis text not null
    check (epistemic_basis in (
      'user_stated',
      'user_demonstrated',
      'observed',
      'inferred',
      'outcome_tested',
      'external_claim'
    )),
  maturity text not null check (maturity in ('staged', 'proposed', 'held', 'trusted')),
  standing text not null check (standing in ('current', 'disputed', 'superseded', 'retired', 'expired')),
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  consequence_permission text not null
    check (consequence_permission in (
      'personalise_presentation',
      'suggest_or_retrieve',
      'shape_reversible_work',
      'confirm_before_consequential_use',
      'prohibited_in_context'
    )),
  applicability jsonb not null default '{}'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  evidence_quality numeric(4,3) not null default 0 check (evidence_quality between 0 and 1),
  corroboration numeric(4,3) not null default 0 check (corroboration between 0 and 1),
  recency numeric(4,3) not null default 0 check (recency between 0 and 1),
  transfer numeric(4,3) not null default 0 check (transfer between 0 and 1),
  human_confirmation numeric(4,3) not null default 0 check (human_confirmation between 0 and 1),
  valid_from timestamptz not null,
  valid_until timestamptz,
  recorded_at timestamptz not null default now(),
  predecessor_version_id uuid references public.brain_item_versions(id) on delete cascade,
  superseded_by_version_id uuid references public.brain_item_versions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  unique (brain_item_id, version),
  unique (id, workspace_id),
  unique (id, workspace_id, subject_id),
  foreign key (brain_item_id, workspace_id, subject_id)
    references public.brain_items(id, workspace_id, subject_id) on delete cascade,
  check (cardinality(human_views) > 0),
  check (human_views <@ array['what_matters', 'how_i_judge', 'my_calls', 'unresolved', 'what_changed']::text[]),
  check (jsonb_typeof(applicability) = 'object'),
  check (jsonb_typeof(exclusions) in ('array', 'object')),
  check (valid_until is null or valid_until > valid_from),
  check (
    (standing in ('current', 'disputed') and valid_until is null)
    or (standing in ('superseded', 'retired', 'expired') and valid_until is not null)
  ),
  check (version = 1 or predecessor_version_id is not null),
  check (id is distinct from predecessor_version_id),
  check (id is distinct from superseded_by_version_id)
);

create unique index brain_item_versions_one_current
  on public.brain_item_versions (brain_item_id)
  where standing = 'current';

create table public.brain_item_version_assertions (
  item_version_id uuid not null,
  assertion_id uuid not null,
  workspace_id uuid not null,
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  evidence_role text not null check (evidence_role in ('supporting', 'contrary')),
  linked_at timestamptz not null default now(),
  linked_by uuid references auth.users(id) on delete set null,
  primary key (item_version_id, assertion_id, evidence_role),
  foreign key (item_version_id, workspace_id)
    references public.brain_item_versions(id, workspace_id) on delete cascade,
  foreign key (assertion_id) references public.brain_assertions(id) on delete cascade
);

create table public.brain_relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  relationship_key text not null check (relationship_key ~ '^[a-z0-9][a-z0-9._-]{2,95}$'),
  from_item_id uuid not null references public.brain_items(id) on delete cascade,
  to_item_id uuid not null references public.brain_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (workspace_id, relationship_key),
  unique (id, workspace_id, subject_id),
  check (from_item_id <> to_item_id)
);

create table public.brain_relationship_versions (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  version integer not null check (version > 0),
  from_item_version_id uuid not null references public.brain_item_versions(id) on delete cascade,
  to_item_version_id uuid not null references public.brain_item_versions(id) on delete cascade,
  relation_type text not null
    check (relation_type in (
      'supports',
      'contradicts',
      'qualifies',
      'in_tension_with',
      'depends_on',
      'informs',
      'exemplifies'
    )),
  explanation_ciphertext text not null check (char_length(explanation_ciphertext) > 0),
  encryption_version smallint not null check (encryption_version > 0),
  epistemic_basis text not null
    check (epistemic_basis in (
      'user_stated',
      'user_demonstrated',
      'observed',
      'inferred',
      'outcome_tested',
      'external_claim'
    )),
  maturity text not null check (maturity in ('staged', 'proposed', 'held', 'trusted')),
  standing text not null check (standing in ('current', 'disputed', 'superseded', 'retired', 'expired')),
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  consequence_permission text not null
    check (consequence_permission in (
      'personalise_presentation',
      'suggest_or_retrieve',
      'shape_reversible_work',
      'confirm_before_consequential_use',
      'prohibited_in_context'
    )),
  valid_from timestamptz not null,
  valid_until timestamptz,
  recorded_at timestamptz not null default now(),
  predecessor_version_id uuid references public.brain_relationship_versions(id) on delete cascade,
  superseded_by_version_id uuid references public.brain_relationship_versions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  unique (relationship_id, version),
  unique (id, workspace_id),
  unique (id, workspace_id, subject_id),
  foreign key (relationship_id, workspace_id, subject_id)
    references public.brain_relationships(id, workspace_id, subject_id) on delete cascade,
  check (from_item_version_id <> to_item_version_id),
  check (valid_until is null or valid_until > valid_from),
  check (
    (standing in ('current', 'disputed') and valid_until is null)
    or (standing in ('superseded', 'retired', 'expired') and valid_until is not null)
  ),
  check (version = 1 or predecessor_version_id is not null),
  check (id is distinct from predecessor_version_id),
  check (id is distinct from superseded_by_version_id)
);

create unique index brain_relationship_versions_one_current
  on public.brain_relationship_versions (relationship_id)
  where standing = 'current';

create table public.brain_relationship_version_assertions (
  relationship_version_id uuid not null,
  assertion_id uuid not null,
  workspace_id uuid not null,
  audience text not null
    check (audience in (
      'person_private',
      'delivery_team_private',
      'named_company_or_project',
      'approved_pattern_commons',
      'public_release'
    )),
  linked_at timestamptz not null default now(),
  linked_by uuid references auth.users(id) on delete set null,
  primary key (relationship_version_id, assertion_id),
  foreign key (relationship_version_id, workspace_id)
    references public.brain_relationship_versions(id, workspace_id) on delete cascade,
  foreign key (assertion_id) references public.brain_assertions(id) on delete cascade
);

create index brain_workspace_roles_user_active_idx
  on public.brain_workspace_roles (user_id, workspace_id)
  where revoked_at is null;
create index brain_audience_grants_grantee_active_idx
  on public.brain_audience_grants (grantee_user_id, workspace_id, audience)
  where revoked_at is null;
create index brain_sources_workspace_audience_idx
  on public.brain_sources (workspace_id, audience, captured_at desc);
create index brain_sources_subject_idx on public.brain_sources (subject_id);
create index brain_assertions_source_idx on public.brain_assertions (source_id);
create index brain_assertions_workspace_audience_idx
  on public.brain_assertions (workspace_id, audience, recorded_at desc);
create index brain_assertions_subject_idx on public.brain_assertions (subject_id);
create index brain_items_workspace_idx on public.brain_items (workspace_id);
create index brain_items_subject_idx on public.brain_items (subject_id);
create index brain_item_versions_workspace_audience_idx
  on public.brain_item_versions (workspace_id, audience, standing, maturity);
create index brain_item_versions_subject_idx on public.brain_item_versions (subject_id);
create index brain_item_versions_predecessor_idx
  on public.brain_item_versions (predecessor_version_id)
  where predecessor_version_id is not null;
create index brain_item_versions_superseded_by_idx
  on public.brain_item_versions (superseded_by_version_id)
  where superseded_by_version_id is not null;
create index brain_item_version_assertions_assertion_idx
  on public.brain_item_version_assertions (assertion_id);
create index brain_item_version_assertions_workspace_audience_idx
  on public.brain_item_version_assertions (workspace_id, audience);
create index brain_relationships_workspace_idx on public.brain_relationships (workspace_id);
create index brain_relationships_subject_idx on public.brain_relationships (subject_id);
create index brain_relationships_from_idx on public.brain_relationships (from_item_id);
create index brain_relationships_to_idx on public.brain_relationships (to_item_id);
create index brain_relationship_versions_workspace_audience_idx
  on public.brain_relationship_versions (workspace_id, audience, standing, maturity);
create index brain_relationship_versions_subject_idx on public.brain_relationship_versions (subject_id);
create index brain_relationship_versions_from_idx
  on public.brain_relationship_versions (from_item_version_id);
create index brain_relationship_versions_to_idx
  on public.brain_relationship_versions (to_item_version_id);
create index brain_relationship_versions_predecessor_idx
  on public.brain_relationship_versions (predecessor_version_id)
  where predecessor_version_id is not null;
create index brain_relationship_versions_superseded_by_idx
  on public.brain_relationship_versions (superseded_by_version_id)
  where superseded_by_version_id is not null;
create index brain_relationship_version_assertions_assertion_idx
  on public.brain_relationship_version_assertions (assertion_id);
create index brain_relationship_version_assertions_workspace_audience_idx
  on public.brain_relationship_version_assertions (workspace_id, audience);

create or replace function private.brain_assertion_scope_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  source_record record;
begin
  select workspace_id, subject_id, audience
    into source_record
  from public.brain_sources
  where id = new.source_id;

  if source_record.workspace_id is null
    or source_record.workspace_id <> new.workspace_id
    or source_record.subject_id <> new.subject_id
    or source_record.audience <> new.audience then
    raise exception 'Brain assertion must preserve source workspace, subject, and audience';
  end if;

  return new;
end;
$$;

create trigger brain_assertion_scope_guard
before insert or update on public.brain_assertions
for each row execute function private.brain_assertion_scope_guard();

create or replace function private.brain_item_version_scope_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item_record record;
  predecessor_record record;
begin
  select workspace_id, subject_id
    into item_record
  from public.brain_items
  where id = new.brain_item_id;

  if item_record.workspace_id is null
    or item_record.workspace_id <> new.workspace_id
    or item_record.subject_id <> new.subject_id then
    raise exception 'Brain item version must preserve item workspace and subject';
  end if;

  if new.version = 1 and new.predecessor_version_id is not null then
    raise exception 'First Brain item version cannot have a predecessor';
  end if;

  if new.predecessor_version_id is not null then
    select brain_item_id, version
      into predecessor_record
    from public.brain_item_versions
    where id = new.predecessor_version_id;

    if predecessor_record.brain_item_id is null
      or predecessor_record.brain_item_id <> new.brain_item_id
      or predecessor_record.version + 1 <> new.version then
      raise exception 'Brain item predecessor must be the immediately prior version of the same item';
    end if;
  end if;

  return new;
end;
$$;

create trigger brain_item_version_scope_guard
before insert or update on public.brain_item_versions
for each row execute function private.brain_item_version_scope_guard();

create or replace function private.brain_item_evidence_scope_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  version_record record;
  assertion_record record;
begin
  select workspace_id, audience into version_record
  from public.brain_item_versions where id = new.item_version_id;

  select workspace_id, audience into assertion_record
  from public.brain_assertions where id = new.assertion_id;

  if version_record.workspace_id is null
    or assertion_record.workspace_id is null
    or version_record.workspace_id <> new.workspace_id
    or assertion_record.workspace_id <> new.workspace_id
    or version_record.audience <> new.audience
    or assertion_record.audience <> new.audience then
    raise exception 'Brain item evidence cannot cross workspace or audience boundaries';
  end if;

  return new;
end;
$$;

create trigger brain_item_evidence_scope_guard
before insert or update on public.brain_item_version_assertions
for each row execute function private.brain_item_evidence_scope_guard();

create or replace function private.brain_relationship_version_scope_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  relationship_record record;
  from_version record;
  to_version record;
  predecessor_record record;
begin
  select workspace_id, subject_id, from_item_id, to_item_id
    into relationship_record
  from public.brain_relationships
  where id = new.relationship_id;

  select brain_item_id, workspace_id, subject_id, standing
    into from_version
  from public.brain_item_versions
  where id = new.from_item_version_id;

  select brain_item_id, workspace_id, subject_id, standing
    into to_version
  from public.brain_item_versions
  where id = new.to_item_version_id;

  if relationship_record.workspace_id is null
    or from_version.brain_item_id is null
    or to_version.brain_item_id is null
    or relationship_record.workspace_id <> new.workspace_id
    or relationship_record.subject_id <> new.subject_id
    or from_version.workspace_id <> new.workspace_id
    or to_version.workspace_id <> new.workspace_id
    or from_version.subject_id <> new.subject_id
    or to_version.subject_id <> new.subject_id
    or from_version.brain_item_id <> relationship_record.from_item_id
    or to_version.brain_item_id <> relationship_record.to_item_id then
    raise exception 'Brain relationship version must connect the identity endpoints in one workspace';
  end if;

  if new.standing = 'current'
    and (from_version.standing <> 'current' or to_version.standing <> 'current') then
    raise exception 'Current Brain relationships require current endpoint versions';
  end if;

  if new.version = 1 and new.predecessor_version_id is not null then
    raise exception 'First Brain relationship version cannot have a predecessor';
  end if;

  if new.predecessor_version_id is not null then
    select relationship_id, version
      into predecessor_record
    from public.brain_relationship_versions
    where id = new.predecessor_version_id;

    if predecessor_record.relationship_id is null
      or predecessor_record.relationship_id <> new.relationship_id
      or predecessor_record.version + 1 <> new.version then
      raise exception 'Brain relationship predecessor must be the immediately prior version of the same relationship';
    end if;
  end if;

  return new;
end;
$$;

create trigger brain_relationship_version_scope_guard
before insert or update on public.brain_relationship_versions
for each row execute function private.brain_relationship_version_scope_guard();

create or replace function private.brain_relationship_evidence_scope_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  version_record record;
  assertion_record record;
begin
  select workspace_id, audience into version_record
  from public.brain_relationship_versions where id = new.relationship_version_id;

  select workspace_id, audience into assertion_record
  from public.brain_assertions where id = new.assertion_id;

  if version_record.workspace_id is null
    or assertion_record.workspace_id is null
    or version_record.workspace_id <> new.workspace_id
    or assertion_record.workspace_id <> new.workspace_id
    or version_record.audience <> new.audience
    or assertion_record.audience <> new.audience then
    raise exception 'Brain relationship evidence cannot cross workspace or audience boundaries';
  end if;

  return new;
end;
$$;

create trigger brain_relationship_evidence_scope_guard
before insert or update on public.brain_relationship_version_assertions
for each row execute function private.brain_relationship_evidence_scope_guard();

create or replace function private.brain_require_item_support()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_version_id uuid;
begin
  if tg_table_name = 'brain_item_versions' then
    target_version_id := new.id;
  elsif tg_op = 'DELETE' then
    target_version_id := old.item_version_id;
  else
    target_version_id := new.item_version_id;
  end if;

  if exists (
    select 1
    from public.brain_item_versions version_row
    where version_row.id = target_version_id
      and version_row.standing = 'current'
      and version_row.maturity in ('held', 'trusted')
      and not exists (
        select 1
        from public.brain_item_version_assertions evidence_row
        where evidence_row.item_version_id = version_row.id
          and evidence_row.evidence_role = 'supporting'
      )
  ) then
    raise exception 'Current held or trusted Brain item versions require supporting evidence';
  end if;

  return null;
end;
$$;

create constraint trigger brain_item_versions_require_support
after insert or update on public.brain_item_versions
deferrable initially deferred
for each row execute function private.brain_require_item_support();

create constraint trigger brain_item_evidence_preserves_support
after insert or update or delete on public.brain_item_version_assertions
deferrable initially deferred
for each row execute function private.brain_require_item_support();

create or replace function private.brain_require_relationship_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_version_id uuid;
begin
  if tg_table_name = 'brain_relationship_versions' then
    target_version_id := new.id;
  elsif tg_op = 'DELETE' then
    target_version_id := old.relationship_version_id;
  else
    target_version_id := new.relationship_version_id;
  end if;

  if exists (
    select 1
    from public.brain_relationship_versions version_row
    where version_row.id = target_version_id
      and not exists (
        select 1
        from public.brain_relationship_version_assertions evidence_row
        where evidence_row.relationship_version_id = version_row.id
      )
  ) then
    raise exception 'Brain relationship versions require evidence';
  end if;

  return null;
end;
$$;

create constraint trigger brain_relationship_versions_require_evidence
after insert or update on public.brain_relationship_versions
deferrable initially deferred
for each row execute function private.brain_require_relationship_evidence();

create constraint trigger brain_relationship_evidence_preserves_support
after insert or update or delete on public.brain_relationship_version_assertions
deferrable initially deferred
for each row execute function private.brain_require_relationship_evidence();

revoke all on function private.brain_assertion_scope_guard() from public, anon, authenticated;
revoke all on function private.brain_item_version_scope_guard() from public, anon, authenticated;
revoke all on function private.brain_item_evidence_scope_guard() from public, anon, authenticated;
revoke all on function private.brain_relationship_version_scope_guard() from public, anon, authenticated;
revoke all on function private.brain_relationship_evidence_scope_guard() from public, anon, authenticated;
revoke all on function private.brain_require_item_support() from public, anon, authenticated;
revoke all on function private.brain_require_relationship_evidence() from public, anon, authenticated;

alter table public.brain_workspaces enable row level security;
alter table public.brain_workspace_roles enable row level security;
alter table public.brain_audience_grants enable row level security;
alter table public.brain_sources enable row level security;
alter table public.brain_assertions enable row level security;
alter table public.brain_items enable row level security;
alter table public.brain_item_versions enable row level security;
alter table public.brain_item_version_assertions enable row level security;
alter table public.brain_relationships enable row level security;
alter table public.brain_relationship_versions enable row level security;
alter table public.brain_relationship_version_assertions enable row level security;

alter table public.brain_workspaces force row level security;
alter table public.brain_workspace_roles force row level security;
alter table public.brain_audience_grants force row level security;
alter table public.brain_sources force row level security;
alter table public.brain_assertions force row level security;
alter table public.brain_items force row level security;
alter table public.brain_item_versions force row level security;
alter table public.brain_item_version_assertions force row level security;
alter table public.brain_relationships force row level security;
alter table public.brain_relationship_versions force row level security;
alter table public.brain_relationship_version_assertions force row level security;

create policy brain_workspaces_member_select
on public.brain_workspaces for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_workspaces.id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
);

create policy brain_workspace_roles_self_select
on public.brain_workspace_roles for select to authenticated
using (user_id = (select auth.uid()) and revoked_at is null);

create policy brain_audience_grants_self_select
on public.brain_audience_grants for select to authenticated
using (
  grantee_user_id = (select auth.uid())
  and revoked_at is null
  and (expires_at is null or expires_at > now())
);

create policy brain_sources_audience_select
on public.brain_sources for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_sources.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_sources.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_sources.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_assertions_audience_select
on public.brain_assertions for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_assertions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_assertions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_assertions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_item_versions_audience_select
on public.brain_item_versions for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_item_versions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_item_versions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_item_versions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_items_visible_version_select
on public.brain_items for select to authenticated
using (
  exists (
    select 1 from public.brain_item_versions version_row
    where version_row.brain_item_id = brain_items.id
  )
);

create policy brain_item_version_assertions_audience_select
on public.brain_item_version_assertions for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_item_version_assertions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_item_version_assertions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_item_version_assertions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_relationship_versions_audience_select
on public.brain_relationship_versions for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_relationship_versions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_relationship_versions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_relationship_versions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

create policy brain_relationships_visible_version_select
on public.brain_relationships for select to authenticated
using (
  exists (
    select 1 from public.brain_relationship_versions version_row
    where version_row.relationship_id = brain_relationships.id
  )
);

create policy brain_relationship_version_assertions_audience_select
on public.brain_relationship_version_assertions for select to authenticated
using (
  exists (
    select 1 from public.brain_workspace_roles role_row
    where role_row.workspace_id = brain_relationship_version_assertions.workspace_id
      and role_row.user_id = (select auth.uid())
      and role_row.revoked_at is null
  )
  and exists (
    select 1 from public.brain_audience_grants grant_row
    where grant_row.workspace_id = brain_relationship_version_assertions.workspace_id
      and grant_row.grantee_user_id = (select auth.uid())
      and grant_row.audience = brain_relationship_version_assertions.audience
      and grant_row.revoked_at is null
      and (grant_row.expires_at is null or grant_row.expires_at > now())
  )
);

revoke all on table public.brain_workspaces from anon, authenticated;
revoke all on table public.brain_workspace_roles from anon, authenticated;
revoke all on table public.brain_audience_grants from anon, authenticated;
revoke all on table public.brain_sources from anon, authenticated;
revoke all on table public.brain_assertions from anon, authenticated;
revoke all on table public.brain_items from anon, authenticated;
revoke all on table public.brain_item_versions from anon, authenticated;
revoke all on table public.brain_item_version_assertions from anon, authenticated;
revoke all on table public.brain_relationships from anon, authenticated;
revoke all on table public.brain_relationship_versions from anon, authenticated;
revoke all on table public.brain_relationship_version_assertions from anon, authenticated;

grant select on table public.brain_workspaces to authenticated;
grant select on table public.brain_workspace_roles to authenticated;
grant select on table public.brain_audience_grants to authenticated;
grant select on table public.brain_sources to authenticated;
grant select on table public.brain_assertions to authenticated;
grant select on table public.brain_items to authenticated;
grant select on table public.brain_item_versions to authenticated;
grant select on table public.brain_item_version_assertions to authenticated;
grant select on table public.brain_relationships to authenticated;
grant select on table public.brain_relationship_versions to authenticated;
grant select on table public.brain_relationship_version_assertions to authenticated;

grant all on table public.brain_workspaces to service_role;
grant all on table public.brain_workspace_roles to service_role;
grant all on table public.brain_audience_grants to service_role;
grant all on table public.brain_sources to service_role;
grant all on table public.brain_assertions to service_role;
grant all on table public.brain_items to service_role;
grant all on table public.brain_item_versions to service_role;
grant all on table public.brain_item_version_assertions to service_role;
grant all on table public.brain_relationships to service_role;
grant all on table public.brain_relationship_versions to service_role;
grant all on table public.brain_relationship_version_assertions to service_role;

comment on table public.brain_workspaces is
  'Tenant and subject boundary for one versioned Living Brain.';
comment on table public.brain_workspace_roles is
  'Membership and responsibility only; content access still requires an audience grant.';
comment on table public.brain_audience_grants is
  'Explicit, purpose-bound audience access. Trust or role alone never widens content visibility.';
comment on table public.brain_sources is
  'Immutable encrypted evidence envelopes or governed external pointers.';
comment on table public.brain_assertions is
  'Atomic encrypted claims with source-span integrity and preserved epistemic basis.';
comment on table public.brain_items is
  'Stable identity for a reusable Brain item across immutable meaning versions.';
comment on table public.brain_item_versions is
  'Versioned Brain meaning, scope, authority, applicability, time and confidence components.';
comment on table public.brain_relationship_versions is
  'Typed, version-specific semantic relationships whose current endpoints and evidence are enforced.';
