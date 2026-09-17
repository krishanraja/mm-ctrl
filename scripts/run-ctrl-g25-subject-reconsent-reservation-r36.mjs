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
].map(read);
const candidate = read("supabase/candidates/g25_prepared_subject_reconsent_reservation_r36.sql");

const contexts = {
  erased: {
    subject: "13600000-0000-4000-8000-000000000001",
    owner: "13600000-0000-4000-8000-000000000002",
    workspace: "24600000-0000-4000-8000-000000000001",
    grant: "35600000-0000-4000-8000-000000000001",
    erasure: "79600000-0000-4000-8000-000000000001",
  },
  current: {
    subject: "13600000-0000-4000-8000-000000000011",
    owner: "13600000-0000-4000-8000-000000000012",
    workspace: "24600000-0000-4000-8000-000000000011",
    grant: "35600000-0000-4000-8000-000000000011",
  },
};
const reservationIds = {
  consent: "8a600000-0000-4000-8000-000000000001",
  convergedConsent: "8a600000-0000-4000-8000-000000000002",
  workspace: "24600000-0000-4000-8000-000000000099",
  custody: "8b600000-0000-4000-8000-000000000099",
};

function assert(condition, message) {
  if (!condition) throw new Error(`[g25-subject-reconsent-reservation-r36] ${message}`);
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
  for (const [name, context] of Object.entries(contexts)) {
    await db.query(
      "insert into auth.users(id, email) values ($1::uuid, $2), ($3::uuid, $4)",
      [
        context.subject,
        `r36-${name}-subject@example.test`,
        context.owner,
        `r36-${name}-owner@example.test`,
      ],
    );
    await db.query(`
      insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key)
      values ($1::uuid, $2::uuid, $3::uuid, $4)
    `, [context.workspace, context.subject, context.owner, `r36-${name}`]);
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
  for (const sql of chain.slice(0, 4)) await db.exec(sql);
  await seedBase(db);
  for (const sql of chain.slice(4)) await db.exec(sql);

  const erasedCustody = await scalar(db, `
    select id from private.brain_custody_principals where workspace_id = $1::uuid
  `, [contexts.erased.workspace]);
  const erasure = {
    schema_version: "ctrl.prepared-intelligence-custody-subject-erasure.r30",
    erasure_id: contexts.erased.erasure,
    workspace_id: contexts.erased.workspace,
    custody_principal_id: erasedCustody,
    subject_id: contexts.erased.subject,
    request_sha256: "e".repeat(64),
    occurred_at: new Date(Date.now() - 60_000).toISOString(),
  };
  const erased = await asRole(db, "service_role", () => scalar(db,
    "select private.brain_erase_both_prepared_generations($1::jsonb)",
    [JSON.stringify(erasure)],
  ));
  assert(erased.status === "erased", "fixture scope was not erased");
  await db.exec(candidateSql);
  return db;
}

async function scopeContext(db, raw) {
  const custody = await scalar(db, `
    select id from private.brain_custody_principals where workspace_id = $1::uuid
  `, [raw.workspace]);
  const operator = await scalar(db, `
    select assignment.operator_principal_id
    from private.brain_custody_assignments assignment
    where assignment.custody_principal_id = $1::uuid and assignment.ended_at is null
  `, [custody]);
  return { ...raw, custody, operator };
}

function consentFor(context, overrides = {}) {
  return {
    schema_version: "ctrl.prepared-intelligence-subject-reconsent-reservation.r36",
    consent_id: reservationIds.consent,
    previous_workspace_id: context.workspace,
    previous_custody_principal_id: context.custody,
    subject_id: context.subject,
    consented_by_user_id: context.subject,
    operator_principal_id: context.operator,
    reserved_workspace_id: reservationIds.workspace,
    reserved_custody_principal_id: reservationIds.custody,
    reserved_tenant_key: "r36-reconsented-scope",
    statement_version: "brain-restart-consent.v1",
    purpose: "prepared_intelligence",
    request_sha256: "c".repeat(64),
    occurred_at: new Date().toISOString(),
    ...overrides,
  };
}

async function reserve(db, consent) {
  return asRole(db, "service_role", () => scalar(db,
    "select private.brain_reserve_reconsented_prepared_scope($1::jsonb)",
    [JSON.stringify(consent)],
  ));
}

async function runPositive(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  const checks = [];
  try {
    const erased = await scopeContext(db, contexts.erased);
    const current = await scopeContext(db, contexts.current);
    const consent = consentFor(erased);
    const result = await reserve(db, consent);
    assert(result.status === "reserved", "valid reconsent was not reserved");
    assert(result.scope_status === "reserved_not_created", "reservation claimed to create a Brain");
    checks.push("erased_scope_reconsent_reserved");
    checks.push("reservation_did_not_claim_scope_creation");

    const scopeState = await scalar(db, `
      select jsonb_build_object(
        'old_tombstone', exists (
          select 1 from public.brain_prepared_custody_subject_erasure_tombstones
          where workspace_id = $1::uuid and subject_id = $2::uuid
        ),
        'new_workspace', exists (
          select 1 from public.brain_workspaces where id = $3::uuid
        ),
        'new_custody', exists (
          select 1 from private.brain_custody_principals where id = $4::uuid
        ),
        'reservation_count', (
          select count(*)::int from public.brain_prepared_reconsent_reservations
          where previous_workspace_id = $1::uuid and subject_id = $2::uuid
        )
      )
    `, [erased.workspace, erased.subject, reservationIds.workspace, reservationIds.custody]);
    assert(scopeState.old_tombstone === true, "old erasure tombstone was changed");
    assert(scopeState.new_workspace === false && scopeState.new_custody === false,
      "reservation created a new Brain scope");
    assert(scopeState.reservation_count === 1, "reservation row count drifted");
    checks.push("old_erased_scope_unchanged");
    checks.push("new_scope_ids_reserved_but_absent");

    const replay = await reserve(db, consent);
    assert(replay.status === "idempotent", "exact consent replay was not idempotent");
    const converged = await reserve(db, {
      ...consent,
      consent_id: reservationIds.convergedConsent,
      reserved_workspace_id: "24600000-0000-4000-8000-000000000098",
      reserved_custody_principal_id: "8b600000-0000-4000-8000-000000000098",
      reserved_tenant_key: "r36-retry-generated-scope",
      occurred_at: new Date().toISOString(),
    });
    assert(converged.status === "converged" && converged.consent_id === reservationIds.consent,
      "equivalent consent did not converge on first receipt");
    checks.push("exact_replay_idempotent");
    checks.push("equivalent_consent_converged");

    checks.push(await expectFailure(
      () => reserve(db, { ...consent, request_sha256: "f".repeat(64) }),
      "reconsent_identity_conflict",
      "conflicting_replay",
    ));
    checks.push(await expectFailure(
      () => reserve(db, consentFor(current, {
        consent_id: "8a600000-0000-4000-8000-000000000011",
        reserved_workspace_id: "24600000-0000-4000-8000-000000000111",
        reserved_custody_principal_id: "8b600000-0000-4000-8000-000000000111",
        reserved_tenant_key: "r36-not-erased",
        request_sha256: "1".repeat(64),
      })),
      "reconsent_previous_scope_not_erased",
      "non_erased_scope",
    ));
    checks.push(await expectFailure(
      () => reserve(db, consentFor(erased, {
        consent_id: "8a600000-0000-4000-8000-000000000012",
        consented_by_user_id: current.subject,
        reserved_workspace_id: "24600000-0000-4000-8000-000000000112",
        reserved_custody_principal_id: "8b600000-0000-4000-8000-000000000112",
        reserved_tenant_key: "r36-wrong-subject-link",
        request_sha256: "2".repeat(64),
      })),
      "reconsent_subject_auth_link_invalid",
      "wrong_subject_auth_link",
    ));
    checks.push(await expectFailure(
      () => reserve(db, consentFor(erased, {
        consent_id: "8a600000-0000-4000-8000-000000000013",
        reserved_workspace_id: current.workspace,
        reserved_custody_principal_id: "8b600000-0000-4000-8000-000000000113",
        reserved_tenant_key: "r36-existing-workspace",
        request_sha256: "3".repeat(64),
      })),
      "reconsent_reserved_scope_collision",
      "existing_scope_collision",
    ));
    checks.push(await expectFailure(
      () => reserve(db, consentFor(erased, {
        consent_id: "8a600000-0000-4000-8000-000000000014",
        reserved_workspace_id: erased.workspace,
        reserved_custody_principal_id: "8b600000-0000-4000-8000-000000000114",
        reserved_tenant_key: "r36-old-workspace-reuse",
        request_sha256: "4".repeat(64),
      })),
      "reconsent_new_workspace_required",
      "old_scope_reopen",
    ));

    checks.push(await expectFailure(
      () => asRole(db, "authenticated", () => scalar(db,
        "select private.brain_reserve_reconsented_prepared_scope($1::jsonb)",
        [JSON.stringify(consent)],
      )),
      "permission denied",
      "ordinary_authenticated_reservation",
    ));
    checks.push(await expectFailure(
      () => asRole(db, "service_role", () => db.query(`
        insert into public.brain_prepared_reconsent_reservations(id)
        values (gen_random_uuid())
      `)),
      "permission denied",
      "raw_service_insert",
    ));

    const security = await scalar(db, `
      select jsonb_build_object(
        'forced_rls', (
          select relrowsecurity and relforcerowsecurity from pg_class
          where oid = 'public.brain_prepared_reconsent_reservations'::regclass
        ),
        'service_execute', has_function_privilege(
          'service_role', 'private.brain_reserve_reconsented_prepared_scope(jsonb)', 'EXECUTE'
        ),
        'authenticated_closed', not has_function_privilege(
          'authenticated', 'private.brain_reserve_reconsented_prepared_scope(jsonb)', 'EXECUTE'
        ),
        'anon_closed', not has_function_privilege(
          'anon', 'private.brain_reserve_reconsented_prepared_scope(jsonb)', 'EXECUTE'
        ),
        'service_insert_closed', not has_table_privilege(
          'service_role', 'public.brain_prepared_reconsent_reservations', 'INSERT'
        ),
        'function_definer', (
          select prosecdef from pg_proc
          where oid = 'private.brain_reserve_reconsented_prepared_scope(jsonb)'::regprocedure
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
        receipt_status: result.status,
        scope_status: result.scope_status,
        old_tombstone_preserved: scopeState.old_tombstone,
        new_workspace_created: scopeState.new_workspace,
        new_custody_created: scopeState.new_custody,
        reservation_count: scopeState.reservation_count,
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
  throw new Error(`[g25-subject-reconsent-reservation-r36] mutation survived: ${label}`);
}

const result = await runPositive();
const tombstoneCheck = `if not exists (
    select 1
    from public.brain_prepared_custody_subject_erasure_tombstones tombstone_row
    where tombstone_row.workspace_id = previous_workspace_id
      and tombstone_row.custody_principal_id = previous_custody_principal_id
      and tombstone_row.subject_id = subject_id
  ) then raise exception 'reconsent_previous_scope_not_erased'; end if;`;
const subjectLinkCheck = `if not exists (
    select 1
    from private.brain_subject_auth_links subject_link
    where subject_link.subject_principal_id = subject_id
      and subject_link.user_id = consented_by_user_id
      and subject_link.linked_at <= occurred_at
      and (subject_link.revoked_at is null or subject_link.revoked_at > occurred_at)
  ) then raise exception 'reconsent_subject_auth_link_invalid'; end if;`;
result.negative_controls = {
  erased_scope: await mutationMustFail(
    replaceOnce(candidate, tombstoneCheck, "if false then raise exception 'disabled'; end if;"),
    "erased_scope_requirement_removed",
  ),
  subject_link: await mutationMustFail(
    replaceOnce(candidate, subjectLinkCheck, "if false then raise exception 'disabled'; end if;"),
    "subject_auth_link_requirement_removed",
  ),
  authenticated_execute: await mutationMustFail(
    replaceOnce(
      candidate,
      "revoke all on function private.brain_reserve_reconsented_prepared_scope(jsonb)\n  from public, anon, authenticated;",
      "revoke all on function private.brain_reserve_reconsented_prepared_scope(jsonb)\n  from public, anon;\ngrant execute on function private.brain_reserve_reconsented_prepared_scope(jsonb) to authenticated;",
    ),
    "authenticated_execute_reopened",
  ),
  raw_insert: await mutationMustFail(
    replaceOnce(
      candidate,
      "grant select on table public.brain_prepared_reconsent_reservations to service_role;",
      "grant select, insert on table public.brain_prepared_reconsent_reservations to service_role;",
    ),
    "raw_service_insert_reopened",
  ),
};

console.log(JSON.stringify(result, null, 2));
