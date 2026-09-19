import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-security-definer-high-risk-callers-r83.json"));
const note = read("project-documentation/ctrl-evolution/g25-security-definer-high-risk-callers-r83.md");
const qa = read("project-documentation/ctrl-evolution/g25-security-definer-high-risk-callers-r83-qa-record.md");
const candidate = read(contract.candidate.path);
const verification = read(contract.candidate.verification_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "caller_evidence_complete_candidate_generated_isolated_test_open", "status drifted");
check(contract.caller_evidence.current_repository_runtime.target_references_found === 0, "repository caller evidence drifted");
check(contract.caller_evidence.deployed_edge_functions.active_functions_scanned === 183, "deployed function coverage drifted");
check(contract.caller_evidence.deployed_edge_functions.retrieval_errors_after_bounded_retry === 0, "deployed retrieval errors reopened");
check(contract.caller_evidence.deployed_edge_functions.target_references_found === 1, "deployed caller claim drifted");
check(contract.caller_evidence.deployed_edge_functions.target_callers["sync_lead_to_sheets(uuid,uuid,text)"].includes("send-results-email"), "deployed sync caller disappeared");
check(contract.caller_evidence.deployed_edge_functions.caller_uses_service_role_symbol === true, "deployed trusted-caller evidence drifted");
check(contract.caller_evidence.deployed_edge_functions.raw_source_committed === false, "raw deployed source was marked committed");

const databaseCallers = contract.caller_evidence.database_definition_callers["sync_lead_to_sheets(uuid,uuid,text)"];
check(databaseCallers.length === 11, "internal sync caller count drifted");
check(Object.keys(contract.caller_evidence.active_cron).length === 2, "cron caller count drifted");
const statementCounts = contract.caller_evidence.observed_top_level_statements.counts;
check(Object.keys(statementCounts).length === 9, "statement count coverage drifted");
check(statementCounts["snapshot_north_star()"] === 9, "north-star observed calls drifted");
check(statementCounts["sp_aggregate_briefing_feedback(integer,integer)"] === 9, "briefing aggregate observed calls drifted");

const dispositions = Object.values(contract.route_dispositions).flat();
check(dispositions.length === 9, "disposition coverage is not nine");
check(new Set(dispositions).size === 9, "dispositions overlap");
check(contract.current_acl.all_nine_anon_executable === true, "current anon ACL evidence drifted");
check(contract.current_acl.all_nine_authenticated_executable === true, "current authenticated ACL evidence drifted");
check(contract.current_acl.seven_inherit_public_execute === true, "current PUBLIC ACL evidence drifted");

check(sha256(candidate) === contract.candidate.sha256, "candidate hash drifted");
check(sha256(verification) === contract.candidate.verification_sha256, "verification hash drifted");
check((candidate.match(/^REVOKE EXECUTE ON FUNCTION /gmu) || []).length === 9, "candidate must contain nine revokes");
check((candidate.match(/^GRANT EXECUTE ON FUNCTION /gmu) || []).length === 9, "candidate must contain nine grants");
check((candidate.match(/FROM PUBLIC, anon, authenticated;/gu) || []).length === 9, "candidate must deny all ordinary roles nine times");
check((candidate.match(/TO service_role;/gu) || []).length === 9, "candidate must retain service role nine times");
check(!/^\s*(CREATE|ALTER FUNCTION|DROP|INSERT|UPDATE|DELETE|TRUNCATE|SELECT\s+.*\()/gimu.test(candidate), "candidate gained an out-of-scope operation");
check(verification.includes("has_function_privilege('anon'"), "verification lost anon evidence");
check(verification.includes("has_function_privilege('authenticated'"), "verification lost authenticated evidence");
check(verification.includes("md5(pg_get_functiondef(oid))"), "verification lost definition identity");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "verification query gained a mutation");

check(contract.candidate.production_applied === false, "production application was fabricated");
check(contract.candidate.isolated_recovery_applied === false, "isolated application was fabricated");
check(contract.candidate.target_functions_invoked_by_test === false, "target invocation was fabricated");
check(contract.acceptance_gate.all_possible_historical_external_callers_proved === false, "historical caller proof was fabricated");
check(contract.acceptance_gate.isolated_acl_verification_passed === false, "isolated test pass was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production remains unchanged."), "production boundary disappeared");
check(qa.includes("Production writes: zero."), "production evidence disappeared");

if (failures.length) {
  console.error(`[g25-security-definer-high-risk-callers-r83] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-security-definer-high-risk-callers-r83] PASS: caller evidence and the isolated-only ACL candidate remain bounded");
