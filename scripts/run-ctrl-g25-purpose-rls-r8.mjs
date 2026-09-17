import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
const candidatePath = path.join(root, "supabase/tests/database/g25_prepared_receipt_purpose_canary.test.sql");
const candidate = fs.readFileSync(candidatePath, "utf8");
const purposePredicate = "and grant_row.purpose = g25_prepared_receipt_purpose_canary.purpose";

if (!candidate.includes(purposePredicate)) throw new Error("R8 purpose predicate is missing");

const bootstrap = `
create schema auth;
create role authenticated nologin;
create role anon nologin;

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

grant usage on schema public, auth to authenticated;
grant execute on function auth.uid(), auth.jwt() to authenticated;
grant select on public.brain_workspace_roles, public.brain_audience_grants to authenticated;
`;

async function createHarnessDatabase() {
  const db = await PGlite.create({ dataDir: "memory://" });
  await db.exec(bootstrap);
  return db;
}

async function runPositiveControl() {
  const db = await createHarnessDatabase();
  try {
    const results = await db.exec(candidate);
    const result = results
      .flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, "g25_purpose_canary_result"));
    if (!result) throw new Error("R8 produced no purpose-canary result");

    const tableReadback = await db.query(
      "select to_regclass('public.g25_prepared_receipt_purpose_canary') is null as table_rolled_back",
    );
    const fixtureReadback = await db.query(
      "select count(*)::int as fixture_users from auth.users where email like 'g25-purpose-%'",
    );
    const canary = result.g25_purpose_canary_result;
    if (canary?.status !== "passed" || canary?.exact_purpose_match_required !== true) {
      throw new Error("R8 positive control did not establish exact-purpose isolation");
    }
    if (tableReadback.rows[0].table_rolled_back !== true || fixtureReadback.rows[0].fixture_users !== 0) {
      throw new Error("R8 rollback left test residue");
    }
    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      canary,
      table_rolled_back: true,
      fixture_users_after_rollback: 0,
    };
  } finally {
    await db.close();
  }
}

async function runNegativeControl() {
  const db = await createHarnessDatabase();
  try {
    const weakened = candidate.replace(purposePredicate, "and true");
    try {
      await db.exec(weakened);
    } catch (error) {
      if (String(error?.message).includes("crossed the exact-purpose boundary")) {
        return { purpose_predicate_removed: "failed_as_required" };
      }
      throw error;
    }
    throw new Error("R8 negative control unexpectedly passed");
  } finally {
    await db.close();
  }
}

const positive = await runPositiveControl();
const negative = await runNegativeControl();

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_control: negative,
}, null, 2)}\n`);
