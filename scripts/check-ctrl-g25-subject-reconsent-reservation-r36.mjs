import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-subject-reconsent-reservation-r36.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-subject-reconsent-reservation-r36.md");
const qa = read("project-documentation/ctrl-evolution/g25-subject-reconsent-reservation-r36-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-subject-reconsent-reservation-r36] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_subject_reconsent_reservation_verified",
  "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("scope_status', 'reserved_not_created'"),
  "reservation began claiming scope creation");
assert(candidate.includes("reconsent_previous_scope_not_erased"),
  "old-scope erasure gate missing");
assert(candidate.includes("reconsent_subject_auth_link_invalid"),
  "subject login-history gate missing");
assert(candidate.includes("unique (previous_workspace_id, subject_id, request_sha256)"),
  "authenticated-request retry identity missing");
assert(candidate.includes("reserved_workspace_id <> previous_workspace_id"),
  "new-scope identity invariant missing");
assert(candidate.includes("force row level security"), "forced RLS missing");
assert(candidate.includes("from public, anon, authenticated, service_role"),
  "broad table-access closure missing");
assert(!candidate.match(/grant (insert|update|delete).*brain_prepared_reconsent_reservations to service_role/),
  "service role gained raw reservation mutation");
assert(runner.includes("equivalent_consent_converged"), "semantic convergence proof missing");
assert(runner.includes("r36-retry-generated-scope"), "fresh transport identity retry missing");
assert(runner.includes("subject_auth_link_requirement_removed"), "subject-link mutation missing");
assert(runner.includes("raw_service_insert_reopened"), "raw-write mutation missing");
assert(note.includes("does not prove the person performed the consent action"),
  "human-action claim boundary missing");
assert(note.includes("does not create the new Brain scope"), "scope-creation boundary missing");
assert(qa.includes("No authenticated-endpoint, new-scope, concurrency, migration or runtime claim"),
  "QA boundary missing");

console.log("[g25-subject-reconsent-reservation-r36] PASS: erased scope stays closed while a distinct restart is reserved");
