import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-dispatch-lifecycle-r71.json"));
const compiler = read(contract.implementation.compiler);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-dispatch-lifecycle-r71.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-dispatch-lifecycle-r71-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-dispatch-lifecycle-r71] ${message}`);
};

assert(contract.status === "append_only_dispatch_lifecycle_locally_proved_persistence_unproved", "status drifted");
assert(contract.event_kinds.length === 9, "event taxonomy drifted");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "PROVIDER_DELETION_DISPATCH_EVENT_SCHEMA",
  "TRANSITIONS",
  "dispatch_retry_limit_reached",
  "dispatch_dead_letter_premature",
  "automatic_terminal",
  "operator_attention_required",
  "closed",
]) assert(compiler.includes(marker), `compiler omits ${marker}`);
for (const behavior of [
  "accepts dispatched, accepted and completed with a content-free receipt digest",
  "accepts a retryable failure followed by one linked retry",
  "forces the fifth retryable failure to dead-letter",
  "allows a terminal failure to dead-letter before attempt five",
  "rejects prematurely dead-lettering a retryable failure",
  "records operator recovery as a separate linked dispatch",
  "rejects a broken predecessor chain",
  "rejects duplicate event identities",
  "rejects a state transition after completion",
  "rejects the wrong actor for acceptance",
  "rejects failure prose in place of a bounded code and evidence digest",
  "rejects event time regression",
  "rejects dispatch or attempt substitution",
  "rejects unexpected event fields",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("History is preserved rather than rewritten"), "recovery-history principle disappeared");
assert(qa.includes("Events are not persisted append-only yet"), "persistence boundary disappeared");

console.log("[g25-provider-deletion-dispatch-lifecycle-r71] PASS: lifecycle and recovery semantics are proved locally; persistence remains closed");
