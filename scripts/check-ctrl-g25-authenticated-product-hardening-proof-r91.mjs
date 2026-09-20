import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-authenticated-product-hardening-proof-r91.json"));
const note = read("project-documentation/ctrl-evolution/g25-authenticated-product-hardening-proof-r91.md");
const qa = read("project-documentation/ctrl-evolution/g25-authenticated-product-hardening-proof-r91-qa-record.md");
const candidate = read(contract.candidate.path);
const verification = read(contract.candidate.verification_path);
const smoke = read(contract.candidate.runtime_smoke_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "isolated_authenticated_product_routes_passed_live_pin_risk_preserved", "status drifted");
check(contract.risk_found.production_affected === true, "live pin risk disappeared");
check(contract.risk_found.production_mutated === false, "production mutation was fabricated");
check(contract.surface.target_count === 8, "surface count drifted");
check(contract.surface.signed_in_only_routes.length === 7, "signed-in-only route count drifted");
check(contract.surface.signed_in_and_service_route.length === 1, "service route count drifted");

check(sha256(candidate) === contract.candidate.sha256, "candidate hash drifted");
check(sha256(verification) === contract.candidate.verification_sha256, "verification hash drifted");
check(sha256(smoke) === contract.candidate.runtime_smoke_sha256, "runtime smoke hash drifted");
check((candidate.match(/REVOKE EXECUTE ON FUNCTION/g) || []).length === 8, "candidate must revoke eight functions");
check((candidate.match(/GRANT EXECUTE ON FUNCTION/g) || []).length === 8, "candidate must grant eight functions");
check(candidate.includes("v_caller_id IS NULL OR v_user_id IS DISTINCT FROM v_caller_id"), "pin identity guard disappeared");
check(!/^\s*(DROP|TRUNCATE|DELETE|INSERT)\b/gimu.test(candidate), "candidate gained destructive data work");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "verification gained a mutation");
check(smoke.includes("cross-subject pin was not blocked"), "cross-subject pin veto disappeared");
check(smoke.includes("owned MCP token mint failed"), "MCP continuity assertion disappeared");
check(smoke.includes("service track-record route was not preserved"), "service continuity assertion disappeared");
check(smoke.includes("DELETE FROM public.decision_outcomes") && smoke.includes("DELETE FROM auth.users"), "fixture cleanup disappeared");

for (const key of [
  "target_count",
  "resolved_count",
  "definer_count",
  "anon_denied_count",
  "authenticated_allowed_count",
  "service_acl_match_count",
  "public_denied_count"
]) check(contract.isolated_verification[key] === 8, `isolated ${key} drifted`);
check(contract.isolated_verification.pin_null_guard_present === true, "pin null guard evidence drifted");
check(contract.isolated_verification.pin_exact_owner_guard_present === true, "pin owner guard evidence drifted");

check(contract.runtime_smoke_history.length === 2, "runtime chronology drifted");
check(contract.runtime_smoke_history[0].result === "rolled_back_before_assertions", "rolled-back attempt disappeared");
check(contract.runtime_smoke_history[0].database_effect === "none", "failed attempt effect drifted");
const pass = contract.runtime_smoke_history[1];
check(pass.result === "pass", "runtime pass disappeared");
for (const [key, value] of Object.entries(pass)) {
  if (key.endsWith("_blocked") || key.endsWith("_preserved")) check(value === true, `runtime ${key} drifted`);
}
check(Object.values(pass.fixture_counts_after).every((count) => count === 0), "runtime fixtures remain");

check(contract.advisor_progress.after_r91.anonymous_security_definer_executable === 3, "anonymous advisor count drifted");
check(contract.advisor_progress.after_r91.authenticated_security_definer_executable === 17, "authenticated advisor count drifted");
check(contract.advisor_progress.remaining_anonymous_routes.length === 3, "remaining anonymous route count drifted");
check(contract.whole_surface.r82_route_count === 45, "R82 route count drifted");
check(contract.whole_surface.isolated_disposition_count === 45, "isolated disposition count drifted");
check(contract.whole_surface.production_applied === false, "production application was fabricated");
check(contract.whole_surface.http_transport_proved === false, "HTTP transport proof was fabricated");
check(contract.production_postcheck.anon_allowed_count === 4, "production anonymous grants drifted");
check(contract.production_postcheck.authenticated_allowed_count === 8, "production authenticated grants drifted");
check(contract.production_postcheck.service_allowed_count === 8, "production service grants drifted");
check(contract.production_postcheck.writes === 0, "production writes drifted");
check(contract.acceptance_gate.all_45_routes_dispositioned_in_isolation === true, "whole-surface disposition gate drifted");
check(contract.acceptance_gate.production_risks_closed === false, "live risks were falsely closed");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.persistent_fixture_rows === 0, "persistent fixture boundary drifted");
check(contract.authority.production_writes === 0, "authority production boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production statement disappeared");
check(note.includes("failed attempt left no database effect"), "failed-attempt chronology disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-authenticated-product-hardening-proof-r91] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-authenticated-product-hardening-proof-r91] PASS: isolated signed-in product routes remain ownership-bound");
