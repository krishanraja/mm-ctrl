import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-post-cutover-lifecycle-r33.json",
));
const cutover = read(contract.artifacts.runtime_cutover);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-post-cutover-lifecycle-r33.md");
const qa = read("project-documentation/ctrl-evolution/g25-post-cutover-lifecycle-r33-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-post-cutover-lifecycle-r33] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_post_cutover_lifecycle_verified", "claim boundary drifted");
assert(sha256(cutover) === contract.artifacts.runtime_cutover_sha256,
  "runtime cutover hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(contract.observed.before_correction_items === 2, "initial two-generation read drifted");
assert(contract.observed.after_correction_items === 0, "correction projection drifted");
assert(contract.observed.replacement_items === 1, "replacement projection drifted");
assert(contract.observed.final_reader_status === "erased", "erasure standing drifted");
assert(contract.observed.final_item_count === 0, "erasure returned current material");
assert(runner.includes("valid_custody_create_and_two_generation_read"),
  "valid create and read proof missing");
assert(runner.includes("both_generations_corrected_atomically_and_hidden"),
  "cross-generation correction proof missing");
assert(runner.includes("replacement_authority_material_became_current"),
  "replacement-authority proof missing");
assert(runner.includes("payload_and_dependencies_destroyed"),
  "destructive erasure proof missing");
assert(runner.includes("raw_revival_after_erasure"), "raw revival control missing");
assert(runner.includes("correction_definer_removed"), "correction mutation missing");
assert(note.includes("R33 tests the sequence a real service must survive"),
  "human lifecycle rationale missing");
assert(note.includes("does not prove multi-connection races"),
  "single-connection claim boundary missing");
assert(qa.includes("No concurrency, migration or runtime claim"), "QA boundary missing");

console.log("[g25-post-cutover-lifecycle-r33] PASS: final service boundary completes the valid lifecycle");
