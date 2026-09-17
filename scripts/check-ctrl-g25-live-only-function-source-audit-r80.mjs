import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-live-only-function-source-audit-r80.json"));
const note = read("project-documentation/ctrl-evolution/g25-live-only-function-source-audit-r80.md");
const qa = read("project-documentation/ctrl-evolution/g25-live-only-function-source-audit-r80-qa-record.md");
const r79 = JSON.parse(read("project-documentation/ctrl-evolution/g25-recovery-non-schema-manifest-r79.json"));

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-live-only-function-source-audit-r80] ${message}`);
};

assert(contract.status === "source_metadata_audit_complete_disposition_open", "status drifted");
assert(contract.source_audit.functions_retrieved === 68, "source coverage drifted");
assert(contract.source_audit.retrieval_errors_after_bounded_retry === 0, "retrieval errors are no longer zero");
assert(contract.gateway_review.verify_jwt_false_count === 31, "JWT-disabled review queue drifted");
assert(contract.gateway_review.verify_jwt_false_with_service_role_symbol === 22, "service-role review queue drifted");
assert(contract.gateway_review.verify_jwt_false_slugs.length === 31, "JWT-disabled slug list is incomplete");
assert(new Set(contract.gateway_review.verify_jwt_false_slugs).size === 31, "JWT-disabled slug list contains duplicates");
assert(contract.gateway_review.verify_jwt_false_slugs.every((slug) => r79.edge_functions.live_only_slugs.includes(slug)), "source audit includes a function outside the R79 manifest");
assert(Object.keys(contract.current_repo_runtime_references).length === 3, "caller scan changed without review");
assert(contract.caller_boundary.includes("not retirement evidence"), "unknown-caller protection disappeared");
assert(contract.security_boundary.includes("not proof of correct authentication"), "static auth boundary disappeared");
assert(note.includes("review queue, not a vulnerability verdict"), "security claim became overconfident");
assert(qa.includes("caller_unknown`, not `unused`"), "unknown callers became false retirement evidence");

console.log("[g25-live-only-function-source-audit-r80] PASS: all live-only sources are accounted for without inventing security or retirement conclusions");
