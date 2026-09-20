import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-erasure-tombstone-policy-r35.json",
));
const r10 = read("supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql");
const r25 = read("supabase/candidates/g25_prepared_custody_atomic_store_r25.sql");
const r30 = read(contract.artifacts.r30_candidate);
const r31 = read(contract.artifacts.r31_candidate);
const note = read("project-documentation/ctrl-evolution/g25-erasure-tombstone-policy-r35.md");
const qa = read("project-documentation/ctrl-evolution/g25-erasure-tombstone-policy-r35-qa-record.md");
const checker = read(contract.artifacts.checker);

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-erasure-tombstone-policy-r35] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const tombstoneDefinition = r30.match(
  /create table public\.brain_prepared_custody_subject_erasure_tombstones \([\s\S]*?\n\);/,
)?.[0] ?? "";

assert(contract.status === "provisional_pre_migration_policy_verified", "policy status drifted");
assert(sha256(r30) === contract.artifacts.r30_candidate_sha256, "R30 hash drifted");
assert(sha256(r31) === contract.artifacts.r31_candidate_sha256, "R31 hash drifted");
assert(sha256(checker) === contract.artifacts.checker_sha256, "checker hash drifted");
assert(tombstoneDefinition.length > 0, "tombstone definition missing");
assert(!tombstoneDefinition.includes("expires_at"), "scope tombstone gained calendar expiry");
assert(tombstoneDefinition.includes("unique (workspace_id, subject_id)"),
  "one-erasure-per-scope invariant missing");
assert(tombstoneDefinition.match(/brain_workspaces\(id\) on delete cascade/),
  "workspace closure does not remove tombstone");
assert(tombstoneDefinition.match(/brain_custody_principals\(id\) on delete cascade/),
  "custody closure does not remove tombstone");
assert(tombstoneDefinition.match(/brain_subject_principals\(id\) on delete restrict/),
  "subject identity could disappear ahead of scope closure");
assert(r10.includes("if private.brain_prepared_subject_erased(workspace_id, subject_id)"),
  "legacy writer anti-revival seam missing");
assert(r25.includes("if private.brain_prepared_subject_erased(workspace_id, subject_id)"),
  "custody writer anti-revival seam missing");
assert(r31.includes("'status', 'erased'") && r31.includes("'item_count', 0"),
  "reader no longer preserves explicit erased standing");
assert(r30.includes("revoke all on table public.brain_prepared_custody_subject_erasure_tombstones\n  from public, anon, authenticated, service_role;"),
  "tombstone broad-access closure missing");
assert(r30.includes("grant select on table public.brain_prepared_custody_subject_erasure_tombstones to service_role;"),
  "service read-only tombstone grant missing");
assert(!r30.match(/grant (insert|update|delete).*brain_prepared_custody_subject_erasure_tombstones to service_role/),
  "service role gained raw tombstone mutation");
assert(note.includes("Erasure is irreversible inside the erased scope"),
  "irreversible-scope rule missing");
assert(note.includes("new explicit subject-consent receipt"), "reconsent gate missing");
assert(note.includes("not legal advice"), "legal claim boundary missing");
assert(qa.includes("No legal or runtime claim"), "QA boundary missing");

console.log("[g25-erasure-tombstone-policy-r35] PASS: erased scope stays erased; reconsent requires a new scope");
