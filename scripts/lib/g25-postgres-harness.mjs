import { PGlite } from "@electric-sql/pglite";

export const g25BaseBootstrap = `
create schema auth;
create role authenticated nologin;
create role anon nologin;
create role service_role nologin bypassrls;

create table auth.users (
  id uuid primary key,
  email text not null unique
);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create function auth.jwt() returns jsonb
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;

create table public.brain_workspaces (
  id uuid primary key,
  subject_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_key text not null unique
);

create table public.brain_workspace_roles (
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  granted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz
);

create table public.brain_audience_grants (
  id uuid primary key,
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  grantee_user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null,
  purpose text not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

grant usage on schema public, auth to authenticated, service_role;
grant execute on function auth.uid(), auth.jwt() to authenticated, service_role;
grant select on public.brain_workspace_roles, public.brain_audience_grants to authenticated;
grant all on public.brain_workspaces, public.brain_workspace_roles, public.brain_audience_grants to service_role;
`;

export const g25AuthorityBootstrap = `
create table public.brain_items (
  id uuid primary key,
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  semantic_type text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (id, workspace_id, subject_id)
);

create table public.brain_item_versions (
  id uuid primary key,
  brain_item_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  version integer not null,
  title text not null,
  meaning_ciphertext text not null,
  encryption_version smallint not null,
  human_views text[] not null,
  epistemic_basis text not null,
  maturity text not null,
  standing text not null,
  audience text not null,
  consequence_permission text not null,
  applicability jsonb not null default '{}'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  evidence_quality numeric(4,3) not null default 0,
  corroboration numeric(4,3) not null default 0,
  recency numeric(4,3) not null default 0,
  transfer numeric(4,3) not null default 0,
  human_confirmation numeric(4,3) not null default 0,
  valid_from timestamptz not null,
  valid_until timestamptz,
  recorded_at timestamptz not null default now(),
  predecessor_version_id uuid,
  superseded_by_version_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  unique (brain_item_id, version),
  foreign key (brain_item_id, workspace_id, subject_id)
    references public.brain_items(id, workspace_id, subject_id) on delete cascade
);

create table public.brain_sources (
  id uuid primary key,
  workspace_id uuid not null references public.brain_workspaces(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  speaker_label text,
  captured_at timestamptz not null,
  purpose text not null,
  audience text not null,
  retention_expires_at timestamptz,
  integrity_sha256 text,
  external_locator text,
  content_ciphertext text,
  encryption_version smallint,
  recorded_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

grant all on public.brain_items, public.brain_item_versions, public.brain_sources to service_role;
`;

export async function createG25PostgresHarness({ authorityTables = false } = {}) {
  const db = await PGlite.create({ dataDir: "memory://" });
  await db.exec(g25BaseBootstrap);
  if (authorityTables) await db.exec(g25AuthorityBootstrap);
  return db;
}
