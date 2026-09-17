import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-dispatch-postgres-r73.json"));
const candidate = read(contract.implementation.candidate);
const tests = read(contract.implementation.tests);
const config = read(contract.implementation.config);
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-dispatch-postgres-r73.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-dispatch-postgres-r73-qa-record.md");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-dispatch-postgres-r73] ${message}`);
};

assert(
  contract.status === "append_only_dispatch_postgres_locally_proved_independent_connections_closed",
  "status drifted",
);
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}
for (const marker of [
  "force row level security",
  "provider_deletion_dispatch_operation_identity_conflict",
  "provider_deletion_dispatch_predecessor_invalid",
  "provider_deletion_dispatch_event_chain_invalid",
  "provider_deletion_dispatch_event_transition_invalid",
  "provider_deletion_dispatch_retry_limit_reached",
  "provider_deletion_dispatch_operator_event",
  "from public, anon, authenticated, service_role",
]) assert(candidate.includes(marker), `candidate omits ${marker}`);
for (const behavior of [
  "records only a content-free projection and converges on exact replay",
  "locks worker acceptance and completion into an append-only projection",
  "denies wrong roles, direct reads and old broad service access",
  "requires a closed linked predecessor before recording a retry",
  "rolls back an invalid event without changing the projection",
  "preserves dead-lettered work for explicit human recovery",
]) assert(tests.includes(behavior), `tests omit ${behavior}`);
assert(config.includes('environment: "node"'), "test environment drifted");
assert(note.includes("one in-process PGlite instance"), "single-process boundary disappeared");
assert(qa.includes("independent login isolation is unproved"), "independent-connection limit disappeared");
assert(!candidate.includes("create policy"), "candidate must not imply a human-session RLS policy");

console.log("[g25-provider-deletion-dispatch-postgres-r73] PASS: append-only dispatch persistence is locally proved; independent connections remain closed");
