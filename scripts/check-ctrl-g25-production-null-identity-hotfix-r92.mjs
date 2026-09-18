import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-production-null-identity-hotfix-r92.json"));
const note = read("project-documentation/ctrl-evolution/g25-production-null-identity-hotfix-r92.md");
const qa = read("project-documentation/ctrl-evolution/g25-production-null-identity-hotfix-r92-qa-record.md");
const migration = read(contract.artifacts.migration_path);
const preflight = read(contract.artifacts.preflight_path);
const verification = read(contract.artifacts.verification_path);
const failClosed = read(contract.artifacts.fail_closed_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "hotfix_packet_proved_awaiting_explicit_production_authority", "status drifted");
check(contract.scope.target_count === 7, "scope count drifted");
check(contract.scope.functions.length === 7, "function coverage drifted");
check(contract.scope.repairs.length === 6, "repair coverage drifted");
check(sha256(migration) === contract.artifacts.migration_sha256, "migration hash drifted");
check(sha256(preflight) === contract.artifacts.preflight_sha256, "preflight hash drifted");
check(sha256(verification) === contract.artifacts.verification_sha256, "verification hash drifted");
check(sha256(failClosed) === contract.artifacts.fail_closed_sha256, "fail-closed hash drifted");

check(migration.includes("R92 preflight: definition drift"), "atomic definition preflight disappeared");
check((migration.match(/CREATE OR REPLACE FUNCTION public\./g) || []).length === 7, "migration must replace seven functions");
check((migration.match(/REVOKE EXECUTE ON FUNCTION/g) || []).length === 7, "migration must revoke seven functions");
check((migration.match(/GRANT EXECUTE ON FUNCTION/g) || []).length === 7, "migration must grant seven functions");
check(migration.trimStart().startsWith("-- G25 production null-identity hotfix candidate R92"), "migration identity drifted");
check(migration.trimEnd().endsWith("COMMIT;"), "migration lost atomic close");
check(!/^\s*(DROP|TRUNCATE)\b/gimu.test(migration), "migration gained destructive DDL");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(preflight), "read-only preflight gained a mutation");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "read-only verification gained a mutation");
check((failClosed.match(/REVOKE EXECUTE ON FUNCTION/g) || []).length === 7, "fail-closed control must disable seven routes");
check((failClosed.match(/GRANT EXECUTE ON FUNCTION/g) || []).length === 4, "fail-closed control must retain four service routes");
check(!failClosed.includes("TO authenticated"), "fail-closed control reopened customer execution");

for (const key of [
  "target_count",
  "resolved_count",
  "definition_match_count",
  "anon_allowed_count",
  "authenticated_allowed_count",
  "service_allowed_count"
]) check(contract.production_preflight[key] === 7, `production preflight ${key} drifted`);
check(contract.production_preflight.writes === 0, "production preflight write boundary drifted");
check(contract.isolated_combined_payload_test.attempts.length === 2, "payload rehearsal chronology drifted");
check(contract.isolated_combined_payload_test.attempts[0].result === "preflight_aborted_as_designed", "correct preflight abort disappeared");
check(contract.isolated_combined_payload_test.attempts[0].database_effect === "none", "aborted preflight effect drifted");
check(contract.isolated_combined_payload_test.attempts[1].result === "pass", "payload rehearsal pass disappeared");
for (const [key, value] of Object.entries(contract.isolated_combined_payload_test.verification)) {
  check(value === 7, `combined payload ${key} drifted`);
}
check(contract.isolated_combined_payload_test.post_payload_runtime_smokes_passed === 3, "post-payload smoke count drifted");
check(contract.isolated_combined_payload_test.persistent_fixture_rows === 0, "post-payload fixtures remain");
check(contract.failure_control.type === "fail_closed_kill_switch_not_vulnerable_rollback", "failure-control type drifted");
check(contract.acceptance_gate.authenticated_http_transport_smoke_passed === false, "HTTP proof was fabricated");
check(contract.acceptance_gate.explicit_production_execution_authority === false, "production authority was fabricated");
check(contract.acceptance_gate.production_applied === false, "production application was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("It has not been applied."), "production application boundary disappeared");
check(note.includes("no normal rollback to the vulnerable public state"), "safe rollback principle disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-production-null-identity-hotfix-r92] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-production-null-identity-hotfix-r92] PASS: the production hotfix remains preflighted, proved and unapplied");
