import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildManifest } from "./inspect-ctrl-g25-repo-function-manifest-r99.mjs";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-isolated-share-card-hosted-proof-r102.json";
const notePath = "project-documentation/ctrl-evolution/g25-isolated-share-card-hosted-proof-r102.md";
const qaPath = "project-documentation/ctrl-evolution/g25-isolated-share-card-hosted-proof-r102-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const migration = read(contract.rate_limit_authority.migration_path);
const manifest = buildManifest();
const share = manifest.functions.find((entry) => entry.slug === "share-card");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(contractRaw.endsWith("\n"), "contract JSON must end with one newline");
check(contract.status === "single_non_email_function_hosted_pass_broader_restoration_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq", "isolated target drifted");
check(contract.target.production === false, "target was mislabeled as production");
check(sha256(migration) === contract.rate_limit_authority.migration_sha256, "rate-limit migration hash drifted");
check(migration.includes("security definer"), "rate-limit routine is not security definer");
check(migration.includes("set search_path = ''"), "rate-limit routine search path is not closed");
check(migration.includes("revoke all on function public.check_rate_limit"), "broad rate-limit execute revoke missing");
check(migration.includes("grant execute on function public.check_rate_limit"), "service-role rate-limit grant missing");
check(contract.rate_limit_authority.rls_enabled === true, "RLS proof drifted");
check(contract.rate_limit_authority.public_anon_authenticated_execute_grants === 0, "broad execute grant appeared");
check(contract.rate_limit_authority.test_rows_after_cleanup === 0, "hosted probe fixture remains");

check(share?.source_sha256 === contract.deployment.local_route_source_sha256, "share-card source digest drifted");
check(/^[0-9a-f]{64}$/.test(contract.deployment.local_shared_source_sha256), "share-card deploy-time shared digest is invalid");
check(share?.config_verify_jwt === contract.deployment.verify_jwt, "share-card gateway posture drifted");
check(contract.deployment.version === 1 && contract.deployment.status === "ACTIVE", "hosted deployment receipt drifted");
check(contract.deployment.other_functions_deployed_in_target === 0, "unexpected isolated function count recorded");

check(contract.hosted_probe.valid_get.status === 200, "valid hosted GET did not pass");
check(contract.hosted_probe.valid_get.content_type === "image/png", "hosted content type drifted");
check(JSON.stringify(contract.hosted_probe.valid_get.png_signature) === JSON.stringify([137, 80, 78, 71, 13, 10, 26, 10]), "PNG signature drifted");
check(contract.hosted_probe.post.status === 405, "method rejection drifted");
check(contract.hosted_probe.oversized_url.status === 413, "oversized URL rejection drifted");
check(contract.failure_recovery.first_valid_get_status === 503 && contract.failure_recovery.second_valid_get_status === 200, "failure recovery receipt drifted");

check(contract.authority.secret_values_retrieved === false, "secret-value boundary drifted");
check(contract.authority.customer_rows_read === 0 && contract.authority.customer_rows_written === 0, "customer-data boundary drifted");
check(contract.authority.isolated_functions_deployed === 1, "isolated deployment count drifted");
check(contract.authority.production_functions_deployed === 0, "production deployment was fabricated");
check(contract.authority.production_writes === 0, "production write was fabricated");

const prose = `${contractRaw}\n${read(notePath)}\n${read(qaPath)}`;
check(!prose.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(prose), "credential-shaped content detected");
check(read(notePath).includes("This proves one route, not the function estate"), "bounded hosted claim disappeared");
check(read(qaPath).includes("Broader Edge Function restoration approved: no"), "broader restoration gate disappeared");

if (failures.length) {
  console.error(`[g25-isolated-share-card-hosted-proof-r102] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-isolated-share-card-hosted-proof-r102] PASS: one isolated non-email route passed end to end; broader restoration remains closed");
