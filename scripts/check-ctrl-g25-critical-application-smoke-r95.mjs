import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-critical-application-smoke-r95.json"));
const note = read("project-documentation/ctrl-evolution/g25-critical-application-smoke-r95.md");
const qa = read("project-documentation/ctrl-evolution/g25-critical-application-smoke-r95-qa-record.md");
const smoke = read(contract.isolated_database_smoke.path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "bounded_critical_layers_pass_non_schema_end_to_end_blocked", "status drifted");
check(sha256(smoke) === contract.isolated_database_smoke.sha256, "database smoke hash drifted");
check(contract.isolated_database_smoke.result === "pass", "database smoke pass disappeared");
check(contract.isolated_database_smoke.paths.length === 4, "database path coverage drifted");
check(contract.isolated_database_smoke.remaining_fixture_rows === 0, "database fixtures remain");
check(contract.local_characterization.test_files === 17, "local test-file count drifted");
check(contract.local_characterization.tests === 205, "local test count drifted");
check(contract.local_characterization.result === "pass", "local characterization pass disappeared");
check(contract.production_bundle.direct_vite_build === "pass", "direct production bundle regressed");
check(contract.production_bundle.vite_modules_transformed === 2812, "bundle module count drifted");
check(contract.production_bundle.formal_npm_build.result === "blocked_before_vite", "formal build boundary drifted");
check(contract.production_bundle.formal_npm_build.product_code_failure === false, "standards failure was misclassified");
check(contract.hosted_non_schema_gap.production.edge_functions === 183, "production function inventory drifted");
check(contract.hosted_non_schema_gap.isolated_recovery.edge_functions === 0, "isolated function inventory drifted");
check(contract.hosted_non_schema_gap.production.storage_buckets === 5, "production bucket inventory drifted");
check(contract.hosted_non_schema_gap.isolated_recovery.storage_buckets === 0, "isolated bucket inventory drifted");
check(contract.hosted_non_schema_gap.production.cron_jobs === 15, "production schedule inventory drifted");
check(contract.hosted_non_schema_gap.isolated_recovery.cron_jobs === 0, "isolated schedule inventory drifted");
check(contract.acceptance_gate.isolated_database_critical_smoke_passed === true, "database gate regressed");
check(contract.acceptance_gate.local_critical_characterization_passed === true, "local gate regressed");
check(contract.acceptance_gate.direct_production_bundle_passed === true, "bundle gate regressed");
check(contract.acceptance_gate.full_hosted_critical_application_smoke_passed === false, "full hosted pass was fabricated");
check(contract.acceptance_gate.non_schema_restoration_passed === false, "non-schema restoration was fabricated");
check(contract.acceptance_gate.production_recovery_choice_ready === false, "production recovery gate opened");
check(contract.authority.customer_data_used === false, "customer-data boundary drifted");
check(contract.authority.external_model_or_email_spend === false, "external spend boundary drifted");
check(contract.authority.edge_functions_deployed === 0, "function deployment was fabricated");
check(contract.authority.production_writes === 0, "production write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Passing local tests does not make remote machinery exist."), "hosted boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-critical-application-smoke-r95] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-critical-application-smoke-r95] PASS: executable critical layers pass and absent hosted machinery remains explicit");
