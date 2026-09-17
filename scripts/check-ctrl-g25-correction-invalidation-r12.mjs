import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-prepared-correction-invalidation-r12.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(contract.schema_version === "ctrl.g25.prepared-correction-invalidation.r12.v1", "unexpected schema version");
check(contract.status === "postgresql_wasm_atomic_correction_invalidation_pass_erasure_pending", "R12 status overclaims or regressed");
check(contract.not_a_migration === true, "R12 must remain a non-migration candidate");
check(contract.verification?.rollback_residue === 0, "R12 does not record zero rollback residue");
check(contract.verification?.forced_event_failure_rolled_back === true, "R12 lacks atomic-failure proof");
check(contract.deliberate_exclusions?.withdrawal_without_replacement?.includes("Closed"), "R12 silently enables withdrawal");

for (const relative of [
  ...contract.depends_on,
  contract.candidate_sql,
  contract.database_test,
  contract.runtime_harness,
  "project-documentation/ctrl-evolution/g25-prepared-correction-invalidation-r12.md",
  "project-documentation/ctrl-evolution/g25-prepared-correction-invalidation-r12-qa-record.md",
]) {
  check(typeof relative === "string" && fs.existsSync(path.join(root, relative)), `missing ${relative}`);
}

check(!contract.candidate_sql.startsWith("supabase/migrations/"), "R12 candidate was placed in migrations");

const candidate = fs.readFileSync(path.join(root, contract.candidate_sql), "utf8").toLowerCase();
const test = fs.readFileSync(path.join(root, contract.database_test), "utf8").toLowerCase();
const harness = fs.readFileSync(path.join(root, contract.runtime_harness), "utf8");

for (const clause of [
  "correction_mode text not null check (correction_mode = 'replaced')",
  "security invoker",
  "set search_path = ''",
  "if not private.brain_prepared_authority_current(",
  "dependency_row.authority_record_id = affected_authority_record_id",
  "receipt_row.workspace_id = workspace_id",
  "receipt_row.owner_id = owner_id",
  "receipt_row.subject_id = subject_id",
  "receipt_row.audience = audience",
  "receipt_row.purpose = purpose",
  "set invalidated_at = greatest(occurred_at, receipt_row.produced_at)",
  "'prepared-receipt-invalidated-r12'",
  "event_type, event_sha256, occurred_at",
  "force row level security",
  "grant update (invalidated_at) on table public.brain_prepared_receipts to service_role",
  "revoke all on function private.brain_invalidate_prepared_receipts_for_correction(jsonb)",
]) {
  check(candidate.includes(clause), `candidate SQL is missing ${clause}`);
}

for (const clause of [
  "superseded replacement authority was accepted",
  "correction did not invalidate exactly one receipt",
  "unrelated receipt was invalidated",
  "invalidation event missing or duplicated",
  "exact correction replay did not preserve the original result",
  "conflicting correction replay was accepted",
  "failed event left receipt invalidated",
  "failed event left correction receipt",
  "authenticated correction execution unexpectedly succeeded",
  "authenticated direct invalidation unexpectedly succeeded",
  "rollback;",
]) {
  check(test.includes(clause), `database test is missing ${clause}`);
}

for (const clause of [
  "affected_record_predicate_removed",
  "replacement_current_guard_removed",
  "invalidation_event_type_changed",
  "schema_security",
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

for (const relative of [contract.candidate_sql, contract.database_test, contract.runtime_harness]) {
  check(!fs.readFileSync(path.join(root, relative), "utf8").includes("\u2014"), `${relative} contains an em dash`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-correction-r12] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-correction-r12] PASS: replacement-backed correction invalidation is atomic; erasure and Supabase parity remain closed");
