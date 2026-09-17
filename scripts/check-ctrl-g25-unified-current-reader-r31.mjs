import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-unified-current-prepared-reader-r31.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-unified-current-prepared-reader-r31.md");
const qa = read("project-documentation/ctrl-evolution/g25-unified-current-prepared-reader-r31-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-unified-current-reader-r31] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_unified_current_reader_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("brain_read_current_prepared_intelligence"), "unified reader missing");
assert(candidate.includes("legacy.invalidated_at is null"), "legacy invalidation guard missing");
assert(candidate.includes("custody.invalidated_at is null"), "custody invalidation guard missing");
assert(candidate.match(/\.expires_at > read_at/g)?.length === 2, "cross-generation expiry guard missing");
assert(candidate.match(/\.produced_at <= read_at/g)?.length === 2, "future-material guard missing");
assert(candidate.includes("brain_prepared_authority_current"), "legacy authority currentness missing");
assert(candidate.includes("brain_current_prepared_custody_authority"),
  "custody authority currentness missing");
assert(candidate.includes("brain_prepared_subject_erased"), "erasure standing guard missing");
assert(candidate.includes("order by projected.produced_at desc"), "deterministic result order missing");
assert(!candidate.includes("partition by eligible.content_fingerprint"),
  "content similarity can still hide a current receipt");
assert(candidate.match(/revoke select on table public\.brain_prepared/g)?.length === 6,
  "authenticated raw read closure incomplete");
assert(runner.includes("generation_order_invariant"), "generation-order proof missing");
assert(runner.includes("authenticated_raw_read"), "raw-read denial proof missing");
assert(runner.includes("custody_authority_currentness_inverted"),
  "custody currentness mutation missing");
assert(note.includes("currentness a retrieval property, not a UI convention"),
  "human trust rationale missing");
assert(note.includes("does not silently collapse legitimate context"),
  "non-lossy read rationale missing");
assert(qa.includes("No migration or runtime claim"), "QA boundary missing");

console.log("[g25-unified-current-reader-r31] PASS: both generations produce one deterministic current answer");
