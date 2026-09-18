import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-second-blank-replay-packet-r97.json"));
const note = read("project-documentation/ctrl-evolution/g25-second-blank-replay-packet-r97.md");
const qa = read("project-documentation/ctrl-evolution/g25-second-blank-replay-packet-r97-qa-record.md");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(contract.status === "packet_prepared_execution_cost_gated", "status drifted");
check(contract.target_contract.target_project_id === null, "a target was fabricated");
check(contract.target_contract.required_cost_confirmation === true, "cost gate disappeared");
check(contract.target_contract.cost_confirmation_obtained === false, "cost confirmation was fabricated");
check(contract.target_contract.second_replay_executed === false, "second replay was fabricated");
check(contract.target_contract.production_writes === 0, "production write boundary drifted");

const extensions = contract.platform_prerequisites.required_extensions;
check(extensions.length === 8, "extension inventory must contain eight entries");
check(new Set(extensions.map((item) => `${item.name}:${item.schema}`)).size === 8, "extension inventory is not unique");
check(extensions.some((item) => item.name === "vector" && item.schema === "public"), "vector schema drifted");
check(extensions.some((item) => item.name === "pg_cron" && item.schema === "pg_catalog"), "pg_cron schema drifted");
check(extensions.some((item) => item.name === "supabase_vault" && item.schema === "vault"), "Vault schema drifted");

const stages = contract.ordered_stages;
const expectedIds = [
  "platform_extensions",
  "application_schema_baseline",
  "high_risk_service_acl",
  "auth_profile_trigger",
  "trigger_function_acl",
  "anonymous_reader_hardening",
  "memory_mutator_hardening",
  "authenticated_product_hardening",
  "null_identity_convergence",
  "secret_free_non_schema_safe_plane"
];
check(stages.length === expectedIds.length, "stage count drifted");
for (let index = 0; index < stages.length; index += 1) {
  const stage = stages[index];
  check(stage.order === index, `stage order drifted at ${index}`);
  check(stage.id === expectedIds[index], `stage identity drifted at ${index}`);
  const mutation = read(stage.mutation_path);
  const verification = read(stage.verification_path);
  check(sha256(mutation) === stage.mutation_sha256, `mutation hash drifted for ${stage.id}`);
  check(sha256(verification) === stage.verification_sha256, `verification hash drifted for ${stage.id}`);
  if (stage.preflight_path) {
    check(sha256(read(stage.preflight_path)) === stage.preflight_sha256, `preflight hash drifted for ${stage.id}`);
  }
}

const extensionStage = read(stages[0].mutation_path);
check((extensionStage.match(/create extension if not exists/gi) || []).length === 8, "extension stage no longer names eight extensions");
check(extensionStage.includes("Version compatibility is governed by G25-EXTENSION-RUNTIME-COMPATIBILITY-R94"), "runtime compatibility boundary disappeared");

check(stages[1].mutation_sha256 === "7bb1a96145efa2b47227f7ed425ff4804dea8ee7b355bddc4dc716af33e3c80d", "R81 baseline identity drifted");
const r81 = JSON.parse(read("project-documentation/ctrl-evolution/g25-recovery-first-blank-replay-r81.json"));
check(r81.capture.top_level_copy_statements === 0, "R81 capture gained top-level COPY data");
check(r81.capture.top_level_insert_statements === 0, "R81 capture gained top-level INSERT data");
check(r81.capture.customer_rows_included === false, "R81 capture gained customer rows");

const convergence = read(stages[8].mutation_path);
const convergenceVerification = read(stages[8].verification_path);
for (const digest of [
  "ff5645d77ee87cf085fe0199dcedb056",
  "69b10171b9fc6bd483b03f5cb5bf7809",
  "51d901710dd937d1cf29b1437c5f2bb6",
  "84e289e5cf89baab91b9250d6ffe7e16",
  "6d57896b69cc7727e4113b843ab64b31",
  "d65b21eb6b5d329355613fba323c5e80",
  "4e4fe71601c7b580d0a9a53bb5c58247"
]) {
  check(convergenceVerification.includes(digest), `convergence final digest missing: ${digest}`);
}
check(convergence.includes("R97 preflight: definition drift"), "convergence fail-closed preflight disappeared");
check((convergence.match(/create or replace function/gi) || []).length === 7, "convergence payload no longer contains seven functions");

const safePlane = read(stages[9].mutation_path);
check((safePlane.match(/create policy/gi) || []).length === 12, "safe-plane policy count drifted");
check(!/cron\.schedule|net\.http_post|vault\.decrypted_secrets/i.test(safePlane), "safe plane gained a secret-bearing or dispatch lane");

const fingerprints = contract.expected_final_application_fingerprint;
check(Object.keys(fingerprints).length === 11, "final fingerprint domain count drifted");
check(fingerprints.routines.object_count === 218 && fingerprints.routines.digest === "860dc64e4a9591117674894bc9abfc92", "hardened routine fingerprint drifted");
check(fingerprints.routine_grants.object_count === 967 && fingerprints.routine_grants.digest === "8b848ea5edf8cad84a03c8aca1c6b3ef", "hardened routine-grant fingerprint drifted");

const finalVerification = read(contract.final_verification.path);
check(sha256(finalVerification) === contract.final_verification.sha256, "final verification hash drifted");
check(contract.final_verification.expected_extensions === 8, "final extension expectation drifted");
check(contract.final_verification.expected_hardened_functions === 7, "final function expectation drifted");
check(contract.final_verification.expected_storage_buckets === 5, "final bucket expectation drifted");
check(contract.final_verification.expected_storage_policies === 12, "final policy expectation drifted");
check(contract.final_verification.expected_application_realtime_tables === 3, "final Realtime expectation drifted");
check(contract.final_verification.expected_auth_users === 0 && contract.final_verification.expected_profiles === 0, "blank-target row expectation drifted");

check(contract.closed_lanes.cron.startsWith("closed_"), "cron lane opened");
check(contract.closed_lanes.edge_functions.startsWith("closed_"), "Edge Function lane opened");
check(contract.closed_lanes.vault.startsWith("closed_"), "Vault lane opened");
check(contract.closed_lanes.production_cutover === "closed", "production cutover opened");
check(contract.closed_lanes.legacy_retirement === "closed", "legacy retirement opened");
check(contract.acceptance_gate.completed_clean_blank_replays === 1, "completed replay count drifted");
check(contract.acceptance_gate.required_clean_blank_replays === 2, "required replay count drifted");
check(contract.acceptance_gate.second_clean_blank_replay_passed === false, "second replay pass was fabricated");
check(contract.acceptance_gate.non_schema_restoration_passed === false, "non-schema completion was fabricated");
check(contract.acceptance_gate.production_recovery_choice_ready === false, "production recovery gate opened");
check(contract.authority.production_writes === 0, "authority permits a production write");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("does not guess commands, publish raw live source or retrieve secrets"), "honest incomplete-lane boundary disappeared");
check(note.includes("it has not been run on a second blank hosted target"), "execution boundary disappeared");
check(qa.includes("Completed clean blank replays: 1"), "QA replay standing disappeared");
check(qa.includes("Production writes: zero"), "QA production boundary disappeared");

if (failures.length) {
  console.error(`[g25-second-blank-replay-packet-r97] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-second-blank-replay-packet-r97] PASS: deterministic packet sealed; hosted execution and incomplete machinery remain closed");
