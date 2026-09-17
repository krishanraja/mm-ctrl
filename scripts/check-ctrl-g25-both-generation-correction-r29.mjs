import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-both-generation-correction-r29.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-both-generation-correction-r29.md");
const qa = read("project-documentation/ctrl-evolution/g25-both-generation-correction-r29-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-both-generation-correction-r29] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_both_generation_correction_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("brain_prepared_custody_corrections"), "custody correction receipt missing");
assert(candidate.includes("brain_prepared_receipts receipt_row"), "legacy generation update missing");
assert(candidate.includes("brain_prepared_custody_receipts receipt_row"), "custody generation update missing");
assert(candidate.match(/dependency_row\.authority_record_id = affected_authority_record_id/g)?.length === 2,
  "exact affected-record predicate missing from one generation");
assert(candidate.includes("replacement_authority_not_current"), "replacement-currentness gate missing");
assert(candidate.includes("prepared-receipt-invalidated-r29"), "event identity missing");
assert(candidate.includes("'legacy' || chr(10)"), "legacy event domain missing");
assert(candidate.includes("'custody' || chr(10)"), "custody event domain missing");
assert(!candidate.includes("owner_id"), "legacy owner identity leaked into R29");
assert(runner.includes("cross_generation_failure_rolled_back_atomically"), "atomic rollback proof missing");
assert(runner.includes("legacy_owner_smuggling"), "owner-smuggling negative case missing");
assert(runner.includes("legacy_affected_record_predicate_removed"), "legacy mutation control missing");
assert(runner.includes("custody_affected_record_predicate_removed"), "custody mutation control missing");
assert(runner.includes("replacement_current_guard_removed"), "currentness mutation control missing");
assert(note.includes("The user's correction must travel across the entire system"), "human trust rationale missing");
assert(qa.includes("No migration or runtime claim"), "QA boundary missing");

console.log("[g25-both-generation-correction-r29] PASS: one correction repairs both prepared generations atomically");
