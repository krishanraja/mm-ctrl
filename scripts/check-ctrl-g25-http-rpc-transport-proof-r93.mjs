import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-http-rpc-transport-proof-r93.json"));
const note = read("project-documentation/ctrl-evolution/g25-http-rpc-transport-proof-r93.md");
const qa = read("project-documentation/ctrl-evolution/g25-http-rpc-transport-proof-r93-qa-record.md");
const anonymousProbe = read(contract.artifacts.anonymous_probe_path);
const authenticatedProbe = read(contract.artifacts.authenticated_probe_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "isolated_http_transport_proved_production_execution_closed", "status drifted");
check(contract.target.kind === "isolated_recovery_project", "isolated target boundary drifted");
check(contract.target.production_writes === 0, "production write boundary drifted");
check(contract.anonymous_transport.public_routes.length === 2, "public-route count drifted");
check(contract.anonymous_transport.public_routes.every((entry) => entry.status === 200), "public route no longer passed");
check(contract.anonymous_transport.denied_routes.length === 3, "anonymous denial count drifted");
check(contract.anonymous_transport.denied_routes.every((entry) => entry.status === 401 && entry.code === "42501"), "anonymous denial evidence drifted");
check(contract.anonymous_transport.role_helper.status === 300 && contract.anonymous_transport.role_helper.code === "PGRST203", "role-helper overload truth drifted");
check(contract.authenticated_transport.authentication.length === 2, "authentication coverage drifted");
check(contract.authenticated_transport.authentication.every((entry) => entry.status === 200), "fixture authentication no longer passed");
check(contract.authenticated_transport.owner_paths.length === 5, "owner-path count drifted");
check(contract.authenticated_transport.owner_paths.every((entry) => entry.status >= 200 && entry.status < 300), "owner path no longer passed");
check(contract.authenticated_transport.cross_subject_paths.length === 4, "cross-subject path count drifted");
check(contract.authenticated_transport.cross_subject_paths.find((entry) => entry.name === "verify_memory_fact")?.result === false, "cross-subject fact denial drifted");
check(contract.authenticated_transport.cross_subject_paths.find((entry) => entry.name === "pin_decision")?.status === 403, "cross-subject decision denial drifted");
check(contract.authenticated_transport.post_state.owned_fact === "verified", "owned fact did not change");
check(contract.authenticated_transport.post_state.cross_subject_fact === "inferred", "cross-subject fact changed");
check(contract.authenticated_transport.post_state.owned_decision_pinned === true, "owned decision was not pinned");
check(contract.authenticated_transport.post_state.cross_subject_decision_pinned === false, "cross-subject decision changed");
check(Object.entries(contract.cleanup).every(([key, value]) => key === "secrets_persisted" ? value === false : value === 0), "fixture cleanup drifted");
check(sha256(anonymousProbe) === contract.artifacts.anonymous_probe_sha256, "anonymous probe hash drifted");
check(sha256(authenticatedProbe) === contract.artifacts.authenticated_probe_sha256, "authenticated probe hash drifted");
check(!anonymousProbe.includes("sb_publishable_") && !authenticatedProbe.includes("sb_publishable_"), "publishable key was embedded");
check(!authenticatedProbe.includes("access_token\")"), "access token logging was introduced");
check(contract.acceptance_gate.authenticated_http_transport_smoke_passed === true, "authenticated HTTP proof disappeared");
check(contract.acceptance_gate.extension_compatibility_passed === false, "extension compatibility was fabricated");
check(contract.acceptance_gate.critical_path_smoke_passed === false, "critical-path smoke was fabricated");
check(contract.acceptance_gate.explicit_production_execution_authority === false, "production authority was fabricated");
check(contract.acceptance_gate.production_applied === false, "production application was fabricated");
check(contract.acceptance_gate.production_mutation_ready === false, "production gate opened");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Production is unchanged."), "production boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-http-rpc-transport-proof-r93] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-http-rpc-transport-proof-r93] PASS: isolated Auth and PostgREST preserve owner and cross-subject boundaries");
