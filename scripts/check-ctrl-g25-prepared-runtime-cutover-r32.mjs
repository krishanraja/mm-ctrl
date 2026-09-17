import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-prepared-runtime-cutover-r32.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-prepared-runtime-cutover-r32.md");
const qa = read("project-documentation/ctrl-evolution/g25-prepared-runtime-cutover-r32-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-prepared-runtime-cutover-r32] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_runtime_privilege_cutover_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.match(/security definer;/g)?.length === 2,
  "new definer boundaries are incomplete");
assert(candidate.includes("revoke execute on function private.brain_store_prepared_receipt"),
  "legacy create remains open");
assert(candidate.includes("revoke execute on function private.brain_invalidate_prepared_receipts"),
  "legacy correction remains open");
assert(candidate.includes("revoke execute on function private.brain_erase_prepared_subject"),
  "legacy erasure remains open");
assert(candidate.match(/revoke insert on table public\.brain_prepared/g)?.length === 8,
  "raw insert closure incomplete");
assert(candidate.match(/revoke update \(/g)?.length === 4,
  "lifecycle update closure incomplete");
assert(candidate.includes("brain_read_current_prepared_intelligence"),
  "unified reader grant missing");
assert(runner.includes("legacy_create_revoke_removed"), "legacy-create mutation missing");
assert(runner.includes("both_generation_correction_definer_removed"),
  "cross-generation correction mutation missing");
assert(runner.includes("custody_raw_insert_reopened"), "raw custody mutation missing");
assert(note.includes("wrong path unavailable, not merely unfashionable"),
  "human trust rationale missing");
assert(note.includes("not yet proof of valid end-to-end operations"),
  "bounded cutover claim missing");
assert(qa.includes("No migration or runtime claim"), "QA boundary missing");

console.log("[g25-prepared-runtime-cutover-r32] PASS: only custody and both-generation runtime capabilities remain open");
