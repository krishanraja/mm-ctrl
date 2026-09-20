import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const overlay = JSON.parse(read("project-documentation/ctrl-evolution/g25-erasure-owner-policy-overlay-r21.json"));
const baseText = read(overlay.base_registry.path);
const plannerText = read(overlay.planner_contract.path);
const base = JSON.parse(baseText);

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-owner-overlay-r21] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function key(entry) {
  return `${entry.relation}.${entry.constraint}`;
}

const baseEntries = base.relations.flatMap((relation) => relation.constraints.map((constraint) => ({
  relation: relation.relation,
  ...constraint,
})));
const baseByKey = new Map(baseEntries.map((entry) => [key(entry), entry]));
const overrideByKey = new Map(overlay.overrides.map((entry) => [key(entry), entry]));

assert(sha256(baseText) === overlay.base_registry.sha256, "base R18 hash drifted");
assert(sha256(plannerText) === overlay.planner_contract.sha256, "R20 planner contract hash drifted");
assert(overlay.policy_decision_ref === "DEC-20260917-g25-owner-subject-separation-r19", "founder policy link drifted");
assert(overlay.overrides.length === 4 && overrideByKey.size === 4, "owner overlay must contain four unique entries");

const unresolvedOwners = baseEntries.filter((entry) => entry.classification === "owner_scope_unresolved");
assert(unresolvedOwners.length === 4, "base registry no longer has the expected four owner-policy entries");

for (const unresolved of unresolvedOwners) {
  const replacement = overrideByKey.get(key(unresolved));
  assert(replacement, `missing owner override: ${key(unresolved)}`);
  assert(JSON.stringify(replacement.from_columns) === JSON.stringify(unresolved.from_columns), `column identity drifted: ${key(unresolved)}`);
  assert(replacement.classification === "operator_custody_gate", `wrong owner classification: ${key(unresolved)}`);
  assert(replacement.standing === "blocks_schema_execution", `owner schema blocker weakened: ${key(unresolved)}`);
  assert(replacement.reason.length >= 80, `owner reason too weak: ${key(unresolved)}`);
}

for (const replacement of overlay.overrides) {
  const original = baseByKey.get(key(replacement));
  assert(original?.classification === "owner_scope_unresolved", `stale or non-owner override: ${key(replacement)}`);
}

const effective = baseEntries.map((entry) => overrideByKey.get(key(entry)) ?? entry);
assert(effective.filter((entry) => entry.classification === "owner_scope_unresolved").length === 0, "unresolved owner policy survived overlay");
assert(effective.filter((entry) => entry.standing === "blocks_schema_execution").length === 4, "four schema blockers must remain");
assert(effective.filter((entry) => entry.classification === "retention_scope_unresolved").length === 2, "two retention blockers must remain");
assert(overlay.effective_gate.status === "blocked", "execution gate opened without schema proof");
assert(overlay.not_authorized.includes("auth-user deletion"), "auth deletion boundary missing");
assert(overlay.not_authorized.includes("linked or production database use"), "database boundary missing");

console.log("[g25-owner-overlay-r21] PASS: four owner-policy gaps are bound; four schema and two retention blockers remain");
