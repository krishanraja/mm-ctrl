import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => read(relative).toString("utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-recovery-first-blank-replay-r81.json";
const notePath = "project-documentation/ctrl-evolution/g25-recovery-first-blank-replay-r81.md";
const qaPath = "project-documentation/ctrl-evolution/g25-recovery-first-blank-replay-r81-qa-record.md";
const contract = JSON.parse(text(contractPath));
const note = text(notePath);
const qa = text(qaPath);
const baselinePath = contract.capture.baseline_path;
const probePath = contract.first_blank_replay.fingerprint_probe_path;
const baseline = read(baselinePath);
const baselineText = baseline.toString("utf8");
const probe = read(probePath);
const probeText = probe.toString("utf8");

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contract.status === "first_blank_replay_exact_second_blank_replay_gated", "status drifted");
check(statSync(resolve(root, baselinePath)).size === contract.capture.baseline_bytes, "baseline byte count drifted");
check(sha256(baseline) === contract.capture.baseline_sha256, "baseline hash drifted");
check(sha256(probe) === contract.first_blank_replay.fingerprint_probe_sha256, "fingerprint probe hash drifted");
check(contract.capture.included_schemas.join("|") === "public|private|ctrl_discovery", "application schema set drifted");
for (const schema of contract.capture.included_schemas) {
  check(baselineText.includes(`CREATE SCHEMA IF NOT EXISTS "${schema}";`), `baseline is missing schema ${schema}`);
  check(probeText.includes(`'${schema}'`), `probe is missing schema ${schema}`);
}

const topLevelCopies = baselineText.match(/^COPY\s/giu) ?? [];
const topLevelInserts = baselineText.match(/^INSERT\s+INTO\s/giu) ?? [];
check(topLevelCopies.length === contract.capture.top_level_copy_statements, "top-level COPY count drifted");
check(topLevelInserts.length === contract.capture.top_level_insert_statements, "top-level INSERT count drifted");
check(contract.capture.customer_rows_included === false, "baseline cannot claim customer rows");

check(baselineText.includes('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public", "private", "ctrl_discovery" FROM "anon", "authenticated", "service_role";'), "table default ACL normalization disappeared");
check(baselineText.includes('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public", "private", "ctrl_discovery" FROM "anon", "authenticated", "service_role";'), "sequence default ACL normalization disappeared");
check(baselineText.includes('REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "public", "private", "ctrl_discovery" FROM "anon", "authenticated", "service_role";'), "function default ACL normalization disappeared");
check(baselineText.includes('REVOKE ALL PRIVILEGES ON SEQUENCE "private"."mindmake_personal_read_rate_events_id_seq" FROM "postgres";'), "sequence owner normalization disappeared");
check(baselineText.includes('GRANT USAGE ON SEQUENCE "private"."mindmake_personal_read_rate_events_id_seq" TO "postgres";'), "production sequence USAGE grant disappeared");

const expectedFingerprints = {
  columns: [2133, "6d21870f39c696a4bb087e6e8ff33438"],
  constraints: [774, "a290e41117eacaf26a8432e64942ca11"],
  indexes: [591, "40bec422cf245975fb4ed6034efc5e0e"],
  policies: [304, "db583e9d8c0cf3b920a728f4d6e276b3"],
  rls: [176, "c1962d417e21fc41cacf8174d46a9bc1"],
  routine_grants: [1080, "fc2586bdacb4ec9bb181a05996ef6881"],
  routines: [218, "e71c463e738e1bba91d784b8af66fb03"],
  schema_grants: [12, "f08632af471eac39debe086bfe584f03"],
  table_grants: [5071, "93b4759a3f418824bd775c83834f4815"],
  triggers: [53, "9138fb0284a3df5f69b33e96e5e9e2cc"],
  views: [9, "41073e0f76e7f2a4480078dcb8f8ed5a"]
};
check(Object.keys(contract.first_blank_replay.fingerprints).length === 11, "fingerprint domain count drifted");
for (const [domain, [count, digest]] of Object.entries(expectedFingerprints)) {
  const actual = contract.first_blank_replay.fingerprints[domain];
  check(actual?.object_count === count, `${domain} count drifted`);
  check(actual?.digest === digest, `${domain} digest drifted`);
}

check(contract.acceptance_gate.required_clean_blank_replays === 2, "two-replay gate disappeared");
check(contract.acceptance_gate.completed_clean_blank_replays === 1, "completed replay count was overstated");
check(contract.acceptance_gate.production_recovery_choice_ready === false, "recovery choice was prematurely opened");
check(contract.acceptance_gate.extension_runtime_parity_required === true, "extension behavior gate disappeared");
check(contract.advisor_snapshot.security.anon_security_definer_function_executable === 41, "anonymous SECURITY DEFINER risk disappeared");
check(contract.advisor_snapshot.security.authenticated_security_definer_function_executable === 45, "authenticated SECURITY DEFINER risk disappeared");
check(contract.authority.production_writes === 0, "production mutation boundary drifted");
check(contract.authority.customer_data_writes === 0, "customer data boundary drifted");

const forbiddenCredentialPatterns = [
  /sbp_[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /vcp_[A-Za-z0-9_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:postgres|postgresql):\/\/[^\s:@]+:[^\s@]+@/i
];
for (const [path, content] of [[baselinePath, baselineText], [probePath, probeText], [contractPath, text(contractPath)], [notePath, note], [qaPath, qa]]) {
  for (const pattern of forbiddenCredentialPatterns) check(!pattern.test(content), `credential-shaped literal found in ${path}`);
}

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("Only one is complete."), "honest one-of-two replay standing disappeared");
check(qa.includes("Production was not mutated."), "production read-only evidence disappeared");

if (failures.length) {
  console.error(`[g25-recovery-first-blank-replay-r81] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-recovery-first-blank-replay-r81] PASS: one blank replay is exact and every remaining recovery gate stays explicit");
