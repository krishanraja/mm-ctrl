import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-provider-deletion-hosted-r76.json"));
const note = read("project-documentation/ctrl-evolution/g25-provider-deletion-hosted-r76.md");
const qa = read("project-documentation/ctrl-evolution/g25-provider-deletion-hosted-r76-qa-record.md");
const originalR68 = read("supabase/candidates/g25_provider_deletion_handle_db_authority_r68.sql");

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-provider-deletion-hosted-r76] ${message}`);
};

assert(
  contract.status === "hosted_candidate_path_proved_production_integration_blocked_by_migration_drift",
  "status drifted",
);
for (const [artifact, expected] of Object.entries(contract.artifact_sha256)) {
  assert(sha256(read(contract.implementation[artifact])) === expected, `${artifact} hash drifted`);
}

const repair = read(contract.implementation.authority_repair);
assert(repair.includes("authority_key_id text"), "hosted Vault variable repair disappeared");
assert(repair.includes("v.name = 'ctrl_provider_handle_authority_' || authority_key_id"), "Vault lookup repair drifted");
assert(!/^\s*key_id text;/m.test(repair), "ambiguous key_id variable returned");
assert(originalR68.includes("key_id text;"), "R68 evidence was rewritten instead of superseded");

const hardening = read(contract.implementation.hardening);
for (const marker of [
  "brain_provider_exchanges_r76_deny_all",
  "brain_provider_deletion_dispatches_r76_deny_all",
  "brain_provider_deletion_dispatch_events_r76_deny_all",
  "brain_provider_deletion_dispatches_workspace_r76_idx",
  "brain_provider_deletion_dispatches_receipt_r76_idx",
  "brain_provider_deletion_dispatch_events_predecessor_r76_idx",
]) assert(hardening.includes(marker), `hardening omits ${marker}`);

const authorityProbe = read(contract.implementation.authority_probe);
assert(authorityProbe.includes("provider_handle_authority_signature_invalid"), "invalid signature probe disappeared");
assert(authorityProbe.includes("brain_verified_register_provider_deletion_handle"), "verified registration probe disappeared");
const authApiProbe = read(contract.implementation.auth_api_probe);
assert(authApiProbe.includes("security invoker"), "test wrapper stopped preserving caller identity");
assert(authApiProbe.includes("to authenticated"), "test wrapper lost authenticated-only grant");
assert(authApiProbe.includes("public wrapper exists only to prove a real JWT"), "test-only wrapper warning disappeared");

assert(note.includes("not production readiness"), "bounded hosted claim disappeared");
assert(note.includes("must never ship"), "public probe wrapper shipping veto disappeared");
assert(qa.includes("production migration ledger cannot currently reproduce production schema"), "migration-replay veto disappeared");
assert(qa.includes("Production writes, customer records, provider requests, deployment, merge and release remained at zero"), "production containment evidence disappeared");

console.log("[g25-provider-deletion-hosted-r76] PASS: hosted authority and custody proof is pinned; production integration remains vetoed by migration drift");
