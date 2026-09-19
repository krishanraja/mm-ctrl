import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-non-fk-erasure-review-plan-r59.json"));
const compiler = read(contract.implementation.compiler);
const tests = read(contract.implementation.tests);
const note = read("project-documentation/ctrl-evolution/g25-non-fk-erasure-review-plan-r59.md");
const qa = read("project-documentation/ctrl-evolution/g25-non-fk-erasure-review-plan-r59-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-non-fk-erasure-review-plan-r59] ${message}`);
};

assert(contract.status === "zero_write_review_plan_proved_execution_held", "status drifted");
assert(contract.current_result.discovered_targets === 36, "discovered count drifted");
assert(contract.current_result.dispositioned_targets === 36, "disposition count drifted");
assert(contract.current_result.draft_targets === 18, "draft count drifted");
assert(contract.current_result.blocked_targets === 18, "blocker count drifted");

for (const marker of [
  "registry_discovery_coverage_mismatch",
  "duplicate_discovered_target",
  "duplicate_registry_target",
  "blocked_action_marked_draft",
  "non_fk_execution_not_authorized",
  "registry_contains_blocking_targets",
  "execution_authority: \"none\"",
  "no_independent_selector",
]) {
  assert(compiler.includes(marker), `compiler omits ${marker}`);
}

for (const forbidden of ["createClient", ".from(", "fetch(", "Deno.env", "process.env", "DELETE FROM", "UPDATE "]) {
  assert(!compiler.includes(forbidden), `compiler contains forbidden execution primitive: ${forbidden}`);
}

for (const behavior of [
  "dispositions every current high-risk anchor but keeps execution held",
  "rejects missing, stale and duplicate coverage",
  "keeps phone subordinate to an already-authorized parent row",
  "never emits draft work for shared-record or retained-audit blockers",
  "rejects a blocking action disguised as draft-eligible",
  "contains abstract selectors only and never receives personal values",
]) {
  assert(tests.includes(behavior), `test suite omits ${behavior}`);
}

assert(note.includes("18 draft steps and 18 blockers"), "result summary disappeared");
assert(qa.includes("Static checks reject database, fetch and environment access"), "zero-write QA boundary disappeared");

console.log("[g25-non-fk-erasure-review-plan-r59] PASS: exhaustive review plan remains content-free, zero-write and held");
