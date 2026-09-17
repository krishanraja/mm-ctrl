import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-principal-removal-planner-r20.json"));
const source = read(contract.artifacts.source);
const tests = read(contract.artifacts.tests);

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-principal-removal-r20] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.policy_decision_ref === "DEC-20260917-g25-owner-subject-separation-r19", "founder policy link drifted");
assert(contract.status === "local_planner_verified_schema_execution_blocked", "claim boundary drifted");
assert(sha256(source) === contract.artifacts.source_sha256, "source hash drifted");
assert(sha256(tests) === contract.artifacts.tests_sha256, "test hash drifted");
assert(source.includes('intent.kind === "operator_removal" && isSubject'), "mixed subject/operator protection missing");
assert(source.includes('inventory.standing !== "verified_complete"'), "complete relationship inventory is not required");
assert(source.includes('action: "require_owner_transfer_or_customer_closure"'), "owner custody gate missing");
assert(source.includes('action: "preserve_subject_brain_and_require_separate_subject_decision"'), "subject Brain preservation missing");
assert(source.includes("auth_user_deletion_allowed: !custodyRequired"), "auth deletion is not bound to custody completion");
assert(tests.includes("never treats ownership alone as subject authority"), "ownership-only negative control missing");
assert(tests.includes("fails closed when the relationship inventory is not verified complete"), "inventory negative control missing");
assert(contract.execution_boundary.blocked.includes("auth-user deletion"), "auth deletion boundary missing");
assert(contract.execution_boundary.blocked.includes("linked or production database use"), "database boundary missing");
assert(contract.verification.focused_tests === 8, "focused test count drifted");

console.log("[g25-principal-removal-r20] PASS: subject and operator paths remain separated and fail closed");
