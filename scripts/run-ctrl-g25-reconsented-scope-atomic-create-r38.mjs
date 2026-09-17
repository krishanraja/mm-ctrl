import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const chain = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
  "supabase/candidates/g25_non_cascading_owner_guard_r22.sql",
  "supabase/candidates/g25_stable_custody_identity_r23.sql",
  "supabase/candidates/g25_prepared_custody_atomic_store_r25.sql",
  "supabase/candidates/g25_prepared_custody_cipher_admission_r27.sql",
  "supabase/candidates/g25_both_generation_correction_r29.sql",
  "supabase/candidates/g25_both_generation_subject_erasure_r30.sql",
  "supabase/candidates/g25_unified_current_prepared_reader_r31.sql",
  "supabase/candidates/g25_prepared_runtime_cutover_r32.sql",
  "supabase/candidates/g25_prepared_subject_reconsent_reservation_r36.sql",
].map(read);
const candidate = read("supabase/candidates/g25_reconsented_scope_atomic_create_r38.sql");

const names = ["primary", "missing-erasure", "inactive-subject", "inactive-operator", "collision"];
const contexts = Object.fromEntries(names.map((name, index) => {
  const suffix = String(index + 1).padStart(12, "0");
  const subject = `13800000-0000-4000-8000-${suffix}`;
  return [name, {
    name,
    subject,
    owner: subject,
    workspace: `33800000-0000-4000-8000-${suffix}`,
    grant: `43800000-0000-4000-8000-${suffix}`,
    erasure: `53800000-0000-4000-8000-${suffix}`,
    consent: `63800000-0000-4000-8000-${suffix}`,
    newWorkspace: `73800000-0000-4000-8000-${suffix}`,
    newCustody: `83800000-0000-4000-8000-${suffix}`,
    creation: `93800000-0000-4000-8000-${suffix}`,
  }];
}));

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-reconsented-scope-atomic-create-r38] ${message}`);
}

function replaceOnce(source, needle, replacement) {
  const index = source.indexOf(needle);
  if (index === -1) throw new Error(`mutation target missing: ${needle}`);
  return `${source.slice(0, index)}${replacement}${source.slice(index + needle.length)}`;
}

async function scalar(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Object.values(result.rows[0])[0];
}

async function asRole(db, role, action) {
  await db.exec(`set role ${role}`);
  try {
    return await action();
  } finally {
    await db.exec("reset role");
  }
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

async function seedBase(db) {
  for (const [index, context] of Object.values(contexts).entries()) {
    await db.query(
      "insert into auth.users(id, email) values ($1::uuid, $2)",
      [context.subject, `r38-${context.name}-subject@example.test`],
    );
    await db.query(`
      insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key)
      values ($1::uuid, $2::uuid, $3::uuid, $4)
    `, [context.workspace, context.subject, context.owner, `r38-old-${index + 1}`]);
    await db.query(`
      insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by)
      values ($1::uuid, $2::uuid, 'owner', $2::uuid)
    `, [context.workspace, context.owner]);
    await db.query(`
      insert into public.brain_audience_grants(
        id, workspace_id, grantee_user_id, audience, purpose, granted_by
      ) values (
        $1::uuid, $2::uuid, $3::uuid, 'person_private', 'prepared_intelligence', $3::uuid
      )
    `, [context.grant, context.workspace, context.owner]);
  }
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  await db.exec(`
    alter table public.brain_workspaces
      add column workspace_kind text not null default 'personal',
      add column lifecycle_state text not null default 'active',
      add constraint brain_workspaces_check
        check (workspace_kind <> 'personal' or subject_id = owner_id);
  `);
  for (const sql of chain.slice(0, 4)) await db.exec(sql);
  await seedBase(db);
  for (const sql of chain.slice(4, 12)) await db.exec(sql);

  for (const context of Object.values(contexts)) {
    context.oldCustody = await scalar(db, `
      select id from private.brain_custody_principals where workspace_id = $1::uuid
    `, [context.workspace]);
    context.operator = await scalar(db, `
      select operator_principal_id from private.brain_custody_assignments
      where custody_principal_id = $1::uuid and ended_at is null
    `, [context.oldCustody]);
    const erasure = {
      schema_version: "ctrl.prepared-intelligence-custody-subject-erasure.r30",
      erasure_id: context.erasure,
      workspace_id: context.workspace,
      custody_principal_id: context.oldCustody,
      subject_id: context.subject,
      request_sha256: "e".repeat(64),
      occurred_at: new Date().toISOString(),
    };
    await asRole(db, "service_role", () => scalar(db,
      "select private.brain_erase_both_prepared_generations($1::jsonb)",
      [JSON.stringify(erasure)],
    ));
  }
  await db.exec(chain[12]);
  await db.exec(candidateSql);
  return db;
}

function reservationFor(context, index) {
  return {
    schema_version: "ctrl.prepared-intelligence-subject-reconsent-reservation.r36",
    consent_id: context.consent,
    previous_workspace_id: context.workspace,
    previous_custody_principal_id: context.oldCustody,
    subject_id: context.subject,
    consented_by_user_id: context.subject,
    operator_principal_id: context.operator,
    reserved_workspace_id: context.newWorkspace,
    reserved_custody_principal_id: context.newCustody,
    reserved_tenant_key: `r38-new-${index + 1}`,
    statement_version: "brain-restart-consent.v1",
    purpose: "prepared_intelligence",
    request_sha256: String(index + 1).repeat(64),
    occurred_at: new Date().toISOString(),
  };
}

function creationFor(context, overrides = {}) {
  return {
    schema_version: "ctrl.prepared-intelligence-reconsent-scope-creation.r38",
    creation_id: context.creation,
    consent_id: context.consent,
    request_sha256: "c".repeat(64),
    occurred_at: new Date().toISOString(),
    ...overrides,
  };
}

async function reserve(db, context, index) {
  return asRole(db, "service_role", () => scalar(db,
    "select private.brain_reserve_reconsented_prepared_scope($1::jsonb)",
    [JSON.stringify(reservationFor(context, index))],
  ));
}

async function createScope(db, command) {
  return asRole(db, "service_role", () => scalar(db,
    "select private.brain_create_reconsented_prepared_scope($1::jsonb)",
    [JSON.stringify(command)],
  ));
}

async function runPositive(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  const checks = [];
  try {
    const ordered = Object.values(contexts);
    for (const [index, context] of ordered.entries()) await reserve(db, context, index);

    const primary = contexts.primary;
    const command = creationFor(primary);
    const created = await createScope(db, command);
    assert(created.status === "created" && created.scope_status === "active_new_scope",
      "new scope was not created");
    checks.push("reserved_scope_created_atomically");

    const state = await scalar(db, `
      select jsonb_build_object(
        'old_tombstone', exists (
          select 1 from public.brain_prepared_custody_subject_erasure_tombstones
          where workspace_id = $1::uuid and subject_id = $2::uuid
        ),
        'workspace', (
          select jsonb_build_object(
            'subject_id', subject_id,
            'owner_id', owner_id,
            'kind', workspace_kind,
            'state', lifecycle_state
          ) from public.brain_workspaces where id = $3::uuid
        ),
        'historical_origin', (
          select origin from private.brain_historical_principals where id = $3::uuid
        ),
        'custody_workspace', (
          select workspace_id from private.brain_custody_principals where id = $4::uuid
        ),
        'assignment', (
          select jsonb_build_object(
            'operator', operator_principal_id,
            'kind', authorization_kind,
            'authorization', authorization_sha256
          ) from private.brain_custody_assignments
          where custody_principal_id = $4::uuid and ended_at is null
        ),
        'subject_owner_role', exists (
          select 1 from public.brain_workspace_roles
          where workspace_id = $3::uuid and user_id = $2::uuid
            and role = 'owner' and revoked_at is null
        ),
        'operator_role_count', (
          select count(*)::int from public.brain_workspace_roles
          where workspace_id = $3::uuid and role = 'operator' and revoked_at is null
        ),
        'private_grant', exists (
          select 1 from public.brain_audience_grants
          where workspace_id = $3::uuid and grantee_user_id = $2::uuid
            and audience = 'person_private' and purpose = 'prepared_intelligence'
            and revoked_at is null
        ),
        'creation_count', (
          select count(*)::int from public.brain_prepared_reconsent_scope_creations
          where consent_id = $5::uuid
        )
      )
    `, [primary.workspace, primary.subject, primary.newWorkspace, primary.newCustody, primary.consent]);
    assert(state.old_tombstone === true, "old erasure tombstone changed");
    assert(state.workspace.subject_id === primary.subject, "stable subject changed");
    assert(state.workspace.owner_id === primary.newWorkspace, "historical owner was not workspace-scoped");
    assert(state.workspace.owner_id !== primary.subject, "historical owner reused subject login identity");
    assert(state.workspace.kind === "personal" && state.workspace.state === "active",
      "new workspace semantics drifted");
    assert(state.historical_origin === "workspace_scoped_v2", "historical principal origin drifted");
    assert(state.custody_workspace === primary.newWorkspace, "custody did not bind new workspace");
    assert(state.assignment.operator === primary.operator
      && state.assignment.kind === "subject_reconsent"
      && state.assignment.authorization.length === 64,
    "custody assignment did not retain consent authority");
    assert(state.subject_owner_role === true && state.operator_role_count >= 1,
      "current access roles missing");
    assert(state.private_grant === true && state.creation_count === 1,
      "private audience or one-creation invariant missing");
    checks.push("old_erasure_preserved");
    checks.push("stable_subject_and_fresh_historical_owner_separated");
    checks.push("subject_access_operator_custody_and_private_audience_created");

    const replay = await createScope(db, command);
    assert(replay.status === "idempotent" && replay.workspace_id === primary.newWorkspace,
      "exact creation replay was not idempotent");
    checks.push("exact_replay_idempotent");
    checks.push(await expectFailure(
      () => createScope(db, { ...command, creation_id: "a3800000-0000-4000-8000-000000000001" }),
      "scope_creation_consent_already_consumed",
      "alternate_creation_for_consumed_consent",
    ));

    const missingErasure = contexts["missing-erasure"];
    await db.query(`
      delete from public.brain_prepared_custody_subject_erasure_tombstones
      where workspace_id = $1::uuid and subject_id = $2::uuid
    `, [missingErasure.workspace, missingErasure.subject]);
    checks.push(await expectFailure(
      () => createScope(db, creationFor(missingErasure)),
      "scope_creation_old_erasure_missing",
      "missing_old_erasure",
    ));

    const inactiveSubject = contexts["inactive-subject"];
    await db.query(`
      update private.brain_subject_auth_links set revoked_at = now()
      where subject_principal_id = $1::uuid and user_id = $2::uuid
    `, [inactiveSubject.subject, inactiveSubject.subject]);
    checks.push(await expectFailure(
      () => createScope(db, creationFor(inactiveSubject)),
      "scope_creation_subject_access_inactive",
      "inactive_subject_access",
    ));

    const inactiveOperator = contexts["inactive-operator"];
    await db.query(`
      update private.brain_operator_principals set retired_at = now()
      where id = $1::uuid
    `, [inactiveOperator.operator]);
    checks.push(await expectFailure(
      () => createScope(db, creationFor(inactiveOperator)),
      "scope_creation_operator_inactive",
      "inactive_operator",
    ));

    const collision = contexts.collision;
    await db.query(`
      insert into private.brain_historical_principals(id, origin)
      values ($1::uuid, 'workspace_scoped_v2')
    `, [collision.newWorkspace]);
    checks.push(await expectFailure(
      () => createScope(db, creationFor(collision)),
      "scope_creation_reserved_identity_collision",
      "reserved_identity_collision",
    ));

    checks.push(await expectFailure(
      () => asRole(db, "authenticated", () => scalar(db,
        "select private.brain_create_reconsented_prepared_scope($1::jsonb)",
        [JSON.stringify(command)],
      )),
      "permission denied",
      "ordinary_authenticated_creation",
    ));
    checks.push(await expectFailure(
      () => asRole(db, "service_role", () => db.query(`
        insert into public.brain_prepared_reconsent_scope_creations(id)
        values (gen_random_uuid())
      `)),
      "permission denied",
      "raw_service_insert",
    ));

    const security = await scalar(db, `
      select jsonb_build_object(
        'forced_rls', (
          select relrowsecurity and relforcerowsecurity from pg_class
          where oid = 'public.brain_prepared_reconsent_scope_creations'::regclass
        ),
        'service_execute', has_function_privilege(
          'service_role', 'private.brain_create_reconsented_prepared_scope(jsonb)', 'EXECUTE'
        ),
        'authenticated_closed', not has_function_privilege(
          'authenticated', 'private.brain_create_reconsented_prepared_scope(jsonb)', 'EXECUTE'
        ),
        'service_insert_closed', not has_table_privilege(
          'service_role', 'public.brain_prepared_reconsent_scope_creations', 'INSERT'
        )
      )
    `);
    assert(Object.values(security).every((value) => value === true),
      `security boundary failed: ${JSON.stringify(security)}`);
    checks.push("service_only_definer_with_no_raw_insert");

    return {
      status: "pass",
      runtime: "@electric-sql/pglite@0.5.8",
      postgres: (await db.query("show server_version")).rows[0].server_version,
      checks,
      observed: {
        creation_status: created.status,
        scope_status: created.scope_status,
        old_tombstone_preserved: state.old_tombstone,
        workspace_kind: state.workspace.kind,
        stable_subject_preserved: state.workspace.subject_id === primary.subject,
        historical_owner_is_fresh: state.workspace.owner_id === primary.newWorkspace,
        operator_role_count: state.operator_role_count,
        creation_count: state.creation_count,
      },
      security,
    };
  } finally {
    await db.close();
  }
}

async function mutationMustFail(sql, label) {
  try {
    await runPositive(sql);
  } catch {
    return `${label}:failed_as_required`;
  }
  throw new Error(`[g25-reconsented-scope-atomic-create-r38] mutation survived: ${label}`);
}

const result = await runPositive();
const tombstoneCheck = `if not exists (
    select 1
    from public.brain_prepared_custody_subject_erasure_tombstones tombstone_row
    where tombstone_row.workspace_id = reservation.previous_workspace_id
      and tombstone_row.custody_principal_id = reservation.previous_custody_principal_id
      and tombstone_row.subject_id = reservation.subject_id
  ) then raise exception 'scope_creation_old_erasure_missing'; end if;`;
const subjectCheck = `if not exists (
    select 1
    from private.brain_subject_auth_links subject_link
    where subject_link.subject_principal_id = reservation.subject_id
      and subject_link.user_id = reservation.consented_by_user_id
      and subject_link.linked_at <= occurred_at
      and (subject_link.revoked_at is null or subject_link.revoked_at > occurred_at)
  ) then raise exception 'scope_creation_subject_access_inactive'; end if;`;
result.negative_controls = {
  old_erasure: await mutationMustFail(
    replaceOnce(candidate, tombstoneCheck, "if false then raise exception 'disabled'; end if;"),
    "old_erasure_recheck_removed",
  ),
  subject_access: await mutationMustFail(
    replaceOnce(candidate, subjectCheck, "if false then raise exception 'disabled'; end if;"),
    "subject_access_recheck_removed",
  ),
  authenticated_execute: await mutationMustFail(
    replaceOnce(
      candidate,
      "revoke all on function private.brain_create_reconsented_prepared_scope(jsonb)\n  from public, anon, authenticated;",
      "revoke all on function private.brain_create_reconsented_prepared_scope(jsonb)\n  from public, anon;\ngrant execute on function private.brain_create_reconsented_prepared_scope(jsonb) to authenticated;",
    ),
    "authenticated_execute_reopened",
  ),
  raw_insert: await mutationMustFail(
    replaceOnce(
      candidate,
      "grant select on table public.brain_prepared_reconsent_scope_creations to service_role;",
      "grant select, insert on table public.brain_prepared_reconsent_scope_creations to service_role;",
    ),
    "raw_service_insert_reopened",
  ),
};

console.log(JSON.stringify(result, null, 2));
