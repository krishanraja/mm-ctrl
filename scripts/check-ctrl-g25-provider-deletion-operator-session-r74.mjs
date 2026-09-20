import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-operator-session-r74.json"));
const candidate = read(contract.implementation.candidate);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-operator-session-r74.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-operator-session-r74-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-operator-session-r74] ${message}`);
};

assert(
  contract.status === "human_operator_recovery_scope_locally_proved_supabase_session_and_stable_custody_unproved",
  "status drifted",
);
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "caller_id := auth.uid()",
  "'is_anonymous'",
  "role_row.role = 'operator'",
  "role_row.revoked_at is null",
  "from public, anon, service_role",
  "to authenticated",
]) assert(candidate.includes(marker), `candidate omits ${marker}`);
for (const behavior of [
  "allows an active human operator to request recovery for their workspace",
  "rejects missing, anonymous and wrong-workspace human sessions",
  "removes machine-role and service-role operator recovery shortcuts",
  "revokes recovery authority immediately when the workspace role ends",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("interim executable authority"), "interim authority boundary disappeared");
assert(qa.includes("not yet joined to R23 stable operator identity"), "stable-custody gap disappeared");

console.log("[g25-provider-deletion-operator-session-r74] PASS: human recovery is workspace-scoped; hosted session and stable custody remain closed");
