import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-exact-purpose-rls-canary-r8.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.exact-purpose-rls-canary.r8.v1") fail("unexpected schema version");
if (contract.status !== "postgresql_wasm_pass_supabase_local_parity_pending") fail("R8 status does not preserve its exact proof boundary");
if (contract.not_a_migration !== true) fail("R8 candidate must remain outside migrations");
if (contract.verification?.database_execution !== "passed_on_postgresql_wasm") fail("R8 PostgreSQL execution proof is missing");
if (contract.verification?.supabase_local_parity !== "pending_no_docker_or_podman") fail("R8 hides its Supabase-local parity blocker");
if (packageJson.devDependencies?.["@electric-sql/pglite"] !== "0.5.8") fail("PGlite test runtime must remain exact-pinned at 0.5.8");

for (const relative of [
  contract.depends_on,
  contract.candidate_sql,
  contract.verification?.runtime_harness,
  "project-documentation/ctrl-evolution/g25-exact-purpose-rls-canary-r8.md",
  "project-documentation/ctrl-evolution/g25-exact-purpose-rls-canary-r8-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

if (contract.candidate_sql.startsWith("supabase/migrations/")) fail("test candidate was placed in migrations");

const sql = fs.readFileSync(path.join(root, contract.candidate_sql), "utf8").toLowerCase();
const harness = fs.readFileSync(path.join(root, contract.verification.runtime_harness), "utf8");
for (const clause of [
  "begin;",
  "rollback;",
  "enable row level security",
  "force row level security",
  "grant_row.workspace_id = g25_prepared_receipt_purpose_canary.workspace_id",
  "grant_row.grantee_user_id = (select auth.uid())",
  "grant_row.audience = g25_prepared_receipt_purpose_canary.audience",
  "grant_row.purpose = g25_prepared_receipt_purpose_canary.purpose",
  "grant_row.revoked_at is null",
  "grant_row.expires_at is null or grant_row.expires_at > now()",
  "role_row.user_id = (select auth.uid())",
  "revoke all on table public.g25_prepared_receipt_purpose_canary from anon, authenticated",
]) {
  if (!sql.includes(clause)) fail(`candidate SQL is missing ${clause}`);
}

for (const clause of [
  'const purposePredicate = "and grant_row.purpose = g25_prepared_receipt_purpose_canary.purpose"',
  'candidate.replace(purposePredicate, "and true")',
  'crossed the exact-purpose boundary',
  'table_rolled_back',
]) {
  if (!harness.includes(clause)) fail(`runtime harness is missing ${clause}`);
}

for (const forbidden of ["linked or production database test", "migration file or migration execution", "legacy retirement"]) {
  if (!contract.authority?.forbids?.includes(forbidden)) fail(`authority boundary missing ${forbidden}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-purpose-r8] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-purpose-r8] PASS: exact-purpose PostgreSQL proof and negative control passed; Supabase-local parity remains pending");
