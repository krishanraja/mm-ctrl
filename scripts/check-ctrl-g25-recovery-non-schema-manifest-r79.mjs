import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-recovery-non-schema-manifest-r79.json"));
const note = read("project-documentation/ctrl-evolution/g25-recovery-non-schema-manifest-r79.md");
const qa = read("project-documentation/ctrl-evolution/g25-recovery-non-schema-manifest-r79-qa-record.md");
const sql = read(contract.probe.path);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-recovery-non-schema-manifest-r79] ${message}`);
};

assert(contract.status === "production_non_schema_inventory_captured_read_only", "status drifted");
assert(sha256(sql) === contract.probe.sha256, "pinned SQL hash drifted");
assert(contract.probe.write_operations === 0, "write boundary widened");
assert(contract.probe.secret_values_returned === 0, "secret boundary widened");
assert(contract.edge_functions.live_active === 183, "live function count drifted");
assert(contract.edge_functions.shared_live_and_local === 115, "shared function count drifted");
assert(contract.edge_functions.local_function_directories_excluding_shared === 122, "current local function count drifted");
assert(contract.edge_functions.local_only_since_observation === 7, "local-only function count drifted");
assert(contract.edge_functions.local_only_since_observation_slugs.length === 7, "local-only function manifest is incomplete");
assert(contract.edge_functions.live_only === 68, "live-only function count drifted");
assert(contract.edge_functions.live_only_slugs.length === 68, "live-only function manifest is incomplete");
assert(new Set(contract.edge_functions.live_only_slugs).size === 68, "live-only function manifest contains duplicates");

const localFunctions = readdirSync(resolve(root, "supabase/functions"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
  .map((entry) => entry.name);
assert(localFunctions.length === 122, "local function count changed without refreshing the live comparison");
assert(contract.edge_functions.local_only_since_observation_slugs.every((slug) => localFunctions.includes(slug)), "recorded local-only source disappeared");
assert(contract.edge_functions.live_only_slugs.every((slug) => !localFunctions.includes(slug)), "a formerly live-only function now has local source; refresh its disposition");

const executable = sql.replace(/^\s*--.*$/gm, "");
assert(!/\b(insert|update|delete|create|alter|drop|truncate|grant|revoke|copy|call|do)\b/i.test(executable), "probe is no longer read-only");
assert(sql.includes("md5(command)"), "cron commands are no longer protected by in-database hashing");
assert(sql.includes("md5(coalesce(name, ''))"), "Vault names are no longer protected by in-database hashing");
assert(note.includes("not an instruction to copy them all"), "legacy improvement boundary disappeared");
assert(qa.includes("No function is declared safe from metadata alone"), "function safety boundary disappeared");

console.log("[g25-recovery-non-schema-manifest-r79] PASS: non-schema machinery is inventoried without treating legacy as automatically safe or disposable");
