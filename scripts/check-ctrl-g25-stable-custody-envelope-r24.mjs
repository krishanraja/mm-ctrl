import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-stable-custody-envelope-r24.json"));
const moduleSource = read(contract.artifacts.module);
const tests = read(contract.artifacts.tests);
const note = read("project-documentation/ctrl-evolution/g25-stable-custody-envelope-r24.md");
const qa = read("project-documentation/ctrl-evolution/g25-stable-custody-envelope-r24-qa-record.md");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-custody-envelope-r24] ${message}`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

assert(contract.status === "pure_stable_custody_scope_verified", "claim boundary drifted");
assert(sha256(moduleSource) === contract.artifacts.module_sha256, "module hash drifted");
assert(sha256(tests) === contract.artifacts.tests_sha256, "test hash drifted");
assert(moduleSource.includes('schema_version: "ctrl.prepared-intelligence-custody-envelope.r24"'), "versioned envelope missing");
assert(moduleSource.includes("custody_principal_id"), "stable custody identity missing");
assert(moduleSource.includes('reasons.push("scope_unknown_field")'), "unknown scope fields do not fail closed");
assert(moduleSource.includes('reasons.push("custody_status_invalid")'), "invalid custody status does not fail closed");
assert(moduleSource.includes('reasons.push(`custody_${input.custody_readback.status}`)'), "non-active custody does not fail closed");
assert(!moduleSource.includes("owner_id"), "legacy owner identity entered the R24 writer");
assert(!moduleSource.includes("operator_principal_id"), "operator assignment entered the R24 writer");
assert(!moduleSource.includes("user_id"), "auth-user identity entered the R24 writer");
assert(tests.includes("current operator assignment changes outside the scope"), "operator-transfer stability proof missing");
assert(tests.includes("operator or login identity smuggled"), "identity-smuggling negative control missing");
assert(note.includes("do not bind to an operator principal"), "identity boundary is absent from claim");
assert(qa.includes("No database or runtime claim"), "QA boundary missing");
assert(contract.not_authorized.includes("legacy receipt rewrite"), "legacy preservation boundary missing");

console.log("[g25-custody-envelope-r24] PASS: new write identity is stable custody, not operator or login");
