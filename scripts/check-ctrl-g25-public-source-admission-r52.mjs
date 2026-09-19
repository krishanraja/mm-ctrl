import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-public-source-admission-r52.json",
));
const moduleSource = read(contract.artifacts.module);
const testSource = read(contract.artifacts.test);
const note = read("project-documentation/ctrl-evolution/g25-public-source-admission-r52.md");
const qa = read("project-documentation/ctrl-evolution/g25-public-source-admission-r52-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-public-source-admission-r52] ${message}`);
};

assert(contract.status === "dormant_public_source_admission_verified", "status drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(moduleSource.includes("verified_public_route"), "public-route attestation disappeared");
assert(moduleSource.includes("MAX_SOURCE_BYTES = 131_072"), "source size bound drifted");
assert(moduleSource.includes("MAX_SOURCE_AGE_MS = 5 * 60 * 1000"), "freshness bound drifted");
assert(moduleSource.includes("public_source_query_not_evidenced"), "evidence membership gate disappeared");
assert(!moduleSource.includes("fetch("), "live fetch implementation entered pure admission module");
assert(testSource.includes("rejects an unsafe redirect target"), "redirect negative control disappeared");
assert(note.includes("no live-web or SSRF-resistance claim"), "transport claim boundary disappeared");
assert(qa.includes("does not establish that a public claim is true"), "truth boundary disappeared");

console.log("[g25-public-source-admission-r52] PASS: query atoms require bounded public evidence before preparation");
