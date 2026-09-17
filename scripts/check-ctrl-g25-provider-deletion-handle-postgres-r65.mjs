import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-postgres-r65.json"));
const candidate = read(contract.artifacts.candidate);
const test = read(contract.artifacts.test);
const config = read(contract.artifacts.node_test_config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-postgres-r65.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-postgres-r65-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-handle-postgres-r65] ${message}`);
};

assert(contract.status === "encrypted_handle_custody_postgres_verified_trusted_writer_required", "status drifted");
assert(contract.observed.tests === 7 && contract.observed.failures === 0, "test result drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(test) === contract.artifacts.test_sha256, "test hash drifted");
assert(sha256(config) === contract.artifacts.node_test_config_sha256, "test config hash drifted");
for (const marker of [
  "brain_register_provider_deletion_handle",
  "brain_lease_provider_deletion_handle",
  "brain_destroy_provider_deletion_handle",
  "provider_deletion_handle_exchange_not_accepted",
  "provider_deletion_handle_already_leased",
  "provider_deletion_handle_success_fact_required",
  "interval '35 days'",
  "lease_seconds > 300",
  "cipher_envelope = null",
  "force row level security",
]) {
  assert(candidate.toLowerCase().includes(marker), `candidate omits ${marker}`);
}
for (const behavior of [
  "requires an accepted exchange and exact provider coherence",
  "round-trips an R64 encrypted envelope through a bounded lease",
  "converges on registration replay and rejects changed ciphertext",
  "destroys an expired exchange handle without returning ciphertext",
  "requires a matching operational-success fact before destroying a leased handle",
  "keeps Stripe encrypted for account lifetime and destroys it only after closure proof",
  "denies service-role raw inserts",
]) {
  assert(test.includes(behavior), `test suite omits ${behavior}`);
}
assert(config.includes('environment: "node"'), "Node test environment disappeared");
assert(note.includes("cannot prove an envelope-shaped value was actually encrypted by R64"), "trusted-writer boundary disappeared");
assert(qa.includes("Independent-connection lease races remain unproved"), "concurrency boundary disappeared");

console.log("[g25-provider-deletion-handle-postgres-r65] PASS: encrypted-handle lifecycle works locally; trusted writer and runtime authority remain blocked");
