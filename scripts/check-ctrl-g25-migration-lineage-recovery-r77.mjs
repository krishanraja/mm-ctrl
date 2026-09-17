import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-migration-lineage-recovery-r77.json"));
const note = read("project-documentation/ctrl-evolution/g25-migration-lineage-recovery-r77.md");
const qa = read("project-documentation/ctrl-evolution/g25-migration-lineage-recovery-r77-qa-record.md");
const migrationFiles = readdirSync(resolve(root, "supabase/migrations")).filter((name) => name.endsWith(".sql"));

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-migration-lineage-recovery-r77] ${message}`);
};

assert(contract.status === "read_only_audit_complete_recovery_execution_gated", "status drifted");
assert(contract.lineage_inventory.local_migration_files === 170, "observed local file count drifted");
assert(contract.lineage_inventory.remote_history_rows === 135, "observed remote row count drifted");
assert(contract.lineage_inventory.local_only_versions === 164, "local-only count drifted");
assert(contract.lineage_inventory.remote_only_versions === 129, "remote-only count drifted");
assert(contract.first_replay_failure.remote_rows_creating_table === 0, "missing-table creation evidence drifted");
assert(contract.acceptance_gate.clean_replay_count === 2, "two-replay gate disappeared");
assert(contract.acceptance_gate.production_writes_before_action_time_approval === 0, "production write gate widened");

const duplicateFiles = migrationFiles.filter((name) => name.startsWith("20260602000000_"));
assert(duplicateFiles.length === 2, "duplicate local migration identity changed without updating the audit");
for (const expected of ["20260602000000_create_audit_infrastructure.sql", "20260602000000_decision_engine.sql"]) {
  assert(duplicateFiles.includes(expected), `missing duplicate migration evidence: ${expected}`);
}

assert(note.includes("A forward patch cannot fix an earlier replay step"), "forward-patch veto disappeared");
assert(note.includes("two clean replays"), "clean replay requirement disappeared");
assert(note.includes("Another ordinary branch is insufficient"), "broken-lineage branch warning disappeared");
assert(qa.includes("No package or runtime was installed"), "toolchain containment evidence disappeared");
assert(qa.includes("Production mutation, another billed environment, deployment and cutover remain separately gated"), "authority boundary disappeared");

console.log("[g25-migration-lineage-recovery-r77] PASS: lineage drift and the clean-baseline recovery gate are pinned");
