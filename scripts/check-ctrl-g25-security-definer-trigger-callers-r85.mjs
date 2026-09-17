import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-security-definer-trigger-callers-r85.json"));
const note = read("project-documentation/ctrl-evolution/g25-security-definer-trigger-callers-r85.md");
const qa = read("project-documentation/ctrl-evolution/g25-security-definer-trigger-callers-r85-qa-record.md");
const candidate = read(contract.candidate.path);
const verification = read(contract.candidate.verification_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "trigger_callers_resolved_candidate_ready_for_isolated_test", "status drifted");
check(contract.surface.target_functions === 15, "target count drifted");
check(contract.surface.all_return_trigger === true, "trigger result proof drifted");
check(contract.surface.all_anon_executable === true, "current anon ACL proof drifted");
check(contract.surface.all_authenticated_executable === true, "current authenticated ACL proof drifted");
check(contract.surface.all_inherit_public_execute === true, "current PUBLIC ACL proof drifted");
check(contract.caller_evidence.current_repository_runtime_references === 0, "repository caller proof drifted");
check(contract.caller_evidence.deployed_edge_functions_scanned === 183, "deployed scan coverage drifted");
check(contract.caller_evidence.deployed_edge_function_references === 0, "deployed caller proof drifted");
check(contract.caller_evidence.deployed_edge_function_retrieval_errors_after_bounded_retry === 0, "deployed retrieval errors reopened");
check(contract.caller_evidence.active_trigger_attachments === 23, "trigger attachment count drifted");
check(contract.caller_evidence.enabled_trigger_attachments === 23, "enabled trigger count drifted");
check(contract.caller_evidence.functions_with_trigger_attachments === 11, "attached function count drifted");
check(contract.caller_evidence.unattached_and_unreferenced_candidates.length === 3, "retirement-candidate count drifted");
check(Object.keys(contract.definition_digests).length === 15, "definition digest coverage drifted");

check(sha256(candidate) === contract.candidate.sha256, "candidate hash drifted");
check(sha256(verification) === contract.candidate.verification_sha256, "verification hash drifted");
check((candidate.match(/^REVOKE EXECUTE ON FUNCTION /gmu) || []).length === 15, "candidate must contain 15 revokes");
check((candidate.match(/^GRANT EXECUTE ON FUNCTION /gmu) || []).length === 15, "candidate must contain 15 grants");
check((candidate.match(/FROM PUBLIC, anon, authenticated;/gu) || []).length === 15, "candidate ordinary-role denial drifted");
check((candidate.match(/TO service_role;/gu) || []).length === 15, "candidate service-role continuity drifted");
check(!/^\s*(CREATE|ALTER FUNCTION|DROP|INSERT|UPDATE|DELETE|TRUNCATE)\b/gimu.test(candidate), "candidate gained an out-of-scope operation");
check(verification.includes("JOIN pg_trigger g ON g.tgfoid = r.oid"), "verification lost trigger attachment proof");
check(verification.includes("p.proname <> split_part"), "verification lost same-name false-positive guard");
check(!/^\s*(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/gimu.test(verification), "verification gained a mutation");

check(contract.candidate.isolated_recovery_applied === false, "isolated application was fabricated");
check(contract.candidate.production_applied === false, "production application was fabricated");
check(contract.candidate.target_functions_invoked === false, "target invocation was fabricated");
check(contract.acceptance_gate.isolated_acl_verification_passed === false, "isolated pass was fabricated");
check(contract.acceptance_gate.trigger_runtime_smoke_passed === false, "runtime smoke was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production boundary disappeared");
check(note.includes("Catalog presence is not runtime proof."), "runtime proof boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-security-definer-trigger-callers-r85] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-security-definer-trigger-callers-r85] PASS: trigger callers and the isolated-only ACL candidate remain bounded");
