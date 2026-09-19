import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contractPath = "project-documentation/ctrl-evolution/g25-cron-recovery-manifest-r101.json";
const notePath = "project-documentation/ctrl-evolution/g25-cron-recovery-manifest-r101.md";
const qaPath = "project-documentation/ctrl-evolution/g25-cron-recovery-manifest-r101-qa-record.md";
const contractRaw = read(contractPath);
const contract = JSON.parse(contractRaw);
const sql = read(contract.candidate.path);
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const bytewise = (left, right) => Buffer.from(left).compare(Buffer.from(right));

const scheduled = [...sql.matchAll(/cron\.schedule\(\s*'([^']+)'\s*,\s*'([^']+)'/g)]
  .map((match) => ({ job: match[1], schedule: match[2] }))
  .sort((left, right) => bytewise(left.job, right.job));
const expected = contract.approved_packet
  .map(({ job, schedule }) => ({ job, schedule }))
  .sort((left, right) => bytewise(left.job, right.job));

check(contractRaw.endsWith("\n"), "contract JSON must end with one newline");
check(contract.status === "target_neutral_packet_ready_execution_blocked", "status drifted");
check(sha256(sql) === contract.candidate.sha256, "candidate hash drifted");
check(JSON.stringify(scheduled) === JSON.stringify(expected), "scheduled job names or expressions drifted");
check(scheduled.length === contract.inventory.approved_packet_jobs, "approved packet job count drifted");
check(contract.inventory.production_jobs_fingerprinted === 15, "production cron fingerprint count drifted");
check(contract.inventory.repo_source_backed_job_definitions === 9, "source-backed definition count drifted");
check(contract.inventory.total_unresolved_jobs === 6, "unresolved production job count drifted");
check(contract.inventory.held_source_backed_jobs === 1, "held source-backed count drifted");
check(!sql.includes("supabase.co"), "candidate contains a hard-coded Supabase URL");
check(!sql.includes("app.supabase_service_role_key"), "candidate reads a service-role key from Postgres settings");
check(!sql.includes("Authorization', 'Bearer"), "candidate places a bearer credential in scheduled commands");
check((sql.match(/name = 'ctrl_edge_base_url'/g) ?? []).length >= 2, "target-neutral base URL preflight or use missing");
check((sql.match(/name = 'ctrl_cron_secret'/g) ?? []).length >= 2, "cron credential preflight or use missing");
check(!scheduled.some((entry) => entry.job === "detect-trends-weekly"), "contained trend job was scheduled");
check(!scheduled.some((entry) => entry.job === "kit-nudges-email"), "source-missing Kit job was scheduled");

const edgeRoutes = [
  "memory-sweep",
  "cleanup-expired-data",
  "live-headlines",
  "send-daily-briefing",
  "send-reactivation-nudge",
  "capture-week",
];
for (const route of edgeRoutes) {
  const source = read(`supabase/functions/${route}/index.ts`);
  check(source.includes('X-CTRL-Cron-Secret'), `${route}: dedicated cron header missing`);
  check(source.includes("CTRL_CRON_SECRET"), `${route}: cron secret comparison missing`);
  check(sql.includes(`/functions/v1/${route}`), `${route}: scheduled target missing`);
}
check(read("supabase/functions/detect-trends/index.ts") === read("supabase/containment/templates/detect-trends-empty.ts"), "detect-trends containment drifted");
check(!read("supabase/config.toml").includes("[functions.send-kit-nudges]"), "source-missing Kit function unexpectedly appeared in config");

check(contract.authority.candidate_applied === false, "candidate application was fabricated");
check(contract.authority.vault_values_provisioned === false, "Vault provisioning was fabricated");
check(contract.authority.isolated_jobs_created === 0, "isolated cron mutation was fabricated");
check(contract.authority.production_jobs_changed === 0, "production cron mutation was fabricated");
check(contract.authority.production_writes === 0, "production write was fabricated");

const prose = `${contractRaw}\n${read(notePath)}\n${read(qaPath)}`;
check(!prose.includes(String.fromCodePoint(0x2014)), "no em dash allowed");
check(!/(?:sbp|ghp|vcp)_[A-Za-z0-9_-]{20,}/.test(prose), "credential-shaped content detected");
check(read(notePath).includes("Nothing has been scheduled"), "execution boundary disappeared");
check(read(qaPath).includes("Total unresolved jobs: six"), "unresolved-job receipt disappeared");

if (failures.length) {
  console.error(`[g25-cron-recovery-manifest-r101] FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("[g25-cron-recovery-manifest-r101] PASS: eight target-neutral jobs are exact; unresolved and contained jobs remain unscheduled");
