import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const sqlFiles = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
  "supabase/candidates/g25_auth_reachable_relation_discovery_r17.sql",
];
const sql = sqlFiles.map((relative) => fs.readFileSync(path.join(root, relative), "utf8"));
const registryPath = path.join(root, "project-documentation/ctrl-evolution/g25-erasure-target-registry-r18.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const allowedClassifications = new Set([
  "subject_delete",
  "membership_delete",
  "attribution_redact",
  "cascade_workspace_scope",
  "cascade_parent_scope",
  "owner_scope_unresolved",
  "retention_scope_unresolved",
]);

function flattenRegistry(candidate) {
  return candidate.relations.flatMap((relation) => relation.constraints.map((constraint) => ({
    relation: relation.relation,
    ...constraint,
  })));
}

async function discover() {
  const db = await createG25PostgresHarness({ authorityTables: true });
  try {
    for (const statement of sql) await db.exec(statement);
    const result = await db.query("select * from private.brain_discover_auth_reachable_relations()");
    return result.rows;
  } finally {
    await db.close();
  }
}

function flattenDiscovery(discovered) {
  const unique = new Map();
  for (const relation of discovered) {
    for (const pathEntry of relation.reference_paths) {
      const key = `${relation.relation_schema}.${relation.relation_name}.${pathEntry.constraint}`;
      const value = {
        relation: `${relation.relation_schema}.${relation.relation_name}`,
        constraint: pathEntry.constraint,
        from_columns: pathEntry.from_columns,
      };
      const prior = unique.get(key);
      if (prior && JSON.stringify(prior) !== JSON.stringify(value)) {
        throw new Error(`discovery_constraint_conflict:${key}`);
      }
      unique.set(key, value);
    }
  }
  return [...unique.values()].sort((left, right) =>
    `${left.relation}.${left.constraint}`.localeCompare(`${right.relation}.${right.constraint}`)
  );
}

function validate(candidate, discovered) {
  const errors = [];
  const actual = flattenDiscovery(discovered);
  const registered = flattenRegistry(candidate).sort((left, right) =>
    `${left.relation}.${left.constraint}`.localeCompare(`${right.relation}.${right.constraint}`)
  );
  const actualByKey = new Map(actual.map((entry) => [`${entry.relation}.${entry.constraint}`, entry]));
  const registryByKey = new Map();

  for (const entry of registered) {
    const key = `${entry.relation}.${entry.constraint}`;
    if (registryByKey.has(key)) errors.push(`duplicate_registry_entry:${key}`);
    registryByKey.set(key, entry);
    if (!allowedClassifications.has(entry.classification)) errors.push(`unknown_classification:${key}`);
    if (!entry.reason || entry.reason.trim().length < 20) errors.push(`weak_reason:${key}`);
    const live = actualByKey.get(key);
    if (!live) errors.push(`stale_registry_entry:${key}`);
    else if (JSON.stringify(live.from_columns) !== JSON.stringify(entry.from_columns)) {
      errors.push(`column_drift:${key}`);
    }
  }

  for (const entry of actual) {
    const key = `${entry.relation}.${entry.constraint}`;
    if (!registryByKey.has(key)) errors.push(`unregistered_discovery:${key}`);
  }

  const blockers = registered
    .filter((entry) => entry.standing === "blocks_execution")
    .map((entry) => `${entry.relation}.${entry.constraint}`)
    .sort();
  if (blockers.length === 0) errors.push("unresolved_policy_blockers_were_erased");
  if (candidate.execution_gate.status !== "blocked") errors.push("execution_gate_not_blocked");

  return { errors: [...new Set(errors)].sort(), blockers, actual_count: actual.length, registry_count: registered.length };
}

function expectFailure(candidate, discovered, expected, label) {
  const result = validate(candidate, discovered);
  if (!result.errors.some((error) => error.includes(expected))) {
    throw new Error(`${label} did not fail with ${expected}: ${JSON.stringify(result.errors)}`);
  }
  return { [label]: "failed_as_required" };
}

const discovered = await discover();
const result = validate(registry, discovered);
if (result.errors.length > 0) throw new Error(`R18 registry invalid: ${JSON.stringify(result.errors)}`);

const missing = structuredClone(registry);
missing.relations[0].constraints.shift();
const missingNegative = expectFailure(missing, discovered, "unregistered_discovery", "registry_entry_removed");

const stale = structuredClone(registry);
stale.relations[0].constraints.push({
  constraint: "removed_constraint_fkey",
  from_columns: ["removed_id"],
  classification: "subject_delete",
  standing: "approved_local_canary",
  reason: "Synthetic stale entry used only by the R18 negative control.",
});
const staleNegative = expectFailure(stale, discovered, "stale_registry_entry", "stale_registry_entry_added");

const drifted = structuredClone(registry);
drifted.relations[0].constraints[0].from_columns = ["wrong_column"];
const driftNegative = expectFailure(drifted, discovered, "column_drift", "registered_columns_drifted");

const falseReady = structuredClone(registry);
falseReady.execution_gate.status = "ready";
const readinessNegative = expectFailure(falseReady, discovered, "execution_gate_not_blocked", "unresolved_registry_marked_ready");

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  discovered_relations: discovered.length,
  discovered_constraints: result.actual_count,
  registered_constraints: result.registry_count,
  execution_gate: registry.execution_gate.status,
  blocking_entries: result.blockers,
  negative_controls: {
    ...missingNegative,
    ...staleNegative,
    ...driftNegative,
    ...readinessNegative,
  },
}, null, 2)}\n`);
