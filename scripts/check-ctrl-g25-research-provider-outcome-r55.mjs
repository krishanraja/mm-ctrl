import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-research-provider-outcome-r55.json"));
const moduleSource = read(contract.artifacts.module);
const testSource = read(contract.artifacts.test);
const note = read("project-documentation/ctrl-evolution/g25-research-provider-outcome-r55.md");
const qa = read("project-documentation/ctrl-evolution/g25-research-provider-outcome-r55-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-research-provider-outcome-r55] ${message}`);
};

assert(contract.status === "dormant_research_outcome_classifier_verified", "status drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(moduleSource.includes('"accepted" | "rejected" | "outcome_unknown"'),
  "honest initial outcomes drifted");
assert(moduleSource.includes("hmacProviderRequestIdentity"), "provider identity HMAC disappeared");
assert(moduleSource.includes("research_outcome_request_control_evidence_required"),
  "per-request control proof disappeared");
assert(!moduleSource.includes("response_body"), "raw response field entered classifier");
assert(testSource.includes('not.toContain("req_abc-123")'), "raw provider ID negative control disappeared");
assert(note.includes("does not invent traceability"), "null-identity rationale disappeared");
assert(qa.includes("trusts a caller-supplied response digest"), "transport residual disappeared");

console.log("[g25-research-provider-outcome-r55] PASS: initial provider outcomes become digest-only R51 events");
