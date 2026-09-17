import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const candidateFiles = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
];
const priorCandidates = candidateFiles.map((relative) => fs.readFileSync(path.join(root, relative), "utf8"));
const discovery = fs.readFileSync(
  path.join(root, "supabase/candidates/g25_auth_reachable_relation_discovery_r17.sql"),
  "utf8",
);

const publicFilter = "and child_ns.nspname = 'public'";
const recursionGuard = "and not child.oid = any(walk.path_oids)";
for (const required of [publicFilter, recursionGuard, "security invoker", "set search_path = ''"]) {
  if (!discovery.toLowerCase().includes(required)) throw new Error(`R17 discovery is missing ${required}`);
}

const expectedRelations = [
  "brain_audience_grants",
  "brain_item_versions",
  "brain_items",
  "brain_prepared_authority_corrections",
  "brain_prepared_receipt_dependencies",
  "brain_prepared_receipt_events",
  "brain_prepared_receipts",
  "brain_prepared_subject_erasure_tombstones",
  "brain_sources",
  "brain_workspace_roles",
  "brain_workspaces",
];

async function createHarnessDatabase(candidateSql = discovery) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const candidate of priorCandidates) await db.exec(candidate);
  await db.exec(`
    create table private.out_of_scope_auth_reference (
      id uuid primary key,
      user_id uuid not null references auth.users(id) on delete cascade
    );
  `);
  await db.exec(candidateSql);
  return db;
}

async function inspect(candidateSql = discovery) {
  const db = await createHarnessDatabase(candidateSql);
  try {
    const discovered = await db.query(`
      select * from private.brain_discover_auth_reachable_relations()
      order by relation_schema, relation_name
    `);
    const security = await db.query(`
      select jsonb_build_object(
        'security_invoker', not prosecdef,
        'stable', provolatile = 's',
        'search_path_empty', coalesce(array_to_string(proconfig, ','), '') in ('search_path=', 'search_path=\"\"'),
        'search_path_config', coalesce(array_to_string(proconfig, ','), ''),
        'authenticated_closed', not has_function_privilege(
          'authenticated', 'private.brain_discover_auth_reachable_relations()', 'EXECUTE'
        ),
        'anon_closed', not has_function_privilege(
          'anon', 'private.brain_discover_auth_reachable_relations()', 'EXECUTE'
        ),
        'service_open', has_function_privilege(
          'service_role', 'private.brain_discover_auth_reachable_relations()', 'EXECUTE'
        )
      ) as result
      from pg_proc
      where oid = 'private.brain_discover_auth_reachable_relations()'::regprocedure
    `);
    return { discovered: discovered.rows, security: security.rows[0].result };
  } finally {
    await db.close();
  }
}

function assertPositive(result) {
  const names = result.discovered.map((row) => row.relation_name);
  if (result.discovered.some((row) => row.relation_schema !== "public")) {
    throw new Error("R17 crossed the explicit public-schema boundary");
  }
  if (JSON.stringify(names) !== JSON.stringify(expectedRelations)) {
    throw new Error(`R17 discovery drifted: ${JSON.stringify(names)}`);
  }
  const { search_path_config: _searchPathConfig, ...securityChecks } = result.security;
  if (Object.values(securityChecks).some((value) => value !== true)) {
    throw new Error(`R17 schema security failed: ${JSON.stringify(result.security)}`);
  }
  const dependencies = result.discovered.find((row) => row.relation_name === "brain_prepared_receipt_dependencies");
  if (!dependencies || dependencies.minimum_depth !== 2) {
    throw new Error("R17 did not discover a transitive auth-owned relation");
  }
}

async function expectNegative(candidateSql, expectedMessage, label) {
  try {
    const result = await inspect(candidateSql);
    assertPositive(result);
  } catch (error) {
    if (String(error?.message).includes(expectedMessage)) return { [label]: "failed_as_required" };
    throw error;
  }
  throw new Error(`R17 ${label} negative control unexpectedly passed`);
}

const positive = await inspect();
assertPositive(positive);

const schemaBoundaryNegative = await expectNegative(
  discovery.replaceAll(publicFilter, "and true"),
  "public-schema boundary",
  "public_schema_filter_removed",
);
const recursiveNegative = await expectNegative(
  discovery.replace(recursionGuard, "and false"),
  "discovery drifted",
  "recursive_discovery_removed",
);
const grantNegative = await expectNegative(
  discovery.replace(
    "revoke all on function private.brain_discover_auth_reachable_relations() from public, anon, authenticated;",
    "grant execute on function private.brain_discover_auth_reachable_relations() to authenticated;",
  ),
  "schema security failed",
  "authenticated_execute_opened",
);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  postgres_version: positive.discovered.length > 0 ? "catalog_introspection_exercised" : "unavailable",
  discovered_relations: positive.discovered,
  schema_security: positive.security,
  negative_controls: {
    ...schemaBoundaryNegative,
    ...recursiveNegative,
    ...grantNegative,
  },
}, null, 2)}\n`);
