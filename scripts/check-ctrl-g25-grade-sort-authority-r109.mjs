import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-grade-sort-authority-r109.json";
const notePath = "project-documentation/ctrl-evolution/g25-grade-sort-authority-r109.md";
const qaPath = "project-documentation/ctrl-evolution/g25-grade-sort-authority-r109-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const note = read(notePath);
const qa = read(qaPath);
const route = read(contract.implementation.route);
const migration = read(contract.implementation.authority_migration);
const clientHook = read(contract.implementation.client_hook);
const probe = read(contract.implementation.probe);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_owner_bound_idempotent_atomic_grade_proved_production_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production_targeted === false, "production targeting was claimed");

check(sha256(route) === contract.implementation.route_sha256, "route hash drifted");
check(sha256(migration) === contract.implementation.authority_migration_sha256, "authority migration hash drifted");
check(sha256(clientHook) === contract.implementation.client_hook_sha256, "client hook hash drifted");
check(sha256(probe) === contract.implementation.probe_sha256, "probe hash drifted");
check(sha256(containment) === contract.implementation.containment_manifest_sha256, "containment hash drifted");
check(sha256(config) === contract.implementation.function_config_sha256, "function config hash drifted");

for (const marker of [
  "EXPECTED_SUPABASE_PROJECT_REF",
  "matchesExpectedSupabaseProject(",
  "readJsonWithLimit(req, MAX_REQUEST_BYTES)",
  "auth.getUser(",
  "p_request_fingerprint: requestFingerprint",
  "client.rpc(\"submit_sort_grade_atomic\"",
  "request_id_conflict",
  "sort_not_ready",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of ["EXPECTED_PROJECT_ID", "SUPABASE_SERVICE_ROLE_KEY", "target_user_id", "req.json("]) {
  check(!route.includes(forbidden), `route forbidden marker present: ${forbidden}`);
}

for (const marker of [
  "create table if not exists public.sort_grade_submission_receipts",
  "enable row level security",
  "security definer",
  "pg_advisory_xact_lock",
  "grade_sort_request_conflict",
  "grade_sort_run_not_ready",
  "insert into public.sort_grades",
  "insert into public.evidence",
  "insert into public.constructs",
  "update public.sort_items",
  "update public.harness_runs set stage_detail",
  "insert into public.sort_grade_submission_receipts",
  "revoke all on function public.submit_sort_grade_atomic",
]) check(migration.includes(marker), `authority migration marker missing: ${marker}`);

for (const marker of [
  "const requestId = crypto.randomUUID()",
  "const operation = gradeWriteQueueRef.current",
  "body: { run_id: session, ...payload, request_id: requestId }",
  "if (attempt === 0) await delay(RETRY_DELAY_MS)",
  "gradeWriteQueueRef.current = operation.then(",
  "await inFlightGradeRef.current",
]) check(clientHook.includes(marker), `client ordering marker missing: ${marker}`);

const hosted = contract.hosted_probe;
for (const [key, expected] of Object.entries({
  anonymous_status: 401,
  wrong_method_status: 405,
  wrong_media_status: 415,
  oversized_status: 413,
  extra_field_status: 400,
  missing_request_status: 400,
  invalid_ms_status: 400,
  long_why_status: 400,
  orphan_manip_status: 400,
  first_status: 200,
  retry_status: 200,
  conflict_status: 409,
  changed_mind_status: 200,
  manipulation_status: 200,
  repeat_status: 200,
  cross_tenant_status: 404,
  cross_tenant_rpc_status: 403,
  direct_receipt_insert_status: 403,
  not_ready_status: 409,
  forced_construct_status: 500,
  forced_manip_status: 500,
})) check(hosted[key] === expected, `${key} drifted`);
for (const key of [
  "retry_idempotent",
  "one_grade_after_retry",
  "one_receipt_after_retry",
  "one_emergent_construct",
  "emergent_evidence_exact",
  "changed_mind_persisted",
  "manipulation_scored",
  "manipulation_ok",
  "pair_flags_written",
  "one_manip_answer",
  "forced_construct_zero_grades",
  "forced_construct_zero_evidence",
  "forced_construct_zero_receipts",
  "forced_manip_zero_grades",
  "forced_manip_flags_unchanged",
  "forced_manip_zero_receipts",
  "forced_manip_no_answer",
]) check(hosted[key] === true, `${key} proof disappeared`);
check(hosted.first_idempotent === false, "first submission incorrectly became a replay");
check(hosted.conflict_error === "request_id_conflict", "request conflict response drifted");
check(hosted.pair_split_after_pair.split === 1 && hosted.pair_split_after_pair.total === 1, "matched-pair split drifted");
check(hosted.self_agreement.matched === 1 && hosted.self_agreement.total === 1, "repeat agreement drifted");

const database = contract.database_readback;
for (const key of ["receipt_rls_enabled", "owner_select_policy_present", "authenticated_submit_execute", "migration_recorded"]) {
  check(database[key] === true, `${key} database readback disappeared`);
}
check(database.anonymous_submit_execute === false, "anonymous submission opened");
check(database.authenticated_receipt_insert === false, "direct receipt insertion opened");
check(database.submit_overload_count === 1, "obsolete atomic submission overload remains");
check(Object.values(contract.cleanup).every((value) => value === 0), "fixture cleanup drifted");

check(contract.hosted_function.verify_jwt === true, "hosted JWT verification drifted");
check(contract.hosted_function.service_role_used === false, "hosted service-role usage appeared");
check(contract.hosted_function.model_used === false, "grade route unexpectedly claimed model use");
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
check(note.includes("This proves authority, idempotency and atomicity"), "interpretation boundary disappeared");
check(qa.includes("Production writes:** zero"), "QA production boundary disappeared");
check(qa.includes("New type errors: zero"), "typecheck result disappeared");

if (failures.length) {
  console.error(`[g25-grade-sort-authority-r109] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-grade-sort-authority-r109] PASS: isolated grade-sort is owner-bound, idempotent and transactionally complete; production remains closed");
