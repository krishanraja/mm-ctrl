import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-memory-settings-hosted-proof-r106.json";
const notePath = "project-documentation/ctrl-evolution/g25-memory-settings-hosted-proof-r106.md";
const qaPath = "project-documentation/ctrl-evolution/g25-memory-settings-hosted-proof-r106-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const note = read(notePath);
const qa = read(qaPath);
const source = read(contract.repair.source_path);
const config = read("supabase/config.toml");
const containment = JSON.parse(read("supabase/containment/manifest.json"));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contractRaw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "owner_settings_control_complete_lifecycle_routes_open", "status drifted");
check(sha256(source) === contract.repair.source_sha256, "memory settings source hash drifted");
check(sha256(read(contract.repair.contract_test_path)) === contract.repair.contract_test_sha256, "route contract test hash drifted");
check(contract.repair.service_role_dependency_removed === true && !source.includes("SUPABASE_SERVICE_ROLE_KEY"), "service-role dependency returned");
check(contract.repair.owner_client_uses_rls === true, "RLS owner-client boundary drifted");
check(source.includes("auth.getUser(") && source.includes('.eq("user_id", user.id)'), "authenticated owner binding disappeared");
check(contract.repair.target_user_argument === false && !source.includes("target_user_id"), "target-user input appeared");
check(contract.repair.empty_get_writes_default_row === false && !source.includes("get_or_create_memory_settings"), "GET became a create operation");
check(source.includes("readJsonWithLimit(req, 4_096)"), "request byte limit disappeared");
check(contract.repair.mutating_body_limit_bytes === 4096, "recorded request byte limit drifted");
check(JSON.stringify(contract.repair.closed_setting_keys) === JSON.stringify([
  "auto_summarize_enabled", "retention_days", "store_memory_enabled", "store_voice_transcripts",
]), "closed setting key list drifted");
check(JSON.stringify(contract.repair.retention_values) === JSON.stringify([null, 30, 90]), "retention values drifted");
check(contract.repair.clear_cache_is_client_instruction_only === true, "cache instruction became a server-erasure claim");
check(contract.repair.user_identifier_logged === false && !source.includes("settings updated for user"), "user identifier logging returned");

check(contract.hosted.slug === "memory-settings", "hosted slug drifted");
check(contract.hosted.status === "ACTIVE" && contract.hosted.version === 1 && contract.hosted.verify_jwt === true, "hosted posture drifted");
check(/^[0-9a-f]{64}$/.test(contract.hosted.hosted_bundle_sha256), "hosted bundle hash is invalid");
check(/^\[functions\.memory-settings\]\s*\r?\nverify_jwt\s*=\s*true/m.test(config), "gateway JWT config drifted");
const containmentEntry = containment.functions.find((entry) => entry.name === "memory-settings");
check(containmentEntry?.verify_jwt === true && containmentEntry?.action === "authenticated_owner_rls_settings", "containment contract drifted");
check(sha256(config) === contract.configuration.config_sha256, "function config hash drifted");
check(/^[0-9a-f]{64}$/.test(contract.configuration.containment_manifest_sha256), "deploy-time containment hash is invalid");
check(containment.functions.length >= contract.configuration.containment_contract_count, "containment coverage regressed below R106");
check(contract.configuration.repository_routes_with_secret_dependency_after_repair === 72, "secret-dependent route count drifted");
check(contract.configuration.repository_routes_with_privileged_database_access_after_repair === 58, "privileged route count drifted");

check(sha256(read(contract.probe.path)) === contract.probe.sha256, "hosted probe hash drifted");
check(contract.probe.synthetic_users === 2, "two-user proof disappeared");
check(contract.probe.anonymous_status === 401, "anonymous denial drifted");
check(contract.probe.empty_owner_a_status === 200 && contract.probe.empty_owner_b_status === 200, "empty owner read proof drifted");
check(contract.probe.empty_owner_a_persisted === false && contract.probe.empty_owner_b_persisted === false, "empty GET persisted state");
check(contract.probe.rows_before_first_write === 0, "GET created a settings row");
check(contract.probe.owner_a_write_status === 200 && contract.probe.owner_a_retry_status === 200 && contract.probe.owner_b_write_status === 200, "owner write proof drifted");
check(contract.probe.owner_a_settings.store_memory_enabled === false, "owner A memory control drifted");
check(contract.probe.owner_a_settings.store_voice_transcripts === false, "owner A transcript control drifted");
check(contract.probe.owner_a_settings.auto_summarize_enabled === false, "owner A summary control drifted");
check(contract.probe.owner_a_settings.retention_days === 30 && contract.probe.owner_b_settings.retention_days === 90, "retention isolation drifted");
check(contract.probe.owner_a_visible_rows === 1 && contract.probe.owner_b_visible_rows === 1, "owner row cardinality drifted");
check(contract.probe.owner_a_cross_subject_rows === 0, "cross-subject settings became visible");
check(contract.probe.invalid_boolean_status === 400, "invalid boolean acceptance drifted");
check(contract.probe.invalid_extra_key_status === 400, "extra-key acceptance drifted");
check(contract.probe.invalid_retention_status === 400, "invalid retention acceptance drifted");
check(contract.probe.wrong_media_status === 415 && contract.probe.wrong_method_status === 405, "HTTP guard proof drifted");
check(contract.probe.cache_instruction_status === 200 && contract.probe.cache_instruction === "clear_local_storage" && contract.probe.cache_key_count === 3, "cache instruction drifted");
check(contract.probe.oversized_status === 413, "oversized request proof drifted");
check(Object.values(contract.cleanup).every((count) => count === 0), "hosted fixtures remain");

check(contract.scope_boundary.proves_owner_privacy_controls === true, "owner-control proof disappeared");
check(contract.scope_boundary.proves_browser_cache_erasure === false, "browser erasure was fabricated");
check(contract.scope_boundary.proves_retention_job_execution === false, "retention execution was fabricated");
check(contract.scope_boundary.proves_complete_account_erasure === false, "account erasure was fabricated");
check(contract.authority.database_migration_applied === false, "R106 database migration was claimed");
check(contract.authority.production_writes === 0 && contract.authority.production_functions_deployed === 0, "production boundary drifted");
check(contract.authority.raw_secret_values_emitted_or_persisted === false, "secret persistence was claimed");
check(contract.authority.email_routes_open === false && contract.authority.payment_routes_open === false && contract.authority.model_spend_routes_open === false, "external-effect gate opened");
check(contract.authority.legacy_retirement_open === false, "legacy retirement gate opened");

const combined = `${contractRaw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("RLS throughout"), "RLS boundary disappeared");
check(note.includes("not enforcement across every ingestion or retention path"), "scope limit disappeared");
check(qa.includes("A cross-subject read: zero rows"), "cross-subject proof disappeared");
check(qa.includes("Production writes: zero"), "production boundary disappeared");

if (failures.length) {
  console.error(`[g25-memory-settings-hosted-proof-r106] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-memory-settings-hosted-proof-r106] PASS: owner settings use JWT plus RLS with closed controls; lifecycle enforcement remains open");
