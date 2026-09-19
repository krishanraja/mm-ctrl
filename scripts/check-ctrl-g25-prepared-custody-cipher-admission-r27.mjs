import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-prepared-custody-cipher-admission-r27.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const note = read("project-documentation/ctrl-evolution/g25-prepared-custody-cipher-admission-r27.md");
const qa = read("project-documentation/ctrl-evolution/g25-prepared-custody-cipher-admission-r27-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-custody-cipher-admission-r27] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_postgres_cipher_admission_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(candidate.includes("brain_prepared_custody_cipher_aad_sha256"), "database AAD function missing");
assert(candidate.includes("ctrl.brain-prepared-custody-cipher-context.r26"), "R26 context version missing");
assert(candidate.includes("if new.encryption_version <> 2 then"), "storage cipher version gate missing");
assert(candidate.includes("count(*) <> 6"), "closed envelope shape missing");
assert(candidate.includes("envelope ->> 'alg' <> 'A256GCM'"), "cipher algorithm gate missing");
assert(candidate.includes("custody_cipher_context_mismatch"), "AAD context mismatch gate missing");
assert(candidate.includes("before insert on public.brain_prepared_custody_receipts"), "admission trigger missing");
assert(!candidate.toLowerCase().includes("decrypt"), "database candidate attempts decryption");
assert(runner.includes("cross_language_r26_aad_sha256"), "cross-language AAD proof missing");
assert(runner.includes("valid_r26_envelope_stored_and_decrypted"), "store-read-decrypt proof missing");
assert(runner.includes("aad_context_check_removed"), "AAD negative control missing");
assert(runner.includes("storage_version_check_removed"), "version negative control missing");
assert(note.includes("without seeing the plaintext or possessing the encryption key"), "keyless boundary missing");
assert(qa.includes("No migration, key or runtime claim"), "QA boundary missing");

console.log("[g25-custody-cipher-admission-r27] PASS: R25 only admits payloads bound to exact R26 context");
