import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-closure-postgres-r63.json"));
const candidate = read(contract.artifacts.candidate);
const test = read(contract.artifacts.test);
const config = read(contract.artifacts.node_test_config);
const note = read("project-documentation/ctrl-evolution/g25-provider-closure-postgres-r63.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-closure-postgres-r63-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-closure-postgres-r63] ${message}`);
};

assert(contract.status === "append_only_provider_closure_facts_postgres_verified", "status drifted");
assert(contract.observed.tests === 7 && contract.observed.failures === 0, "test result drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(test) === contract.artifacts.test_sha256, "test hash drifted");
assert(sha256(config) === contract.artifacts.node_test_config_sha256, "test config hash drifted");
for (const marker of [
  "brain_provider_closure_facts",
  "brain_append_provider_closure_fact",
  "provider_closure_fact_exchange_not_accepted",
  "provider_closure_fact_recovery_without_failure",
  "provider_closure_fact_payload_disposition_conflict",
  "provider_closure_fact_operation_identity_conflict",
  "for update",
  "force row level security",
]) {
  assert(candidate.toLowerCase().includes(marker), `candidate omits ${marker}`);
}
for (const forbiddenColumn of ["prompt", "content", "email", "provider_request_id", "recipient", "deletion_handle"]) {
  const createTable = candidate.match(/create table private\.brain_provider_closure_facts \(([\s\S]*?)\n\);/i)?.[1] ?? "";
  assert(!new RegExp(`^\\s*${forbiddenColumn}\\s`, "mi").test(createTable), `forbidden column present: ${forbiddenColumn}`);
}
for (const behavior of [
  "refuses closure evidence before the provider accepted the exchange",
  "persists Stripe operational deletion and regulated residual retention together",
  "persists Resend expiry separately from the external recipient copy",
  "requires failure evidence before recovery and preserves both facts",
  "rejects contradictory payload disposition and failure after deletion success",
  "converges on exact replay and rejects changed operation evidence",
  "denies service-role raw inserts while allowing content-free readback",
]) {
  assert(test.includes(behavior), `test suite omits ${behavior}`);
}
assert(config.includes('environment: "node"'), "Node test environment disappeared");
assert(note.includes("native V8/Wasm teardown fault"), "test-host limitation disappeared");
assert(qa.includes("Independent-connection races remain unproved"), "concurrency boundary disappeared");

console.log("[g25-provider-closure-postgres-r63] PASS: append-only compound provider facts agree with local PostgreSQL");
