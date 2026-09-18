import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-second-clean-replay-r98.json";
const notePath = "project-documentation/ctrl-evolution/g25-second-clean-replay-r98.md";
const qaPath = "project-documentation/ctrl-evolution/g25-second-clean-replay-r98-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const note = read(notePath);
const qa = read(qaPath);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const checkFrozenFile = (entry, label) => {
  const value = read(entry.path);
  check(sha256(value) === entry.sha256, `${label} hash drifted`);
  return value;
};

check(contractRaw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "second_clean_replay_passed_full_non_schema_incomplete", "status drifted");
check(contract.target.project_id === "cgkcplcamsijghalintq", "reused target drifted");
check(contract.target.production_project_id === "bkyuxvschuwngtcdhsyg", "production identity drifted");
check(contract.target.separate_from_production === true, "target separation disappeared");
check(contract.target.founder_authorized_destructive_reuse === true, "cleanup authority disappeared");
check(contract.target.new_paid_project_created === false, "new project was fabricated");
check(contract.target.additional_project_monthly_cost === 0, "incremental project cost drifted");

const cleanup = checkFrozenFile(contract.retired_project_cleanup, "cleanup candidate");
check(cleanup.includes("v_application_tables <> 20"), "cleanup table-count preflight disappeared");
check(cleanup.includes("v_auth_users <> 4"), "cleanup Auth-count preflight disappeared");
check(cleanup.includes("v_cron_jobs <> 2"), "cleanup cron-count preflight disappeared");
check(cleanup.includes("drop schema public cascade"), "cleanup no longer removes the retired application schema");
check(cleanup.includes("delete from auth.users"), "cleanup no longer removes retired Auth users");
check(contract.retired_project_cleanup.blank_state_verified.public_application_objects === 0, "blank application state drifted");
check(contract.retired_project_cleanup.blank_state_verified.auth_users === 0, "blank Auth state drifted");
check(contract.retired_project_cleanup.recoverability.includes("not recoverable through this repository"), "destructive recoverability warning disappeared");

check(contract.replay.required_clean_replays === 2, "required replay count drifted");
check(contract.replay.completed_clean_replays === 2, "completed replay count drifted");
check(contract.replay.second_replay_executed === true, "second replay execution disappeared");
check(contract.replay.second_replay_passed === true, "second replay pass disappeared");

const normalization = checkFrozenFile(contract.replay.additional_stage, "ACL normalization");
check(normalization.includes("and d.deptype = 'e'"), "extension-owned routine boundary disappeared");
check(normalization.includes("grant usage on schema public to public"), "standard public-schema grant disappeared");
check(!/grant\s+execute\s+on\s+function/i.test(normalization), "normalization gained function ACL mutation");

const finalVerification = checkFrozenFile(contract.replay.final_verification, "final verification");
check(finalVerification.includes("expected_function_count"), "final function verification disappeared");
check(contract.replay.final_verification.extensions === "8_of_8", "extension verification drifted");
check(contract.replay.final_verification.hardened_functions === "7_of_7", "function verification drifted");
check(contract.replay.final_verification.auth_users === 0, "final Auth state drifted");
check(contract.replay.final_verification.profiles === 0, "final profile state drifted");

const fingerprint = checkFrozenFile(contract.canonical_application_fingerprint, "canonical fingerprint");
check(fingerprint.includes("set_config('search_path', '', false)"), "canonical search path disappeared");
check(fingerprint.includes("dependency.deptype = 'e'"), "extension-owned routine exclusion disappeared");
check(contract.canonical_application_fingerprint.search_path_canonicalized === true, "search-path canonicalization claim drifted");
check(contract.canonical_application_fingerprint.extension_owned_routines_excluded === true, "extension exclusion claim drifted");
check(contract.canonical_application_fingerprint.differences === 0, "cross-target fingerprint differences appeared");

const expectedFingerprints = {
  columns: [2133, "f68c992ae809c2eaeaf3502a892b28d4"],
  constraints: [774, "a677be5a80180bf27840f77900d9acf9"],
  indexes: [591, "37b7cfb959f20f388fa8e983bdf01891"],
  policies: [304, "883b242b83f5d2a57d1368cae4e130fe"],
  rls: [176, "c1962d417e21fc41cacf8174d46a9bc1"],
  routine_grants: [259, "3896eb727989f4ab6421b7de8e7fa92e"],
  routines: [100, "7778479c75e3c5e5696e73c298645bf6"],
  schema_grants: [12, "f08632af471eac39debe086bfe584f03"],
  table_grants: [5071, "93b4759a3f418824bd775c83834f4815"],
  triggers: [53, "462bda631de05499f3a3432da713ad36"],
  views: [9, "bdfe07a67648686a49eb0443f0f7a442"],
};
check(Object.keys(contract.canonical_application_fingerprint.domains).length === 11, "fingerprint domain count drifted");
for (const [domain, [objectCount, digest]] of Object.entries(expectedFingerprints)) {
  const actual = contract.canonical_application_fingerprint.domains[domain];
  check(actual?.object_count === objectCount, `${domain} object count drifted`);
  check(actual?.digest === digest, `${domain} digest drifted`);
}

check(contract.platform_compatibility.postgres === "17.6", "Postgres version drifted");
check(contract.platform_compatibility.extensions.length === 8, "platform extension inventory drifted");
check(contract.platform_compatibility.extension_owned_public_routines === 118, "extension-owned routine count drifted");

const http = contract.runtime_proofs.http_transport;
check(sha256(read(http.anonymous_probe_path)) === http.anonymous_probe_sha256, "anonymous HTTP probe hash drifted");
check(sha256(read(http.authenticated_probe_path)) === http.authenticated_probe_sha256, "authenticated HTTP probe hash drifted");
check(http.public_reads === "pass" && http.anonymous_mutations_denied === "pass", "anonymous transport proof drifted");
check(http.owned_paths === "pass" && http.cross_subject_paths_denied_or_safe === "pass", "authenticated transport proof drifted");
check(http.owned_fact_verified === true && http.other_fact_unchanged === true, "fact storage proof drifted");
check(http.owned_decision_pinned === true && http.other_decision_unchanged === true, "decision storage proof drifted");
check(http.remaining_fixtures === 0, "HTTP fixtures remain");

const extension = contract.runtime_proofs.extension_runtime;
for (const [pathKey, hashKey, label] of [
  ["synchronous_path", "synchronous_sha256", "synchronous extension proof"],
  ["pg_net_enqueue_path", "pg_net_enqueue_sha256", "pg_net enqueue proof"],
  ["pg_net_verify_cleanup_path", "pg_net_verify_cleanup_sha256", "pg_net cleanup proof"],
]) {
  check(sha256(read(extension[pathKey])) === extension[hashKey], `${label} hash drifted`);
}
check(extension.cron_schedule_and_unschedule === "pass", "cron runtime proof drifted");
check(extension.pg_net_enqueue_worker_and_error_receipt === "pass", "pg_net runtime proof drifted");
check(extension.vector_1536_ranking === "pass", "vector runtime proof drifted");
check(extension.remaining_fixtures === 0, "extension fixtures remain");

const critical = contract.runtime_proofs.critical_application;
check(sha256(read(critical.path)) === critical.sha256, "critical smoke hash drifted");
check(critical.brain_export_and_context === "pass", "Brain critical smoke drifted");
check(critical.decision_ownership === "pass", "decision critical smoke drifted");
check(critical.briefing_feedback_learning === "pass", "briefing-learning smoke drifted");
check(critical.remaining_fixtures === 0, "critical smoke fixtures remain");

const safePlane = contract.runtime_proofs.safe_non_schema_plane;
check(sha256(read(safePlane.verification_path)) === safePlane.verification_sha256, "safe-plane verification hash drifted");
check(safePlane.storage_buckets === "5_of_5", "bucket verification drifted");
check(safePlane.storage_policies === "12_of_12", "Storage policy verification drifted");
check(safePlane.application_realtime_tables === "3_of_3", "Realtime verification drifted");

check(contract.acceptance_gate.second_clean_blank_replay_passed === true, "second replay gate regressed");
check(contract.acceptance_gate.application_schema_reproducible === true, "application reproducibility gate regressed");
check(contract.acceptance_gate.http_transport_passed === true, "HTTP gate regressed");
check(contract.acceptance_gate.tested_extension_surface_passed === true, "extension gate regressed");
check(contract.acceptance_gate.critical_database_smoke_passed === true, "critical database gate regressed");
check(contract.acceptance_gate.secret_free_non_schema_safe_plane_passed === true, "safe non-schema gate regressed");
check(contract.acceptance_gate.full_non_schema_restoration_passed === false, "full non-schema recovery was fabricated");
check(contract.acceptance_gate.production_recovery_choice_ready === false, "production recovery gate opened");
check(contract.closed_lanes.cron.startsWith("closed_"), "cron lane opened");
check(contract.closed_lanes.edge_functions.startsWith("closed_"), "Edge Function lane opened");
check(contract.closed_lanes.vault.startsWith("closed_"), "Vault lane opened");
check(contract.closed_lanes.production_cutover === "closed", "production cutover opened");
check(contract.closed_lanes.legacy_retirement === "closed", "legacy retirement opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.customer_data_used === false, "customer-data boundary drifted");
check(contract.authority.secret_values_persisted_to_repo === false, "secret persistence boundary drifted");
check(contract.authority.edge_functions_deployed === 0, "Edge Function deployment was fabricated");
check(contract.authority.production_deployments === 0, "production deployment was fabricated");

const combined = `${contractRaw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("does not close full non-schema recovery"), "honest recovery boundary disappeared");
check(note.includes("Production was not changed"), "production boundary disappeared");
check(qa.includes("Completed clean isolated replays: 2"), "QA replay count disappeared");
check(qa.includes("Remaining synthetic proof fixtures: zero"), "QA cleanup result disappeared");

if (failures.length) {
  console.error(`[g25-second-clean-replay-r98] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-second-clean-replay-r98] PASS: second clean application replay is reproducible; full hosted recovery remains closed");
