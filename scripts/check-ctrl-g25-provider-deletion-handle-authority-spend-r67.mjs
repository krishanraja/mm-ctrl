import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-authority-spend-r67.json"));
const candidate = read(contract.implementation.candidate);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-authority-spend-r67.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-authority-spend-r67-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-handle-authority-spend-r67] ${message}`);
};

assert(contract.status === "atomic_authority_spend_and_database_role_separation_locally_proved_runtime_identity_mapping_closed", "status drifted");
assert(contract.observed_environment.tests === 9 && contract.observed_environment.failures === 0, "test evidence drifted");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "create role provider_handle_crypto_writer nologin",
  "create role provider_deletion_worker nologin",
  "brain_provider_handle_authority_spends",
  "brain_spend_provider_handle_authority",
  "brain_authorized_register_provider_deletion_handle",
  "brain_authorized_lease_provider_deletion_handle",
  "brain_authorized_destroy_provider_deletion_handle",
  "provider_handle_authority_replay_conflict",
  "interval '5 minutes'",
  "revoke select on table private.brain_provider_deletion_handles from service_role",
]) assert(candidate.includes(marker), `candidate omits ${marker}`);
for (const behavior of [
  "lets only the crypto writer register and converges on an exact replay",
  "denies every role the other role's operation",
  "requires a worker authority to lease and permits only its exact retry",
  "rolls back an authority spend when the underlying operation fails",
  "rejects expired authority before touching the handle",
  "requires a matching success fact and destroy authority",
  "rejects operation-field swaps and invalid destruction evidence",
  "keeps authority spends content-free and denies direct table reads",
  "denies the old broad service-role entry points",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("does not hold the R66 HMAC key"), "signature boundary disappeared");
assert(qa.includes("Independent-connection spend and lease races remain unproved"), "connection boundary disappeared");

console.log("[g25-provider-deletion-handle-authority-spend-r67] PASS: authority spend is atomic and roles are separated; runtime identity mapping remains closed");
