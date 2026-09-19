import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const hash = (path) => createHash("sha256").update(read(path)).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-measure-standard-authority-r113.json";
const notePath = "project-documentation/ctrl-evolution/g25-measure-standard-authority-r113.md";
const qaPath = "project-documentation/ctrl-evolution/g25-measure-standard-authority-r113-qa-record.md";
const raw = read(contractPath);
const contract = JSON.parse(raw);
const route = read(contract.artifacts.route);
const migration = read(contract.artifacts.migration);
const gate = read(contract.artifacts.gate);
const confusion = read("supabase/functions/_shared/confusion.ts");
const operator = read(contract.artifacts.operator_wrapper);
const standardReader = read(contract.artifacts.standard_reader);
const containment = read("supabase/containment/manifest.json");
const config = read("supabase/config.toml");
const docs = `${raw}\n${read(notePath)}\n${read(qaPath)}`;
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(raw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "isolated_hosted_hidden_label_measurement_proved_production_closed", "status drifted");
check(hash(contract.artifacts.route) === contract.artifacts.route_sha256, "route hash drifted");
check(hash(contract.artifacts.migration) === contract.artifacts.migration_sha256, "migration hash drifted");
check(hash(contract.artifacts.gate) === contract.artifacts.gate_sha256, "gate hash drifted");
check(hash("supabase/functions/_shared/confusion.ts") === contract.artifacts.confusion_sha256, "confusion hash drifted");
check(hash(contract.artifacts.operator_wrapper) === contract.artifacts.operator_wrapper_sha256, "operator wrapper hash drifted");
check(hash(contract.artifacts.standard_reader) === contract.artifacts.standard_reader_sha256, "standard reader hash drifted");
check(hash(contract.artifacts.probe) === contract.artifacts.probe_sha256, "probe hash drifted");
check(hash("supabase/containment/manifest.json") === contract.artifacts.containment_manifest_sha256, "containment hash drifted");
check(hash("supabase/config.toml") === contract.artifacts.config_sha256, "config hash drifted");
check(hash("scripts/inspect-ctrl-g25-function-env-requirements-r104.mjs") === contract.artifacts.environment_inspector_sha256, "environment inspector hash drifted");

for (const marker of [
  "auth.getUser(", "EXPECTED_SUPABASE_PROJECT_REF", "MEASURE_STANDARD_RPC_SECRET",
  "reserve_measure_standard_run", "record_measure_standard_usage", "finish_measure_standard_run",
  "gateFromStandardVerdicts", "selectExemplars",
]) check(route.includes(marker), `route marker missing: ${marker}`);
for (const forbidden of ["SUPABASE_SERVICE_ROLE_KEY", "bkyuxvschuwngtcdhsyg", "req.json(", "target_user_id"]) {
  check(!route.includes(forbidden), `forbidden route marker present: ${forbidden}`);
}
check(/interface TargetItem \{ id: string; position: number; surface: string; body: string \}/.test(route), "target material gained an answer field");
check(route.includes('gate: "insufficient"'), "provider failure no longer becomes insufficient");
check(!route.includes("sort_grades"), "Edge route can read hidden grades directly");

for (const marker of [
  "current_standard_measurement_source", "Strip every human verdict before returning evaluation material",
  "measure_standard_exemplar_leak", "measure_standard_incomplete_predictions",
  "measure_standard_missing_usage_receipt", "measure_standard_source_changed",
  "standard_measurements", "source_snapshot",
]) check(migration.includes(marker), `migration marker missing: ${marker}`);
check(migration.includes("'id', t->>'id', 'position'"), "returned targets are not rebuilt from an allowlist");
check(migration.includes("v_human := v_target->>'verdict'"), "database no longer joins the hidden label after prediction");
check(migration.includes("v_scored >= 10"), "Verified scored-item floor disappeared from the atomic finalizer");
check(confusion.includes("denominator laundering"), "shared release logic lost the exclusion guard");
check(confusion.includes("scoredHeldOut"), "shared release label no longer uses scored held-out work");
check(gate.includes('return { gate: "insufficient", scoredCriteria: 0 }'), "empty lens answer became a pass");

check(!operator.includes("bkyuxvschuwngtcdhsyg"), "operator wrapper regained a production default");
check(!operator.includes("generate_link"), "operator wrapper can mint an owner session");
check(operator.includes("measure-standard"), "operator wrapper bypasses the canonical route");
check(operator.includes("releaseVerdict"), "operator wrapper does not rederive release standing");
check(standardReader.includes("scored_held_out"), "product reader can launder excluded items into the denominator");
check(standardReader.includes("!meta.measurement_id"), "product reader can prefer the stale pre-measurement reason");

const manifest = JSON.parse(containment);
const entry = manifest.functions.find((row) => row.name === "measure-standard");
check(entry?.verify_jwt === true, "containment entry is not JWT verified");
check(entry?.action?.includes("hidden-label"), "containment entry lost hidden-label boundary");
check(config.includes("[functions.measure-standard]\nverify_jwt = true") || config.includes("[functions.measure-standard]\r\nverify_jwt = true"), "function config lost JWT verification");

const proof = contract.hosted_proof;
check(proof.anonymous_status === 401 && proof.direct_rpc_status === 403, "hosted caller boundary drifted");
check(proof.first_status === 202 && proof.primary_status === "done", "hosted measurement did not complete");
check(proof.held_out_graded === 10 && proof.scored_held_out === 10 && proof.usage_receipts === 10, "hosted denominator or receipt count drifted");
check(proof.confusion.tp === 5 && proof.confusion.fp === 0 && proof.confusion.fn === 0 && proof.confusion.tn === 5, "hosted matrix drifted");
check(proof.cross_tenant_rows === 0, "cross-tenant proof drifted");
check(proof.stale_source_error === "source_changed_retry" && proof.stale_source_measurements === 0, "stale-source atomicity proof drifted");
check(Object.values(proof.cleanup).every((value) => value === 0), "hosted fixtures remain");

check(contract.target.production_writes === 0, "production write boundary drifted");
check(contract.boundary.production_deployed === false, "production deployment was claimed");
check(contract.boundary.merge_or_cutover_authorized === false, "merge or cutover was authorised");
check(contract.boundary.legacy_retirement_authorized === false, "legacy retirement was authorised");
check(!docs.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(docs), "credential-shaped content detected");

if (failures.length) {
  console.error(`[g25-measure-standard-authority-r113] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`[g25-measure-standard-authority-r113] PASS: hidden-label measurement, exact denominator, atomic release evidence and production boundary are frozen.`);

