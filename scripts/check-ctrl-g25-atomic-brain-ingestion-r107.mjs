import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-atomic-brain-ingestion-r107.json";
const notePath = "project-documentation/ctrl-evolution/g25-atomic-brain-ingestion-r107.md";
const qaPath = "project-documentation/ctrl-evolution/g25-atomic-brain-ingestion-r107-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const note = read(notePath);
const qa = read(qaPath);
const route = read(contract.implementation.route);
const composition = read(contract.implementation.composition_module);
const compositionTest = read("supabase/functions/_shared/brain-to-evidence.test.ts");
const authorityMigration = read(contract.implementation.atomic_authority_migration);
const retiredMigration = read(contract.implementation.retired_semantics_migration);
const probe = read(contract.implementation.probe);
const databaseRunner = read(contract.implementation.target_neutral_database_runner);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_atomic_brain_ingestion_proved_production_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production_targeted === false, "production targeting was claimed");

check(sha256(route) === contract.implementation.route_sha256, "route hash drifted");
check(sha256(composition) === contract.implementation.composition_module_sha256, "composition hash drifted");
check(sha256(compositionTest) === contract.implementation.composition_test_sha256, "composition test hash drifted");
check(sha256(authorityMigration) === contract.implementation.atomic_authority_migration_sha256, "authority migration hash drifted");
check(sha256(retiredMigration) === contract.implementation.retired_semantics_migration_sha256, "retired semantics migration hash drifted");
check(sha256(probe) === contract.implementation.probe_sha256, "probe hash drifted");
check(sha256(databaseRunner) === contract.implementation.target_neutral_database_runner_sha256, "database runner hash drifted");
check(sha256(containment) === contract.implementation.containment_manifest_sha256, "containment hash drifted");
check(sha256(config) === contract.implementation.function_config_sha256, "function config hash drifted");

for (const marker of [
  "EXPECTED_SUPABASE_PROJECT_REF",
  "matchesExpectedSupabaseProject(",
  "readJsonWithLimit(req, MAX_REQUEST_BYTES)",
  "auth.getUser(",
  "userClient.rpc(\"ingest_brain_atomic\"",
  "brain_changed_during_ingestion",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of ["EXPECTED_PROJECT_ID", "SUPABASE_SERVICE_ROLE_KEY", "target_user_id", "req.json("]) {
  check(!route.includes(forbidden), `route forbidden marker present: ${forbidden}`);
}

for (const marker of [
  "security definer",
  "v_user_id uuid := auth.uid()",
  "pg_advisory_xact_lock",
  "brain_ingest_stale_input",
  "insert into public.evidence_sources",
  "insert into public.evidence(",
  "insert into public.constructs(",
  "insert into public.brain_ingestion_receipts(",
  "and status = 'candidate'",
  "revoke all on function public.ingest_brain_atomic(jsonb) from public, anon",
]) check(authorityMigration.includes(marker), `atomic authority marker missing: ${marker}`);
check(retiredMigration.includes("status in ('candidate', 'retired')"), "retired candidate semantics disappeared");
check((retiredMigration.match(/status in \('candidate', 'retired'\)/g) ?? []).length === 2, "both retired constraints are not present");

const hosted = contract.hosted_probe;
for (const [key, expected] of Object.entries({
  anonymous_status: 401,
  empty_brain_status: 422,
  wrong_method_status: 405,
  wrong_media_status: 415,
  extra_body_status: 400,
  oversized_status: 413,
  forced_late_failure_status: 500,
  first_status: 200,
  retry_status: 200,
  second_tenant_status: 200,
  correction_status: 200,
  direct_receipt_insert_status: 403,
})) check(hosted[key] === expected, `${key} drifted`);
for (const key of [
  "forced_failure_zero_sources",
  "forced_failure_zero_evidence",
  "forced_failure_zero_constructs",
  "forced_failure_zero_receipts",
  "retry_already_ingested",
  "retry_same_receipt",
  "retry_same_source",
  "retry_same_fingerprint",
  "correction_new_receipt",
  "correction_new_fingerprint",
  "correction_supersedes_first",
  "correction_retry_already_ingested",
  "correction_retry_same_receipt",
  "old_receipt_points_forward",
  "new_receipt_points_back",
  "accepted_old_construct_preserved",
  "stale_old_candidates_retired",
  "new_constructs_all_candidate",
  "exact_offsets_including_unicode",
  "rejected_fact_not_staged",
]) check(hosted[key] === true, `${key} proof disappeared`);
check(hosted.first_already_ingested === false, "first ingestion became a retry");
check(hosted.correction_already_ingested === false, "correction became a retry");
check(JSON.stringify(hosted.first_counts) === JSON.stringify({ facts: 2, decisions: 1, evidence: 3, constructs: 2, skipped: 1 }), "first ingestion counts drifted");
check(hosted.receipt_history_count === 2 && hosted.active_receipt_count === 1, "receipt lifecycle drifted");
check(hosted.cross_tenant_receipt_rows_visible === 0, "cross-person receipt visibility appeared");

const database = contract.database_readback;
for (const key of [
  "receipt_rls_enabled",
  "authenticated_select",
  "authenticated_rpc_execute",
  "probe_function_removed",
  "retired_candidate_pole_semantics_present",
  "retired_candidate_evidence_semantics_present",
]) check(database[key] === true, `${key} database readback disappeared`);
check(database.authenticated_direct_insert === false, "authenticated direct receipt insert opened");
check(database.anonymous_rpc_execute === false, "anonymous RPC execution opened");
check(database.receipt_rows_after_cleanup === 0 && database.probe_trigger_count === 0, "hosted residue remains");
check(JSON.stringify(database.migration_versions_recorded) === JSON.stringify(["20260918153000", "20260918153500"]), "migration history drifted");
check(Object.values(contract.cleanup).every((value) => value === 0), "fixture cleanup drifted");

check(!databaseRunner.includes("bkyuxvschuwngtcdhsyg"), "database runner retained a production default");
check(databaseRunner.includes("--project-ref"), "database runner lost explicit target selection");
check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.production_functions_deployed === 0, "production function deployment was claimed");
check(contract.authority.credential_values_emitted_or_persisted === false, "credential emission was claimed");
check(contract.authority.merge_or_cutover_authorized === false, "merge or cutover opened");
check(contract.authority.legacy_retirement_authorized === false, "legacy retirement opened");

const combined = `${raw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("The defect the proof found"), "schema-learning chronology disappeared");
check(note.includes("Production was not targeted"), "production boundary disappeared");
check(qa.includes("Forced late failure: `500`, with zero partial rows"), "atomic rollback evidence disappeared");
check(qa.includes("**Production writes:** zero"), "QA production boundary disappeared");

if (failures.length) {
  console.error(`[g25-atomic-brain-ingestion-r107] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-atomic-brain-ingestion-r107] PASS: owner-bound atomic ingestion, retry identity and correction supersession are proved on the isolated host; production stays closed");
