import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-memory-mutator-hardening-proof-r90.json"));
const note = read("project-documentation/ctrl-evolution/g25-memory-mutator-hardening-proof-r90.md");
const qa = read("project-documentation/ctrl-evolution/g25-memory-mutator-hardening-proof-r90-qa-record.md");
const candidate = read(contract.candidate.path);
const verification = read(contract.candidate.verification_path);
const smoke = read(contract.candidate.runtime_smoke_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "isolated_memory_subject_boundary_passed_live_risk_preserved", "status drifted");
check(contract.risk_found.production_affected === true, "live risk disappeared");
check(contract.risk_found.production_mutated === false, "production mutation was fabricated");
check(contract.risk_found.affected_functions.length === 4, "affected function count drifted");
check(contract.surface.target_count === 5, "surface count drifted");
check(contract.surface.deployed_touch_memory_facts_callers === 8, "deployed service caller count drifted");

check(sha256(candidate) === contract.candidate.sha256, "candidate hash drifted");
check(sha256(verification) === contract.candidate.verification_sha256, "verification hash drifted");
check(sha256(smoke) === contract.candidate.runtime_smoke_sha256, "runtime smoke hash drifted");
check((candidate.match(/CREATE OR REPLACE FUNCTION public\./g) || []).length === 5, "candidate must replace five functions");
check((candidate.match(/REVOKE EXECUTE ON FUNCTION/g) || []).length === 5, "candidate must revoke five functions");
check((candidate.match(/GRANT EXECUTE ON FUNCTION/g) || []).length === 5, "candidate must grant five functions");
check(candidate.includes("v_user_id IS DISTINCT FROM v_caller_id"), "exact owner comparison disappeared");
check(candidate.includes("v_service boolean := auth.role() = 'service_role'"), "service distinction disappeared");
check(candidate.includes("v_caller_id IS NULL AND NOT v_service"), "null-identity touch guard disappeared");
check(!/^\s*(DROP|TRUNCATE)\b/gimu.test(candidate), "candidate gained destructive DDL");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "verification gained a mutation");
check(smoke.includes("cross-subject verification was not blocked"), "cross-subject verification veto disappeared");
check(smoke.includes("anonymous touch body guard did not block"), "anonymous body-guard veto disappeared");
check(smoke.includes("service touch route was not preserved"), "service continuity assertion disappeared");
check(smoke.includes("DELETE FROM public.memory_events") && smoke.includes("DELETE FROM auth.users"), "fixture cleanup disappeared");

for (const key of [
  "target_count",
  "resolved_count",
  "definer_count",
  "anon_denied_count",
  "authenticated_allowed_count",
  "service_acl_match_count",
  "public_denied_count"
]) check(contract.isolated_verification[key] === 5, `isolated ${key} drifted`);
for (const key of ["fix_null_guard_present", "verify_exact_owner_guard_present", "touch_service_guard_present"]) {
  check(contract.isolated_verification[key] === true, `isolated ${key} drifted`);
}

for (const [key, value] of Object.entries(contract.runtime_smoke)) {
  if (key.endsWith("_blocked") || key.endsWith("_preserved") || key.endsWith("_subject") || key.endsWith("_once")) {
    check(value === true, `runtime ${key} drifted`);
  }
}
check(Object.values(contract.runtime_smoke.fixture_counts_after).every((count) => count === 0), "runtime fixtures remain");
check(contract.advisor_progress.after_r90.anonymous_security_definer_executable === 7, "anonymous advisor count drifted");
check(contract.advisor_progress.after_r90.authenticated_security_definer_executable === 17, "authenticated advisor count drifted");
check(contract.production_postcheck.anon_allowed_count === 5, "production anonymous grants drifted");
check(contract.production_postcheck.authenticated_allowed_count === 5, "production authenticated grants drifted");
check(contract.production_postcheck.service_allowed_count === 5, "production service grants drifted");
check(contract.production_postcheck.writes === 0, "production writes drifted");
check(contract.acceptance_gate.production_unchanged === true, "production boundary drifted");
check(contract.acceptance_gate.production_risk_closed === false, "live risk was falsely closed");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.persistent_fixture_rows === 0, "persistent fixture boundary drifted");
check(contract.authority.production_writes === 0, "authority production boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("production risk is recorded but not remediated"), "live-risk boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-memory-mutator-hardening-proof-r90] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-memory-mutator-hardening-proof-r90] PASS: isolated memory mutation boundaries remain proved and live risk stays explicit");
