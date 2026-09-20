import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const readBytes = (path) => readFileSync(resolve(root, path));
const hash = (path) => createHash("sha256").update(readBytes(path)).digest("hex");
const hashText = (value) => createHash("sha256").update(value).digest("hex");
const contractPath =
  "project-documentation/ctrl-evolution/g25-standard-change-owner-gate-r116.json";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(
  contract.status ===
    "isolated_headless_owner_review_apply_reversal_rollback_and_restore_proved_production_closed",
  "status drifted",
);

for (const [pathKey, hashKey] of [
  ["strategy", "strategy_sha256"],
  ["finding", "finding_sha256"],
  ["qa_record", "qa_record_sha256"],
  ["route", "route_sha256"],
  ["route_config", "route_config_sha256"],
  ["core", "core_sha256"],
  ["core_test", "core_test_sha256"],
  ["request_guard", "request_guard_sha256"],
  ["migration", "migration_sha256"],
  ["probe", "probe_sha256"],
  ["rollback_sql", "rollback_sql_sha256"],
  ["rollback_operator", "rollback_operator_sha256"],
  ["restore_operator", "restore_operator_sha256"],
  ["deployment_manifest", "deployment_manifest_sha256"],
  ["deployment_verifier", "deployment_verifier_sha256"],
  ["hosted_proof_receipt", "hosted_proof_receipt_sha256"],
  ["rollback_proof_receipt", "rollback_proof_receipt_sha256"],
]) {
  check(hash(contract.artifacts[pathKey]) === contract.artifacts[hashKey], `${pathKey} hash drifted`);
}
const functionConfig = read("supabase/config.toml").match(
  /^\[functions\.review-standard-change\]\r?\n(?:(?!^\[)[\s\S])*/m,
)?.[0];
check(
  functionConfig && hashText(functionConfig) === contract.artifacts.config_block_sha256,
  "function config block drifted",
);

const manifestRaw = read(contract.artifacts.deployment_manifest);
const manifest = JSON.parse(manifestRaw);
check(manifestRaw === `${JSON.stringify(manifest, null, 2)}\n`, "deployment manifest is not canonical");
check(
  manifest.project_ref === contract.target.project_ref &&
    manifest.production_project_ref === contract.target.production_project_ref &&
    manifest.production_allowed === false &&
    manifest.functions.length === 1,
  "deployment boundary drifted",
);
const deployed = manifest.functions[0];
check(
  deployed.slug === "review-standard-change" &&
    deployed.status === "ACTIVE" &&
    deployed.verify_jwt === true &&
    deployed.import_map === true &&
    deployed.source_files.length === 4,
  "deployed function contract drifted",
);
for (const file of deployed.source_files) {
  const path = `${manifest.local_source_root}/${file.path}`;
  check(
    readBytes(path).byteLength === file.bytes && hash(path) === file.sha256,
    `deployed source drifted: ${file.path}`,
  );
}

const route = read(contract.artifacts.route);
for (const marker of [
  'withSupabase({ auth: "user" }',
  "readJsonWithLimit(request, MAX_BYTES)",
  "parseOwnerStandardChangeRequest",
  "ownerStandardChangeRpc",
  "ownerStandardChangeErrorStatus",
  '"Cache-Control": "no-store"',
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "target_user_id",
  "req.json(",
  "bkyuxvschuwngtcdhsyg",
]) check(!route.includes(forbidden), `forbidden route marker present: ${forbidden}`);

const core = read(contract.artifacts.core);
for (const marker of [
  'action: "prepare"',
  'action: "decide"',
  'action: "reverse"',
  "prepare_standard_change_review",
  "decide_standard_change_review",
  "reverse_standard_change_application",
  "expected_packet_sha256",
  "expected_application_hash",
]) check(core.includes(marker), `core marker missing: ${marker}`);

const migration = read(contract.artifacts.migration);
for (const marker of [
  "standard_change_review_packets",
  "standard_change_owner_decisions",
  "standard_change_applications",
  "standard_change_reversals",
  "standard_versions",
  "force row level security",
  "criteria_before_sha256",
  "criteria_after_sha256",
  "reversible_while_current_head",
  "deploy_authorized', false",
  "release_authorized', false",
  "pg_advisory_xact_lock",
  "standard_change_review_source_stale",
  "standard_change_reversal_head_changed",
  "grant execute on function public.prepare_standard_change_review",
]) check(migration.includes(marker), `migration marker missing: ${marker}`);
check(!migration.includes("errcode = '40001'"), "retryable serialization code returned for application conflict");

const rollback = read(contract.artifacts.rollback_sql);
for (const marker of [
  "r116_rollback_unknown_later_standard_head",
  "r116_rollback_unknown_later_criteria_head",
  "r116_owned_standard_heads",
  "lock table",
  "in access exclusive mode",
  "in access exclusive mode nowait",
  "current_standard_criteria_snapshot",
  "r116_rollback_criteria_mismatch",
  "'checked', 'needs_evidence', 'blocked'",
]) check(rollback.includes(marker), `rollback marker missing: ${marker}`);
check(
  rollback.indexOf("lock table") < rollback.indexOf("create temp table r116_affected_requests") &&
    rollback.indexOf("lock table") < rollback.indexOf("update public.criteria"),
  "rollback table lock must precede snapshot derivation and mutation",
);
check(!rollback.includes("errcode = '40001'"), "rollback contains retryable deterministic conflict code");
check(
  rollback.indexOf("public.standard_change_owner_decisions") <
      rollback.indexOf("public.standard_change_review_packets") &&
    rollback.indexOf("public.standard_change_reversals") <
      rollback.indexOf("public.standard_change_applications"),
  "rollback lock order must follow the owner RPC receipt-first order",
);
const rollbackOperator = read(contract.artifacts.rollback_operator);
check(
  rollbackOperator.indexOf("--file $rollbackPath") <
    rollbackOperator.indexOf("functions delete $functionName"),
  "rollback must complete database preflight before deleting the Edge route",
);

const proof = JSON.parse(read(contract.artifacts.hosted_proof_receipt));
check(
  proof.deployment_identity.version === contract.deployment.version &&
    proof.deployment_identity.ezbr_sha256 === contract.deployment.ezbr_sha256 &&
    proof.deployment_identity.slug === deployed.slug &&
    proof.deployment_identity.status === deployed.status &&
    proof.deployment_identity.verify_jwt === deployed.verify_jwt &&
    proof.deployment_identity.import_map === deployed.import_map &&
    proof.deployment_identity.exact_downloaded_source_match === true &&
    proof.deployment_identity.exact_local_source_match === true &&
    proof.post_final_bytes_probe_passed === true,
  "hosted proof is not bound to the final deployed bytes",
);
check(
  proof.production_writes === 0 &&
    proof.prepared_count === 3 &&
    proof.r115_pipeline.length === 3 &&
    proof.r115_pipeline.every((item) =>
      item.compile_status === 200 && item.build_status === 200 &&
      item.check_status === 200 && item.verdict === "passed"),
  "R115 to R116 hosted path drifted",
);
check(
  proof.prepare_retry_idempotent === true &&
    proof.cross_owner_status === 404 &&
    proof.direct_insert_denied === true &&
    proof.rejection_mutated_nothing === true,
  "prepare, tenancy or rejection proof drifted",
);
check(
  JSON.stringify(proof.approval_race_statuses) === JSON.stringify([200, 409]) &&
    proof.approval_retry_idempotent === true &&
    proof.approval_changed_retry_status === 409 &&
    proof.stale_approval_status === 409,
  "approval concurrency or stale proof drifted",
);
check(
  proof.non_head_reversal_status === 409 &&
    proof.reversal_status === 200 &&
    proof.reversal_retry_idempotent === true &&
    proof.reversal_changed_retry_status === 409 &&
    proof.exact_standard_restored === true &&
    proof.exact_criteria_restored === true,
  "reversal proof drifted",
);
check(
  Object.values(proof.cleanup).every((value) => value === 0),
  "hosted fixtures remain",
);

const rollbackProof = JSON.parse(read(contract.artifacts.rollback_proof_receipt));
check(
  rollbackProof.rollback.status === "rolled_back" &&
    rollbackProof.rollback.r116_tables === 0 &&
    rollbackProof.rollback.r116_functions === 0 &&
    rollbackProof.rollback.r116_edge_functions === 0 &&
    rollbackProof.rollback.r115_preserved === true &&
    rollbackProof.adversarial_preflight.criteria_only_later_state_refused === true &&
    rollbackProof.adversarial_preflight.database_preserved_on_refusal === true &&
    rollbackProof.adversarial_preflight.edge_route_preserved_on_refusal === true &&
    rollbackProof.adversarial_preflight.concurrent_criteria_writer_blocked_by_table_lock === true &&
    rollbackProof.adversarial_preflight.concurrent_owner_rpc_forced_immediate_rollback_refusal === true &&
    rollbackProof.adversarial_preflight.deadlock_sqlstate_observed === false &&
    rollbackProof.adversarial_preflight.rollback_conflicts_non_retryable === true,
  "rollback proof drifted",
);
check(
  rollbackProof.restore.status === "restored" &&
    rollbackProof.restore.r116_tables === 5 &&
    rollbackProof.restore.owner_rpcs === 3 &&
    rollbackProof.restore.r116_active_edge_functions === 1 &&
    rollbackProof.restore.r115_preserved === true &&
    rollbackProof.post_restore.hosted_probe_passed === true,
  "restore proof drifted",
);

check(
  contract.database_readback.rls_forced_tables === 5 &&
    contract.database_readback.owner_select_policies === 5 &&
    contract.database_readback.ordinary_write_grants === 0 &&
    contract.database_readback.exposed_helpers === 0 &&
    contract.database_readback.owner_rpcs === 3 &&
    contract.database_readback.fixture_rows === 0,
  "database boundary readback drifted",
);
check(
  contract.boundary.production_deployed === false &&
    contract.boundary.merge_or_cutover_authorized === false &&
    contract.boundary.release_authorized === false &&
    contract.boundary.legacy_retirement_authorized === false,
  "release boundary drifted",
);

const docs = [contractPath, contract.artifacts.strategy, contract.artifacts.finding, contract.artifacts.qa_record]
  .map(read)
  .join("\n");
check(!docs.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(docs), "credential-shaped content detected");

if (failures.length) {
  console.error(`[g25-standard-change-owner-r116] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  "[g25-standard-change-owner-r116] PASS: the subject owner can review, reject, atomically apply and safely reverse one passed candidate while deploy, release and production remain closed.",
);
