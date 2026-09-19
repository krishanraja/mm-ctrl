import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-build-sort-authority-r108.json";
const notePath = "project-documentation/ctrl-evolution/g25-build-sort-authority-r108.md";
const qaPath = "project-documentation/ctrl-evolution/g25-build-sort-authority-r108-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const note = read(notePath);
const qa = read(qaPath);
const route = read(contract.implementation.route);
const prompt = read(contract.implementation.prompt);
const composition = read(contract.implementation.composition_module);
const compositionTest = read(contract.implementation.composition_test);
const migration = read(contract.implementation.authority_migration);
const probe = read(contract.implementation.probe);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_owner_bound_metered_atomic_build_proved_production_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production_targeted === false, "production targeting was claimed");

check(sha256(route) === contract.implementation.route_sha256, "route hash drifted");
check(sha256(prompt) === contract.implementation.prompt_sha256, "prompt hash drifted");
check(sha256(composition) === contract.implementation.composition_module_sha256, "composition hash drifted");
check(sha256(compositionTest) === contract.implementation.composition_test_sha256, "composition test hash drifted");
check(sha256(migration) === contract.implementation.authority_migration_sha256, "authority migration hash drifted");
check(sha256(probe) === contract.implementation.probe_sha256, "probe hash drifted");
check(sha256(containment) === contract.implementation.containment_manifest_sha256, "containment hash drifted");
check(sha256(config) === contract.implementation.function_config_sha256, "function config hash drifted");

for (const marker of [
  "EXPECTED_SUPABASE_PROJECT_REF",
  "matchesExpectedSupabaseProject(",
  "readJsonWithLimit(req, MAX_REQUEST_BYTES)",
  "auth.getUser(",
  "p_request_fingerprint: requestFingerprint",
  "userClient.rpc(\"reserve_build_sort_run\"",
  "client.rpc(\"record_build_sort_usage\"",
  "client.rpc(\"finalize_build_sort_run\"",
  "request_id_conflict",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of ["EXPECTED_PROJECT_ID", "SUPABASE_SERVICE_ROLE_KEY", "target_user_id", "req.json(", "checkDailySoftCap("]) {
  check(!route.includes(forbidden), `route forbidden marker present: ${forbidden}`);
}

for (const marker of [
  "p_request_fingerprint text",
  "build_sort_request_conflict",
  "build_sort_daily_run_limit",
  "build_sort_daily_spend_limit",
  "pg_advisory_xact_lock",
  "insert into public.ai_usage_audit",
  "build_sort_stale_construct",
  "insert into public.sort_items",
  "status = 'done'",
  "drop function if exists public.reserve_build_sort_run(text, text, text, text, jsonb, boolean)",
  "revoke all on function public.finalize_build_sort_run(uuid, jsonb, jsonb) from public, anon",
]) check(migration.includes(marker), `authority migration marker missing: ${marker}`);

const hosted = contract.hosted_probe;
for (const [key, expected] of Object.entries({
  anonymous_status: 401,
  wrong_method_status: 405,
  wrong_media_status: 415,
  oversized_status: 413,
  extra_field_status: 400,
  missing_request_status: 400,
  invalid_depth_status: 400,
  first_status: 202,
  retry_status: 200,
  conflict_status: 409,
  cross_tenant_usage_status: 403,
  atomic_failure_status: 400,
  stale_construct_status: 400,
  spend_gate_status: 429,
  daily_run_gate_status: 429,
})) check(hosted[key] === expected, `${key} drifted`);
for (const key of [
  "retry_idempotent",
  "retry_same_run",
  "one_reserved_run",
  "usage_replay_idempotent",
  "positions_contiguous",
  "repeats_resolve_earlier",
  "all_items_owned",
  "atomic_failure_zero_items",
  "atomic_failure_run_still_running",
  "stale_construct_zero_items",
  "first_five_reservations_ok",
]) check(hosted[key] === true, `${key} proof disappeared`);
check(hosted.conflict_error === "request_id_conflict", "request conflict response drifted");
check(hosted.terminal_status === "done" && hosted.terminal_stage === "ready" && hosted.terminal_error === null, "terminal run state drifted");
check(hosted.usage_rows === 1, "paid-call receipt count drifted");
check(hosted.item_count === 15, "honest sparse-fixture item count drifted");
check(hosted.cross_tenant_run_rows === 0 && hosted.cross_tenant_item_rows === 0 && hosted.cross_tenant_update_rows === 0, "cross-person visibility or mutation appeared");
check(hosted.spend_gate_error === "daily_spend_limit", "spend gate response drifted");
check(hosted.daily_run_gate_error === "daily_run_limit", "run gate response drifted");

const database = contract.database_readback;
for (const key of [
  "harness_rls_enabled",
  "harness_select_policy_present",
  "authenticated_reserve_execute",
  "authenticated_usage_execute",
  "authenticated_finalize_execute",
  "migration_recorded",
  "request_id_present",
]) check(database[key] === true, `${key} database readback disappeared`);
check(database.anonymous_reserve_execute === false, "anonymous reservation opened");
check(database.anonymous_usage_execute === false, "anonymous usage write opened");
check(database.anonymous_finalize_execute === false, "anonymous finalization opened");
check(database.reservation_overload_count === 1, "obsolete reservation overload remains");
check(Object.values(contract.cleanup).every((value) => value === 0), "fixture cleanup drifted");

check(contract.hosted_function.verify_jwt === true, "hosted JWT verification drifted");
check(contract.hosted_function.service_role_used === false, "hosted service-role usage appeared");
check(contract.hosted_function.model_used === true && contract.hosted_function.paid_call_receipt_required === true, "model-spend boundary drifted");
check(/^[0-9a-f]{64}$/.test(contract.hosted_function.bundle_sha256), "hosted bundle hash is invalid");
check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.production_functions_deployed === 0, "production deployment was claimed");
check(contract.authority.production_secrets_changed === 0, "production secret mutation was claimed");
check(contract.authority.credential_values_emitted_or_persisted === false, "credential persistence was claimed");
check(contract.authority.merge_or_cutover_authorized === false, "cutover gate opened");
check(contract.authority.legacy_retirement_authorized === false, "legacy retirement gate opened");

const combined = `${raw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("This is authority and failure-integrity proof"), "interpretation boundary disappeared");
check(qa.includes("Production writes:** zero"), "QA production boundary disappeared");
check(qa.includes("New type errors: zero"), "typecheck result disappeared");

if (failures.length) {
  console.error(`[g25-build-sort-authority-r108] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-build-sort-authority-r108] PASS: isolated build-sort is owner-bound, metered, idempotent and atomically finalized; production remains closed");
