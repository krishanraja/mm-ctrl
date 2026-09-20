import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-compile-standard-authority-r110.json";
const notePath = "project-documentation/ctrl-evolution/g25-compile-standard-authority-r110.md";
const qaPath = "project-documentation/ctrl-evolution/g25-compile-standard-authority-r110-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const note = read(notePath);
const qa = read(qaPath);
const route = read(contract.implementation.route);
const prompt = read(contract.implementation.prompt);
const migration = read(contract.implementation.authority_migration);
const clientHook = read(contract.implementation.client_hook);
const probe = read(contract.implementation.probe);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_snapshot_pinned_capability_guarded_metered_atomic_compile_proved_production_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production_targeted === false, "production targeting was claimed");
check(sha256(route) === contract.implementation.route_sha256, "route hash drifted");
check(sha256(prompt) === contract.implementation.prompt_sha256, "prompt hash drifted");
check(sha256(migration) === contract.implementation.authority_migration_sha256, "authority migration hash drifted");
check(sha256(clientHook) === contract.implementation.client_hook_sha256, "client hook hash drifted");
check(sha256(probe) === contract.implementation.probe_sha256, "probe hash drifted");
check(sha256(containment) === contract.implementation.containment_manifest_sha256, "containment hash drifted");
check(sha256(config) === contract.implementation.function_config_sha256, "function config hash drifted");

for (const marker of [
  "EXPECTED_SUPABASE_PROJECT_REF", "COMPILE_STANDARD_RPC_SECRET", "matchesExpectedSupabaseProject(",
  "readJsonWithLimit(req, MAX_REQUEST_BYTES)", "auth.getUser(",
  "userClient.rpc(\"reserve_compile_standard_run\"", "p_request_fingerprint: requestFingerprint",
  "client.rpc(\"record_compile_standard_usage\"", "client.rpc(\"finalize_compile_standard_run\"",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of ["EXPECTED_PROJECT_ID", "SUPABASE_SERVICE_ROLE_KEY", "target_user_id", "req.json(", "checkDailySoftCap(", "recordAiUsage("]) {
  check(!route.includes(forbidden), `route forbidden marker present: ${forbidden}`);
}
for (const marker of [
  "assert_compile_standard_capability", "vault.decrypted_secrets", "compile_standard_incomplete_grades",
  "compile_standard_unreceipted_grades", "grade_snapshot_sha256", "compile_standard_stale_grades",
  "compile_standard_daily_run_limit", "compile_standard_daily_spend_limit", "record_compile_standard_usage",
  "update public.criteria set is_current = false", "insert into public.criteria", "update public.constructs",
  "insert into public.generated_artifacts", "stage = 'ready', status = 'done'",
]) check(migration.includes(marker), `authority migration marker missing: ${marker}`);
for (const marker of [
  "compileRequestIdRef", "body: { run_id: session, request_id: requestId }",
  "if (attempt === 0) await delay(RETRY_DELAY_MS)",
]) check(clientHook.includes(marker), `client retry marker missing: ${marker}`);

const hosted = contract.hosted_probe;
for (const [key, expected] of Object.entries({
  anonymous_status: 401, wrong_method_status: 405, wrong_media_status: 415,
  oversized_status: 413, extra_field_status: 400, missing_request_status: 400,
  invalid_run_status: 400, cross_tenant_status: 404, cross_tenant_rpc_status: 403,
  direct_owner_rpc_status: 403, direct_criteria_insert_status: 403,
  incomplete_status: 409, unreceipted_status: 409, not_ready_status: 409,
  first_status: 202, retry_status: 200, conflict_status: 409,
  stale_status: 202, atomic_status: 202, halt_status: 202, template_status: 202,
  sixth_status: 429, spend_status: 429,
})) check(hosted[key] === expected, `${key} drifted`);
for (const key of [
  "retry_idempotent", "retry_same_run", "primary_all_advisory", "primary_version_one",
  "primary_provenance_exact", "primary_artifact_nonempty", "stale_zero_criteria",
  "stale_zero_artifacts", "atomic_zero_criteria", "atomic_zero_artifacts",
  "atomic_construct_unchanged", "halt_zero_usage", "template_zero_usage",
]) check(hosted[key] === true, `${key} proof disappeared`);
check(hosted.incomplete_error === "grades_incomplete", "incomplete-grade response drifted");
check(hosted.unreceipted_error === "grades_unreceipted", "receipt gate response drifted");
check(hosted.conflict_error === "request_id_conflict", "request conflict response drifted");
check(hosted.primary_stage === "ready" && hosted.primary_status === "done", "primary terminal state drifted");
check(hosted.primary_runs === 1 && hosted.primary_criteria === 1 && hosted.primary_artifacts === 1 && hosted.primary_usage === 1, "primary write cardinality drifted");
check(hosted.stale_terminal_stage === "failed" && hosted.atomic_terminal_stage === "failed", "rollback terminal state drifted");
check(hosted.halt_terminal_stage === "halted", "honest halt disappeared");
check(hosted.template_terminal_stage === "template_and_voice", "template route disappeared");
check(hosted.sixth_error === "daily_run_limit" && hosted.spend_error === "daily_spend_limit", "hard admission gate drifted");

const database = contract.database_readback;
for (const key of [
  "migration_recorded", "edge_capability_present", "database_capability_present",
  "authenticated_reserve_execute", "authenticated_finalize_execute",
]) check(database[key] === true, `${key} database readback disappeared`);
for (const key of [
  "anonymous_reserve_execute", "anonymous_finalize_execute",
  "authenticated_criteria_insert", "authenticated_grade_insert",
]) check(database[key] === false, `${key} database boundary opened`);
check(database.reserve_overload_count === 1 && database.finalize_overload_count === 1, "obsolete compiler overload remains");
check(Object.values(contract.cleanup).every((value) => value === 0), "fixture cleanup drifted");
check(contract.hosted_function.verify_jwt === true, "hosted JWT verification drifted");
check(contract.hosted_function.service_role_used === false, "hosted service-role usage appeared");
check(contract.hosted_function.private_rpc_capability_required === true, "private RPC capability disappeared");
check(contract.hosted_function.model_used === true && contract.hosted_function.paid_call_receipt_required === true, "model-spend boundary drifted");
check(/^[0-9a-f]{64}$/.test(contract.hosted_function.bundle_sha256), "hosted bundle hash is invalid");
check(contract.authority.production_writes === 0 && contract.authority.production_functions_deployed === 0 && contract.authority.production_secrets_changed === 0, "production boundary drifted");
check(contract.authority.credential_values_emitted_or_persisted === false, "credential persistence was claimed");
check(contract.authority.merge_or_cutover_authorized === false && contract.authority.legacy_retirement_authorized === false, "release boundary opened");

const combined = `${raw}\n${note}\n${qa}`;
check(!combined.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("This proves one isolated authority and transaction boundary"), "interpretation boundary disappeared");
check(qa.includes("Production writes:** zero"), "QA production boundary disappeared");

if (failures.length) {
  console.error(`[g25-compile-standard-authority-r110] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("[g25-compile-standard-authority-r110] PASS: isolated compilation is complete-grade, snapshot-pinned, capability-guarded, metered and atomic; production remains closed");
