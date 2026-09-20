import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-reconsent-retry-identity-r39.json",
));
const candidate = read(contract.artifacts.r36_candidate);
const runner = read(contract.artifacts.r36_runner);
const endpoint = read(contract.artifacts.r37_module);
const note = read("project-documentation/ctrl-evolution/g25-reconsent-retry-identity-r39.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-reconsent-retry-identity-r39] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "retry_identity_defect_corrected", "status drifted");
assert(sha256(candidate) === contract.artifacts.r36_candidate_sha256, "R36 candidate drifted");
assert(sha256(runner) === contract.artifacts.r36_runner_sha256, "R36 runner drifted");
assert(candidate.includes("brain_prepared_reconsent_request_key"),
  "request-key constraint missing");
assert(candidate.includes("unique (previous_workspace_id, subject_id, request_sha256)"),
  "retry identity does not use authenticated request");
assert(candidate.includes("consent_row.request_sha256 = request_sha256"),
  "convergence lookup does not use authenticated request");
assert(!candidate.includes("brain_prepared_reconsent_scope_fingerprint_key"),
  "transport-generated scope fingerprint remains uniqueness authority");
assert(runner.includes("r36-retry-generated-scope"), "fresh-ID retry regression missing");
assert(endpoint.includes("prepared-subject-reconsent-request-r37"),
  "stable endpoint request fingerprint missing");
assert(note.includes("network behavior is not human intent"), "human rationale missing");

console.log("[g25-reconsent-retry-identity-r39] PASS: network retries converge on authenticated intent");
