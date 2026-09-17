import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-persistence-authority-r72.json"));
const compiler = read(contract.implementation.compiler);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-persistence-authority-r72.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-persistence-authority-r72-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-persistence-authority-r72] ${message}`);
};

assert(contract.status === "narrow_persistence_authority_overlay_locally_proved_provisioning_unproved", "status drifted");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "record_dispatch",
  "append_issuer_event",
  "verified_register_handle",
  "verified_lease_handle",
  "verified_destroy_handle",
  "append_target_event",
  "append_operator_recovery_event",
  "generic_privileged_credential_forbidden",
]) assert(compiler.includes(marker), `compiler omits ${marker}`);
for (const behavior of [
  "accepts a narrow persistence overlay without widening custody",
  "is stable across grant and function ordering",
  "rejects giving the issuer custody functions",
  "rejects giving a machine credential to the operator",
  "rejects a generic service credential",
  "rejects credential reuse between issuer and worker",
  "requires writer and worker credentials to match their R69 cells",
  "rejects a stale topology fingerprint",
  "rejects duplicate principals",
  "rejects unexpected grant fields",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("would undo every least-privilege decision"), "contradiction rationale disappeared");
assert(qa.includes("must not use `service_role` as a shortcut"), "service-role boundary disappeared");

console.log("[g25-provider-deletion-persistence-authority-r72] PASS: persistence powers are narrow and topology-bound; provisioning remains closed");
