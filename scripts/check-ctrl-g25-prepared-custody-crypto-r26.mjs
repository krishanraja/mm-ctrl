import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-prepared-custody-crypto-r26.json"));
const moduleSource = read(contract.artifacts.module);
const tests = read(contract.artifacts.tests);
const note = read("project-documentation/ctrl-evolution/g25-prepared-custody-crypto-r26.md");
const qa = read("project-documentation/ctrl-evolution/g25-prepared-custody-crypto-r26-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-custody-crypto-r26] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "pure_custody_native_crypto_verified", "claim boundary drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(tests) === contract.artifacts.tests_sha256, "test hash drifted");
assert(moduleSource.includes("PREPARED_CUSTODY_CIPHER_VERSION = 2"), "version 2 cipher missing");
assert(moduleSource.includes("ctrl.brain-prepared-custody-cipher-context.r26"), "context schema missing");
assert(moduleSource.includes("custody_principal_id"), "stable custody is absent from AAD");
assert(moduleSource.includes("authority_fingerprint"), "authority is absent from AAD");
assert(moduleSource.includes("additionalData: contextBytes"), "AES-GCM AAD binding missing");
assert(moduleSource.includes("Object.keys(context).length !== CONTEXT_KEYS.size"), "closed context shape missing");
assert(moduleSource.includes("candidate.v !== PREPARED_CUSTODY_CIPHER_VERSION"), "legacy envelope rejection missing");
assert(!moduleSource.includes("owner_id"), "legacy owner entered custody crypto");
assert(!moduleSource.includes("operator_principal_id"), "operator entered custody crypto");
assert(!moduleSource.includes("user_id"), "auth user entered custody crypto");
assert(tests.includes("legacy v1 envelope"), "legacy-version negative control missing");
assert(tests.includes("operator or login identity smuggled"), "identity-smuggling negative control missing");
assert(note.includes("does not change legacy canonical context bytes"), "legacy compatibility boundary missing");
assert(qa.includes("No key, database or runtime claim"), "QA boundary missing");

console.log("[g25-custody-crypto-r26] PASS: payload AAD follows stable custody, not operator or login");
