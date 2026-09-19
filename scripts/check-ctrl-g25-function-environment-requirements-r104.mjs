import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEnvironmentManifest } from "./inspect-ctrl-g25-function-env-requirements-r104.mjs";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const jsonHash = (value) => sha256(`${JSON.stringify(value)}\n`);
const contractPath = "project-documentation/ctrl-evolution/g25-function-environment-requirements-r104.json";
const notePath = "project-documentation/ctrl-evolution/g25-function-environment-requirements-r104.md";
const qaPath = "project-documentation/ctrl-evolution/g25-function-environment-requirements-r104-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const note = read(notePath);
const qa = read(qaPath);
const manifest = buildEnvironmentManifest();
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const policy = manifest.environment_symbols.map(({ symbol, classification, secret, deployment_risk }) => ({
  symbol,
  classification,
  secret,
  deployment_risk,
}));
const routeRequirements = manifest.routes.map(({
  slug,
  closure_file_count,
  missing_relative_imports,
  environment_symbols,
  secret_environment_symbols,
  deployment_risks,
  closure_sha256,
}) => ({
  slug,
  closure_file_count,
  missing_relative_imports,
  environment_symbols,
  secret_environment_symbols,
  deployment_risks,
  closure_sha256,
}));
const unsortedClassificationCounts = manifest.environment_symbols.reduce((counts, entry) => {
  counts[entry.classification] = (counts[entry.classification] ?? 0) + 1;
  return counts;
}, {});
const classificationCounts = Object.fromEntries(Object.entries(unsortedClassificationCounts).sort(([left], [right]) => left.localeCompare(right)));
const riskRouteCounts = Object.fromEntries(manifest.risk_route_counts.map(({ risk, route_count }) => [risk, route_count]));
const platformSymbols = new Set([
  "DENO_DEPLOYMENT_ID",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
]);
const secretRoutes = manifest.routes.filter((route) => route.secret_environment_symbols.length > 0);
const zeroEnvironmentRoutes = manifest.routes.filter((route) => route.environment_symbols.length === 0);
const onlyPlatformRoutes = manifest.routes.filter((route) =>
  route.environment_symbols.length > 0 && route.environment_symbols.every((symbol) => platformSymbols.has(symbol))
);

check(contractRaw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "value_free_dependency_map_complete_staged_restoration_open", "status drifted");
check(sha256(read(contract.inspector.path)) === contract.inspector.sha256, "inspector hash drifted");
check(manifest.manifest_sha256 === contract.inspector.manifest_sha256, "derived manifest hash drifted");
check(jsonHash(policy) === contract.inspector.environment_policy_sha256, "environment policy hash drifted");
check(jsonHash(routeRequirements) === contract.inspector.route_requirements_sha256, "route requirements hash drifted");
check(contract.inspector.raw_source_emitted === false, "raw-source boundary drifted");
check(contract.inspector.environment_values_retrieved === false, "environment-value boundary drifted");

check(manifest.function_count === contract.coverage.repository_function_count, "function count drifted");
check(manifest.function_count === contract.coverage.entrypoint_count, "entrypoint count drifted");
check(manifest.function_count === 121, "repository function baseline no longer includes the candidate standard-change pipeline");
check(manifest.functions_with_missing_relative_imports.length === contract.coverage.functions_with_missing_relative_imports, "missing relative import count drifted");
check(manifest.functions_with_missing_relative_imports.length === 0, "a transitive relative import is missing");
check(manifest.unique_environment_symbol_count === contract.coverage.unique_environment_symbol_count, "environment symbol count drifted");
check(manifest.unclassified_environment_symbols.length === contract.coverage.unclassified_environment_symbol_count, "unclassified symbol count drifted");
check(manifest.unclassified_environment_symbols.length === 0, "an environment symbol lacks policy");
check(manifest.stale_environment_policy_entries.length === contract.coverage.stale_environment_policy_entry_count, "stale policy entry count drifted");
check(manifest.stale_environment_policy_entries.length === 0, "an environment policy entry is stale");
check(secretRoutes.length === contract.coverage.routes_with_secret_dependency, "secret-dependent route count drifted");
check(manifest.function_count - secretRoutes.length === contract.coverage.routes_without_secret_dependency, "non-secret route count drifted");
check(zeroEnvironmentRoutes.length === contract.coverage.routes_with_no_environment_dependency, "zero-environment route count drifted");
check(onlyPlatformRoutes.length === contract.coverage.routes_with_only_platform_injected_dependencies, "platform-only route count drifted");
check(JSON.stringify(classificationCounts) === JSON.stringify(contract.classification_counts), "classification counts drifted");
check(JSON.stringify(riskRouteCounts) === JSON.stringify(contract.environment_scoped_route_risk_counts), "risk route counts drifted");

check(contract.restoration_ladder.length === 6, "restoration ladder length drifted");
check(contract.restoration_ladder.map((entry) => entry.stage).join(",") === "0,1,2,3,4,5", "restoration ladder ordering drifted");
check(JSON.stringify(contract.restoration_ladder[0].routes) === JSON.stringify(["share-card", "memory-export"]), "proved hosted route set drifted");
check(contract.restoration_ladder.slice(1).every((entry) => entry.routes.length === 0), "an unproved route was admitted to the restoration ladder");
check(contract.interpretation_boundary.environment_scan_is_security_proof === false, "environment scan became security proof");
check(contract.interpretation_boundary.absence_of_environment_dependency_means_safe === false, "missing environment usage became a safety verdict");
check(contract.interpretation_boundary.platform_injected_service_role_means_route_approved === false, "service-role injection became route approval");
check(contract.interpretation_boundary.route_lists_are_inferred_from_environment_only === true, "environment-scope boundary drifted");
check(contract.interpretation_boundary.route_specific_behavioral_proof_required === true, "route-specific proof requirement disappeared");

check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.isolated_secret_values_written === 0, "isolated secret write was claimed");
check(contract.authority.secret_values_retrieved === false, "secret retrieval was claimed");
check(contract.authority.raw_live_only_source_retrieved === false, "raw live-only source retrieval was claimed");
check(contract.authority.isolated_functions_deployed_by_r104 === 0, "R104 deployment was claimed");
check(contract.authority.production_functions_deployed === 0, "production deployment was claimed");
check(contract.authority.billing_routes_open === false, "billing route gate opened");
check(contract.authority.email_routes_open === false, "email route gate opened");
check(contract.authority.model_spend_routes_open === false, "model-spend route gate opened");
check(contract.authority.legacy_retirement_open === false, "legacy retirement gate opened");

const combined = `${contractRaw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("environment facts, not safety verdicts"), "interpretation boundary disappeared");
check(note.includes("No environment value was retrieved or persisted"), "value-free boundary disappeared");
check(qa.includes("Missing relative imports: zero"), "closure proof disappeared");
check(qa.includes("Production writes: zero"), "production boundary disappeared");

if (failures.length) {
  console.error(`[g25-function-environment-requirements-r104] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-function-environment-requirements-r104] PASS: all repository function closures and environment requirements are classified without values; restoration stays staged");
