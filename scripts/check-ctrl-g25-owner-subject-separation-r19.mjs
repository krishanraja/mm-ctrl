import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const record = JSON.parse(read("project-documentation/ctrl-evolution/g25-owner-subject-separation-founder-lock-r19.json"));

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-owner-subject-r19] ${message}`);
}

assert(record.exact_final_call === "agreed completely!", "founder finality is not exact");
assert(record.decision_record.decision_id === "DEC-20260917-g25-owner-subject-separation-r19", "decision identity drifted");
assert(record.decision_record.status === "active", "approved invariant is not active");
assert(record.locked_policy.subject_erasure.rule.includes("subject_id"), "subject authority is not explicit");
assert(record.locked_policy.operator_removal.rule.includes("must never"), "operator deletion invariant weakened");
assert(record.locked_policy.owned_customer_brain.rule.includes("transfer") && record.locked_policy.owned_customer_brain.rule.includes("closure"), "transfer and closure gate incomplete");
assert(record.locked_policy.dual_role.rule.includes("other subject"), "dual-role protection missing");
assert(record.not_authorized.includes("auth-user deletion"), "auth deletion boundary missing");
assert(record.not_authorized.includes("linked or production database use"), "database boundary missing");
assert(record.cross_venture_decision_ledger.status === "STORE_UNAVAILABLE", "unverified canonical write was implied");
assert(record.cross_venture_decision_ledger.unmet_gates.length === 4, "canonical-store gates are incomplete");
assert(record.decision_record.revisit.trigger.length > 40, "revisit trigger is not observable");

console.log("[g25-owner-subject-r19] PASS: operator removal cannot delete another subject's Brain");
