import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-persistence-mapping-r6.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.persistence-mapping.r6.v1") fail("unexpected schema version");
if (contract.status !== "blocked_pending_scope_dependency_and_purpose_repairs") fail("R6 hides valid persistence blockers");

for (const relative of [
  contract.depends_on,
  ...(contract.evidence_baseline || []),
  "project-documentation/ctrl-evolution/g25-persistence-mapping-r6.md",
  "project-documentation/ctrl-evolution/g25-persistence-mapping-r6-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

const blockers = Array.isArray(contract.blocking_findings) ? contract.blocking_findings : [];
for (const id of [
  "R6-BLOCK-WORKSPACE-SCOPE",
  "R6-BLOCK-AUDIENCE-VOCABULARY",
  "R6-BLOCK-PURPOSE-ENFORCEMENT",
  "R6-BLOCK-TYPED-DEPENDENCIES",
  "R6-BLOCK-CIPHERTEXT-CONTEXT",
]) {
  if (!blockers.some((blocker) => blocker.id === id && blocker.risk?.length > 40 && blocker.required_repair?.length > 30)) {
    fail(`missing material blocker ${id}`);
  }
}

const routes = new Map((contract.route_comparison || []).map((route) => [route.route, route.decision]));
if (routes.get("Extend the canonical Brain substrate") !== "preferred_after_repairs") fail("preferred route drifted");
if (routes.get("Use briefings or delivery tables as authority") !== "rejected") fail("delivery was allowed to become truth");
if (routes.get("Create an independent intelligence database") !== "rejected") fail("a second Brain was allowed");

if (!Array.isArray(contract.required_database_proofs_before_execution) || contract.required_database_proofs_before_execution.length < 10) {
  fail("database proof ladder is incomplete");
}
if (!contract.authority?.forbids?.includes("Migration file")) fail("migration authority is not closed");

const canary = fs.readFileSync(path.join(root, "supabase/migrations/20260908111121_brain_workspace_audience_canary.sql"), "utf8");
if (!canary.includes("grant_row.audience = brain_sources.audience")) fail("audience policy evidence changed");
if (canary.includes("grant_row.purpose = brain_sources.purpose")) fail("purpose blocker is stale and must be re-adjudicated");

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-persistence-r6] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-persistence-r6] PASS: 5 material blockers explicit, preferred Brain-owned route bounded, migration authority closed");
