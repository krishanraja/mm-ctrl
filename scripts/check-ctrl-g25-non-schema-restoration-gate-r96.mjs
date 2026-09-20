import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-non-schema-restoration-gate-r96.json"));
const note = read("project-documentation/ctrl-evolution/g25-non-schema-restoration-gate-r96.md");
const qa = read("project-documentation/ctrl-evolution/g25-non-schema-restoration-gate-r96-qa-record.md");
const restore = read(contract.safe_plane_candidate.restore_path);
const preflight = read(contract.safe_plane_candidate.preflight_path);
const verification = read(contract.safe_plane_candidate.verification_path);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

check(contract.status === "safe_plane_candidate_proved_execution_closed", "status drifted");
check(sha256(restore) === contract.safe_plane_candidate.restore_sha256, "restore hash drifted");
check(sha256(preflight) === contract.safe_plane_candidate.preflight_sha256, "preflight hash drifted");
check(sha256(verification) === contract.safe_plane_candidate.verification_sha256, "verification hash drifted");
check(contract.safe_plane_candidate.transactional_dry_run === "pass", "dry-run pass disappeared");
check(contract.safe_plane_candidate.dry_run_terminal_action === "rollback", "dry-run rollback disappeared");
check(Object.values(contract.safe_plane_candidate.isolated_post_dry_run).every((value) => value === 0), "dry run persisted state");
check(contract.storage.production_bucket_count === 5 && contract.storage.buckets.length === 5, "bucket inventory drifted");
check(contract.storage.production_policy_count === 12, "Storage policy inventory drifted");
check(contract.realtime.application_table_count === 3 && contract.realtime.application_tables.length === 3, "application Realtime inventory drifted");
check(contract.realtime.platform_managed_partition_members_copied === false, "platform partitions were copied");
check(contract.cron.production_job_count === 15 && contract.cron.jobs.length === 15, "schedule inventory drifted");
check(contract.cron.repo_executable_evidence_count === 9, "schedule evidence count drifted");
check(contract.cron.missing_repo_executable_definition_count === 6, "missing schedule count drifted");
check(contract.cron.commands_retrieved === false, "cron commands were retrieved");
check(contract.edge_functions.production_active === 183, "production function inventory drifted");
check(contract.edge_functions.repo_function_directories === 115, "local function inventory drifted");
check(contract.edge_functions.live_only === 68, "live-only function inventory drifted");
check(contract.edge_functions.isolated_deployed === 0, "isolated deployment was fabricated");
check(contract.vault.production_secret_name_count === 2, "Vault inventory drifted");
check(contract.vault.secret_names_retrieved === false && contract.vault.secret_values_retrieved === false, "Vault read boundary drifted");
check((restore.match(/insert into storage\.buckets/gi) || []).length === 1, "bucket restore disappeared");
check((restore.match(/create policy/gi) || []).length === 12, "Storage policy restore count drifted");
check(restore.includes("alter publication supabase_realtime add table"), "application Realtime restore disappeared");
check(!/vault\.decrypted_secrets|cron\.schedule|net\.http_post/i.test(restore), "safe-plane candidate gained a secret-bearing or dispatch lane");
check(contract.acceptance_gate.safe_plane_candidate_dry_run_passed === true, "safe-plane proof regressed");
check(contract.acceptance_gate.safe_plane_applied === false, "safe plane application was fabricated");
check(contract.acceptance_gate.cron_restoration_ready === false, "cron gate opened");
check(contract.acceptance_gate.edge_function_restoration_ready === false, "function gate opened");
check(contract.acceptance_gate.vault_restoration_ready === false, "Vault gate opened");
check(contract.acceptance_gate.non_schema_restoration_passed === false, "non-schema restoration was fabricated");
check(contract.authority.raw_function_source_published === false, "raw function source was published");
check(contract.authority.secret_names_or_values_retrieved === false, "secret retrieval was fabricated");
check(contract.authority.isolated_safe_plane_writes_persisted === 0, "isolated writes persisted");
check(contract.authority.production_writes === 0, "production write boundary drifted");

const emDash = String.fromCodePoint(0x2014);
check(!note.includes(emDash) && !qa.includes(emDash), "no em dash allowed");
check(note.includes("does not convert an incomplete backend into a recovery claim"), "honest boundary disappeared");
check(qa.includes("Production writes: zero."), "production QA boundary disappeared");

if (failures.length) {
  console.error(`[g25-non-schema-restoration-gate-r96] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-non-schema-restoration-gate-r96] PASS: safe plane is proved and unresolved live machinery remains closed");
