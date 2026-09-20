import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-restart-operational-boundary-r42.json",
));
const note = read("project-documentation/ctrl-evolution/g25-restart-operational-boundary-r42.md");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-restart-operational-boundary-r42] ${message}`);
};

assert(contract.status === "dormant_live_boundary_specified", "status drifted");
assert(contract.endpoint.authentication === "verified subject JWT only", "auth boundary drifted");
assert(contract.endpoint.model_calls === 0, "model entered consent path");
assert(contract.endpoint.browser_operations === 1, "browser gained internal creation operation");
assert(contract.rate_limits.idempotency_authority.includes("R39 and R40"),
  "limiter replaced database idempotency");
assert(contract.telemetry.consent_record === false, "telemetry became consent authority");
for (const forbidden of ["bearer token", "email", "request body", "Brain content"]) {
  assert(contract.telemetry.forbidden.includes(forbidden), `telemetry prohibition missing: ${forbidden}`);
}
assert(contract.rollback.first_action === "disable server flag", "rollback first action drifted");
assert(contract.rollback.preserve.includes("old erasure tombstones"), "rollback can weaken erasure");
assert(contract.rollout.at(-1).includes("each additional workspace"), "bulk rollout reopened");
assert(note.includes("There is no bulk enablement step"), "human rollout boundary missing");
assert(note.includes("No live caller is allowed"), "runtime gate missing");

console.log("[g25-restart-operational-boundary-r42] PASS: future live restart is bounded, observable and reversible");
