import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-runtime-topology-r69.json"));
const compiler = read(contract.implementation.compiler);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-runtime-topology-r69.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-runtime-topology-r69-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-runtime-topology-r69] ${message}`);
};

assert(contract.status === "three_cell_secret_isolation_contract_locally_proved_deployment_unproved", "status drifted");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "authority_issuer",
  "crypto_writer",
  "deletion_worker",
  "deployment_boundary_not_isolated",
  "secret_domain_not_isolated",
  "secret_reference_reused_across_cells",
  "generic_privileged_credential_forbidden",
  "SUPABASE_SERVICE_ROLE_KEY",
]) assert(compiler.includes(marker), `compiler omits ${marker}`);
for (const behavior of [
  "accepts three isolated least-privilege runtime cells",
  "is stable when cells and operations arrive in another order",
  "rejects a shared deployment boundary",
  "rejects a shared secret domain",
  "rejects reusing one secret reference across cells",
  "rejects generic privileged credential %s",
  "rejects giving the signing key to a worker",
  "rejects giving decryption to the writer",
  "rejects giving provider deletion credentials to the issuer",
  "rejects operation escalation in any cell",
  "rejects unexpected manifest fields",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("three database roles are theatre"), "secret-boundary rationale disappeared");
assert(qa.includes("Cross-cell queues, job authentication, acknowledgement and replay behavior are unspecified"), "transport boundary disappeared");

console.log("[g25-provider-deletion-runtime-topology-r69] PASS: secret and operation boundaries compile locally; deployment remains unproved");
