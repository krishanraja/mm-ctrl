import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-extension-runtime-compatibility-r94.json"));
const note = read("project-documentation/ctrl-evolution/g25-extension-runtime-compatibility-r94.md");
const qa = read("project-documentation/ctrl-evolution/g25-extension-runtime-compatibility-r94-qa-record.md");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contract.status === "tested_application_surface_compatible", "status drifted");
check(contract.interface_comparison.used_signatures_compared === 6, "used signature count drifted");
check(contract.interface_comparison.exact_matches === 6, "signature parity drifted");
check(contract.interface_comparison.signatures.length === 6, "signature inventory drifted");
check(Object.values(contract.runtime_proof.pg_cron).every((value) => value === true || value === 0), "cron runtime proof drifted");
check(contract.runtime_proof.pg_net.request_id_returned === true, "pg_net request ID proof disappeared");
check(contract.runtime_proof.pg_net.queue_shape_matched === true, "pg_net queue proof disappeared");
check(contract.runtime_proof.pg_net.worker_consumed_request === true, "pg_net worker proof disappeared");
check(contract.runtime_proof.pg_net.worker_recorded_result === true, "pg_net result proof disappeared");
check(contract.runtime_proof.pg_net.credentials_used === false, "pg_net probe gained credentials");
check(contract.runtime_proof.pg_net.probe_table_removed === true && contract.runtime_proof.pg_net.request_fixture_removed === true, "pg_net cleanup drifted");
check(contract.runtime_proof.vector.dimensions === 1536, "vector dimensions drifted");
check(contract.runtime_proof.vector.exact_vector_similarity === 1, "exact-vector result drifted");
check(contract.runtime_proof.vector.orthogonal_vector_similarity === 0, "orthogonal-vector result drifted");
check(contract.runtime_proof.vector.ranking_correct === true, "vector ranking drifted");
check(contract.runtime_proof.vector.remaining_fixture_rows === 0, "vector fixtures remain");
check(contract.acceptance_gate.extension_compatibility_passed === true, "extension gate regressed");
check(contract.acceptance_gate.critical_application_smoke_passed === false, "critical-path proof was fabricated");
check(contract.acceptance_gate.second_clean_blank_replay_passed === false, "second blank replay was fabricated");
check(contract.acceptance_gate.production_recovery_choice_ready === false, "production recovery gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.remaining_isolated_fixtures === 0, "isolated fixtures remain");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("bounded application-surface claim"), "bounded compatibility claim disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-extension-runtime-compatibility-r94] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-extension-runtime-compatibility-r94] PASS: tested extension application surface is compatible");
