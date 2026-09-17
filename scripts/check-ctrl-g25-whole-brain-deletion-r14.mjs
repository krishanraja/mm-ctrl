import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-whole-brain-deletion-coverage-r14.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(contract.schema_version === "ctrl.g25.whole-brain-deletion-coverage.r14.v1", "unexpected schema version");
check(contract.status === "repository_coverage_map_complete_execution_closed", "R14 status overclaims or regressed");
check(contract.coverage_planes?.length === 9, "R14 does not preserve all nine data planes");
check(contract.blocking_findings?.length >= 7, "R14 lost blocking deletion findings");

for (const relative of [
  ...contract.depends_on,
  ...Object.values(contract.evidence),
  "project-documentation/ctrl-evolution/g25-whole-brain-deletion-coverage-r14.md",
  "project-documentation/ctrl-evolution/g25-whole-brain-deletion-coverage-r14-qa-record.md",
]) {
  check(typeof relative === "string" && fs.existsSync(path.join(root, relative)), `missing ${relative}`);
}

const brainSchema = fs.readFileSync(path.join(root, contract.evidence.canonical_brain_schema), "utf8");
const canonicalTables = [...brainSchema.matchAll(/create table public\.(brain_[a-z0-9_]+)/gi)].map((match) => match[1]);
check(
  JSON.stringify([...new Set(canonicalTables)].sort()) === JSON.stringify([...contract.canonical_brain_tables].sort()),
  "canonical Brain table inventory drifted",
);

const deletion = fs.readFileSync(path.join(root, contract.evidence.account_deletion_runtime), "utf8");
const deletionTest = fs.readFileSync(path.join(root, contract.evidence.account_deletion_e2e), "utf8");
const skillExport = fs.readFileSync(path.join(root, contract.evidence.skill_export_runtime), "utf8");

for (const marker of [
  "const deletionErrors: string[] = []",
  "for (const bucket of ['ctrl-briefings', 'documents'])",
  "limit: 1000",
  "success: true",
  "details: { email: userEmail",
  "supabaseAdmin.auth.admin.deleteUser(userId)",
]) {
  check(deletion.includes(marker), `delete-account evidence missing ${marker}`);
}

check(skillExport.includes('.from("skill-packages")'), "skill-packages write evidence missing");
check(!deletion.includes("'skill-packages'"), "R14 gap is stale: delete-account now mentions skill-packages");
check(deletionTest.includes("test.describe.skip"), "R14 gap is stale: deletion E2E is no longer skipped");
check(deletionTest.includes("deletionBody.errors ?? []"), "E2E no longer treats partial deletion as failure");

for (const plane of contract.coverage_planes) {
  check(typeof plane.id === "string" && plane.id.length > 0, "coverage plane lacks id");
  check(typeof plane.verdict === "string" && plane.verdict.length > 0, `${plane.id} lacks verdict`);
  check(typeof plane.required_proof === "string" && plane.required_proof.length > 0, `${plane.id} lacks required proof`);
}

for (const forbidden of [
  "delete-account runtime edit",
  "migration file or migration execution",
  "linked or production database use",
  "external provider deletion",
  "customer-facing deletion claim",
  "legacy retirement",
]) {
  check(contract.authority?.forbids?.includes(forbidden), `authority boundary missing ${forbidden}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-deletion-r14] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-deletion-r14] PASS: whole-Brain deletion surfaces mapped; execution and customer claims remain closed");
