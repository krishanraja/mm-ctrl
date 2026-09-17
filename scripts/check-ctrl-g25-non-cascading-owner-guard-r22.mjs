import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-non-cascading-owner-guard-r22.json"));
const sql = read(contract.artifacts.candidate_sql);
const runner = read(contract.artifacts.runner);

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-owner-guard-r22] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_fail_closed_guard_verified_not_custody_solution", "claim boundary drifted");
assert(contract.policy_decision_ref === "DEC-20260917-g25-owner-subject-separation-r19", "founder policy link drifted");
assert(sha256(sql) === contract.artifacts.candidate_sql_sha256, "candidate SQL hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(contract.guarded_constraints.length === 4, "four owner constraints are not enumerated");
for (const constraint of contract.guarded_constraints) {
  assert(sql.includes(`drop constraint ${constraint}`), `constraint replacement missing: ${constraint}`);
}
assert((sql.match(/on delete restrict/g) ?? []).length === 4, "every owner constraint must use RESTRICT");
assert(!sql.includes("on delete cascade"), "owner cascade survived candidate SQL");
assert(runner.includes("owner_restrict_weakened_to_cascade"), "cascade negative control missing");
assert(runner.includes("historical_prepared_custody"), "historical custody blocker is not exercised");
assert(contract.discovered_limit.includes("does not complete transfer"), "guard is being misrepresented as custody solution");
assert(contract.not_authorized.includes("migration creation or execution"), "migration boundary missing");
assert(contract.not_authorized.includes("linked or production database use"), "database boundary missing");

console.log("[g25-owner-guard-r22] PASS: owner cascades fail closed; durable custody remains a separate gate");
