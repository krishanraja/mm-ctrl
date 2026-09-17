import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-stable-principal-removal-r28.json",
));
const candidate = read(contract.artifacts.candidate);
const runner = read(contract.artifacts.runner);
const planner = read(contract.artifacts.planner);
const plannerTest = read(contract.artifacts.planner_test);
const note = read("project-documentation/ctrl-evolution/g25-stable-principal-removal-r28.md");
const qa = read("project-documentation/ctrl-evolution/g25-stable-principal-removal-r28-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-stable-principal-removal-r28] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "local_stable_login_removal_planning_verified", "claim boundary drifted");
assert(sha256(candidate) === contract.artifacts.candidate_sha256, "candidate hash drifted");
assert(sha256(runner) === contract.artifacts.runner_sha256, "runner hash drifted");
assert(sha256(planner) === contract.artifacts.planner_sha256, "planner hash drifted");
assert(sha256(plannerTest) === contract.artifacts.planner_test_sha256, "planner test hash drifted");
assert(candidate.includes("for key share"), "target auth-user lock missing");
assert(candidate.includes("security definer"), "privileged read boundary missing");
assert(candidate.includes("set search_path = ''"), "empty search path missing");
assert(candidate.includes("context_observed_at timestamptz := statement_timestamp()"), "database observation time missing");
assert(!candidate.includes("p_observed_at"), "caller-controlled observation time remains");
assert(candidate.includes("target_subject_principal_ids"), "subject identity readback missing");
assert(candidate.includes("target_operator_principal_ids"), "operator identity readback missing");
assert(candidate.includes("current_operator_active_auth_user_ids"), "custody access routes missing");
assert(candidate.includes("target_has_current_role"), "role access readback missing");
assert(candidate.includes("target_has_current_grant"), "grant access readback missing");
assert(candidate.includes("stable-principal-removal-context-r28"), "evidence domain separator missing");
assert(!candidate.includes("owner_id"), "legacy owner identity leaked into R28");
assert(planner.includes("require_customer_authorized_custody_transfer"), "custody transfer gate missing");
assert(planner.includes("preserve_subject_principal"), "subject preservation action missing");
assert(!planner.includes("erase_subject"), "planner contains subject erasure");
assert(plannerTest.includes("separates the target's own Brain from customer custody"), "mixed-role proof missing");
assert(plannerTest.includes("unrelated workspace"), "unrelated-scope negative case missing");
assert(runner.includes("alternate_login_preserves_custody_identity"), "alternate-login proof missing");
assert(runner.includes("ordinary_user_read"), "privilege negative control missing");
assert(note.includes("Removing a login does not erase a person or their Brain"), "human policy boundary missing");
assert(qa.includes("No deletion, transfer, migration or runtime claim"), "QA claim boundary missing");

console.log("[g25-stable-principal-removal-r28] PASS: login removal preserves Brain identity and customer custody");
