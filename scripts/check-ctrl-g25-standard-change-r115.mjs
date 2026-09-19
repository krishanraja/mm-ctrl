import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const readBytes = (path) => readFileSync(resolve(root, path));
const hash = (path) => createHash("sha256").update(read(path)).digest("hex");
const hashBytes = (path) => createHash("sha256").update(readBytes(path)).digest("hex");
const contractPath =
  "project-documentation/ctrl-evolution/g25-standard-change-candidate-pipeline-r115.json";
const notePath =
  "project-documentation/ctrl-evolution/g25-standard-change-candidate-pipeline-r115.md";
const qaPath =
  "project-documentation/ctrl-evolution/g25-standard-change-candidate-pipeline-r115-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(
  raw === `${JSON.stringify(contract, null, 2)}\n`,
  "contract JSON is not canonical",
);
check(
  contract.status ===
    "isolated_hosted_candidate_pipeline_concurrency_provenance_holdout_and_rollback_proved_production_closed",
  "status drifted",
);
for (const [pathKey, hashKey] of [
  ["compile_route", "compile_route_sha256"],
  ["build_route", "build_route_sha256"],
  ["check_route", "check_route_sha256"],
  ["core", "core_sha256"],
  ["core_test", "core_test_sha256"],
  ["request_guard", "request_guard_sha256"],
  ["deployment_manifest", "deployment_manifest_sha256"],
  ["deployment_verifier", "deployment_verifier_sha256"],
  ["probe", "probe_sha256"],
  ["rollback", "rollback_sha256"],
  ["rollback_operator", "rollback_operator_sha256"],
  ["restore_operator", "restore_operator_sha256"],
  ["hosted_proof_receipt", "hosted_proof_receipt_sha256"],
  ["rollback_proof_receipt", "rollback_proof_receipt_sha256"],
])
  check(
    hash(contract.artifacts[pathKey]) === contract.artifacts[hashKey],
    `${pathKey} hash drifted`,
  );
for (const migration of contract.artifacts.migrations) {
  check(
    hash(migration.path) === migration.sha256,
    `migration hash drifted: ${migration.path}`,
  );
}
check(
  hash("supabase/config.toml") === contract.artifacts.config_sha256,
  "function config hash drifted",
);

const deploymentManifestRaw = read(contract.artifacts.deployment_manifest);
const deploymentManifest = JSON.parse(deploymentManifestRaw);
check(
  deploymentManifestRaw === `${JSON.stringify(deploymentManifest, null, 2)}\n`,
  "deployment manifest JSON is not canonical",
);
check(
  deploymentManifest.project_ref === contract.target.project_ref &&
    deploymentManifest.production_project_ref === contract.target.production_project_ref &&
    deploymentManifest.production_allowed === false &&
    deploymentManifest.functions.length === 3,
  "deployment manifest boundary drifted",
);
for (const deployedFunction of deploymentManifest.functions) {
  const contractFunction = contract.deployment.functions.find(
    (candidate) => candidate.slug === deployedFunction.slug,
  );
  check(
    Number.isInteger(contractFunction?.version) && contractFunction.version > 0 &&
      contractFunction?.status === deployedFunction.status &&
      contractFunction?.verify_jwt === deployedFunction.verify_jwt &&
      contractFunction?.import_map === deployedFunction.import_map &&
      contractFunction?.ezbr_sha256 === deployedFunction.ezbr_sha256,
    `deployment metadata drifted: ${deployedFunction.slug}`,
  );
  check(
    deployedFunction.source_files.length === 5,
    `deployment closure cardinality drifted: ${deployedFunction.slug}`,
  );
  for (const file of deployedFunction.source_files) {
    const localPath = `${deploymentManifest.local_source_root}/${file.path}`;
    check(
      readBytes(localPath).byteLength === file.bytes && hashBytes(localPath) === file.sha256,
      `deployment source drifted: ${deployedFunction.slug}:${file.path}`,
    );
  }
}
check(
  hash("supabase/containment/manifest.json") ===
    contract.artifacts.containment_manifest_sha256,
  "containment hash drifted",
);
const r99 = JSON.parse(
  read(
    "project-documentation/ctrl-evolution/g25-repo-function-source-manifest-r99.json",
  ),
);
const r104 = JSON.parse(
  read(
    "project-documentation/ctrl-evolution/g25-function-environment-requirements-r104.json",
  ),
);
check(
  r99.inspector.manifest_sha256 ===
    contract.artifacts.repository_function_manifest_sha256,
  "R99 manifest drifted",
);
check(
  r104.inspector.manifest_sha256 ===
    contract.artifacts.environment_manifest_sha256,
  "R104 manifest drifted",
);

const sources = [
  contract.artifacts.compile_route,
  contract.artifacts.build_route,
  contract.artifacts.check_route,
]
  .map(read)
  .join("\n");
for (const marker of [
  'withSupabase({ auth: "user" }',
  "STANDARD_CHANGE_PIPELINE_RPC_SECRET",
  "readJsonWithLimit(request, MAX_BYTES)",
  "safeErrorMessage(error)",
  "reserve_standard_change_compile",
  "finalize_standard_change_compile",
  "reserve_standard_change_build",
  "finalize_standard_change_build",
  "repeat_build_mismatch",
  "reserve_standard_change_check",
  "finalize_standard_change_check",
  "checkStandardChangeCandidate",
])
  check(sources.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "target_user_id",
  "req.json(",
  "bkyuxvschuwngtcdhsyg",
]) {
  check(
    !sources.includes(forbidden),
    `forbidden route marker present: ${forbidden}`,
  );
}

const core = read(contract.artifacts.core);
for (const marker of [
  "ctrl.standard-change.compile.v1",
  "ctrl.standard-change.build.v1",
  "ctrl.standard-change.check.v1",
  "holdout_ids_loaded: []",
  "active_standard_mutated: false",
  "apply_authorized: false",
  "deploy_authorized: false",
  "criterion_id",
  "surface",
  "evidence_bindings",
  "opportunity_bindings",
  "opportunity_run_ids",
  "source_opportunity_binding",
  "holdout_receipt",
  "insufficient-evidence",
])
  check(core.includes(marker), `core marker missing: ${marker}`);

const migrations = contract.artifacts.migrations
  .map(({ path }) => read(path))
  .join("\n");
for (const marker of [
  "standard_change_requests",
  "standard_change_stage_runs",
  "standard_change_compilations",
  "standard_change_builds",
  "standard_change_checks",
  "proposal_decisions_queue_standard_change",
  "capture_runs_set_source_manifest",
  "proposals_validate_capture_manifest",
  "capture_acceptance_cannot_apply",
  "change_applied', false",
  "compile_candidate",
  "standard_change_source_stale",
  "standard_change_stage_runs_one_running_per_target_stage",
  "standard_change_stage_busy",
  "holdout_manifest_sha256",
  "holdout_intersection_count",
  "proposal_snapshot",
  "decision_snapshot",
  "ctrl.capture.source-manifest.v3",
  "opportunity_bindings",
  "capture_drift_opportunities_not_exactly_bound",
  "capture_proposal_source_line_bijection_invalid",
  "capture_false_positive_evidence_not_exactly_bound",
  "capture_uncovered_evidence_not_exactly_bound",
])
  check(migrations.includes(marker), `migration marker missing: ${marker}`);

const rollbackOperator = read(contract.artifacts.rollback_operator);
check(
  rollbackOperator.includes(
    '$migrationVersionSql = ($migrationVersions | ForEach-Object { "\'$_\'" }) -join \',\'',
  ) &&
    rollbackOperator.includes("version = any(array[$migrationVersionSql])"),
  "rollback history readback is not derived from the canonical migration list",
);
for (const helper of [
  "set_capture_source_manifest()",
  "validate_capture_proposal_manifest()",
  "queue_standard_change_request_from_decision()",
]) {
  check(
    migrations.includes(
      `revoke all on function public.${helper} from public, anon, authenticated`,
    ),
    `trigger ACL missing: ${helper}`,
  );
}

const deploymentIdentityValid = (identity) => {
  if (
    identity?.project_ref !== contract.target.project_ref ||
    identity?.production_project_ref !== contract.target.production_project_ref ||
    identity?.production_writes !== 0 ||
    identity?.inventory_stable_during_download !== true ||
    identity?.functions?.length !== 3 ||
    identity?.downloaded_sources?.length !== 3
  ) return false;
  for (const expected of deploymentManifest.functions) {
    const actual = identity.functions.find((candidate) => candidate.slug === expected.slug);
    const source = identity.downloaded_sources.find((candidate) => candidate.slug === expected.slug);
    if (
      !actual ||
      !/^[0-9a-f-]{36}$/.test(actual.id) ||
      !Number.isInteger(actual.updated_at) ||
      !Number.isInteger(actual.version) || actual.version < 1 ||
      actual.status !== expected.status ||
      actual.verify_jwt !== expected.verify_jwt ||
      actual.import_map !== expected.import_map ||
      actual.ezbr_sha256 !== expected.ezbr_sha256 ||
      source?.exact_file_count !== expected.source_files.length ||
      source?.exact_downloaded_source_match !== true ||
      source?.exact_local_source_match !== true
    ) return false;
  }
  return true;
};
const deploymentExerciseIdentityValid = (identity) =>
  identity?.inventory_stable_across_exercise === true &&
  deploymentIdentityValid(identity.before) &&
  deploymentIdentityValid(identity.after) &&
  isDeepStrictEqual(identity.before.functions, identity.after.functions) &&
  isDeepStrictEqual(identity.before.downloaded_sources, identity.after.downloaded_sources);

const proof = contract.hosted_proof;
const hostedReceipt = JSON.parse(read(contract.artifacts.hosted_proof_receipt));
check(
  isDeepStrictEqual(hostedReceipt.proof, proof),
  "hosted receipt and contract proof diverged",
);
check(
  deploymentExerciseIdentityValid(proof.deployment_identity) &&
    contract.deployment.exact_bundle_digest_verified === true &&
    contract.deployment.downloaded_runtime_source_matches_reviewed_source === true,
  "hosted runtime source identity drifted",
);
check(
  proof.publish_inserted === 3 &&
    JSON.stringify(proof.proposal_types_inserted) === JSON.stringify(["drift", "false_positive", "uncovered"]) &&
    proof.uncovered_change_request_created === true &&
    proof.drift_change_request_created === true,
  "three-type database proposal coverage drifted",
);
check(
  proof.compile_status === 200 &&
    proof.build_status === 200 &&
    proof.check_status === 200,
  "hosted conveyor drifted",
);
check(
  proof.check_verdict === "passed" && proof.check_findings === 10,
  "fresh Check evidence drifted",
);
check(
  proof.drift_compile_status === 200 &&
    proof.drift_build_status === 200 &&
    proof.drift_check_status === 200 &&
    proof.drift_check_verdict === "passed" &&
    proof.drift_candidate_status === "no_change" &&
    proof.drift_provenance_status === "holds",
  "drift absence proof did not survive the whole conveyor",
);
check(
  proof.durable.compilations === 2 &&
    proof.durable.builds === 2 &&
    proof.durable.checks === 2,
  "both evidenced-change and evidenced-no-change paths were not retained",
);
check(
  proof.compile_retry_idempotent &&
    proof.build_retry_idempotent &&
    proof.check_retry_idempotent,
  "stage replay drifted",
);
check(
  proof.cross_owner_status === 404 &&
    proof.direct_rpc_statuses.length === 7 &&
    proof.direct_rpc_statuses.every((status) => status === 403) &&
    proof.compile_conflict_status === 409,
  "authority statuses drifted",
);
check(
  proof.compile_race_statuses.length === 2 &&
    proof.compile_race_statuses.includes(200) &&
    proof.compile_race_statuses.includes(409),
  "single-worker concurrency proof drifted",
);
check(
  proof.active_standard_unchanged && proof.active_criteria_unchanged,
  "active Brain mutation boundary drifted",
);
check(
  proof.stale_compile_status === 409 && proof.stale_compilations === 0,
  "stale-source refusal drifted",
);
check(
  proof.cross_tenant_rows.length === 5 &&
    proof.cross_tenant_rows.every((value) => value === 0),
  "cross-tenant visibility drifted",
);
check(
  proof.durable.holdout_item_count === 1 &&
    proof.durable.holdout_intersection_count === 0 &&
    /^[a-f0-9]{64}$/.test(proof.durable.holdout_manifest_sha256),
  "durable holdout exclusion proof drifted",
);
check(
  Object.values(proof.cleanup).every((value) => value === 0),
  "hosted fixtures remain",
);
check(
  contract.pipeline.aggregate_score_used === false &&
    contract.pipeline.holdout_answers_loaded === false,
  "Check boundary drifted",
);
check(
  contract.pipeline.active_standard_mutated === false &&
    contract.pipeline.apply_authorized === false,
  "candidate became active",
);
check(
  contract.target.production_writes === 0 &&
    contract.boundary.production_deployed === false,
  "production boundary drifted",
);
check(
  contract.boundary.merge_or_cutover_authorized === false &&
    contract.boundary.release_authorized === false,
  "release boundary drifted",
);

const rollbackProof = JSON.parse(
  read(contract.artifacts.rollback_proof_receipt),
);
check(
  rollbackProof.rollback.status === "rolled_back" &&
    rollbackProof.rollback.candidate_tables === 0 &&
    rollbackProof.rollback.candidate_functions === 0,
  "complete rollback proof drifted",
);
check(
  rollbackProof.rollback.edge_functions_remaining === 0 &&
    rollbackProof.rollback.migration_history_rows === 0 &&
    rollbackProof.rollback.vault_capability_secrets === 0,
  "rollback residue proof drifted",
);
check(
  rollbackProof.restore.status === "restored" &&
    rollbackProof.restore.candidate_tables === 5 &&
    rollbackProof.restore.stage_rpcs === 7,
  "complete restore proof drifted",
);
check(
  rollbackProof.restore.active_edge_functions === 3 &&
    rollbackProof.restore.migration_history_rows === 13 &&
    rollbackProof.restore.vault_capability_secrets === 1,
  "restored hosted surface drifted",
);
check(
  deploymentIdentityValid(rollbackProof.restore.deployment_identity) &&
    deploymentExerciseIdentityValid(rollbackProof.post_restore_hosted_probe.deployment_identity),
  "post-restore deployment identity drifted",
);
check(
  rollbackProof.post_restore_hosted_probe.publish_inserted === 3 &&
    rollbackProof.post_restore_hosted_probe.proposal_types_inserted.length === 3 &&
    rollbackProof.post_restore_hosted_probe.uncovered_change_request_created === true &&
    rollbackProof.post_restore_hosted_probe.drift_change_request_created === true &&
    rollbackProof.post_restore_hosted_probe.check_verdict === "passed" &&
    rollbackProof.post_restore_hosted_probe.drift_check_verdict === "passed" &&
    rollbackProof.post_restore_hosted_probe.drift_provenance_status === "holds" &&
    rollbackProof.post_restore_hosted_probe.cleanup_rows === 0,
  "post-restore hosted proof drifted",
);

const docs = `${raw}\n${read(notePath)}\n${read(qaPath)}`;
check(!docs.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(
  !/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(docs),
  "credential-shaped content detected",
);

if (failures.length) {
  console.error(`[g25-standard-change-r115] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  "[g25-standard-change-r115] PASS: accepted proposals become checked candidates while the active standard, release and production remain closed.",
);
