import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-erasure-review-plan-r61.json"));
const planner = read(contract.implementation.planner);
const tests = read(contract.implementation.tests);
const note = read("project-documentation/ctrl-evolution/g25-provider-erasure-review-plan-r61.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-erasure-review-plan-r61-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-erasure-review-plan-r61] ${message}`);
};

assert(contract.status === "provider_erasure_and_expiry_planning_proved_execution_closed", "status drifted");
assert(contract.design_defects_exposed.length === 3, "design defect disappeared");
for (const marker of [
  "provider_outcome_must_be_resolved",
  "terminal_verification_failure_requires_remediation",
  "receipt_hmac_is_not_a_deletion_handle",
  "registry_cannot_express_operational_deletion_and_residual_retention",
  "record_irretrievable_recipient_copy",
  "record_public_query_boundary",
  "execution_authority: \"none\"",
]) {
  assert(planner.includes(marker), `planner omits ${marker}`);
}
for (const forbidden of ["createClient", ".from(", "fetch(", "Deno.env", "process.env", "Authorization", "api_key"]) {
  assert(!planner.includes(forbidden), `planner contains forbidden execution primitive: ${forbidden}`);
}
for (const behavior of [
  "treats a rejected exchange as terminal without inventing provider work",
  "holds an unknown outcome until the provider result is resolved",
  "requires evidence before translating ZDR into an expired event",
  "refuses to mistake a receipt HMAC for an ElevenLabs deletion handle",
  "drafts ElevenLabs deletion only when a separate handle exists",
  "separates Resend expiry from the recipient copy that cannot be recalled",
  "holds Stripe because deletion and regulated residual retention need a compound outcome",
  "keeps research public and adds expiry only when the route is not a fixed fetch",
  "blocks an unknown configured destination and rejects route incoherence",
]) {
  assert(tests.includes(behavior), `test suite omits ${behavior}`);
}
assert(note.includes("cannot recover the object ID needed to ask a provider to delete it"), "deletion handle boundary disappeared");
assert(qa.includes("Static checks reject network, database and environment access"), "zero-execution QA boundary disappeared");

console.log("[g25-provider-erasure-review-plan-r61] PASS: provider deletion, expiry and residual truth stay distinct; execution closed");
