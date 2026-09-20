import fs from "node:fs";
import path from "node:path";
import { createG25PostgresHarness } from "./lib/g25-postgres-harness.mjs";

const root = process.cwd();
const priorFiles = [
  "supabase/candidates/g25_prepared_receipt_atomic_store_r10.sql",
  "supabase/candidates/g25_prepared_authority_adapter_r11.sql",
  "supabase/candidates/g25_prepared_correction_invalidation_r12.sql",
  "supabase/candidates/g25_prepared_subject_erasure_r13.sql",
];
const priorSql = priorFiles.map((relative) => fs.readFileSync(path.join(root, relative), "utf8"));
const r22 = fs.readFileSync(
  path.join(root, "supabase/candidates/g25_non_cascading_owner_guard_r22.sql"),
  "utf8",
);
const candidate = fs.readFileSync(
  path.join(root, "supabase/candidates/g25_stable_custody_identity_r23.sql"),
  "utf8",
);

const IDS = {
  maya: "11111111-1111-4111-8111-111111111111",
  krish: "22222222-2222-4222-8222-222222222222",
  alex: "33333333-3333-4333-8333-333333333333",
  sam: "44444444-4444-4444-8444-444444444444",
  nina: "55555555-5555-4555-8555-555555555555",
  mayaWorkspace: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  krishWorkspace: "abababab-abab-4bab-8bab-abababababab",
  ninaWorkspace: "acacacac-acac-4cac-8cac-acacacacacac",
  receipt: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  correction: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  erasure: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  affected: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  replacement: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  mayaGrant: "10101010-1010-4010-8010-101010101010",
  krishGrant: "20202020-2020-4020-8020-202020202020",
  ninaGrant: "30303030-3030-4030-8030-303030303030",
  alexMayaGrant: "40404040-4040-4040-8040-404040404040",
  alexKrishGrant: "50505050-5050-4050-8050-505050505050",
  alexNinaGrant: "60606060-6060-4060-8060-606060606060",
};

async function seedLegacyState(db) {
  await db.exec(`
    insert into auth.users(id, email) values
      ('${IDS.maya}', 'maya@example.test'),
      ('${IDS.krish}', 'krish@example.test'),
      ('${IDS.alex}', 'alex@example.test'),
      ('${IDS.sam}', 'sam@example.test'),
      ('${IDS.nina}', 'nina@example.test');

    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key) values
      ('${IDS.mayaWorkspace}', '${IDS.maya}', '${IDS.krish}', 'maya-brain'),
      ('${IDS.krishWorkspace}', '${IDS.krish}', '${IDS.krish}', 'krish-brain'),
      ('${IDS.ninaWorkspace}', '${IDS.nina}', '${IDS.sam}', 'nina-brain');

    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values
      ('${IDS.mayaWorkspace}', '${IDS.krish}', 'owner', '${IDS.krish}'),
      ('${IDS.krishWorkspace}', '${IDS.krish}', 'owner', '${IDS.krish}'),
      ('${IDS.ninaWorkspace}', '${IDS.sam}', 'owner', '${IDS.sam}');

    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose, granted_by
    ) values
      ('${IDS.mayaGrant}', '${IDS.mayaWorkspace}', '${IDS.krish}', 'person_private', 'prepared_intelligence', '${IDS.krish}'),
      ('${IDS.krishGrant}', '${IDS.krishWorkspace}', '${IDS.krish}', 'person_private', 'prepared_intelligence', '${IDS.krish}'),
      ('${IDS.ninaGrant}', '${IDS.ninaWorkspace}', '${IDS.sam}', 'person_private', 'prepared_intelligence', '${IDS.sam}');

    insert into public.brain_prepared_receipts(
      id, workspace_id, owner_id, subject_id, ingest_key, request_sha256, kind,
      audience, purpose, authority_fingerprint, content_fingerprint,
      payload_ciphertext, encryption_version, produced_at, expires_at
    ) values (
      '${IDS.receipt}', '${IDS.mayaWorkspace}', '${IDS.krish}', '${IDS.maya}', 'ingest-1',
      repeat('1', 64), 'prepared_intelligence', 'person_private', 'prepared_intelligence',
      repeat('2', 64), repeat('3', 64), 'immutable-ciphertext', 1,
      '2026-09-17T10:00:00Z', '2026-10-17T10:00:00Z'
    );

    insert into public.brain_prepared_authority_corrections(
      id, workspace_id, owner_id, subject_id, audience, purpose, correction_mode,
      affected_authority_kind, affected_authority_record_id,
      replacement_authority_record_id, replacement_authority_version,
      replacement_authority_sha256, correction_fingerprint, request_sha256, occurred_at
    ) values (
      '${IDS.correction}', '${IDS.mayaWorkspace}', '${IDS.krish}', '${IDS.maya}',
      'person_private', 'prepared_intelligence', 'replaced', 'brain_item_version',
      '${IDS.affected}', '${IDS.replacement}', 'v2', repeat('4', 64),
      repeat('5', 64), repeat('6', 64), '2026-09-17T10:30:00Z'
    );

    insert into public.brain_prepared_subject_erasure_tombstones(
      erasure_id, workspace_id, owner_id, subject_id, request_sha256,
      erasure_fingerprint, occurred_at
    ) values (
      '${IDS.erasure}', '${IDS.mayaWorkspace}', '${IDS.krish}', '${IDS.maya}',
      repeat('7', 64), repeat('8', 64), '2026-09-17T11:00:00Z'
    );
  `);
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const statement of priorSql) await db.exec(statement);
  await seedLegacyState(db);
  await db.exec(r22);
  await db.exec(candidateSql);
  // The candidate backfill correctly uses now() in production. The archived
  // proof transfers at a fixed 2026 timestamp, so pin fixture acceptance just
  // before that transfer instead of letting the wall clock make the test
  // invalid after 17 September 2026.
  await db.exec(`
    update private.brain_custody_assignments
    set accepted_at = '2026-09-17T17:00:00Z'::timestamptz
    where authorization_kind = 'legacy_backfill'
  `);
  return db;
}

async function custodyState(db, workspaceId) {
  const result = await db.query(`
    select jsonb_build_object(
      'workspace_id', custody.workspace_id,
      'custody_principal_id', custody.id,
      'operator_principal_id', assignment.operator_principal_id,
      'status', case
        when custody.closed_at is not null then 'closed'
        when assignment.operator_principal_id is null then 'unassigned'
        when exists (
          select 1
          from private.brain_operator_auth_links auth_link
          where auth_link.operator_principal_id = assignment.operator_principal_id
            and auth_link.revoked_at is null
        ) then 'active'
        else 'transfer_required'
      end
    ) as state
    from private.brain_custody_principals custody
    left join private.brain_custody_assignments assignment
      on assignment.custody_principal_id = custody.id
      and assignment.ended_at is null
    where custody.workspace_id = '${workspaceId}'
  `);
  return result.rows[0]?.state;
}

async function transfer(db, workspaceId, fromOperator, toOperator, digit, at) {
  await db.query(`
    select private.brain_transfer_workspace_custody(
      '${workspaceId}',
      '${fromOperator}',
      '${toOperator}',
      repeat('${digit}', 64),
      '${at}'::timestamptz
    )
  `);
}

async function protectedSnapshot(db) {
  const result = await db.query(`
    select jsonb_build_object(
      'workspaces', (select count(*) from public.brain_workspaces),
      'maya_receipt', (select count(*) from public.brain_prepared_receipts where id = '${IDS.receipt}'),
      'maya_correction', (select count(*) from public.brain_prepared_authority_corrections where id = '${IDS.correction}'),
      'maya_tombstone', (select count(*) from public.brain_prepared_subject_erasure_tombstones where erasure_id = '${IDS.erasure}'),
      'ciphertext', (select payload_ciphertext from public.brain_prepared_receipts where id = '${IDS.receipt}'),
      'authority_fingerprint', (select authority_fingerprint from public.brain_prepared_receipts where id = '${IDS.receipt}'),
      'historical_owner', (select owner_id from public.brain_prepared_receipts where id = '${IDS.receipt}'),
      'krish_subject_workspace', (select count(*) from public.brain_workspaces where id = '${IDS.krishWorkspace}' and subject_id = '${IDS.krish}')
    ) as snapshot
  `);
  return result.rows[0].snapshot;
}

async function visiblePreparedReceipts(db, userId) {
  await db.exec(`
    begin;
    select set_config('request.jwt.claim.sub', '${userId}', true);
    select set_config('request.jwt.claims', '{"is_anonymous": false}', true);
    set local role authenticated;
  `);
  try {
    const result = await db.query("select count(*)::integer as count from public.brain_prepared_receipts");
    return result.rows[0].count;
  } finally {
    await db.exec("rollback");
  }
}

function assertEqual(actual, expected, label) {
  const canonical = (value) => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    }
    return value;
  };
  if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected))) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertPreserved(before, after, label) {
  assertEqual(after, before, label);
}

async function inspect(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  try {
    const before = await protectedSnapshot(db);
    const constraintTargets = await db.query(`
      select conname, confrelid::regclass::text as target, confdeltype
      from pg_constraint
      where conname in (
        'brain_workspaces_subject_id_fkey',
        'brain_workspaces_owner_id_fkey',
        'brain_prepared_receipts_subject_id_fkey',
        'brain_prepared_receipts_owner_id_fkey',
        'brain_prepared_authority_corrections_subject_id_fkey',
        'brain_prepared_authority_corrections_owner_id_fkey',
        'brain_prepared_subject_erasure_tombstones_subject_id_fkey',
        'brain_prepared_subject_erasure_tombstones_owner_id_fkey'
      )
      order by conname
    `);

    const existingOperators = await db.query(`
      select id, legacy_auth_alias
      from private.brain_operator_principals
      order by legacy_auth_alias
    `);
    const krishOperator = existingOperators.rows.find((row) => row.legacy_auth_alias === IDS.krish)?.id;
    const samOperator = existingOperators.rows.find((row) => row.legacy_auth_alias === IDS.sam)?.id;
    if (!krishOperator || !samOperator || krishOperator === IDS.krish || samOperator === IDS.sam) {
      throw new Error(`operator principals are not independent: ${JSON.stringify(existingOperators.rows)}`);
    }
    const insertedAlex = await db.query(`
      insert into private.brain_operator_principals default values
      returning id
    `);
    const alexOperator = insertedAlex.rows[0].id;
    await db.exec(`
      insert into private.brain_operator_auth_links(operator_principal_id, user_id)
      values ('${alexOperator}', '${IDS.alex}');
    `);

    await transfer(db, IDS.mayaWorkspace, krishOperator, alexOperator, "9", "2026-09-17T18:00:00Z");
    await transfer(db, IDS.krishWorkspace, krishOperator, alexOperator, "a", "2026-09-17T18:01:00Z");

    const custodyDoesNotGrantAccess = await db.query(`
      select jsonb_build_object(
        'alex_roles', (select count(*) from public.brain_workspace_roles where user_id = '${IDS.alex}'),
        'alex_grants', (select count(*) from public.brain_audience_grants where grantee_user_id = '${IDS.alex}')
      ) as result
    `);

    await db.exec(`
      insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by) values
        ('${IDS.mayaWorkspace}', '${IDS.alex}', 'owner', '${IDS.alex}'),
        ('${IDS.krishWorkspace}', '${IDS.alex}', 'owner', '${IDS.alex}');
      insert into public.brain_audience_grants(
        id, workspace_id, grantee_user_id, audience, purpose, granted_by
      ) values
        ('${IDS.alexMayaGrant}', '${IDS.mayaWorkspace}', '${IDS.alex}', 'person_private', 'prepared_intelligence', '${IDS.alex}'),
        ('${IDS.alexKrishGrant}', '${IDS.krishWorkspace}', '${IDS.alex}', 'person_private', 'prepared_intelligence', '${IDS.alex}');
    `);

    await db.exec(`delete from auth.users where id = '${IDS.krish}'`);
    const afterPlannedRemoval = await protectedSnapshot(db);
    assertPreserved(before, afterPlannedRemoval, "planned operator removal changed protected Brain state");
    const removedOperatorExistingJwtRead = await visiblePreparedReceipts(db, IDS.krish);
    const replacementOperatorRead = await visiblePreparedReceipts(db, IDS.alex);

    const plannedRemoval = await db.query(`
      select jsonb_build_object(
        'auth_user', (select count(*) from auth.users where id = '${IDS.krish}'),
        'subject_auth_links', (select count(*) from private.brain_subject_auth_links where user_id = '${IDS.krish}'),
        'operator_auth_links', (select count(*) from private.brain_operator_auth_links where user_id = '${IDS.krish}'),
        'roles', (select count(*) from public.brain_workspace_roles where user_id = '${IDS.krish}'),
        'grants', (select count(*) from public.brain_audience_grants where grantee_user_id = '${IDS.krish}'),
        'subject_principal', (select count(*) from private.brain_subject_principals where id = '${IDS.krish}'),
        'operator_principal', (select count(*) from private.brain_operator_principals where legacy_auth_alias = '${IDS.krish}')
      ) as result
    `);

    await db.exec(`delete from auth.users where id = '${IDS.sam}'`);
    const afterUnplannedRemoval = await protectedSnapshot(db);
    assertPreserved(before, afterUnplannedRemoval, "unplanned operator removal changed protected Brain state");
    const unplannedState = await custodyState(db, IDS.ninaWorkspace);

    await transfer(db, IDS.ninaWorkspace, samOperator, alexOperator, "b", "2026-09-17T18:02:00Z");
    const recoveredStateBeforeAccess = await custodyState(db, IDS.ninaWorkspace);
    const ninaAccessBeforeGrant = await db.query(`
      select count(*)::integer as count
      from public.brain_workspace_roles
      where workspace_id = '${IDS.ninaWorkspace}' and user_id = '${IDS.alex}'
    `);
    await db.exec(`
      insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by)
      values ('${IDS.ninaWorkspace}', '${IDS.alex}', 'owner', '${IDS.alex}');
      insert into public.brain_audience_grants(
        id, workspace_id, grantee_user_id, audience, purpose, granted_by
      ) values (
        '${IDS.alexNinaGrant}', '${IDS.ninaWorkspace}', '${IDS.alex}',
        'person_private', 'prepared_intelligence', '${IDS.alex}'
      );
    `);

    let duplicateCurrentAssignment = "not_run";
    try {
      const custody = await custodyState(db, IDS.ninaWorkspace);
      await db.exec(`
        insert into private.brain_custody_assignments(
          custody_principal_id, operator_principal_id, accepted_at,
          authorization_kind, authorization_sha256
        ) values (
          '${custody.custody_principal_id}', '${krishOperator}', '2026-09-17T18:03:00Z',
          'customer_authorized_transfer', repeat('c', 64)
        )
      `);
    } catch (error) {
      if (/unique|duplicate/i.test(String(error?.message))) duplicateCurrentAssignment = "blocked";
      else throw error;
    }

    let wrongSourceTransfer = "not_run";
    try {
      await transfer(db, IDS.ninaWorkspace, samOperator, krishOperator, "d", "2026-09-17T18:04:00Z");
    } catch (error) {
      if (/custody_transfer_source_mismatch/i.test(String(error?.message))) wrongSourceTransfer = "blocked";
      else throw error;
    }

    return {
      constraint_targets: constraintTargets.rows,
      operator_identity_separated: true,
      krish_operator_principal_id: krishOperator,
      sam_operator_principal_id: samOperator,
      replacement_operator_principal_id: alexOperator,
      custody_does_not_grant_access: custodyDoesNotGrantAccess.rows[0].result,
      planned_operator_removal: plannedRemoval.rows[0].result,
      removed_operator_existing_jwt_receipts: removedOperatorExistingJwtRead,
      replacement_operator_receipts: replacementOperatorRead,
      planned_maya_custody: await custodyState(db, IDS.mayaWorkspace),
      planned_dual_role_custody: await custodyState(db, IDS.krishWorkspace),
      unplanned_operator_removal: unplannedState,
      recovered_custody_before_access_grant: recoveredStateBeforeAccess,
      recovered_access_before_explicit_grant: ninaAccessBeforeGrant.rows[0].count,
      protected_snapshot: afterPlannedRemoval,
      controls: {
        duplicate_current_assignment: duplicateCurrentAssignment,
        wrong_source_transfer: wrongSourceTransfer,
      },
    };
  } finally {
    await db.close();
  }
}

function assertProtected(result) {
  const subjectTargets = result.constraint_targets.filter((row) => row.conname.includes("subject_id_fkey"));
  const ownerTargets = result.constraint_targets.filter((row) => row.conname.includes("owner_id_fkey"));
  if (subjectTargets.length !== 4 || subjectTargets.some((row) => row.target !== "private.brain_subject_principals" || row.confdeltype !== "r")) {
    throw new Error(`subject constraints are not stable and restrictive: ${JSON.stringify(subjectTargets)}`);
  }
  if (ownerTargets.length !== 4 || ownerTargets.some((row) => row.target !== "private.brain_historical_principals" || row.confdeltype !== "r")) {
    throw new Error(`owner constraints are not historical and restrictive: ${JSON.stringify(ownerTargets)}`);
  }
  assertEqual(result.custody_does_not_grant_access, { alex_roles: 0, alex_grants: 0 }, "custody granted access");
  assertEqual(result.planned_operator_removal, {
    auth_user: 0,
    subject_auth_links: 0,
    operator_auth_links: 0,
    roles: 0,
    grants: 0,
    subject_principal: 1,
    operator_principal: 1,
  }, "planned removal state drifted");
  if (Number(result.removed_operator_existing_jwt_receipts) !== 0 || Number(result.replacement_operator_receipts) !== 1) {
    throw new Error(`access handoff drifted: ${JSON.stringify({
      removed: result.removed_operator_existing_jwt_receipts,
      replacement: result.replacement_operator_receipts,
    })}`);
  }
  if (result.operator_identity_separated !== true || result.replacement_operator_principal_id === IDS.alex) {
    throw new Error("operator and authentication identity were conflated");
  }
  if (result.planned_maya_custody.status !== "active" || result.planned_maya_custody.operator_principal_id !== result.replacement_operator_principal_id) {
    throw new Error(`planned Maya custody drifted: ${JSON.stringify(result.planned_maya_custody)}`);
  }
  if (result.planned_dual_role_custody.status !== "active" || result.planned_dual_role_custody.operator_principal_id !== result.replacement_operator_principal_id) {
    throw new Error(`dual-role custody drifted: ${JSON.stringify(result.planned_dual_role_custody)}`);
  }
  if (result.unplanned_operator_removal.status !== "transfer_required" || result.unplanned_operator_removal.operator_principal_id !== result.sam_operator_principal_id) {
    throw new Error(`unplanned removal did not fail safe: ${JSON.stringify(result.unplanned_operator_removal)}`);
  }
  if (result.recovered_custody_before_access_grant.status !== "active" || result.recovered_custody_before_access_grant.operator_principal_id !== result.replacement_operator_principal_id) {
    throw new Error(`custody recovery drifted: ${JSON.stringify(result.recovered_custody_before_access_grant)}`);
  }
  if (Number(result.recovered_access_before_explicit_grant) !== 0) {
    throw new Error("custody recovery silently granted workspace access");
  }
  if (result.protected_snapshot.ciphertext !== "immutable-ciphertext" || result.protected_snapshot.historical_owner !== IDS.krish) {
    throw new Error(`historical receipt identity changed: ${JSON.stringify(result.protected_snapshot)}`);
  }
  if (result.controls.duplicate_current_assignment !== "blocked" || result.controls.wrong_source_transfer !== "blocked") {
    throw new Error(`transfer controls drifted: ${JSON.stringify(result.controls)}`);
  }
}

const positive = await inspect();
assertProtected(positive);

let authOwnerNegative = "not_run";
try {
  const weakened = candidate.replaceAll(
    "references private.brain_historical_principals(id) on delete restrict",
    "references auth.users(id) on delete restrict",
  );
  const result = await inspect(weakened);
  assertProtected(result);
} catch (error) {
  if (/foreign key|historical and restrictive/i.test(String(error?.message))) authOwnerNegative = "failed_as_required";
  else throw error;
}
if (authOwnerNegative !== "failed_as_required") throw new Error("auth-owner negative control unexpectedly passed");

let subjectCascadeNegative = "not_run";
try {
  const weakened = candidate.replaceAll(
    "references private.brain_subject_principals(id) on delete restrict",
    "references auth.users(id) on delete cascade",
  );
  const result = await inspect(weakened);
  assertProtected(result);
} catch (error) {
  if (/protected Brain state|stable and restrictive/i.test(String(error?.message))) subjectCascadeNegative = "failed_as_required";
  else throw error;
}
if (subjectCascadeNegative !== "failed_as_required") throw new Error("subject-cascade negative control unexpectedly passed");

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_controls: {
    historical_owner_rebound_to_auth_user: authOwnerNegative,
    stable_subject_rebound_to_auth_cascade: subjectCascadeNegative,
  },
}, null, 2)}\n`);
