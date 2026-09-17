import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-prepared-custody-atomic-store-r25.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-prepared-custody-atomic-store-r25.md");
const qa = read("project-documentation/ctrl-evolution/g25-prepared-custody-atomic-store-r25-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-custody-atomic-r25] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_postgres_atomic_store_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("create table public.brain_prepared_custody_receipts"), "custody store missing");
assert(candidate.includes("ctrl.prepared-intelligence-custody-envelope.r24"), "R24 version binding missing");
assert(candidate.includes("brain_prepared_custody_fingerprint"), "database fingerprint missing");
assert(candidate.includes("prepared-custody-envelope-r24"), "R24 domain separator missing");
assert(candidate.includes("receipt_dependencies_mismatch"), "receipt dependency equality missing");
assert(candidate.includes("receipt_shape_invalid"), "closed receipt shape missing");
assert(candidate.includes("authority_dependency_not_current"), "current authority gate missing");
assert(candidate.includes("receipt_custody_inactive"), "active custody gate missing");
assert(candidate.includes("brain_prepared_legacy_cross_generation_guard"), "legacy collision guard missing");
assert(candidate.includes("existing.payload_ciphertext = payload_ciphertext"), "ciphertext replay equality missing");
assert(candidate.includes("existing.encryption_version = encryption_version"), "encryption replay equality missing");
assert(candidate.includes("brain_workspace_roles"), "role read gate missing");
assert(candidate.includes("brain_audience_grants"), "audience-purpose read gate missing");
assert(!candidate.includes("owner_id"), "legacy owner identity entered the custody-native store");
assert(!candidate.includes("insert into public.brain_prepared_receipts (\n    id, workspace_id"), "R25 writes the legacy store");
assert(runner.includes("cross_language_r24_fingerprint"), "cross-language proof missing");
assert(runner.includes("atomic_failure_rolled_back"), "atomic rollback proof missing");
assert(runner.includes("authority_fingerprint_check_removed"), "fingerprint negative control missing");
assert(runner.includes("active_custody_check_removed"), "custody negative control missing");
assert(runner.includes("outstanding_jwt_denied_after_role_removal"), "outstanding JWT denial missing");
assert(runner.includes("legacy_r10_writer_still_operational"), "legacy writer regression proof missing");
assert(note.includes("separate custody-native storage generation"), "generation boundary missing from claim");
assert(qa.includes("No migration or runtime claim"), "QA boundary missing");
assert(contract.not_authorized.includes("legacy retirement"), "legacy preservation boundary missing");

console.log("[g25-custody-atomic-r25] PASS: custody-native atomic store is isolated from legacy receipts");
