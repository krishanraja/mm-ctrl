import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-anonymous-reader-hardening-proof-r89.json"));
const note = read("project-documentation/ctrl-evolution/g25-anonymous-reader-hardening-proof-r89.md");
const qa = read("project-documentation/ctrl-evolution/g25-anonymous-reader-hardening-proof-r89-qa-record.md");
const candidate = read(contract.candidate.path);
const verification = read(contract.candidate.verification_path);
const smoke = read(contract.candidate.runtime_smoke_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "isolated_subject_boundary_passed_production_unchanged", "status drifted");
check(contract.surface.target_count === 8, "target count drifted");
check(contract.surface.literal_deployed_caller_count === 1, "deployed caller count drifted");
check(contract.surface.production_role_policy_dependency_count === 5, "production role-policy count drifted");
check(contract.surface.isolated_role_policy_dependency_count === 3, "isolated role-policy count drifted");

const dispositions = Object.values(contract.dispositions).flat();
check(dispositions.length === 8, "disposition coverage is not eight");
check(new Set(dispositions).size === 8, "dispositions overlap");

check(sha256(candidate) === contract.candidate.sha256, "candidate hash drifted");
check(sha256(verification) === contract.candidate.verification_sha256, "verification hash drifted");
check(sha256(smoke) === contract.candidate.runtime_smoke_sha256, "runtime smoke hash drifted");
check(candidate.includes("SECURITY INVOKER"), "pure invoker correction disappeared");
check(candidate.includes("Cannot read another user''s pending verifications"), "memory subject guard disappeared");
check(candidate.includes("_user_id = auth.uid()"), "role subject guard disappeared");
check(candidate.includes("auth.role() = 'service_role'"), "trusted service route disappeared");
check((candidate.match(/REVOKE EXECUTE ON FUNCTION/g) || []).length === 8, "candidate must explicitly revoke eight functions");
check((candidate.match(/GRANT EXECUTE ON FUNCTION/g) || []).length === 8, "candidate must explicitly grant eight functions");
check(!/^\s*(DROP|TRUNCATE|DELETE|INSERT|UPDATE)\b/gimu.test(candidate), "candidate gained destructive data work");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "verification gained a mutation");
check(smoke.includes("cross-subject pending verification read was not blocked"), "cross-subject memory veto disappeared");
check(smoke.includes("authenticated caller could enumerate another user role"), "cross-subject role veto disappeared");
check(smoke.includes("DELETE FROM public.user_memory") && smoke.includes("DELETE FROM auth.users"), "fixture cleanup disappeared");

for (const key of [
  "target_count",
  "resolved_count",
  "definer_match_count",
  "anon_acl_match_count",
  "authenticated_acl_match_count",
  "service_acl_match_count",
  "public_denied_count"
]) check(contract.isolated_verification[key] === 8, `isolated ${key} drifted`);
for (const key of [
  "pending_subject_guard_present",
  "pending_service_route_present",
  "role_subject_guard_present",
  "role_service_route_present"
]) check(contract.isolated_verification[key] === true, `isolated ${key} drifted`);

for (const [key, value] of Object.entries(contract.runtime_smoke)) {
  if (key.endsWith("_read") || key.endsWith("_blocked") || key.endsWith("_preserved")) {
    check(value === true, `runtime ${key} drifted`);
  }
}
check(Object.values(contract.runtime_smoke.fixture_counts_after).every((count) => count === 0), "runtime fixtures remain");
check(contract.advisor_progress.after_r89.anonymous_security_definer_executable === 12, "anonymous advisor count drifted");
check(contract.advisor_progress.after_r89.authenticated_security_definer_executable === 17, "authenticated advisor count drifted");
check(contract.advisor_progress.closed_by_r89.anonymous === 5, "anonymous closure count drifted");
check(contract.advisor_progress.closed_by_r89.authenticated === 4, "authenticated closure count drifted");
check(contract.production_postcheck.anon_allowed_count === 8, "production anonymous grants drifted");
check(contract.production_postcheck.authenticated_allowed_count === 8, "production authenticated grants drifted");
check(contract.production_postcheck.service_allowed_count === 8, "production service grants drifted");
check(contract.production_postcheck.writes === 0, "production writes drifted");
check(contract.acceptance_gate.production_unchanged === true, "production boundary drifted");
check(contract.acceptance_gate.all_45_routes_dispositioned === false, "whole-surface proof was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.persistent_fixture_rows === 0, "persistent fixture boundary drifted");
check(contract.authority.production_writes === 0, "authority production boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production statement disappeared");
check(note.includes("does not yet prove the HTTP/PostgREST transport"), "transport proof boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-anonymous-reader-hardening-proof-r89] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-anonymous-reader-hardening-proof-r89] PASS: isolated subject boundaries and reader ACLs remain proved");
