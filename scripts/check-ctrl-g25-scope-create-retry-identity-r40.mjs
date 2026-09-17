import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-scope-create-retry-identity-r40.json",
));
const candidate = read(contract.artifacts.r38_candidate);
const runner = read(contract.artifacts.r38_runner);
const note = read("project-documentation/ctrl-evolution/g25-scope-create-retry-identity-r40.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-scope-create-retry-identity-r40] ${message}`);
};

assert(contract.status === "creation_retry_identity_defect_corrected", "status drifted");
assert(sha256(candidate) === contract.artifacts.r38_candidate_sha256, "R38 candidate drifted");
assert(sha256(runner) === contract.artifacts.r38_runner_sha256, "R38 runner drifted");
assert(candidate.includes("if existing.request_sha256 = request_sha256 then"),
  "request-identity convergence missing");
assert(!candidate.includes("if existing.id = creation_id and existing.request_sha256"),
  "transport identity still controls replay");
assert(runner.includes("fresh_transport_identity_converged"), "fresh-ID regression missing");
assert(runner.includes("conflicting_creation_for_consumed_consent"),
  "conflicting-request negative case missing");
assert(note.includes("database committed but the HTTP response was lost"),
  "recovery rationale missing");

console.log("[g25-scope-create-retry-identity-r40] PASS: creation retries converge on accepted request");
