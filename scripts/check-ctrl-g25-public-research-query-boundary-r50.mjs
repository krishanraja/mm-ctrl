import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-public-research-query-boundary-r50.json",
));
const moduleSource = read(contract.artifacts.module);
const testSource = read(contract.artifacts.test);
const note = read("project-documentation/ctrl-evolution/g25-public-research-query-boundary-r50.md");
const qa = read("project-documentation/ctrl-evolution/g25-public-research-query-boundary-r50-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-public-research-query-boundary-r50] ${message}`);
};

assert(contract.status === "dormant_typed_public_query_boundary_verified", "status drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(moduleSource.includes("public_research_query_shape_invalid"), "exact-shape gate disappeared");
assert(moduleSource.includes("fixed_public_fetch"), "fixed public route disappeared");
assert(moduleSource.includes("public_topic_terms"), "bounded topic route disappeared");
assert(moduleSource.includes("value.terms.length < 2 || value.terms.length > 10"),
  "topic bound drifted");
assert(!moduleSource.includes("interview_answer"), "private source field appeared in module");
assert(testSource.includes("rejects private-source fields instead of silently dropping them"),
  "private-field negative control disappeared");
assert(note.includes("construction beats redaction"), "design rationale disappeared");
assert(qa.includes("not independently resolved"), "public-source proof limit disappeared");

console.log("[g25-public-research-query-boundary-r50] PASS: research requests are constructed from bounded public atoms");
