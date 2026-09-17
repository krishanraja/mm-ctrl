import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-recovery-schema-fingerprint-r78.json"));
const note = read("project-documentation/ctrl-evolution/g25-recovery-schema-fingerprint-r78.md");
const qa = read("project-documentation/ctrl-evolution/g25-recovery-schema-fingerprint-r78-qa-record.md");
const sql = read(contract.probe.path);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-recovery-schema-fingerprint-r78] ${message}`);
};

assert(contract.status === "production_fingerprint_captured_read_only", "status drifted");
assert(sha256(sql) === contract.probe.sha256, "pinned SQL hash drifted");
assert(contract.probe.write_operations === 0, "write boundary widened");
assert(contract.probe.customer_rows_returned === 0, "customer-row boundary widened");
assert(contract.production_public_schema_fingerprint.columns.count === 2047, "column baseline drifted");
assert(contract.production_public_schema_fingerprint.routines.count === 204, "routine baseline drifted");
assert(contract.production_public_schema_fingerprint.table_grants.count === 5003, "table-grant baseline drifted");

const executable = sql.replace(/^\s*--.*$/gm, "");
assert(!/\b(insert|update|delete|create|alter|drop|truncate|grant|revoke|copy|call|do)\b/i.test(executable), "probe is no longer read-only");
assert(sql.includes("md5(pg_get_functiondef(p.oid))"), "routine bodies stopped being hashed in database");
assert(sql.includes("md5(coalesce(qual, ''))"), "policy predicates stopped being hashed in database");
assert(/SELECT domain, object_count, digest\s+FROM fingerprints/i.test(sql), "final projection exposes more than fingerprint fields");
assert(note.includes("Digest equality is necessary, not sufficient"), "bounded fingerprint claim disappeared");
assert(qa.includes("production writes were zero"), "read-only execution evidence disappeared");

console.log("[g25-recovery-schema-fingerprint-r78] PASS: the read-only production fingerprint and its limits are pinned");
