import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-prepared-receipt-atomic-store-r10.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(contract.schema_version === "ctrl.g25.prepared-receipt-atomic-store.r10.v1", "unexpected schema version");
check(contract.status === "postgresql_wasm_atomic_store_pass_live_authority_adapters_pending", "R10 status overclaims or regressed");
check(contract.not_a_migration === true, "R10 must remain a non-migration candidate");
check(contract.verification?.rollback_residue === 0, "R10 does not record zero rollback residue");
check(contract.verification?.cross_language_authority_fingerprint === true, "R10 lacks cross-language fingerprint proof");
check(contract.authority_adapter_boundary?.default === "deny_all", "R10 authority seam is not closed by default");

for (const relative of [
  ...contract.depends_on,
  contract.candidate_sql,
  contract.database_test,
  contract.runtime_harness,
  "project-documentation/ctrl-evolution/g25-prepared-receipt-atomic-store-r10.md",
  "project-documentation/ctrl-evolution/g25-prepared-receipt-atomic-store-r10-qa-record.md",
]) {
  check(typeof relative === "string" && fs.existsSync(path.join(root, relative)), `missing ${relative}`);
}

check(!contract.candidate_sql.startsWith("supabase/migrations/"), "R10 candidate was placed in migrations");

const candidate = fs.readFileSync(path.join(root, contract.candidate_sql), "utf8").toLowerCase();
const test = fs.readFileSync(path.join(root, contract.database_test), "utf8").toLowerCase();
const harness = fs.readFileSync(path.join(root, contract.runtime_harness), "utf8");

for (const clause of [
  "create table public.brain_prepared_receipts",
  "create table public.brain_prepared_receipt_dependencies",
  "create table public.brain_prepared_receipt_events",
  "force row level security",
  "grant_row.purpose = brain_prepared_receipts.purpose",
  "security invoker",
  "set search_path = ''",
  "as $$ select false $$",
  "authority_fingerprint <> expected_authority_fingerprint",
  "authority_dependency_not_current",
  "authority_dependency_observed_after_receipt",
  "on conflict on constraint brain_prepared_receipts_workspace_id_ingest_key_key do nothing",
  "receipt_identity_conflict",
  "revoke all on function private.brain_store_prepared_receipt(jsonb, jsonb) from public, anon, authenticated",
]) {
  check(candidate.includes(clause), `candidate SQL is missing ${clause}`);
}

for (const clause of [
  "exact replay duplicated durable rows",
  "authority fingerprint mismatch was accepted",
  "stale authority dependency was accepted",
  "future authority observation was accepted",
  "cross-purpose authority dependency was accepted",
  "forced final write failure left partial rows",
  "authenticated function execution unexpectedly succeeded",
  "different-purpose reader crossed the prepared receipt boundary",
  "rollback;",
]) {
  check(test.includes(clause), `database test is missing ${clause}`);
}

for (const clause of [
  "verifyCrossLanguageFingerprint",
  "authority_fingerprint_check_removed",
  "current_authority_check_removed",
  "rollback_residue",
  "verifySchemaSecurity",
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
  check(!fs.readFileSync(path.join(root, relative), "utf8").includes("—"), `${relative} contains an em dash`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-atomic-r10] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-atomic-r10] PASS: atomic receipt store proved; real authority adapters and Supabase parity remain closed");
