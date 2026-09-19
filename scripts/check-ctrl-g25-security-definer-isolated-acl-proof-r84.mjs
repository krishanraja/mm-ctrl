import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-security-definer-isolated-acl-proof-r84.json"));
const note = read("project-documentation/ctrl-evolution/g25-security-definer-isolated-acl-proof-r84.md");
const qa = read("project-documentation/ctrl-evolution/g25-security-definer-isolated-acl-proof-r84-qa-record.md");
const verification = read(contract.verification.path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "isolated_acl_proof_passed_production_unchanged", "status drifted");
check(contract.target.purpose === "approved_blank_recovery_proof", "target purpose drifted");
check(contract.target.customer_rows === 0, "blank target claim drifted");
check(contract.preflight.ordinary_role_executable_security_definer_count === 45, "preflight count drifted");
check(contract.preflight.exposure_digest === "e2917473e664296685ec4975f658ca3b", "preflight digest drifted");
check(contract.preflight.matched_production_r82 === true, "preflight parity drifted");

check(contract.migration.applied_to_isolated_target === true, "isolated migration result disappeared");
check(contract.migration.applied_to_production === false, "production application was fabricated");
check(contract.migration.function_definitions_changed === false, "definition mutation boundary drifted");
check(contract.migration.target_functions_invoked === false, "function invocation boundary drifted");
check(contract.verification_history.length === 2, "verification chronology drifted");
check(contract.verification_history[0].result === "verifier_query_failed_before_result", "first verifier failure disappeared");
check(contract.verification_history[0].database_effect === "none", "failed verifier effect drifted");
check(contract.verification_history[1].result === "pass", "corrected verifier pass disappeared");

check(sha256(verification) === contract.verification.sha256, "verification hash drifted");
for (const key of [
  "target_count",
  "resolved_count",
  "anon_denied_count",
  "authenticated_denied_count",
  "service_allowed_count",
  "owner_allowed_count",
  "definition_unchanged_count"
]) check(contract.verification[key] === 9, `${key} drifted`);
check(contract.verification.sync_lead_internal_caller_count === 11, "internal caller continuity drifted");
check(contract.verification.acl_verification_digest === "ffb416d4290ee946209916d0e11629b1", "ACL verification digest drifted");

check(contract.advisor_delta.anonymous_security_definer_executable.delta === -9, "anonymous advisor delta drifted");
check(contract.advisor_delta.authenticated_security_definer_executable.delta === -9, "authenticated advisor delta drifted");
check(contract.production_postcheck.anon_allowed_count === 9, "production anon postcheck drifted");
check(contract.production_postcheck.authenticated_allowed_count === 9, "production authenticated postcheck drifted");
check(contract.production_postcheck.definition_unchanged_count === 9, "production definition postcheck drifted");
check(contract.production_postcheck.writes === 0, "production write boundary drifted");

check(contract.acceptance_gate.isolated_acl_verification_passed === true, "isolated gate drifted");
check(contract.acceptance_gate.advisor_delta_matches_scope === true, "advisor gate drifted");
check(contract.acceptance_gate.production_unchanged_after_test === true, "production postcheck gate drifted");
check(contract.acceptance_gate.all_45_routes_dispositioned === false, "whole-surface proof was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.production_writes === 0, "authority write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production boundary disappeared");
check(note.includes("The failed query changed nothing."), "verifier correction chronology disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-security-definer-isolated-acl-proof-r84] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-security-definer-isolated-acl-proof-r84] PASS: isolated ACL effect is proved and production remains closed");
