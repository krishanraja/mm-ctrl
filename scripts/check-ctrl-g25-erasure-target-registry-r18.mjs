import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const registry = JSON.parse(read("project-documentation/ctrl-evolution/g25-erasure-target-registry-r18.json"));
const runner = read("scripts/run-ctrl-g25-erasure-target-registry-r18.mjs");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-erasure-registry-r18] ${message}`);
}

assert(registry.status === "canary_registry_complete_execution_blocked", "unexpected registry status");
assert(registry.relations.length === 11, "registry must cover eleven R17 canary relations");
const entries = registry.relations.flatMap((relation) => relation.constraints.map((constraint) => ({
  relation: relation.relation,
  ...constraint,
})));
assert(entries.length === 28, "registry must cover twenty-eight discovered constraints");
assert(new Set(entries.map((entry) => `${entry.relation}.${entry.constraint}`)).size === entries.length, "duplicate registry key");
assert(entries.every((entry) => entry.from_columns.length > 0), "registry entry without constrained columns");
assert(entries.every((entry) => entry.reason.length >= 20), "registry entry without a material reason");

const blockers = entries.filter((entry) => entry.standing === "blocks_execution");
assert(blockers.length === 6, "six unresolved owner or retention entries must remain visible");
assert(blockers.every((entry) => ["owner_scope_unresolved", "retention_scope_unresolved"].includes(entry.classification)), "unknown blocker class");
assert(registry.execution_gate.status === "blocked", "registry cannot be execution-ready");

for (const marker of [
  "registry_entry_removed",
  "stale_registry_entry_added",
  "registered_columns_drifted",
  "unresolved_registry_marked_ready",
]) {
  assert(runner.includes(marker), `negative control missing: ${marker}`);
}

console.log("[g25-erasure-registry-r18] PASS: 28 constraints classified; six policy blockers keep execution closed");
