import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const record = JSON.parse(read("project-documentation/ctrl-evolution/g25-whole-brain-erasure-policy-founder-lock-r16.json"));

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-erasure-policy-r16] ${message}`);
}

assert(record.exact_final_call === "yes", "founder finality is not exact");
assert(record.decision_record.decision_id === "DEC-20260917-g25-erasure-policy-r16", "decision identity drifted");
assert(record.decision_record.status === "conditional", "decision must remain conditional while retention is unbound");
assert(record.locked_policy.access_revocation.standing === "approved", "access-first policy is not approved");
assert(record.locked_policy.partial_completion.standing === "approved", "partial completion policy is not approved");
assert(record.locked_policy.partial_completion.rule.includes("resumable_pending"), "resumable pending is not exact");
assert(record.locked_policy.partial_completion.rule.includes("never return success"), "partial success remains possible");
assert(record.locked_policy.customer_controlled_copies.standing === "approved", "customer-copy policy is not approved");
assert(record.locked_policy.customer_controlled_copies.rule.includes("name the destination"), "destination naming is not required");
assert(record.locked_policy.customer_controlled_copies.rule.includes("specific removal action"), "removal action is not required");
assert(record.locked_policy.retained_deletion_receipt.standing === "unbound_legal_policy_gate", "retention was silently bound");
assert(record.cross_venture_decision_ledger.status === "STORE_UNAVAILABLE", "unverified canonical write was implied");
assert(record.cross_venture_decision_ledger.unmet_gates.length === 4, "canonical-store gates are incomplete");
assert(record.not_authorized.includes("linked or production database use"), "database boundary missing");
assert(record.not_authorized.includes("cross-venture Supabase decision-ledger write"), "ledger-write boundary missing");
assert(record.decision_record.revisit.trigger.length > 40, "revisit trigger is not observable");

console.log("[g25-erasure-policy-r16] PASS: founder policy locked; retention and runtime remain closed");
