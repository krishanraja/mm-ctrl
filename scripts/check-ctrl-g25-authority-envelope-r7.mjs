import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-authority-envelope-r7.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.authority-envelope.r7.v1") fail("unexpected schema version");
if (contract.status !== "local_contract_repair_passed") fail("R7 contract is not passed for local scope");

for (const relative of [
  ...(contract.depends_on || []),
  contract.implementation,
  contract.tests,
  "project-documentation/ctrl-evolution/g25-authority-envelope-r7.md",
  "project-documentation/ctrl-evolution/g25-authority-envelope-r7-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

const repairStates = new Map((contract.repairs || []).map((repair) => [repair.finding, repair.state]));
for (const id of ["R6-BLOCK-WORKSPACE-SCOPE", "R6-BLOCK-AUDIENCE-VOCABULARY", "R6-BLOCK-TYPED-DEPENDENCIES"]) {
  if (repairStates.get(id) !== "repaired_at_persistence_envelope_boundary") fail(`repair is not explicit for ${id}`);
}

for (const id of ["R6-BLOCK-PURPOSE-ENFORCEMENT", "R6-BLOCK-CIPHERTEXT-CONTEXT"]) {
  if (!contract.remaining_blockers?.includes(id)) fail(`remaining blocker hidden: ${id}`);
}

for (const forbidden of ["migration file", "database or Supabase mutation", "runtime or producer connection", "legacy retirement"]) {
  if (!contract.authority?.forbids?.includes(forbidden)) fail(`authority boundary missing ${forbidden}`);
}

const implementation = fs.readFileSync(path.join(root, contract.implementation), "utf8");
for (const token of [
  "workspace_id",
  "person_private",
  "delivery_team_private",
  "prepared_intelligence",
  "dependency_authority_missing",
  "dependency_authority_stale",
  "authority_version",
  "authority_sha256",
]) {
  if (!implementation.includes(token)) fail(`implementation is missing ${token}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-authority-r7] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-authority-r7] PASS: workspace and audience scope canonical, typed authority current, 2 database blockers remain closed");
