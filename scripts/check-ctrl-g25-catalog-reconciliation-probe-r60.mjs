import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-catalog-reconciliation-probe-r60.json"));
const compiler = read(contract.implementation.compiler);
const note = read("project-documentation/ctrl-evolution/g25-catalog-reconciliation-probe-r60.md");
const qa = read("project-documentation/ctrl-evolution/g25-catalog-reconciliation-probe-r60-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-catalog-reconciliation-probe-r60] ${message}`);
};

assert(contract.status === "read_only_catalog_probe_compiled_execution_deferred", "status drifted");
assert(sha256(compiler) === contract.implementation.compiler_sha256, "compiler hash drifted");
const payload = JSON.parse(execFileSync(process.execPath, [resolve(root, contract.implementation.compiler)], {
  cwd: root,
  encoding: "utf8",
}));
assert(payload.sql_sha256 === contract.compiled_probe.sql_sha256, "SQL hash drifted");
assert(payload.target_counts.total === contract.compiled_probe.target_count, "target count drifted");
assert(payload.target_counts.migration_only === contract.compiled_probe.migration_only_target_count, "migration-only count drifted");
assert(payload.target_counts.opaque_json === contract.compiled_probe.opaque_json_target_count, "opaque JSON count drifted");
assert(new Set(payload.targets.map((target) => `${target.origin}:${target.table}.${target.column}`)).size === payload.targets.length, "duplicate target");

const forbidden = /\b(?:INSERT|UPDATE|DELETE|MERGE|TRUNCATE|ALTER|CREATE|DROP|COPY|CALL|DO|GRANT|REVOKE)\b/i;
assert(!forbidden.test(payload.sql), "probe contains a mutation statement");
const fromRelations = [...payload.sql.matchAll(/\b(?:FROM|JOIN)\s+([a-z0-9_.]+)/gi)].map((match) => match[1]);
const allowedRelations = new Set([
  "requested",
  "observed",
  "pg_catalog.pg_namespace",
  "pg_catalog.pg_class",
  "pg_catalog.pg_attribute",
  "pg_catalog.pg_constraint",
]);
assert(fromRelations.every((relation) => allowedRelations.has(relation)), `unexpected read relation: ${fromRelations.find((relation) => !allowedRelations.has(relation))}`);
assert(payload.sql.includes("NOT attributes.attisdropped"), "dropped-column exclusion disappeared");
assert(payload.sql.includes("classes.relrowsecurity"), "RLS observation disappeared");
assert(payload.sql.includes("pg_catalog.pg_get_constraintdef"), "constraint observation disappeared");
assert(note.includes("does not inspect a single application row"), "row-read boundary disappeared");
assert(qa.includes("No database returned these metadata rows yet"), "execution boundary disappeared");

console.log("[g25-catalog-reconciliation-probe-r60] PASS: 193 metadata targets compiled into a pinned read-only query; execution deferred");
