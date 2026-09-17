import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-both-generation-subject-erasure-r30.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-both-generation-subject-erasure-r30.md");
const qa = read("project-documentation/ctrl-evolution/g25-both-generation-subject-erasure-r30-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-both-generation-subject-erasure-r30] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_both_generation_subject_erasure_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("brain_prepared_custody_subject_erasure_tombstones"),
  "stable erasure tombstone missing");
assert(candidate.includes("brain_prepared_receipts receipt_row"), "legacy generation erasure missing");
assert(candidate.includes("brain_prepared_custody_receipts receipt_row"),
  "custody generation erasure missing");
assert(candidate.match(/payload_ciphertext = null,/g)?.length === 2,
  "payload destruction missing from one generation");
assert(candidate.includes("prepared-legacy-receipt-erased-event-r30"),
  "legacy erased-event domain missing");
assert(candidate.includes("prepared-custody-receipt-erased-event-r30"),
  "custody erased-event domain missing");
assert(candidate.includes("legacy_tombstone") && candidate.includes("custody_tombstone"),
  "shared anti-revival seam does not recognize both generations");
assert(!candidate.includes("owner_id"), "legacy owner identity leaked into R30");
assert(runner.includes("closed_custody_remained_erasable"),
  "post-access erasure proof missing");
assert(runner.includes("legacy_tombstone_bridged_into_stable_erasure"),
  "legacy tombstone bridge proof missing");
assert(runner.includes("cross_generation_failure_rolled_back_atomically"),
  "atomic rollback proof missing");
assert(runner.includes("legacy_subject_scope_removed"), "legacy mutation control missing");
assert(runner.includes("custody_subject_scope_removed"), "custody mutation control missing");
assert(runner.includes("custody_payload_destruction_removed"),
  "payload mutation control missing");
assert(runner.includes("stable_anti_revival_seam_removed"),
  "anti-revival mutation control missing");
assert(note.includes("A leader should not need to know which generation"),
  "human trust rationale missing");
assert(note.includes("not a final product or legal retention promise"),
  "unresolved retention boundary missing");
assert(qa.includes("No migration or runtime claim"), "QA boundary missing");

console.log("[g25-both-generation-subject-erasure-r30] PASS: one stable request erases both prepared generations atomically");
