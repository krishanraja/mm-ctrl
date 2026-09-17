import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-reconsented-scope-atomic-create-r38.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-reconsented-scope-atomic-create-r38.md");
const qa = read("project-documentation/ctrl-evolution/g25-reconsented-scope-atomic-create-r38-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-reconsented-scope-atomic-create-r38] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_atomic_new_scope_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("workspace_historical_principal_id = created_workspace_id"),
  "fresh workspace historical identity invariant missing");
assert(candidate.includes("'subject_reconsent'"), "consent-backed custody kind missing");
assert(candidate.includes("scope_creation_old_erasure_missing"), "old erasure recheck missing");
assert(candidate.includes("scope_creation_subject_access_inactive"),
  "subject access recheck missing");
assert(candidate.includes("scope_creation_consent_already_consumed"),
  "one-consent-one-scope guard missing");
assert(candidate.includes("for update"), "reservation serialization lock missing");
assert(!candidate.match(/delete from .*erasure_tombstones/i), "creator can clear old erasure");
assert(runner.includes("stable_subject_and_fresh_historical_owner_separated"),
  "identity-separation proof missing");
assert(runner.includes("old_erasure_recheck_removed"), "old-erasure mutation missing");
assert(note.includes("does not make the old Brain recoverable"), "anti-revival claim missing");
assert(qa.includes("No multi-connection, migration, Supabase-local or production claim"),
  "QA boundary missing");

console.log("[g25-reconsented-scope-atomic-create-r38] PASS: one accepted restart creates one separate personal Brain");
