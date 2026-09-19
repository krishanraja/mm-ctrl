import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-prepared-research-operation-r54.json"));
const moduleSource = read(contract.artifacts.module);
const testSource = read(contract.artifacts.test);
const note = read("project-documentation/ctrl-evolution/g25-prepared-research-operation-r54.md");
const qa = read("project-documentation/ctrl-evolution/g25-prepared-research-operation-r54-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-prepared-research-operation-r54] ${message}`);
};

assert(contract.status === "dormant_research_operation_composed", "status drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(moduleSource.includes("await admitPublicResearchQuery"), "public admission composition disappeared");
assert(moduleSource.includes('standing: "receipt_required_before_dispatch"'),
  "receipt-before-dispatch standing disappeared");
assert(moduleSource.includes("execute_authorized: false"), "dispatch denial disappeared");
assert(moduleSource.includes("query_minimization_sha256: isFixed ? null"),
  "fixed-fetch minimisation mapping drifted");
assert(!/\bfetch\s*\(/.test(moduleSource), "provider or network fetch entered composer");
assert(testSource.includes("preserves exact operation identity independently"),
  "operation versus payload identity test disappeared");
assert(note.includes("audit trail being manufactured afterwards"), "ordering rationale disappeared");
assert(qa.includes("does not persist the receipt or call a provider"), "dormant boundary disappeared");

console.log("[g25-prepared-research-operation-r54] PASS: research is prepared behind a receipt-before-dispatch boundary");
