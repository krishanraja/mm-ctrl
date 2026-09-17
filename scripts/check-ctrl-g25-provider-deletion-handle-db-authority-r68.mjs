import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-db-authority-r68.json"));
const authority = read(contract.implementation.authority);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const candidate = read(contract.implementation.candidate);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-db-authority-r68.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-db-authority-r68-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-handle-db-authority-r68] ${message}`);
};

assert(contract.status === "compact_authority_locally_proved_supabase_verifier_static_only", "status drifted");
assert(contract.local_proof.tests === 12 && contract.local_proof.failures === 0, "local proof drifted");
assert(contract.supabase_candidate.execution_status === "not_executed", "candidate execution overstated");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "PROVIDER_HANDLE_DB_AUTHORITY_SCHEMA",
  "PROVIDER_HANDLE_ENVELOPE_FINGERPRINT_DOMAIN",
  "fingerprintProviderDeletionHandleEnvelope",
  "issueDatabaseVerifiableProviderHandleAuthority",
  "verifyDatabaseVerifiableProviderHandleAuthority",
]) assert(authority.includes(marker), `authority omits ${marker}`);
for (const behavior of [
  "issues and verifies one compact R66 authority",
  "contains neither ciphertext nor a raw provider handle",
  "produces a stable field fingerprint without serialisation ambiguity",
  "changes the fingerprint when any ciphertext field changes",
  "rejects extra envelope fields",
  "rejects tampering with compact token segment %s",
  "rejects a non-canonical signature encoding with identical decoded bytes",
  "rejects an unknown verification key",
  "retains R66 context and expiry checks",
  "supports key rotation while refusing a relabelled token",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
for (const marker of [
  "create extension if not exists pgcrypto with schema extensions",
  "vault.decrypted_secrets",
  "extensions.hmac",
  "extensions.digest",
  "brain_verify_provider_handle_db_authority",
  "brain_provider_deletion_handle_envelope_fingerprint_r68",
  "brain_verified_register_provider_deletion_handle",
  "brain_verified_lease_provider_deletion_handle",
  "brain_verified_destroy_provider_deletion_handle",
  "revoke all on function private.brain_authorized_register_provider_deletion_handle",
]) assert(candidate.includes(marker), `candidate omits ${marker}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("cannot be honestly described as executed"), "execution boundary disappeared");
assert(qa.includes("Secret-domain isolation between issuer, writer and worker is not yet proved"), "secret-isolation boundary disappeared");

console.log("[g25-provider-deletion-handle-db-authority-r68] PASS: compact authority is proved locally; Supabase verifier remains static-only");
