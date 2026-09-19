import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-auth-trigger-and-trigger-acl-proof-r87.json"));
const note = read("project-documentation/ctrl-evolution/g25-auth-trigger-and-trigger-acl-proof-r87.md");
const qa = read("project-documentation/ctrl-evolution/g25-auth-trigger-and-trigger-acl-proof-r87-qa-record.md");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contract.status === "auth_hook_recovered_trigger_acl_passed_production_unchanged", "status drifted");
for (const key of ["trigger_count", "enabled_count", "correct_function_count", "function_definition_unchanged_count"]) {
  check(contract.auth_hook_recovery[key] === 1, `Auth hook ${key} drifted`);
}
check(contract.auth_hook_recovery.trigger_definition_digest === "5504e726ea31c59076a56dac4c4b4c88", "Auth hook digest drifted");
check(contract.auth_hook_recovery.matches_production_trigger_digest === true, "production trigger parity drifted");

check(contract.runtime_smoke_history.length === 3, "runtime smoke chronology drifted");
check(contract.runtime_smoke_history[0].result === "blocked_before_insert", "read-only refusal disappeared");
check(contract.runtime_smoke_history[0].database_effect === "none", "read-only refusal effect drifted");
for (const attempt of contract.runtime_smoke_history.slice(1)) {
  check(attempt.result === "pass", `${attempt.migration} did not pass`);
  check(attempt.profile_created === true && attempt.default_role_created === true, `${attempt.migration} lost outcome proof`);
  check(Object.values(attempt.fixture_counts_after).every((count) => count === 0), `${attempt.migration} left fixture rows`);
}

for (const key of [
  "target_count",
  "resolved_count",
  "anon_denied_count",
  "authenticated_denied_count",
  "service_allowed_count",
  "owner_allowed_count",
  "definition_unchanged_count"
]) check(contract.trigger_acl[key] === 15, `trigger ACL ${key} drifted`);
check(contract.trigger_acl.attachment_count === 23, "trigger attachment count drifted");
check(contract.trigger_acl.enabled_attachment_count === 23, "enabled trigger attachment count drifted");
check(contract.trigger_acl.direct_definition_caller_count === 1, "internal caller count drifted");
check(contract.trigger_acl.acl_verification_digest === "85e20aed33ba6b1317789f1c30b7c45a", "trigger ACL digest drifted");

check(contract.advisor_progress.initial_r81.anonymous_security_definer_executable === 41, "initial anonymous advisor count drifted");
check(contract.advisor_progress.after_r87.anonymous_security_definer_executable === 17, "remaining anonymous advisor count drifted");
check(contract.advisor_progress.initial_r81.authenticated_security_definer_executable === 45, "initial authenticated advisor count drifted");
check(contract.advisor_progress.after_r87.authenticated_security_definer_executable === 21, "remaining authenticated advisor count drifted");
check(contract.advisor_progress.closed_by_isolated_acl_proofs.anonymous === 24, "anonymous closed count drifted");
check(contract.advisor_progress.closed_by_isolated_acl_proofs.authenticated === 24, "authenticated closed count drifted");

check(contract.production_postcheck.anon_allowed_count === 15, "production anonymous postcheck drifted");
check(contract.production_postcheck.authenticated_allowed_count === 15, "production authenticated postcheck drifted");
check(contract.production_postcheck.service_allowed_count === 15, "production service postcheck drifted");
check(contract.production_postcheck.writes === 0, "production write boundary drifted");
check(contract.acceptance_gate.auth_hook_recovered === true, "Auth hook gate drifted");
check(contract.acceptance_gate.pre_acl_runtime_smoke_passed === true, "pre-ACL smoke gate drifted");
check(contract.acceptance_gate.trigger_acl_verification_passed === true, "trigger ACL gate drifted");
check(contract.acceptance_gate.post_acl_runtime_smoke_passed === true, "post-ACL smoke gate drifted");
check(contract.acceptance_gate.fixtures_fully_cleaned === true, "fixture cleanup gate drifted");
check(contract.acceptance_gate.production_unchanged === true, "production boundary drifted");
check(contract.acceptance_gate.all_45_routes_dispositioned === false, "whole-surface proof was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.persistent_fixture_rows === 0, "persistent fixture boundary drifted");
check(contract.authority.production_writes === 0, "authority production boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production statement disappeared");
check(note.includes("The synthetic signup passed again after the ACL change."), "runtime continuity statement disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-auth-trigger-and-trigger-acl-proof-r87] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-auth-trigger-and-trigger-acl-proof-r87] PASS: signup runtime and trigger ACL continuity are proved in isolation");
