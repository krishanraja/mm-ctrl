import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-route-matrix-r53.json"));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-provider-route-matrix-r53.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-route-matrix-r53-qa-record.md");
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-route-matrix-r53] ${message}`);
};

assert(contract.status === "dormant_provider_route_matrix_verified", "status drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("brain_provider_exchanges_route_matrix_r53_check"), "route matrix disappeared");
assert(candidate.includes("brain_provider_exchanges_research_control_r53_check"),
  "research control matrix disappeared");
assert(candidate.includes("provider not in ('artificial_analysis', 'fixed_rss_publishers')"),
  "fixed versus customer-query split disappeared");
assert(note.includes("record as a whole was false"), "semantic rationale disappeared");
assert(qa.includes("not actual provider account configuration"), "provider-config claim boundary disappeared");

const output = execFileSync(process.execPath, [resolve(root, contract.artifacts.runner)], {
  cwd: root,
  encoding: "utf8",
});
const observed = JSON.parse(output);
assert(observed.status === "provider_route_matrix_verified", "route matrix did not verify");
assert(observed.checks.length === contract.observed.checks, "check count drifted");

console.log("[g25-provider-route-matrix-r53] PASS: provider receipts cannot claim impossible route combinations");
