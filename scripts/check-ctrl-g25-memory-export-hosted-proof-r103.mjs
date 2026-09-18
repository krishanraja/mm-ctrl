import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildManifest } from "./inspect-ctrl-g25-repo-function-manifest-r99.mjs";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-memory-export-hosted-proof-r103.json";
const notePath = "project-documentation/ctrl-evolution/g25-memory-export-hosted-proof-r103.md";
const qaPath = "project-documentation/ctrl-evolution/g25-memory-export-hosted-proof-r103-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const manifest = buildManifest();
const memoryExport = manifest.functions.find((entry) => entry.slug === "memory-export");
const source = read("supabase/functions/memory-export/index.ts");
const builder = read("supabase/functions/_shared/memory-context-builder.ts");
const probe = read(contract.deployment.probe_path);
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(contractRaw.endsWith("\n"), "contract JSON must end with one newline");
check(contract.status === "authenticated_owner_export_hosted_pass_broader_brain_routes_closed", "status drifted");
check(contract.target.project_ref === "cgkcplcamsijghalintq" && contract.target.production === false, "isolated target boundary drifted");
check(memoryExport?.source_sha256 === contract.deployment.local_route_source_sha256, "memory-export source digest drifted");
check(memoryExport?.config_verify_jwt === true, "memory-export gateway JWT drifted");
check(sha256(probe) === contract.deployment.probe_sha256, "probe hash drifted");
check(source.includes("auth.getUser("), "verified user lookup disappeared");
check(source.includes("readJsonWithLimit("), "request byte budget disappeared");
check(source.includes("await supabase.rpc(\"touch_memory_facts\""), "awaited reliance receipt disappeared");
for (const marker of ["memory_export_hot_facts_failed", "memory_export_warm_facts_failed", "memory_export_patterns_failed", "memory_export_decisions_failed"]) {
  check(builder.includes(marker), `fail-loud query marker missing: ${marker}`);
}

const hosted = contract.hosted_probe;
check(hosted.anonymous_status === 401, "anonymous denial drifted");
check(hosted.owner_status === 200 && hosted.owner_fact_count === 1, "owner export drifted");
check(hosted.owner_marker_present === true && hosted.cross_subject_marker_absent === true, "owner isolation drifted");
check(hosted.touched_fact_count === 1 && hosted.reliance_reference_count === 1, "reliance receipt drifted");
check(hosted.invalid_format_status === 400 && hosted.invalid_budget_status === 400 && hosted.wrong_method_status === 405, "input rejection drifted");
check(Object.entries(contract.cleanup).every(([key, value]) => key === "secret_values_persisted" ? value === false : value === 0), "fixture cleanup drifted");
check(contract.authority.customer_rows_read === 0 && contract.authority.customer_rows_written === 0, "customer-data boundary drifted");
check(contract.authority.secret_values_retrieved === false, "secret-value boundary drifted");
check(contract.authority.production_functions_deployed === 0 && contract.authority.production_writes === 0, "production boundary drifted");

const prose = `${contractRaw}\n${read(notePath)}\n${read(qaPath)}`;
check(!prose.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(prose), "credential-shaped content detected");
check(read(notePath).includes("It does not yet prove a complete account archive"), "portability boundary disappeared");
check(read(qaPath).includes("Broader Brain function restoration approved: no"), "broader restoration gate disappeared");

if (failures.length) {
  console.error(`[g25-memory-export-hosted-proof-r103] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-memory-export-hosted-proof-r103] PASS: authenticated owner export and cross-subject isolation passed; complete portability remains open");
