import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-provider-exchange-retry-identity-r51.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-provider-exchange-retry-identity-r51.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-exchange-retry-identity-r51-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-exchange-retry-identity-r51] ${message}`);
};

assert(contract.status === "r49_operation_identity_defect_corrected", "status drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("idempotency_key_sha256"), "operation identity disappeared");
assert(candidate.includes("provider_exchange_operation_identity_conflict"),
  "changed exchange retry no longer fails closed");
assert(candidate.includes("provider_event_operation_identity_conflict"),
  "changed event retry no longer fails closed");
assert(candidate.includes("provider_exchange_r51_requires_empty_r49_registry"),
  "unsafe overlay guard disappeared");
assert(note.includes("request digest identifies the outbound payload"), "identity separation disappeared");
assert(qa.includes("Independent-connection"), "concurrency claim boundary disappeared");

const output = execFileSync(
  process.execPath,
  [resolve(root, contract.artifacts.runner)],
  { cwd: root, encoding: "utf8" },
);
const observed = JSON.parse(output);
assert(observed.status === "retry_identity_corrected", "retry identity did not verify");
assert(observed.checks.length === contract.observed.checks, "check count drifted");

console.log("[g25-provider-exchange-retry-identity-r51] PASS: operation retry identity is distinct from payload identity");
