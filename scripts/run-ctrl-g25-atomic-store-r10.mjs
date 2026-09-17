import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
const candidatePath = path.join(root, "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql");
const testPath = path.join(root, "supabase/tests/database/g25_prepared_receipt_atomic_store_r10.test.sql");
const candidate = fs.readFileSync(candidatePath, "utf8");
const test = fs.readFileSync(testPath, "utf8");

const fingerprintPredicate = "if authority_fingerprint <> expected_authority_fingerprint then";
const currentAuthorityPredicate = "if not private.brain_prepared_authority_current(";

for (const required of [fingerprintPredicate, currentAuthorityPredicate]) {
  if (!candidate.includes(required)) throw new Error(`R10 candidate is missing ${required}`);
}

const bootstrap = `
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

async function createHarnessDatabase(candidateSql = candidate) {
  const db = await PGlite.create({ dataDir: "memory://" });
  await db.exec(bootstrap);
  await db.exec(candidateSql);
  return db;
}

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`;
}

async function verifyCrossLanguageFingerprint(db) {
  const scope = {
    workspace_id: "b2000000-0000-4000-8000-000000000001",
    owner_id: "b1000000-0000-4000-8000-000000000001",
    subject_id: "b1000000-0000-4000-8000-000000000001",
    audience: "person_private",
    purpose: "prepared_intelligence",
  };
  const receiptId = "b5000000-0000-4000-8000-000000000001";
  const dependencies = [{
    authority_kind: "brain_item_version",
    authority_record_id: "b4000000-0000-4000-8000-000000000001",
    authority_version: "3",
    authority_sha256: "a".repeat(64),
    observed_at: "2026-09-17T08:59:00Z",
    ...scope,
  }];
  const unsigned = {
    schema_version: "ctrl.prepared-intelligence-authority-envelope.r7",
    receipt_id: receiptId,
    ...scope,
    dependencies,
  };
  const expected = createHash("sha256")
    .update(`prepared-authority-envelope-r7\n${canonicalJson(unsigned)}`, "utf8")
    .digest("hex");
  const database = await db.query(
    `select private.brain_prepared_authority_fingerprint(
      $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::text, $6::text, $7::jsonb
    ) as fingerprint`,
    [receiptId, scope.workspace_id, scope.owner_id, scope.subject_id, scope.audience, scope.purpose, JSON.stringify(dependencies)],
  );
  if (database.rows[0].fingerprint !== expected) {
    throw new Error("R10 database fingerprint differs from the R7 TypeScript contract");
  }
  return true;
}

async function verifySchemaSecurity(db) {
  const result = await db.query(`
    select
      bool_and(class.relrowsecurity and class.relforcerowsecurity) as rls_forced,
      not has_table_privilege('authenticated', 'public.brain_prepared_receipts', 'INSERT') as authenticated_insert_closed,
      not has_function_privilege('authenticated', 'private.brain_store_prepared_receipt(jsonb,jsonb)', 'EXECUTE') as authenticated_function_closed,
      has_function_privilege('service_role', 'private.brain_store_prepared_receipt(jsonb,jsonb)', 'EXECUTE') as service_function_open,
      not has_table_privilege('service_role', 'public.brain_prepared_receipts', 'UPDATE') as service_update_closed,
      not has_table_privilege('service_role', 'public.brain_prepared_receipts', 'DELETE') as service_delete_closed,
      (
        select count(*) = 9
        from pg_indexes
        where schemaname = 'public'
          and indexname in (
            'brain_prepared_receipts_pkey',
            'brain_prepared_receipts_scope_idx',
            'brain_prepared_receipts_owner_idx',
            'brain_prepared_receipts_subject_idx',
            'brain_prepared_receipts_current_idx',
            'brain_prepared_receipt_dependencies_pkey',
            'brain_prepared_receipt_dependencies_authority_idx',
            'brain_prepared_receipt_dependencies_scope_idx',
            'brain_prepared_receipt_events_receipt_idx'
          )
      ) as required_indexes_present
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname in (
        'brain_prepared_receipts',
        'brain_prepared_receipt_dependencies',
        'brain_prepared_receipt_events'
      )
  `);
  const proof = result.rows[0];
  if (Object.values(proof).some((value) => value !== true)) {
    throw new Error(`R10 schema security or index invariant failed: ${JSON.stringify(proof)}`);
  }
  return proof;
}

async function runPositiveControl() {
  const db = await createHarnessDatabase();
  try {
    const crossLanguageAuthorityFingerprint = await verifyCrossLanguageFingerprint(db);
    const schemaSecurity = await verifySchemaSecurity(db);
    const results = await db.exec(test);
    const result = results
      .flatMap((entry) => entry.rows ?? [])
      .find((row) => Object.hasOwn(row, "g25_atomic_store_result"));
    if (!result || result.g25_atomic_store_result?.status !== "passed") {
      throw new Error("R10 produced no passing atomic-store result");
    }

    const residue = await db.query(`
      select
        (select count(*)::int from public.brain_prepared_receipts) as receipts,
        (select count(*)::int from public.brain_prepared_receipt_dependencies) as dependencies,
        (select count(*)::int from public.brain_prepared_receipt_events) as events,
        to_regclass('public.g25_current_authority_fixture') is null as fixture_rolled_back
    `);
    const row = residue.rows[0];
    if (row.receipts !== 0 || row.dependencies !== 0 || row.events !== 0 || row.fixture_rolled_back !== true) {
      throw new Error("R10 rollback left durable test residue");
    }

    return {
      postgres_version: (await db.query("show server_version")).rows[0].server_version,
      cross_language_authority_fingerprint: crossLanguageAuthorityFingerprint,
      schema_security: schemaSecurity,
      canary: result.g25_atomic_store_result,
      rollback_residue: row,
    };
  } finally {
    await db.close();
  }
}

async function expectNegativeControl(candidateSql, expectedMessage, label) {
  const db = await createHarnessDatabase(candidateSql);
  try {
    try {
      await db.exec(test);
    } catch (error) {
      if (String(error?.message).includes(expectedMessage)) return { [label]: "failed_as_required" };
      throw error;
    }
    throw new Error(`R10 ${label} negative control unexpectedly passed`);
  } finally {
    await db.close();
  }
}

const positive = await runPositiveControl();
const fingerprintNegative = await expectNegativeControl(
  candidate.replace(fingerprintPredicate, "if false then"),
  "authority fingerprint mismatch was accepted",
  "authority_fingerprint_check_removed",
);
const currentAuthorityNegative = await expectNegativeControl(
  candidate.replace(currentAuthorityPredicate, "if false and not private.brain_prepared_authority_current("),
  "stale authority dependency was accepted",
  "current_authority_check_removed",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_controls: {
    ...fingerprintNegative,
    ...currentAuthorityNegative,
  },
}, null, 2)}\n`);
