import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-generate-skill-export-authority-r111.json";
const notePath = "project-documentation/ctrl-evolution/g25-generate-skill-export-authority-r111.md";
const qaPath = "project-documentation/ctrl-evolution/g25-generate-skill-export-authority-r111-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const note = read(notePath);
const qa = read(qaPath);
const route = read(contract.implementation.route);
const provenance = read(contract.implementation.provenance);
const migration = read(contract.implementation.authority_migration);
const probe = read(contract.implementation.probe);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const envInspector = read("scripts/inspect-ctrl-g25-function-env-requirements-r104.mjs");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_snapshot_pinned_capability_guarded_metered_atomic_portable_skill_proved_production_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production_targeted === false, "production targeting was claimed");
check(sha256(route) === contract.implementation.route_sha256, "route hash drifted");
check(sha256(provenance) === contract.implementation.provenance_sha256, "provenance hash drifted");
check(sha256(migration) === contract.implementation.authority_migration_sha256, "authority migration hash drifted");
check(sha256(probe) === contract.implementation.probe_sha256, "probe hash drifted");
check(sha256(containment) === contract.implementation.containment_manifest_sha256, "containment hash drifted");
check(sha256(config) === contract.implementation.function_config_sha256, "function config hash drifted");
check(sha256(envInspector) === contract.implementation.environment_inspector_sha256, "environment inspector hash drifted");

for (const marker of [
  "EXPECTED_SUPABASE_PROJECT_REF", "GENERATE_SKILL_EXPORT_RPC_SECRET", "matchesExpectedSupabaseProject(",
  "readJsonWithLimit(req, MAX_REQUEST_BYTES)", "auth.getUser(",
  "reserve_generate_skill_export_run", "record_generate_skill_export_usage",
  "finalize_generate_skill_export_run", "prepareCitedSpans(", "packageSha256",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of [
  "EXPECTED_PROJECT_ID", "SUPABASE_SERVICE_ROLE_KEY", "target_user_id", "req.json(",
  "checkDailySoftCap(", "recordAiUsage(", "persistCitedSpans(",
]) check(!route.includes(forbidden), `route forbidden marker present: ${forbidden}`);
for (const marker of [
  "assert_generate_skill_export_capability", "vault.decrypted_secrets",
  "current_generate_skill_source_snapshot", "generate_skill_export_stale_source",
  "generate_skill_export_daily_run_limit", "generate_skill_export_daily_spend_limit",
  "record_generate_skill_export_usage", "insert into public.skill_exports",
  "insert into public.generated_artifacts", "insert into public.skill_provenance",
  "insert into public.memory_links", "stage = 'ready', status = 'done'",
]) check(migration.includes(marker), `authority migration marker missing: ${marker}`);
for (const marker of [
  "export function prepareCitedSpans", "this makes no database write",
  "targets.evidenceUuidByShort.set", "targets.pendingSpans.delete",
]) check(provenance.includes(marker), `prepared-citation marker missing: ${marker}`);

const hosted = contract.hosted_probe;
for (const [key, expected] of Object.entries({
  anonymous_status: 401, wrong_method_status: 405, wrong_media_status: 415,
  oversized_status: 413, extra_field_status: 400, missing_request_status: 400,
  direct_rpc_status: 403, direct_artifact_status: 403,
  first_status: 200, retry_status: 200, conflict_status: 409,
  sixth_status: 429, spend_status: 429, stale_status: 409, atomic_status: 500,
})) check(hosted[key] === expected, `${key} drifted`);
for (const key of [
  "first_skill", "first_artifact", "first_zip", "first_package_sha",
  "retry_idempotent", "retry_same_run", "retry_same_artifact",
]) check(hosted[key] === true, `${key} proof disappeared`);
check(hosted.first_triage_result === "skill", "skill triage proof disappeared");
check(hosted.conflict_error === "request_id_conflict", "request conflict response drifted");
check(hosted.cross_tenant_artifact_rows === 0, "cross-tenant artifact boundary opened");
check(hosted.primary_runs === 1 && hosted.primary_exports === 1 && hosted.primary_artifacts === 1, "primary write cardinality drifted");
check(hosted.primary_provenance_min >= 1 && hosted.primary_cited_sources === 1 && hosted.primary_cited_evidence_min >= 1, "primary provenance proof disappeared");
check(hosted.primary_usage >= 1 && hosted.primary_usage <= 2 && hosted.primary_objects === 1, "usage or package cardinality drifted");
check(hosted.sixth_error === "daily_run_limit" && hosted.spend_error === "daily_spend_limit", "hard admission gate drifted");
check(hosted.stale_error === "source_changed_retry" && hosted.stale_failed_runs === 1, "stale-source refusal drifted");
check(hosted.stale_exports === 0 && hosted.stale_artifacts === 0 && hosted.stale_objects === 0, "stale-source residue appeared");
check(hosted.atomic_error === "skill_export_failed" && hosted.atomic_failed_runs === 1, "late-failure close drifted");
check(hosted.atomic_exports === 0 && hosted.atomic_artifacts === 0 && hosted.atomic_provenance === 0 && hosted.atomic_objects === 0, "atomic rollback residue appeared");

const database = contract.database_readback;
for (const key of [
  "migration_recorded", "edge_capability_present", "database_capability_present",
  "authenticated_reserve_execute", "authenticated_finalize_execute", "owner_storage_insert_policy",
]) check(database[key] === true, `${key} database readback disappeared`);
for (const key of [
  "anonymous_reserve_execute", "anonymous_finalize_execute", "authenticated_skill_export_insert",
  "authenticated_artifact_insert", "authenticated_provenance_insert",
]) check(database[key] === false, `${key} database boundary opened`);
check(database.reserve_overload_count === 1 && database.finalize_overload_count === 1, "obsolete export overload remains");
check(Object.values(contract.cleanup).every((value) => value === 0), "fixture cleanup drifted");
check(contract.hosted_function.verify_jwt === true, "hosted JWT verification drifted");
check(contract.hosted_function.service_role_used === false, "hosted service-role usage appeared");
check(contract.hosted_function.private_rpc_capability_required === true, "private RPC capability disappeared");
check(contract.hosted_function.private_owner_storage_required === true, "private owner storage boundary disappeared");
check(contract.hosted_function.model_used === true && contract.hosted_function.paid_call_receipt_required === true, "model-spend boundary drifted");
check(/^[0-9a-f]{64}$/.test(contract.hosted_function.bundle_sha256), "hosted bundle hash is invalid");
check(contract.authority.production_writes === 0 && contract.authority.production_functions_deployed === 0 && contract.authority.production_secrets_changed === 0, "production boundary drifted");
check(contract.authority.credential_values_emitted_or_persisted === false, "credential persistence was claimed");
check(contract.authority.merge_or_cutover_authorized === false && contract.authority.legacy_retirement_authorized === false, "release boundary opened");

const combined = `${raw}\n${note}\n${qa}`;
check(!combined.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("This proves one isolated authority and transaction boundary"), "interpretation boundary disappeared");
check(qa.includes("**Production writes:** zero"), "QA production boundary disappeared");

if (failures.length) {
  console.error(`[g25-generate-skill-export-authority-r111] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("[g25-generate-skill-export-authority-r111] PASS: isolated portable skill generation is owner-bound, snapshot-pinned, metered, recoverable and atomic; production remains closed");
