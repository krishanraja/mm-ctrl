// Operator wrapper around the canonical held-out measurement route.
//
// It deliberately contains no scoring logic and cannot mint a user session.
// The route fixes every prediction before the database reveals human labels.
//
// Usage:
//   CTRL_EVAL_PROJECT_REF=<exact-ref> CTRL_EVAL_JWT=<owner-jwt> \
//   SUPABASE_ACCESS_TOKEN=<management-token> \
//   node scripts/eval-skill.mjs --run <sort-run-id> [--artifact <standard-id>] \
//     [--expect draft|provisional|verified]

import { releaseVerdict, storedMetrics } from "../supabase/functions/_shared/confusion.ts";

const argv = process.argv.slice(2);
const arg = (name) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : null;
};
const runId = arg("run");
let artifactId = arg("artifact");
const expected = arg("expect");
const jwt = arg("jwt") ?? process.env.CTRL_EVAL_JWT ?? "";
const projectRef = process.env.CTRL_EVAL_PROJECT_REF ?? "";
const managementToken = process.env.SUPABASE_ACCESS_TOKEN ?? "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!UUID.test(runId ?? "")) throw new Error("Give an exact --run <sort-run-id>.");
if (artifactId && !UUID.test(artifactId)) throw new Error("--artifact must be a UUID.");
if (expected && !["draft", "provisional", "verified"].includes(expected)) throw new Error("Invalid --expect label.");
if (!/^[a-z0-9]{20}$/.test(projectRef)) throw new Error("CTRL_EVAL_PROJECT_REF must be exact. There is no production default.");
if (!jwt) throw new Error("CTRL_EVAL_JWT or --jwt is required. This script never mints an owner session.");
if (!managementToken.startsWith("sbp_")) throw new Error("SUPABASE_ACCESS_TOKEN is required for read-only discovery.");

const base = `https://${projectRef}.supabase.co`;
const json = async (response) => {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
};
async function management(path, init = {}) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${managementToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await json(response);
  if (!response.ok) throw new Error(`management ${response.status}`);
  return body;
}
const dbq = (query) => management("/database/query", { method: "POST", body: JSON.stringify({ query }) });
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;

const keys = await management("/api-keys?reveal=true");
const anon = keys.find((key) => key.name === "anon")?.api_key;
if (!anon) throw new Error("Public project key unavailable.");

const ownerResponse = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${jwt}` } });
const owner = await json(ownerResponse);
if (!ownerResponse.ok || !UUID.test(owner?.id ?? "")) throw new Error("Owner JWT is not valid for the exact project.");

const runRows = await dbq(`select id,user_id,kind,status,surface from public.harness_runs where id=${lit(runId)}::uuid`);
const run = runRows?.[0];
if (!run || run.kind !== "sort" || run.status !== "done") throw new Error("The sort does not exist or is not complete.");
if (run.user_id !== owner.id) throw new Error("The JWT owner does not own this sort.");

if (!artifactId) {
  const rows = await dbq(`select id from public.generated_artifacts
    where user_id=${lit(owner.id)}::uuid and kind='standard' and metadata->>'sort_run_id'=${lit(runId)}
    order by created_at desc limit 1`);
  artifactId = rows?.[0]?.id ?? null;
}
if (!UUID.test(artifactId ?? "")) throw new Error("No compiled standard exists for this sort.");

const requestId = `measure_${crypto.randomUUID().replaceAll("-", "")}`;
const startResponse = await fetch(`${base}/functions/v1/measure-standard`, {
  method: "POST",
  headers: { apikey: anon, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
  body: JSON.stringify({ request_id: requestId, sort_run_id: runId, standard_artifact_id: artifactId }),
});
const start = await json(startResponse);
if (!startResponse.ok || !UUID.test(start?.run_id ?? "")) throw new Error(`Measurement did not start (${startResponse.status}: ${start?.error ?? "unknown"}).`);

let terminal = null;
const deadline = Date.now() + 300_000;
while (Date.now() < deadline) {
  const response = await fetch(`${base}/rest/v1/harness_runs?id=eq.${start.run_id}&select=stage,status,error,stage_detail`, {
    headers: { apikey: anon, Authorization: `Bearer ${jwt}` },
  });
  const rows = await json(response);
  terminal = Array.isArray(rows) ? rows[0] : null;
  if (terminal && terminal.status !== "running") break;
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!terminal || terminal.status === "running") throw new Error("Measurement did not reach a terminal state in five minutes.");
if (terminal.status !== "done") throw new Error(`Measurement failed: ${terminal.error ?? "unknown"}`);

const result = terminal.stage_detail?.result ?? {};
const metricsRaw = result.metrics ?? {};
const metrics = storedMetrics({
  precision: typeof metricsRaw.precision === "number" ? metricsRaw.precision : null,
  recall: typeof metricsRaw.recall === "number" ? metricsRaw.recall : null,
  tnr: typeof metricsRaw.tnr === "number" ? metricsRaw.tnr : null,
  n: typeof metricsRaw.n === "number" ? metricsRaw.n : 0,
  counts: result.confusion ?? null,
});
const agreement = result.self_agreement ?? { matched: 0, total: 0 };
const release = releaseVerdict({ metrics, heldOutGraded: result.held_out_graded ?? 0, selfAgreement: agreement });
if (result.label !== release.label) throw new Error(`Stored label ${result.label} disagrees with shared release logic ${release.label}.`);

console.log(`\nHeld-out measurement: ${release.label.toUpperCase()}`);
console.log(`  scored ${metrics.n} of ${result.held_out_graded ?? 0} graded unfamiliar pieces`);
console.log(`  TP ${result.confusion?.tp ?? 0}  FP ${result.confusion?.fp ?? 0}  FN ${result.confusion?.fn ?? 0}  TN ${result.confusion?.tn ?? 0}`);
console.log(`  excluded: ${result.confusion?.excluded?.skipped ?? 0} skipped, ${result.confusion?.excluded?.insufficient ?? 0} insufficient`);
console.log(`  ${release.reason}`);

if (expected && release.label !== expected) {
  console.error(`Expected ${expected}, got ${release.label}.`);
  process.exit(1);
}
