import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildManifest } from "./inspect-ctrl-g25-repo-function-manifest-r99.mjs";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-repo-function-source-manifest-r99.json";
const notePath = "project-documentation/ctrl-evolution/g25-repo-function-source-manifest-r99.md";
const qaPath = "project-documentation/ctrl-evolution/g25-repo-function-source-manifest-r99-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const note = read(notePath);
const qa = read(qaPath);
const manifest = buildManifest();
const r79 = JSON.parse(read("project-documentation/ctrl-evolution/g25-recovery-non-schema-manifest-r79.json"));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contractRaw === `${JSON.stringify(contract, null, 2)}\n`, "contract JSON is not canonical");
check(contract.status === "repo_function_source_and_gateway_posture_complete_route_proof_open", "status drifted");
check(sha256(read(contract.inspector.path)) === contract.inspector.sha256, "inspector hash drifted");
check(manifest.manifest_sha256 === contract.inspector.manifest_sha256, "derived manifest hash drifted");
check(contract.inspector.raw_source_emitted_by_default === false, "inspector raw-source boundary drifted");

check(manifest.summary.local_function_count === contract.source.local_function_count, "local function count drifted");
check(manifest.summary.entrypoint_count === contract.source.entrypoint_count, "entrypoint count drifted");
check(manifest.summary.local_function_count === 122, "local function inventory no longer includes the owner-gated standard-change review route");
check(manifest.summary.entrypoint_count === 122, "a local function entrypoint is missing");
check(manifest.generated_from.shared_file_count === contract.source.shared_file_count, "shared file count drifted");
check(manifest.generated_from.shared_source_bytes === contract.source.shared_source_bytes, "shared source byte count drifted");
check(manifest.generated_from.shared_source_sha256 === contract.source.shared_source_sha256, "shared source digest drifted");
check(contract.source.per_function_source_digest_count === manifest.functions.length, "per-function digest coverage drifted");
check(manifest.summary.configured_without_local_source_count === 0, "configured route without source appeared");
check(manifest.functions.every((entry) => entry.shared_source_sha256 === manifest.generated_from.shared_source_sha256), "a function is not bound to shared source");

check(manifest.generated_from.config_sha256 === contract.gateway_posture.config_sha256, "function config hash drifted");
check(manifest.summary.explicit_verify_jwt_true === contract.gateway_posture.explicit_verify_jwt_true, "JWT-true count drifted");
check(manifest.summary.explicit_verify_jwt_false === contract.gateway_posture.explicit_verify_jwt_false, "JWT-false count drifted");
check(manifest.summary.verify_jwt_unspecified === contract.gateway_posture.verify_jwt_unspecified, "unspecified JWT count drifted");
check(manifest.summary.explicit_verify_jwt_true === 88, "expected eighty-eight explicit JWT routes");
check(manifest.summary.explicit_verify_jwt_false === 34, "expected thirty-four explicit non-JWT routes");
check(manifest.summary.verify_jwt_unspecified === 0, "implicit gateway posture remains");
check(contract.gateway_posture.shared_production_functions_compared === 115, "production comparison coverage drifted");
check(contract.gateway_posture.explicit_posture_mismatches === 1, "intentional production posture mismatch count drifted");
check(JSON.stringify(contract.gateway_posture.intentional_security_overrides) === JSON.stringify(["prompt-coach:false_to_true"]), "security override inventory drifted");
check(contract.gateway_posture.previously_implicit_postures_frozen === 48, "recovered posture count drifted");
check(contract.gateway_posture.previously_implicit_true === 47, "recovered JWT-true count drifted");
check(contract.gateway_posture.previously_implicit_false === 1, "recovered JWT-false count drifted");
check(contract.gateway_posture.previously_implicit_false_slug === "nudge-briefing", "recovered JWT-false route drifted");
check(contract.gateway_posture.boundary.includes("not evidence"), "gateway preservation became a security verdict");

check(contract.production_metadata.live_active === r79.edge_functions.live_active, "live function inventory drifted from R79");
check(contract.production_metadata.shared_live_and_local === r79.edge_functions.shared_live_and_local, "shared function inventory drifted from R79");
check(contract.production_metadata.live_only === r79.edge_functions.live_only, "live-only inventory drifted from R79");
check(contract.production_metadata.repo_only === 7, "forward repo-only function count drifted");
check(contract.production_metadata.metadata_digest_fields.join("|") === "slug|verify_jwt|version|entrypoint_path|import_map", "production metadata digest fields drifted");
check(/^[0-9a-f]{64}$/.test(contract.production_metadata.metadata_sha256), "production metadata digest is invalid");

check(manifest.summary.service_role_marker_count === contract.static_markers.functions_with_service_role_marker, "service-role marker count drifted");
check(manifest.summary.explicit_get_user_marker_count === contract.static_markers.functions_with_explicit_get_user_marker, "getUser marker count drifted");
check(manifest.summary.unique_environment_symbol_count === contract.static_markers.unique_environment_symbol_count, "environment-symbol count drifted");
check(JSON.stringify(manifest.unique_environment_symbols) === JSON.stringify(contract.static_markers.environment_symbols), "environment-symbol inventory drifted");
check(contract.static_markers.environment_symbol_values_retrieved === false, "environment values were claimed as retrieved");
check(contract.static_markers.boundary.includes("dependency evidence only"), "static markers became runtime proof");

check(contract.open_work.repo_backed_route_authentication_proofs_required === 122, "route-proof queue drifted");
check(contract.open_work.jwt_disabled_repo_routes_requiring_route_specific_review === 34, "JWT-disabled review queue drifted");
check(contract.open_work.live_only_functions_without_repo_source === 68, "live-only preservation queue drifted");
check(contract.open_work.live_only_disposition.startsWith("preserve_until_"), "live-only preserve boundary disappeared");
check(contract.open_work.isolated_deployment_ready === false, "isolated deployment was prematurely opened");
check(contract.acceptance_gate.all_repo_function_sources_fingerprinted === true, "source fingerprint gate regressed");
check(contract.acceptance_gate.all_repo_function_entrypoints_present === true, "entrypoint gate regressed");
check(contract.acceptance_gate.all_repo_gateway_postures_explicit === true, "gateway posture gate regressed");
check(contract.acceptance_gate.shared_production_gateway_postures_match === false, "intentional gateway hardening disappeared");
check(contract.acceptance_gate.shared_production_gateway_postures_accounted_for === true, "gateway posture accounting regressed");
check(contract.acceptance_gate.environment_values_ready === false, "environment-value gate was fabricated");
check(contract.acceptance_gate.route_authentication_proved === false, "route authentication was fabricated");
check(contract.acceptance_gate.live_only_source_recovered === false, "live-only recovery was fabricated");
check(contract.acceptance_gate.edge_function_restoration_ready === false, "function restoration gate opened");
check(contract.authority.production_writes === 0, "production write boundary drifted");
check(contract.authority.raw_live_source_retrieved === false, "raw live source retrieval was fabricated");
check(contract.authority.secret_values_retrieved === false, "secret retrieval was fabricated");
check(contract.authority.isolated_functions_deployed === 0, "isolated deployment was fabricated");
check(contract.authority.production_functions_deployed === 0, "production deployment was fabricated");

const combined = `${contractRaw}\n${note}\n${qa}`;
const emDash = String.fromCodePoint(0x2014);
check(!combined.includes(emDash), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(combined), "credential-shaped content detected");
check(note.includes("This is preservation, not approval"), "security boundary disappeared");
check(note.includes("No value was retrieved, printed or persisted"), "environment-value boundary disappeared");
check(qa.includes("Unspecified local gateway posture: zero"), "QA explicit-posture proof disappeared");
check(qa.includes("Production writes: zero"), "QA production boundary disappeared");

if (failures.length) {
  console.error(`[g25-repo-function-source-manifest-r99] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-repo-function-source-manifest-r99] PASS: repository function source and gateway posture are deterministic; route security remains open");
