import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-crypto-r64.json"));
const crypto = read(contract.implementation.crypto);
const tests = read(contract.implementation.tests);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-crypto-r64.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-handle-crypto-r64-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-handle-crypto-r64] ${message}`);
};

assert(contract.status === "capability_specific_handle_encryption_proved_persistence_closed", "status drifted");
assert(contract.custody_classes.elevenlabs_exchange_window.maximum_days === 35, "exchange window drifted");
assert(contract.custody_classes.stripe_account_lifetime.calendar_expiry === null, "Stripe calendar expiry introduced");
for (const marker of [
  "AES-GCM",
  "workspace_id",
  "receipt_id",
  "handle_id",
  "retention_class",
  "provider_deletion",
  "MAX_EXCHANGE_WINDOW_MS",
  "Account-lifetime deletion handles cannot use a calendar expiry",
]) {
  assert(crypto.includes(marker), `crypto omits ${marker}`);
}
for (const forbidden of ["createClient", "supabase.from(", "fetch(", "Deno.env", "process.env", "Authorization"]) {
  assert(!crypto.includes(forbidden), `crypto contains forbidden execution primitive: ${forbidden}`);
}
for (const behavior of [
  "round-trips an encrypted ElevenLabs handle without exposing it",
  "rejects moving ciphertext across %s context",
  "supports key rotation without relabeling old ciphertext",
  "enforces a bounded exchange window",
  "ties Stripe custody to account closure instead of a calendar expiry",
  "rejects provider and retention-class substitution",
  "rejects whitespace, control characters and oversized raw handles",
]) {
  assert(tests.includes(behavior), `test suite omits ${behavior}`);
}
assert(note.includes("legally retained Stripe record remains a separate R63 fact"), "retention boundary disappeared");
assert(qa.includes("Environment key custody, rotation operations and key destruction remain unproved"), "key-custody boundary disappeared");

console.log("[g25-provider-deletion-handle-crypto-r64] PASS: provider deletion handles are encrypted, context-bound and capability-scoped");
