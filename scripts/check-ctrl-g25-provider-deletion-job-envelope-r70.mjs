import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-job-envelope-r70.json"));
const compiler = read(contract.implementation.compiler);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-job-envelope-r70.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-job-envelope-r70-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-job-envelope-r70] ${message}`);
};

assert(contract.status === "content_free_cross_cell_dispatch_locally_proved_queue_unproved", "status drifted");
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "PROVIDER_DELETION_JOB_SCHEMA",
  "targetForOperation",
  "topology_fingerprint_mismatch",
  "dispatch_target_mismatch",
  "dispatch_exceeds_authority",
  "dispatch_predecessor_invalid",
  "MAX_JOB_LIFETIME_MS",
]) assert(compiler.includes(marker), `compiler omits ${marker}`);
for (const behavior of [
  "compiles one content-free deletion-worker dispatch",
  "derives crypto-writer routing from a register authority",
  "rejects a caller-selected destination that disagrees with the authority",
  "rejects a stale topology fingerprint",
  "rejects a dispatch that starts before its authority",
  "rejects a dispatch that outlives its authority",
  "rejects invalid attempt %s",
  "requires a predecessor only after the first attempt",
  "accepts a bounded retry linked to a different predecessor",
  "rejects a tampered authority token before routing",
  "rejects cross-job authority reuse",
  "rejects unexpected envelope fields",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("This is not yet a queue protocol"), "transport boundary disappeared");
assert(qa.includes("future worker must reverify authority at the database boundary"), "database-verification boundary disappeared");

console.log("[g25-provider-deletion-job-envelope-r70] PASS: cross-cell dispatch is content-free and authority-bound; transport remains closed");
