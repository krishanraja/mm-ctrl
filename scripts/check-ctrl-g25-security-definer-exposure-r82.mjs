import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contractPath = "project-documentation/ctrl-evolution/g25-security-definer-exposure-r82.json";
const notePath = "project-documentation/ctrl-evolution/g25-security-definer-exposure-r82.md";
const qaPath = "project-documentation/ctrl-evolution/g25-security-definer-exposure-r82-qa-record.md";
const contract = JSON.parse(read(contractPath));
const note = read(notePath);
const qa = read(qaPath);
const probe = read(contract.fingerprint.probe_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contract.status === "read_only_exposure_audit_complete_mutation_gated", "status drifted");
check(contract.fingerprint.callable_security_definer_count === 45, "callable count drifted");
check(contract.fingerprint.anon_count === 41, "anonymous count drifted");
check(contract.fingerprint.authenticated_count === 45, "authenticated count drifted");
check(contract.fingerprint.public_default_count === 39, "PUBLIC default count drifted");
check(contract.fingerprint.trigger_result_count === 15, "trigger count drifted");
check(contract.fingerprint.non_trigger_count === 30, "normal callable count drifted");
check(contract.fingerprint.anon_write_no_auth_marker_count === 9, "highest-risk write count drifted");
check(contract.fingerprint.anon_read_no_auth_marker_count === 8, "anonymous read count drifted");
check(contract.fingerprint.exposure_digest === "e2917473e664296685ec4975f658ca3b", "exposure digest drifted");
check(contract.fingerprint.production_and_first_blank_replay_match === true, "replay parity disappeared");

const classes = contract.route_classes;
const classSizes = {
  anonymous_write_without_visible_identity_guard: 9,
  anonymous_read_without_visible_identity_guard: 8,
  auth_uid_marker_requires_behavioral_proof: 13,
  trigger_returning_direct_execute_should_be_removed: 15
};
for (const [key, size] of Object.entries(classSizes)) {
  check(Array.isArray(classes[key]) && classes[key].length === size, `${key} size drifted`);
}
const allRoutes = Object.values(classes).flat();
check(allRoutes.length === 45, "route classes no longer cover 45 functions");
check(new Set(allRoutes).size === 45, "route classes overlap or contain duplicate signatures");

const runtimeNames = Object.keys(contract.current_repository_runtime_references);
check(runtimeNames.length === 14, "current runtime caller count drifted");
for (const [name, files] of Object.entries(contract.current_repository_runtime_references)) {
  check(files.length > 0, `${name} has no caller evidence`);
  for (const file of files) check(existsSync(resolve(root, file)), `${name} caller file is missing: ${file}`);
}
check(contract.highest_risk_caller_evidence.actual_runtime_reference_count === 0, "highest-risk caller claim drifted");
check(contract.highest_risk_caller_evidence.generated_types_only.length === 6, "types-only count drifted");
check(contract.highest_risk_caller_evidence.no_current_repository_reference.length === 3, "no-reference count drifted");

check(contract.acceptance_gate.all_45_routes_dispositioned === false, "route disposition was fabricated");
check(contract.acceptance_gate.all_current_and_external_callers_proved === false, "caller proof was fabricated");
check(contract.acceptance_gate.attacker_owner_and_service_role_tests_pass === false, "security test pass was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production mutation gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");

check(probe.trimStart().startsWith("-- G25 SECURITY DEFINER exposure fingerprint R82"), "probe identity drifted");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(probe), "probe gained a mutation statement");
check(probe.includes("pg_get_functiondef") && probe.includes("has_function_privilege"), "probe lost definition or ACL evidence");
check(createHash("sha256").update(probe).digest("hex").length === 64, "probe hashing failed");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("No grant or routine mutation is authorised."), "mutation boundary disappeared");
check(qa.includes("No routine was called."), "non-execution evidence disappeared");

if (failures.length) {
  console.error(`[g25-security-definer-exposure-r82] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-security-definer-exposure-r82] PASS: all exposed privileged functions remain partitioned and mutation stays blocked");
