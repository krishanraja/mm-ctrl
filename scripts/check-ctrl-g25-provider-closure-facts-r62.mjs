import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-closure-facts-r62.json"));
const evaluator = read(contract.implementation.evaluator);
const tests = read(contract.implementation.tests);
const note = read("project-documentation/ctrl-evolution/g25-provider-closure-facts-r62.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-closure-facts-r62-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-closure-facts-r62] ${message}`);
};

assert(contract.status === "orthogonal_provider_closure_semantics_proved_persistence_closed", "status drifted");
for (const obligation of contract.obligations) assert(evaluator.includes(`\"${obligation}\"`), `evaluator omits ${obligation}`);
for (const marker of [
  "conflicting_payload_disposition",
  "recovery_without_prior_failure",
  "unrecovered_verification_failure",
  "bounded_complete_with_residual",
  "ctrl_complete_external_copy_remains",
  "execution_authority: \"none\"",
]) {
  assert(evaluator.includes(marker), `evaluator omits ${marker}`);
}
for (const forbidden of ["createClient", ".from(", "fetch(", "Deno.env", "process.env", "Authorization"]) {
  assert(!evaluator.includes(forbidden), `evaluator contains forbidden execution primitive: ${forbidden}`);
}
for (const behavior of [
  "completes verified no-retention payload closure",
  "holds policy expiry until final evidence arrives",
  "expresses Stripe operational deletion and residual retention together",
  "expresses CTRL delivery closure while an external recipient copy remains",
  "keeps a verification failure visible until a later recovery",
  "rejects recovery without failure and wrong fact scope",
  "rejects conflicting final payload dispositions",
  "retains failure history while allowing later operational recovery",
]) {
  assert(tests.includes(behavior), `test suite omits ${behavior}`);
}
assert(note.includes("several true things together"), "orthogonal rationale disappeared");
assert(qa.includes("No database table or append function persists these facts"), "persistence boundary disappeared");

console.log("[g25-provider-closure-facts-r62] PASS: compound provider truth and recovery semantics are pure, explicit and non-executing");
