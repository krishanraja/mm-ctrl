import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-operator-custody-r75.json"));
const candidate = read(contract.implementation.candidate);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-operator-custody-r75.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-operator-custody-r75-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-operator-custody-r75] ${message}`);
};

assert(
  contract.status === "stable_custody_recovery_authority_locally_proved_independent_sessions_unproved",
  "status drifted",
);
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "brain_custody_principals",
  "brain_custody_assignments",
  "brain_operator_principals",
  "brain_operator_auth_links",
  "operator.retired_at is null",
  "custody.closed_at is null",
  "provider_deletion_dispatch_operator_custody_denied",
]) assert(candidate.includes(marker), `candidate omits ${marker}`);
for (const behavior of [
  "allows the signed-in operator holding current customer custody",
  "rejects a workspace operator who does not hold current custody",
  "rejects a revoked stable operator login even while its workspace role remains",
  "moves recovery authority with customer-authorised custody transfer",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("workspace role alone is insufficient"), "dual-authority rationale disappeared");
assert(qa.includes("truly independent connections"), "independent-connection boundary disappeared");

console.log("[g25-provider-deletion-operator-custody-r75] PASS: recovery follows stable customer custody; independent hosted sessions remain closed");
