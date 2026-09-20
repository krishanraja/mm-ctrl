import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-prepared-authority-adapter-r11.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(contract.schema_version === "ctrl.g25.prepared-authority-adapter.r11.v1", "unexpected schema version");
check(contract.status === "postgresql_wasm_real_brain_authority_pass_decision_authority_closed", "R11 status overclaims or regressed");
check(contract.not_a_migration === true, "R11 must remain a non-migration candidate");
check(contract.verification?.rollback_residue === 0, "R11 does not record zero rollback residue");
check(contract.verification?.content_free_authority_receipts === true, "R11 lacks content-free receipt proof");
check(contract.verification?.decision_authority_closed === true, "R11 silently enabled decision authority");

for (const relative of [
  ...contract.depends_on,
  contract.candidate_sql,
  contract.database_test,
  contract.runtime_harness,
  contract.shared_harness,
  "project-documentation/ctrl-evolution/g25-prepared-authority-adapter-r11.md",
  "project-documentation/ctrl-evolution/g25-prepared-authority-adapter-r11-qa-record.md",
]) {
  check(typeof relative === "string" && fs.existsSync(path.join(root, relative)), `missing ${relative}`);
}

check(!contract.candidate_sql.startsWith("supabase/migrations/"), "R11 candidate was placed in migrations");

const candidate = fs.readFileSync(path.join(root, contract.candidate_sql), "utf8").toLowerCase();
const test = fs.readFileSync(path.join(root, contract.database_test), "utf8").toLowerCase();
const harness = fs.readFileSync(path.join(root, contract.runtime_harness), "utf8");

for (const clause of [
  "security invoker",
  "set search_path = ''",
  "version_row.workspace_id = p_workspace_id",
  "version_row.standing in ('current', 'disputed')",
  "version_row.valid_until is null",
  "version_row.superseded_by_version_id is null",
  "version_row.consequence_permission <> 'prohibited_in_context'",
  "source_row.source_type = 'external'",
  "source_row.purpose = 'prepared_intelligence'",
  "source_row.integrity_sha256 is not null",
  "source_row.retention_expires_at is null or source_row.retention_expires_at > now()",
  "brain_authority_row_sha256",
  "recorded_at')::timestamptz <= p_observed_at",
  "revoke all on function private.brain_current_prepared_authority",
]) {
  check(candidate.includes(clause), `candidate SQL is missing ${clause}`);
}

for (const clause of [
  "authority snapshot leaked content",
  "stale item version was accepted",
  "authority was accepted before it was recorded",
  "cross-workspace item authority was accepted",
  "superseded item authority was accepted",
  "prohibited item authority was accepted",
  "expired external source authority was accepted",
  "wrong-purpose external source authority was accepted",
  "unverified external source authority was accepted",
  "unmapped decision authority was accepted",
  "rollback;",
]) {
  check(test.includes(clause), `database test is missing ${clause}`);
}

for (const clause of [
  "consequence_permission_check_removed",
  "source_retention_check_removed",
  "item_workspace_check_removed",
  "rollback_residue",
]) {
  check(harness.includes(clause), `runtime harness is missing ${clause}`);
}

for (const forbidden of [
  "migration file or migration execution",
  "linked or production database use",
  "runtime caller or producer connection",
  "legacy retirement",
]) {
  check(contract.authority?.forbids?.includes(forbidden), `authority boundary missing ${forbidden}`);
}

for (const relative of [contract.candidate_sql, contract.database_test, contract.runtime_harness, contract.shared_harness]) {
  check(!fs.readFileSync(path.join(root, relative), "utf8").includes("\u2014"), `${relative} contains an em dash`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-authority-r11] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-authority-r11] PASS: real Brain item and source authority proved; decision authority and Supabase parity remain closed");
