import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contractPath = "project-documentation/ctrl-evolution/g25-stable-custody-identity-r23.json";
const contract = JSON.parse(read(contractPath));
const sql = read(contract.artifacts.candidate_sql);
const runner = read(contract.artifacts.runner);
const cryptoTest = read(contract.artifacts.crypto_test);
const note = read("project-documentation/ctrl-evolution/g25-stable-custody-identity-r23.md");
const qa = read("project-documentation/ctrl-evolution/g25-stable-custody-identity-r23-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-stable-custody-r23] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_stable_identity_and_crypto_compatibility_verified", "claim boundary drifted");
assert(contract.policy_decision_ref === "DEC-20260917-g25-owner-subject-separation-r19", "founder policy link drifted");
assert(sha256(sql) === contract.artifacts.candidate_sql_sha256, "candidate SQL hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(sha256(cryptoTest) === contract.artifacts.crypto_test_sha256, "crypto test hash drifted");

for (const table of [
  "brain_subject_principals",
  "brain_subject_auth_links",
  "brain_operator_principals",
  "brain_operator_auth_links",
  "brain_historical_principals",
  "brain_custody_principals",
  "brain_custody_assignments",
]) {
  assert(sql.includes(`private.${table}`), `private identity table missing: ${table}`);
}

assert((sql.match(/references private\.brain_historical_principals\(id\) on delete restrict/g) ?? []).length === 4,
  "four owner paths do not use immutable historical principals");
assert((sql.match(/references private\.brain_subject_principals\(id\) on delete restrict/g) ?? []).length === 6,
  "six direct subject paths do not use stable subject principals");
assert(sql.includes("brain_custody_assignments_one_current_idx"), "single-current-custodian constraint missing");
assert(sql.includes("id uuid primary key default gen_random_uuid()"), "operator or custody principal lacks independent identity generation");
assert(sql.includes("for update"), "serialized custody transfer lock missing");
assert(sql.includes("security invoker"), "custody transfer is not security-invoker");
assert(sql.includes("revoke all on function private.brain_transfer_workspace_custody"), "transfer execution is not closed by default");
assert(!sql.includes("security definer"), "custody candidate introduced security-definer authority");

for (const signal of [
  "removed_operator_existing_jwt_receipts",
  "operator_identity_separated",
  "custody_does_not_grant_access",
  "unplanned_operator_removal",
  "duplicate_current_assignment",
  "historical_owner_rebound_to_auth_user",
  "stable_subject_rebound_to_auth_cascade",
]) {
  assert(runner.includes(signal), `behavioral or negative signal missing: ${signal}`);
}

assert(cryptoTest.includes("keeps an old prepared receipt decryptable after current custody transfers"),
  "positive cryptographic compatibility proof missing");
assert(cryptoTest.includes("rewriting historical owner identity during transfer breaks authenticated context"),
  "historical rewrite negative proof missing");
assert(note.includes("out-of-band deletion case is catastrophe recovery, not permission"),
  "catastrophe recovery is being mistaken for normal policy");
assert(qa.includes("No migration or runtime claim"), "QA claim boundary missing");
assert(contract.not_authorized.includes("linked or production database use"), "database boundary missing");
assert(contract.not_authorized.includes("deployment, merge or release"), "release boundary missing");
assert(contract.residuals.some((item) => item.includes("tombstone")), "tombstone blocker disappeared");

console.log("[g25-stable-custody-r23] PASS: login, subject, custody and historical identity remain separate");
