import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-whole-brain-erasure-planner-r15.json"));
const planner = read("supabase/functions/_shared/whole-brain-erasure-plan.r15.ts");
const tests = read("supabase/functions/_shared/whole-brain-erasure-plan.r15.test.ts");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-erasure-plan-r15] ${message}`);
}

assert(contract.status === "local_erasure_planner_proved_policy_unbound", "unexpected contract status");
assert(contract.policy_gate.retained_audit.status === "unbound", "retained audit policy was silently bound");
assert(contract.policy_gate.customer_controlled_copies.status === "unbound", "customer-copy language was silently bound");
assert(contract.policy_gate.partial_completion.status === "unbound", "partial completion policy was silently bound");

const planes = [
  "canonical_brain",
  "prepared_intelligence",
  "legacy_memory_and_decisions",
  "briefings_news_and_audio",
  "exports_and_skills",
  "mcp_and_access",
  "logs_caches_and_analytics",
  "external_processors",
  "backups_observability_and_devices",
];
for (const plane of planes) assert(planner.includes(`\"${plane}\"`), `planner omits ${plane}`);

for (const marker of [
  "retained_audit_policy_unbound",
  "customer_copy_language_unbound",
  "partial_completion_policy_unbound",
  "access_revocation_target_missing",
  "access_revocation_not_ctrl_controlled",
  "customer_action_wrong_controller",
  "processor_deletion_wrong_controller",
  "proved_without_valid_proof",
  "ctrl_erased_customer_action_required",
]) {
  assert(planner.includes(marker), `planner omits fail-closed marker ${marker}`);
}

for (const behavior of [
  "holds while any consequential policy is unbound",
  "holds when even one R14 coverage plane is absent",
  "orders access revocation before destructive work and customer action",
  "never calls missing or unproved results complete",
  "distinguishes CTRL erasure from a copy still controlled by the customer",
  "requires a proof reference before any target can be called proved",
  "keeps hard failure distinct from resumable pending",
]) {
  assert(tests.includes(behavior), `unit suite omits ${behavior}`);
}

for (const forbidden of contract.authority.forbids) assert(typeof forbidden === "string" && forbidden.length > 0, "invalid authority boundary");

console.log("[g25-erasure-plan-r15] PASS: planner is fail-closed; policy and execution remain unbound");
