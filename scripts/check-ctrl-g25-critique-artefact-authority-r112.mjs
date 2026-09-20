import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-critique-artefact-authority-r112.json";
const notePath = "project-documentation/ctrl-evolution/g25-critique-artefact-authority-r112.md";
const qaPath = "project-documentation/ctrl-evolution/g25-critique-artefact-authority-r112-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const note = read(notePath);
const qa = read(qaPath);
const route = read(contract.artifacts.route_path);
const migration = read(contract.artifacts.migration_path);
const client = read(contract.artifacts.client_path);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(contractRaw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_proof_complete_production_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production_project_ref === "bkyuxvschuwngtcdhsyg", "production identity drifted");
check(contract.target.production_mutated === false, "production mutation was claimed");

check(sha256(route) === contract.artifacts.route_sha256, "route hash drifted");
check(sha256(read(contract.artifacts.prompt_path)) === contract.artifacts.prompt_sha256, "prompt hash drifted");
check(sha256(migration) === contract.artifacts.migration_sha256, "migration hash drifted");
check(sha256(read(contract.artifacts.probe_path)) === contract.artifacts.probe_sha256, "probe hash drifted");
check(sha256(client) === contract.artifacts.client_sha256, "client hash drifted");
check(sha256(containment) === contract.artifacts.containment_manifest_sha256, "containment hash drifted");
check(sha256(config) === contract.artifacts.config_sha256, "config hash drifted");
check(sha256(read("scripts/inspect-ctrl-g25-function-env-requirements-r104.mjs")) === contract.artifacts.environment_inspector_sha256, "environment inspector hash drifted");

for (const marker of [
  "EXPECTED_SUPABASE_PROJECT_REF",
  "CRITIQUE_ARTEFACT_RPC_SECRET",
  "matchesExpectedSupabaseProject(",
  "readJsonWithLimit(req, MAX_REQUEST_BYTES)",
  "reserve_critique_artefact_run",
  "record_critique_artefact_usage",
  "finalize_critique_artefact_run",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of [
  "EXPECTED_PROJECT_ID",
  "SUPABASE_SERVICE_ROLE_KEY",
  "checkDailySoftCap(",
  "recordAiUsage(",
  "req.json(",
]) check(!route.includes(forbidden), `forbidden route marker present: ${forbidden}`);
check(client.includes("request_id: requestId"), "client request identity disappeared");
check(client.includes("attempt < 2"), "same-id client retry disappeared");
check(config.includes("[functions.critique-artefact]\nverify_jwt = true"), "gateway JWT posture drifted");

check(migration.includes("critique_artefact_rpc_secret"), "Vault capability binding disappeared");
check(migration.includes("current_critique_artefact_source_snapshot"), "source snapshot disappeared");
check(migration.includes("critique_artefact_daily_run_limit"), "hard run limit disappeared");
check(migration.includes("critique_artefact_daily_spend_limit"), "hard spend limit disappeared");
check(migration.includes("critique_artefact_stale_source"), "stale-source refusal disappeared");
check(migration.includes("p_purpose not in ('standard', 'evidence', 'signature', 'meta', 'revision')"), "bounded usage purposes disappeared");

const probe = contract.hosted_probe;
check(probe.anonymous_status === 401, "anonymous refusal drifted");
check(probe.wrong_method_status === 405, "method refusal drifted");
check(probe.wrong_media_status === 415, "media refusal drifted");
check(probe.oversized_status === 413, "byte-limit refusal drifted");
check(probe.direct_rpc_status === 403, "private capability refusal drifted");
check(probe.primary_terminal_status === "done" && probe.primary_has_result === true, "primary completion proof drifted");
check(JSON.stringify(probe.primary_lenses_ran) === JSON.stringify(["evidence", "signature"]), "independent lens proof drifted");
check(probe.primary_meta_ran === true, "meta-judge proof drifted");
check(probe.primary_usage_receipts === 3 && probe.primary_distinct_purposes === 3, "usage receipt proof drifted");
check(probe.retry_idempotent === true && probe.retry_same_run === true, "retry identity proof drifted");
check(probe.conflict_status === 409 && probe.conflict_error === "request_id_conflict", "request conflict proof drifted");
check(probe.cross_tenant_run_rows === 0, "tenant isolation proof drifted");
check(probe.ninth_status === 429 && probe.spend_status === 429, "hard admission proof drifted");
check(probe.stale_terminal_stage === "failed" && probe.stale_has_result === false, "stale-source atomicity proof drifted");
check(probe.atomic_terminal_stage === "failed" && probe.atomic_has_result === false, "late-failure atomicity proof drifted");
check(Object.values(probe.cleanup).every((value) => value === 0), "hosted probe cleanup drifted");

check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.production_functions_deployed === 0, "production deploy boundary drifted");
check(contract.authority.merge_authorized === false, "merge gate opened");
check(contract.interpretation_boundary.critique_quality_proved_for_all_work === false, "universal quality was claimed");
check(contract.interpretation_boundary.held_out_measurement_consumer_proved === false, "measurement consumer was claimed");
check(contract.interpretation_boundary.verified_release_claim_authorized === false, "verified release was authorized");

const combined = `${contractRaw}\n${note}\n${qa}`;
check(!combined.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("conveyor belt of specialists"), "modular judge architecture disappeared");
check(note.includes("absence is disclosed"), "honest abstention disappeared");
check(qa.includes("Production writes: zero"), "production boundary disappeared from QA");

if (failures.length) {
  console.error(`[g25-critique-artefact-authority-r112] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-critique-artefact-authority-r112] PASS: independent critique is owner-bound, snapshot-pinned, metered and atomically published on the isolated host; production remains closed");
