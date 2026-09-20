import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-authority-r66.json"));
const authority = read(contract.implementation.authority);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-authority-r66.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-authority-r66-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-handle-authority-r66] ${message}`);
};

assert(contract.status === "operation_scoped_authority_locally_proved_durable_spend_and_database_enforcement_closed", "status drifted");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "provider_handle_crypto_writer",
  "provider_deletion_worker",
  "cipher_envelope_sha256",
  "lease_seconds",
  "destruction_reason",
  "success_fact_id",
  "MAX_AUTHORITY_LIFETIME_MS",
  "authority_payload_malformed",
  "authority_signature_invalid",
]) assert(authority.includes(marker), `authority omits ${marker}`);
for (const forbidden of ["createClient", "supabase.from(", "fetch(", "Deno.env", "process.env", "provider_handle:"]) {
  assert(!authority.includes(forbidden), `authority contains forbidden primitive: ${forbidden}`);
}
for (const behavior of [
  "accepts one exact crypto-writer registration capability",
  "contains no raw provider handle or ciphertext",
  "refuses an injected raw handle instead of signing it",
  "holds a registration when its envelope digest is substituted",
  "maps lease and destroy only to the deletion-worker role",
  "rejects authority and lease lifetimes beyond five minutes",
  "holds capabilities before issue time and at expiry",
  "holds a capability moved across %s context",
  "requires provider-specific destruction evidence",
  "rejects tampering with the derived role",
  "fails closed when the signing key is unavailable",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("does not yet make PostgreSQL verify that signature"), "database-enforcement boundary disappeared");
assert(qa.includes("Independent-connection lease races remain unproved"), "concurrency boundary disappeared");

console.log("[g25-provider-deletion-handle-authority-r66] PASS: writer and worker powers are separated; durable spend and database enforcement remain closed");
