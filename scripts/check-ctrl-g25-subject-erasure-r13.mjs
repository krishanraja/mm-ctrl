import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-prepared-subject-erasure-r13.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(contract.schema_version === "ctrl.g25.prepared-subject-erasure.r13.v1", "unexpected schema version");
check(contract.status === "postgresql_wasm_cryptographic_erasure_pass_reconsent_closed", "R13 status overclaims or regressed");
check(contract.not_a_migration === true, "R13 must remain a non-migration candidate");
check(contract.verification?.rollback_residue === 0, "R13 does not record zero rollback residue");
check(contract.verification?.subject_tombstone_blocks_revival === true, "R13 lacks anti-revival proof");
check(contract.deliberate_exclusions?.tombstone_clearance?.includes("Closed"), "R13 silently enables tombstone clearance");

for (const relative of [
  ...contract.depends_on,
  contract.candidate_sql,
  contract.database_test,
  contract.runtime_harness,
  "project-documentation/ctrl-evolution/g25-prepared-subject-erasure-r13.md",
  "project-documentation/ctrl-evolution/g25-prepared-subject-erasure-r13-qa-record.md",
]) {
  check(typeof relative === "string" && fs.existsSync(path.join(root, relative)), `missing ${relative}`);
}

check(!contract.candidate_sql.startsWith("supabase/migrations/"), "R13 candidate was placed in migrations");

const candidate = fs.readFileSync(path.join(root, contract.candidate_sql), "utf8").toLowerCase();
const test = fs.readFileSync(path.join(root, contract.database_test), "utf8").toLowerCase();
const harness = fs.readFileSync(path.join(root, contract.runtime_harness), "utf8");
const store = fs.readFileSync(path.join(root, "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql"), "utf8").toLowerCase();

for (const clause of [
  "brain_prepared_receipts_payload_erasure_state_check",
  "create table public.brain_prepared_subject_erasure_tombstones",
  "force row level security",
  "security definer",
  "set search_path = ''",
  "payload_ciphertext = null",
  "encryption_version = null",
  "delete from public.brain_prepared_receipt_dependencies",
  "delete from public.brain_prepared_receipt_events",
  "'prepared-receipt-erased-event-r13'",
  "revoke all on table public.brain_prepared_subject_erasure_tombstones",
  "revoke all on function private.brain_erase_prepared_subject(jsonb)",
  "grant execute on function private.brain_erase_prepared_subject(jsonb) to service_role",
]) {
  check(candidate.includes(clause), `candidate SQL is missing ${clause}`);
}

check(store.includes("if private.brain_prepared_subject_erased(workspace_id, subject_id) then"), "store lacks subject-erasure guard");
check(store.includes("raise exception 'prepared_subject_erased'"), "store lacks fail-closed erasure result");

for (const clause of [
  "erased receipt retained recoverable payload or ingest identity",
  "erased receipt retained original fingerprints",
  "erased receipt retained authority dependencies",
  "erased receipt retained non-erasure events or lost its tombstone event",
  "cross-workspace receipt was erased",
  "silent subject revival was accepted",
  "failed event erased the payload",
  "failed event erased dependencies",
  "failed event left a subject tombstone",
  "authenticated erasure execution unexpectedly succeeded",
  "authenticated direct erasure unexpectedly succeeded",
  "rollback;",
]) {
  check(test.includes(clause), `database test is missing ${clause}`);
}

for (const clause of [
  "workspace_predicate_removed",
  "ciphertext_destruction_removed",
  "subject_erasure_guard_removed",
  "schema_security",
  "rollback_residue",
]) {
  check(harness.includes(clause), `runtime harness is missing ${clause}`);
}

for (const forbidden of [
  "migration file or migration execution",
  "linked or production database use",
  "runtime caller or producer connection",
  "tombstone clearance or re-consent implementation",
  "legacy retirement",
]) {
  check(contract.authority?.forbids?.includes(forbidden), `authority boundary missing ${forbidden}`);
}

for (const relative of [contract.candidate_sql, contract.database_test, contract.runtime_harness]) {
  check(!fs.readFileSync(path.join(root, relative), "utf8").includes("\u2014"), `${relative} contains an em dash`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-erasure-r13] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-erasure-r13] PASS: prepared derivatives are cryptographically erased and revival is blocked; whole-Brain erasure and Supabase parity remain closed");
