import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const prior = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
].map(read);
const overlays = [
  "supabase/candidates/g25_non_cascading_owner_guard_r22.sql",
  "supabase/candidates/g25_stable_custody_identity_r23.sql",
].map(read);
const candidate = read("supabase/candidates/g25_stable_principal_removal_context_r28.sql");

const ids = {
  maya: "11000000-0000-4000-8000-000000000001",
  krish: "11000000-0000-4000-8000-000000000002",
  alternate: "11000000-0000-4000-8000-000000000003",
  mayaWorkspace: "22000000-0000-4000-8000-000000000001",
  krishWorkspace: "22000000-0000-4000-8000-000000000002",
  mayaGrant: "33000000-0000-4000-8000-000000000001",
  krishGrant: "33000000-0000-4000-8000-000000000002",
};

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-stable-principal-removal-r28] ${message}`);
}

function canonicalJson(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`).join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function expectFailure(action, fragment, label) {
  try {
    await action();
  } catch (error) {
    if (String(error?.message).includes(fragment)) return `${label}:closed`;
    throw new Error(`${label} failed for an unexpected reason: ${error?.message}`);
  }
  throw new Error(`${label} unexpectedly passed`);
}

async function createDatabase() {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const sql of prior) await db.exec(sql);
  await db.exec(`
    insert into auth.users(id, email) values
      ('${ids.maya}', 'maya-r28@example.test'),
      ('${ids.krish}', 'krish-r28@example.test'),
      ('${ids.alternate}', 'alternate-r28@example.test');

    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values
      ('${ids.mayaWorkspace}', '${ids.maya}', '${ids.krish}', 'maya-r28'),
      ('${ids.krishWorkspace}', '${ids.krish}', '${ids.krish}', 'krish-r28');

    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values
      ('${ids.mayaWorkspace}', '${ids.krish}', 'owner', '${ids.krish}'),
      ('${ids.krishWorkspace}', '${ids.krish}', 'owner', '${ids.krish}');

    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose, granted_by
    ) values
      ('${ids.mayaGrant}', '${ids.mayaWorkspace}', '${ids.krish}', 'person_private', 'prepared_intelligence', '${ids.krish}'),
      ('${ids.krishGrant}', '${ids.krishWorkspace}', '${ids.krish}', 'person_private', 'prepared_intelligence', '${ids.krish}');
  `);
  for (const sql of overlays) await db.exec(sql);
  await db.exec(candidate);
  return db;
}

async function readContext(db, userId = ids.krish) {
  await db.exec("set role service_role");
  try {
    const result = await db.query(
      "select private.brain_stable_principal_removal_context($1::uuid) as context",
      [userId],
    );
    return result.rows[0].context;
  } finally {
    await db.exec("reset role");
  }
}

const db = await createDatabase();
const checks = [];
try {
  const initial = await readContext(db);
  const unsigned = { ...initial };
  delete unsigned.evidence_ref;
  const expectedEvidence = sha256(
    `stable-principal-removal-context-r28\n${canonicalJson(unsigned)}`,
  );

  assert(initial.schema_version === "ctrl.stable-principal-removal-context.r28", "schema version drifted");
  assert(initial.standing === "verified_complete", "inventory is not verified complete");
  assert(initial.evidence_ref === expectedEvidence, "evidence hash does not bind the exact context");
  assert(initial.workspace_count === 2 && initial.workspaces.length === 2, "related workspace inventory incomplete");
  assert(initial.target_subject_principal_ids.join(",") === ids.krish, "subject identity was not separated");
  assert(initial.target_operator_principal_ids.length === 1, "operator identity was not separated");
  assert(initial.workspaces.every((workspace) => workspace.custody_status === "active"), "active custody was misclassified");
  assert(initial.workspaces.every((workspace) =>
    workspace.current_operator_active_auth_user_ids.join(",") === ids.krish), "last custody route was not exposed");
  assert(!JSON.stringify(initial).includes("owner_id"), "legacy ownership leaked into current custody context");
  checks.push("stable_subject_operator_custody_access_separation");
  checks.push("evidence_bound_verified_inventory");

  const operatorId = initial.target_operator_principal_ids[0];
  await db.query(
    `insert into private.brain_operator_auth_links(operator_principal_id, user_id)
     values ($1::uuid, $2::uuid)`,
    [operatorId, ids.alternate],
  );
  const withAlternate = await readContext(db);
  assert(withAlternate.workspaces.every((workspace) =>
    workspace.current_operator_active_auth_user_ids.includes(ids.krish)
      && workspace.current_operator_active_auth_user_ids.includes(ids.alternate)),
  "alternate login route was not exposed");
  assert(withAlternate.workspaces.every((workspace) => workspace.custody_principal_id ===
    initial.workspaces.find((entry) => entry.workspace_id === workspace.workspace_id)?.custody_principal_id),
  "adding a login changed custody identity");
  checks.push("alternate_login_preserves_custody_identity");

  await db.exec(`
    update private.brain_operator_auth_links
    set revoked_at = '2026-09-17T15:45:00Z'
    where user_id = '${ids.krish}';
    update public.brain_workspace_roles
    set revoked_at = '2026-09-17T15:45:00Z'
    where workspace_id = '${ids.mayaWorkspace}' and user_id = '${ids.krish}';
    update public.brain_audience_grants
    set revoked_at = '2026-09-17T15:45:00Z'
    where workspace_id = '${ids.mayaWorkspace}' and grantee_user_id = '${ids.krish}';
  `);
  const afterRevocation = await readContext(db);
  assert(afterRevocation.target_operator_principal_ids.length === 0, "revoked operator link remained current");
  assert(afterRevocation.workspace_count === 1, "unrelated customer workspace remained in removal scope");
  assert(afterRevocation.workspaces[0].workspace_id === ids.krishWorkspace, "subject Brain fell out of scope");
  assert(afterRevocation.workspaces[0].current_operator_active_auth_user_ids.join(",") === ids.alternate,
    "custody continuity did not survive target-link revocation");
  checks.push("revoked_access_excluded_subject_brain_preserved");

  await db.exec("set role authenticated");
  try {
    checks.push(await expectFailure(
      () => db.query(
        "select private.brain_stable_principal_removal_context($1::uuid)",
        [ids.krish],
      ),
      "permission denied",
      "ordinary_user_read",
    ));
  } finally {
    await db.exec("reset role");
  }
  checks.push(await expectFailure(
    () => readContext(db, "11000000-0000-4000-8000-000000000099"),
    "stable_principal_removal_auth_user_not_found",
    "missing_auth_user",
  ));

  console.log(JSON.stringify({ status: "pass", postgres: "18.3", checks }, null, 2));
} finally {
  await db.close();
}
