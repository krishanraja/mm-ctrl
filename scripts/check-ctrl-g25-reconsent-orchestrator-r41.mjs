import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-reconsent-orchestrator-r41.json",
));
const moduleSource = read(contract.artifacts.module);
const testSource = read(contract.artifacts.test);
const note = read("project-documentation/ctrl-evolution/g25-reconsent-orchestrator-r41.md");
const qa = read("project-documentation/ctrl-evolution/g25-reconsent-orchestrator-r41-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-reconsent-orchestrator-r41] ${message}`);
};

assert(contract.status === "dormant_restart_composition_verified", "status drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(moduleSource.includes("await handleSubjectReconsent"), "reservation does not precede creation");
assert(moduleSource.includes("reconsent_reserved_pending_creation"),
  "recoverable middle state missing");
assert(moduleSource.includes("prepared-reconsent-scope-create-r41"),
  "stable creation request identity missing");
assert(moduleSource.includes("scope_creation_contract_invalid"),
  "downstream identity guard missing");
assert(testSource.includes("later attempt converges after a lost response"),
  "lost-response recovery test missing");
assert(note.includes("No Edge Function entrypoint imports it"), "dormant boundary missing");
assert(qa.includes("No live endpoint, database wiring, migration or production claim"),
  "QA claim boundary missing");

console.log("[g25-reconsent-orchestrator-r41] PASS: restart composition preserves truth across partial failure");
