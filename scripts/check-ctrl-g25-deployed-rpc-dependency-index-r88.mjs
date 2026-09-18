import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const indexText = read("project-documentation/ctrl-evolution/g25-deployed-rpc-dependency-index-r88.json");
const index = JSON.parse(indexText);
const note = read("project-documentation/ctrl-evolution/g25-deployed-rpc-dependency-index-r88.md");
const qa = read("project-documentation/ctrl-evolution/g25-deployed-rpc-dependency-index-r88-qa-record.md");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(index.status === "durable_literal_dependency_index_complete", "status drifted");
check(index.active_functions_scanned === 183, "deployment coverage drifted");
check(index.retrieval_errors.length === 0, "retrieval errors reopened");
check(index.functions_with_dependencies === 22, "caller count drifted");
check(Object.keys(index.rpc_callers).length === 13, "RPC dependency count drifted");
check(Object.keys(index.edge_function_callers).length === 1, "Edge dependency count drifted");
check(index.rpc_callers.sync_lead_to_sheets.includes("send-results-email"), "corrected sync caller disappeared");
check(index.rpc_callers.get_pending_verifications.includes("extract-user-context"), "pending-verification caller disappeared");
check(index.rpc_callers.touch_memory_facts.length === 8, "memory touch caller count drifted");
check(index.edge_function_callers["synthesize-briefing"].includes("generate-briefing"), "Edge-to-Edge dependency drifted");
check(index.anonymous_reader_target_callers.get_pending_verifications.length === 1, "anonymous-reader caller count drifted");
for (const [name, callers] of Object.entries(index.anonymous_reader_target_callers)) {
  if (name !== "get_pending_verifications") check(callers.length === 0, `${name} deployed caller evidence drifted`);
}
check(index.corrected_prior_claims.length === 1, "correction history drifted");
check(index.corrected_prior_claims[0].contract === "G25-SECURITY-DEFINER-HIGH-RISK-CALLERS-R83", "corrected contract drifted");
check(index.authority.production_writes === 0, "production write boundary drifted");
check(index.authority.raw_source_committed === false, "raw source boundary drifted");
check(index.authority.secret_values_committed === false, "secret boundary drifted");
check(createHash("sha256").update(indexText).digest("hex") === "617bc9692eae5e7c975be3e36798b3f3060206f8ec18a5f75d4f2faca4ee95f5", "index hash drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("one produced a false negative"), "correction rationale disappeared");
check(note.includes("no raw deployed source"), "source containment disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-deployed-rpc-dependency-index-r88] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-deployed-rpc-dependency-index-r88] PASS: deployed literal dependencies remain durable and source-free");
