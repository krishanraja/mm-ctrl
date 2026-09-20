import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read(
  "project-documentation/ctrl-evolution/g25-subject-reconsent-endpoint-r37.json",
));
const moduleSource = read(contract.artifacts.module);
const testSource = read(contract.artifacts.test);
const note = read("project-documentation/ctrl-evolution/g25-subject-reconsent-endpoint-r37.md");
const qa = read("project-documentation/ctrl-evolution/g25-subject-reconsent-endpoint-r37-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-subject-reconsent-endpoint-r37] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "dormant_authenticated_endpoint_logic_verified",
  "claim boundary drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(testSource) === contract.artifacts.test_sha256, "test hash drifted");
assert(moduleSource.includes("consented_by_user_id: authenticated.user_id"),
  "authenticated subject derivation missing");
assert(!moduleSource.includes("request.body.subject_id"), "browser subject identity became trusted");
assert(!moduleSource.includes("request.body.operator_principal_id"),
  "browser operator identity became trusted");
assert(moduleSource.includes("scope_status !== \"reserved_not_created\""),
  "no-creation response guard missing");
assert(moduleSource.includes("reconsent_scope_unavailable"), "scope-enumeration closure missing");
assert(moduleSource.includes("reconsent_not_reserved"), "database-detail closure missing");
assert(moduleSource.includes("prepared-subject-reconsent-request-r37"),
  "versioned request fingerprint missing");
assert(testSource.includes("rejects browser attempts to submit privileged identity"),
  "privileged-identity negative test missing");
assert(testSource.includes("refuses any reservation result that claims the scope already exists"),
  "scope-creation overclaim test missing");
assert(note.includes("not a deployed Edge Function"), "dormant-runtime boundary missing");
assert(qa.includes("No deployed endpoint, new-scope, migration or production claim"),
  "QA boundary missing");

console.log("[g25-subject-reconsent-endpoint-r37] PASS: authenticated intent is bound without trusting browser identity");
