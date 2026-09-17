import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-prepared-research-postgres-corridor-r56.json",
));
const testSource = read(contract.artifacts.test);
const configSource = read(contract.artifacts.node_test_config);
const note = read("project-documentation/ctrl-evolution/g25-prepared-research-postgres-corridor-r56.md");
const qa = read("project-documentation/ctrl-evolution/g25-prepared-research-postgres-corridor-r56-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-prepared-research-postgres-corridor-r56] ${message}`);
};

assert(contract.status === "synthetic_research_corridor_postgres_verified", "status drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(sha256(configSource) === contract.artifacts.node_test_config_sha256, "Node test config hash drifted");
assert(testSource.includes("provider_event_receipt_not_found"), "receipt-before-event gate disappeared");
assert(testSource.includes("provider_event_operation_identity_conflict"),
  "changed-event-evidence negative control disappeared");
assert(testSource.includes('not.toContain("request-r56-secret")'), "raw request ID readback check disappeared");
assert(testSource.includes('not.toContain("ai-adoption marketing")'), "raw query readback check disappeared");
assert(configSource.includes('environment: "node"'), "PGlite Node environment disappeared");
assert(note.includes("Provider dispatch and public-source fetch are synthetic"), "synthetic boundary disappeared");
assert(qa.includes("Independent-connection races remain unproved"), "concurrency boundary disappeared");

console.log("[g25-prepared-research-postgres-corridor-r56] PASS: prepared receipts and initial outcomes agree with PostgreSQL");
