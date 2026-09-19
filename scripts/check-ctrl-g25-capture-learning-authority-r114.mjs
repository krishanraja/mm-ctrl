import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const hash = (path) => createHash("sha256").update(read(path)).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-capture-learning-authority-r114.json";
const notePath = "project-documentation/ctrl-evolution/g25-capture-learning-authority-r114.md";
const qaPath = "project-documentation/ctrl-evolution/g25-capture-learning-authority-r114-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const route = read(contract.artifacts.route);
const core = read(contract.artifacts.core);
const migration = read(contract.artifacts.migration);
const reviewClient = read(contract.artifacts.review_client);
const proposalClient = read(contract.artifacts.proposal_client);
const containment = read("supabase/containment/manifest.json");
const r99 = JSON.parse(read("project-documentation/ctrl-evolution/g25-repo-function-source-manifest-r99.json"));
const r104 = JSON.parse(read("project-documentation/ctrl-evolution/g25-function-environment-requirements-r104.json"));
const docs = `${raw}\n${read(notePath)}\n${read(qaPath)}`;
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_owner_governed_capture_proved_production_closed", "status drifted");
for (const [pathKey, hashKey] of [
  ["route", "route_sha256"], ["core", "core_sha256"], ["core_test", "core_test_sha256"],
  ["migration", "migration_sha256"], ["review_client", "review_client_sha256"],
  ["proposal_client", "proposal_client_sha256"], ["probe", "probe_sha256"],
]) check(hash(contract.artifacts[pathKey]) === contract.artifacts[hashKey], `${pathKey} hash drifted`);
check(hash("supabase/containment/manifest.json") === contract.artifacts.containment_manifest_sha256, "containment hash drifted");
check(hash("supabase/config.toml") === contract.artifacts.config_sha256, "config hash drifted");
check(r99.inspector.manifest_sha256 === contract.artifacts.repository_function_manifest_sha256, "R99 manifest drifted");
check(r104.inspector.manifest_sha256 === contract.artifacts.environment_manifest_sha256, "R104 manifest drifted");

for (const marker of [
  "hasExactServiceCredential(", "matchesExpectedSupabaseProject(", "captureCadenceDue(",
  "current_capture_source_packet", "publish_capture_run", "new_untouched_holdout_required",
  "reused_holdout_claimed_fresh: false", "criteria_changed: 0", "standards_changed: 0", "releases_changed: 0",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of ["roleFromJwt(", "[captureSecret, svcKey]", "bkyuxvschuwngtcdhsyg"]) {
  check(!route.includes(forbidden), `forbidden route marker present: ${forbidden}`);
}
for (const marker of [
  "stableEvidenceIdentity", "captureCadenceDue", "opportunityBySurface", "freshnessUnknown",
  "Do not delete an unrelated rule", "copying it into durable proposals is",
]) check(core.includes(marker), `core marker missing: ${marker}`);

for (const marker of [
  "capture_policies", "capture_runs", "proposal_decisions", "current_capture_source_packet",
  "publish_capture_run", "decide_capture_proposal", "capture_acceptance_scope_required",
  "capture_freshness_decision_required", "change_applied', false", "versioned_change_request",
]) check(migration.includes(marker), `migration marker missing: ${marker}`);
check(migration.includes("revoke all on public.capture_policies from public, anon, authenticated"), "owner policy privilege reset missing");
check(migration.includes("grant insert, update, delete on public.capture_policies to authenticated"), "owner policy write grant missing");
check(migration.includes("revoke insert, update, delete, truncate on public.proposals"), "direct proposal writes reopened");
check(reviewClient.includes("source_run_id: runId") && reviewClient.includes("onConflict: 'user_id,source_run_id,source_event_key'"), "review evidence identity is not idempotent");
check(proposalClient.includes("decide_capture_proposal") && proposalClient.includes("apply_change: false"), "proposal decision bypasses governed RPC");
check(!proposalClient.includes(".update({ status"), "proposal client regained direct update authority");

const manifest = JSON.parse(containment);
const entry = manifest.functions.find((row) => row.name === "capture-week");
check(entry?.verify_jwt === false, "capture-week gateway posture drifted");
check(entry?.action === "exact_service_credential", "capture-week service authentication drifted");
check(entry?.required_source_markers?.includes("publish_capture_run"), "capture-week containment marker drifted");

const proof = contract.hosted_proof;
check(proof.anonymous_status === 403 && proof.first_status === 200, "hosted caller boundary drifted");
check(proof.first_published === 2 && proof.capture_runs === 1 && proof.retry_idempotent === true, "hosted publication or replay drifted");
check(proof.cross_tenant_rows === 0 && proof.cross_owner_decision_denied === true, "tenant boundary drifted");
check(proof.owner_policy_update_count === 1 && proof.cross_owner_policy_update_count === 0, "owner policy authority drifted");
check(proof.cadence_hold_status === "not_due" && proof.cadence_hold_reason === "cadence_pending", "owner cadence proof drifted");
check(proof.owner_decision_change_applied === false && proof.criteria_unchanged_after_acceptance === true, "acceptance applied a standard change");
check(proof.durable_quotes_copied === false && proof.stale_source_publication_denied === true, "privacy or snapshot proof drifted");
check(Object.values(proof.cleanup).every((value) => value === 0), "hosted fixtures remain");

check(contract.target.production_writes === 0, "production write boundary drifted");
check(contract.deployment.scheduled_execution_created === false, "scheduled execution was claimed");
check(contract.boundary.production_deployed === false, "production deployment was claimed");
check(contract.boundary.merge_or_cutover_authorized === false, "merge or cutover was authorised");
check(contract.boundary.legacy_retirement_authorized === false, "legacy retirement was authorised");
check(contract.boundary.old_development_project_deletion_authorized === false, "old project deletion was authorised");
check(!docs.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(docs), "credential-shaped content detected");

if (failures.length) {
  console.error(`[g25-capture-learning-authority-r114] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("[g25-capture-learning-authority-r114] PASS: owner cadence, unique evidence, governed proposals, append-only decisions and production boundary are frozen.");
