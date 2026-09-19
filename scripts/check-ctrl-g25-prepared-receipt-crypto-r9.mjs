import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = "project-documentation/ctrl-evolution/g25-prepared-receipt-crypto-r9.json";
const contract = JSON.parse(fs.readFileSync(path.join(root, contractPath), "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

if (contract.schema_version !== "ctrl.g25.prepared-receipt-crypto.r9.v1") fail("unexpected schema version");
if (contract.status !== "local_crypto_extension_passed_database_use_blocked") fail("R9 status overclaims database use");
if (contract.compatibility?.legacy_context_bytes_changed !== false) fail("legacy context compatibility is not pinned");
if (contract.verification?.typecheck_new_errors !== 0) fail("R9 introduced type errors");

for (const relative of [
  ...(contract.depends_on || []),
  contract.implementation,
  contract.tests,
  "project-documentation/ctrl-evolution/g25-prepared-receipt-crypto-r9.md",
  "project-documentation/ctrl-evolution/g25-prepared-receipt-crypto-r9-qa-record.md",
]) {
  if (typeof relative !== "string" || !fs.existsSync(path.join(root, relative))) fail(`missing ${relative}`);
}

const implementation = fs.readFileSync(path.join(root, contract.implementation), "utf8");
for (const token of [
  'prepared_receipt: "payload"',
  'recordKind: "prepared_receipt"',
  'purpose: "prepared_intelligence"',
  "authorityFingerprint",
  "authority_fingerprint",
  "Brain record kind and encrypted field do not match.",
]) {
  if (!implementation.includes(token)) fail(`implementation is missing ${token}`);
}

for (const forbidden of ["database-backed prepared-receipt use", "key or environment change", "legacy retirement"]) {
  if (!contract.authority?.forbids?.includes(forbidden)) fail(`authority boundary missing ${forbidden}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[g25-crypto-r9] FAIL: ${failure}`);
  process.exit(1);
}

console.log("[g25-crypto-r9] PASS: prepared receipt context bound, legacy AAD stable, database use closed");
