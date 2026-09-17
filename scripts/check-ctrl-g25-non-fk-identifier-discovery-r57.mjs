import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-non-fk-identifier-discovery-r57.json"));
const discoverySource = read(contract.artifacts.discovery);
const note = read("project-documentation/ctrl-evolution/g25-non-fk-identifier-discovery-r57.md");
const qa = read("project-documentation/ctrl-evolution/g25-non-fk-identifier-discovery-r57-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-non-fk-identifier-discovery-r57] ${message}`);
};

assert(contract.status === "non_fk_identifier_surface_discovered_execution_closed", "status drifted");
assert(sha256(discoverySource) === contract.artifacts.discovery_sha256, "discovery hash drifted");
const output = execFileSync(process.execPath, [resolve(root, contract.artifacts.discovery)], {
  cwd: root,
  encoding: "utf8",
});
const observed = JSON.parse(output);
const observedKeyMap = {
  generated_schema_tables: "table_count",
  generated_schema_row_columns: "row_column_count",
  non_fk_candidates: "non_fk_candidate_count",
  direct_candidates: "direct_candidate_count",
  opaque_json_candidates: "opaque_json_candidate_count",
  high_risk_anchors: "high_risk_anchor_count",
  delete_account_mentioned_tables: "delete_account_mentioned_table_count",
  migration_only_candidates: "migration_only_candidate_count",
};
for (const [contractKey, observedKey] of Object.entries(observedKeyMap)) {
  assert(
    observed.observed[observedKey] === contract.observed[contractKey],
    `${contractKey} drifted`,
  );
}

const deleteTables = new Set(observed.delete_account_mentioned_tables);
const currentUnmentioned = observed.high_risk_anchors
  .filter((candidate) => !deleteTables.has(candidate.table))
  .map((candidate) => `${candidate.table}.${candidate.column}`)
  .sort();
const migrationUnmentioned = observed.migration_only_candidates
  .filter((candidate) => candidate.kind !== "opaque_json_may_embed_identifier"
    && !deleteTables.has(candidate.table))
  .map((candidate) => `${candidate.table}.${candidate.column}`)
  .sort();
assert(JSON.stringify(currentUnmentioned)
  === JSON.stringify([...contract.generated_schema_high_risk_unmentioned_by_delete].sort()),
"current high-risk deletion gaps drifted");
assert(JSON.stringify(migrationUnmentioned)
  === JSON.stringify([...contract.migration_only_high_risk_unmentioned_by_delete].sort()),
"migration-only high-risk gaps drifted");
assert(discoverySource.includes("opaque_json_may_embed_identifier"), "opaque JSON discovery disappeared");
assert(note.includes("does not become a generic delete loop"), "semantic safety rationale disappeared");
assert(qa.includes("Migration parsing is archaeology"), "migration claim boundary disappeared");

console.log("[g25-non-fk-identifier-discovery-r57] PASS: non-FK identity surfaces are visible and execution remains closed");
