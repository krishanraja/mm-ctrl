import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-auth-reachable-schema-discovery-r17.json"));
const sql = read("supabase/candidates/g25_auth_reachable_relation_discovery_r17.sql");
const runner = read("scripts/run-ctrl-g25-auth-reachable-discovery-r17.mjs");

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-auth-reachable-r17] ${message}`);
}

assert(contract.status === "local_auth_reachable_discovery_proved_registry_closed", "unexpected contract status");
assert(sql.includes("private.brain_discover_auth_reachable_relations()"), "auth-reachable function missing");
assert(sql.toLowerCase().includes("with recursive fk_walk"), "recursive catalog walk missing");
assert(sql.includes("con.confrelid = 'auth.users'::pg_catalog.regclass"), "auth.users root missing");
assert(sql.includes("and child_ns.nspname = 'public'"), "public-schema containment missing");
assert(sql.includes("and not child.oid = any(walk.path_oids)"), "cycle guard missing");
assert(sql.toLowerCase().includes("security invoker"), "security invoker missing");
assert(sql.includes("set search_path = ''"), "empty search path missing");
assert(sql.includes("from public, anon, authenticated"), "public execution closure missing");
assert(!/^\s*(delete|update|insert|truncate)\s/im.test(sql), "discovery candidate contains data mutation");

for (const marker of [
  "public_schema_filter_removed",
  "recursive_discovery_removed",
  "authenticated_execute_opened",
]) {
  assert(runner.includes(marker), `negative control missing: ${marker}`);
}

assert(contract.semantic_boundary.catalog_cannot_establish.includes(
  "whether the relation contains subject data, ownership, attribution or a lawful retention exception",
), "reachability was misrepresented as ownership");
assert(contract.authority.forbids.includes("treating auth reachability as deletion authority"), "deletion authority boundary missing");

console.log("[g25-auth-reachable-r17] PASS: recursive discovery proved; classification and execution remain closed");
