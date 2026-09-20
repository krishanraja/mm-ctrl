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
const candidate = fs.readFileSync(
  path.join(root, "supabase/candidates/g25_non_cascading_owner_guard_r22.sql"),
  "utf8",
);

const IDS = {
  maya: "11111111-1111-4111-8111-111111111111",
  krish: "22222222-2222-4222-8222-222222222222",
  alex: "33333333-3333-4333-8333-333333333333",
  sam: "44444444-4444-4444-8444-444444444444",
  workspace: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  receipt: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  correction: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  erasure: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  affected: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  replacement: "ffffffff-ffff-4fff-8fff-ffffffffffff",
};

async function createDatabase(candidateSql) {
  const db = await createG25PostgresHarness({ authorityTables: true });
  for (const statement of priorSql) await db.exec(statement);
  await db.exec(candidateSql);
  await db.exec(`
    insert into auth.users(id, email) values
      ('${IDS.maya}', 'maya@example.test'),
      ('${IDS.krish}', 'krish@example.test'),
      ('${IDS.alex}', 'alex@example.test'),
      ('${IDS.sam}', 'sam@example.test');

    insert into public.brain_workspaces(id, subject_id, owner_id, tenant_key)
    values ('${IDS.workspace}', '${IDS.maya}', '${IDS.krish}', 'maya-brain');

    insert into public.brain_workspace_roles(workspace_id, user_id, role, granted_by)
    values
      ('${IDS.workspace}', '${IDS.krish}', 'owner', '${IDS.krish}'),
      ('${IDS.workspace}', '${IDS.sam}', 'operator', '${IDS.krish}');

    insert into public.brain_prepared_receipts(
      id, workspace_id, owner_id, subject_id, ingest_key, request_sha256, kind,
      audience, purpose, authority_fingerprint, content_fingerprint,
      payload_ciphertext, encryption_version, produced_at, expires_at
    ) values (
      '${IDS.receipt}', '${IDS.workspace}', '${IDS.krish}', '${IDS.maya}', 'ingest-1',
      repeat('1', 64), 'prepared_intelligence', 'person_private', 'prepared_intelligence',
      repeat('2', 64), repeat('3', 64), 'ciphertext', 1,
      '2026-09-17T10:00:00Z', '2026-10-17T10:00:00Z'
    );

    insert into public.brain_prepared_authority_corrections(
      id, workspace_id, owner_id, subject_id, audience, purpose, correction_mode,
      affected_authority_kind, affected_authority_record_id,
      replacement_authority_record_id, replacement_authority_version,
      replacement_authority_sha256, correction_fingerprint, request_sha256, occurred_at
    ) values (
      '${IDS.correction}', '${IDS.workspace}', '${IDS.krish}', '${IDS.maya}',
      'person_private', 'prepared_intelligence', 'replaced', 'brain_item_version',
      '${IDS.affected}', '${IDS.replacement}', 'v2', repeat('4', 64),
      repeat('5', 64), repeat('6', 64), '2026-09-17T10:30:00Z'
    );

    insert into public.brain_prepared_subject_erasure_tombstones(
      erasure_id, workspace_id, owner_id, subject_id, request_sha256,
      erasure_fingerprint, occurred_at
    ) values (
      '${IDS.erasure}', '${IDS.workspace}', '${IDS.krish}', '${IDS.maya}',
      repeat('7', 64), repeat('8', 64), '2026-09-17T11:00:00Z'
    );
  `);
  return db;
}

async function expectDeleteBlocked(db, userId, label) {
  try {
    await db.exec(`delete from auth.users where id = '${userId}'`);
  } catch (error) {
    if (/foreign key|violates/i.test(String(error?.message))) return `${label}:blocked`;
    throw error;
  }
  throw new Error(`${label}:unexpectedly_deleted`);
}

async function inspect(candidateSql = candidate) {
  const db = await createDatabase(candidateSql);
  try {
    const ownerConstraints = await db.query(`
      select conname, confdeltype
      from pg_constraint
      where conname in (
        'brain_workspaces_owner_id_fkey',
        'brain_prepared_receipts_owner_id_fkey',
        'brain_prepared_authority_corrections_owner_id_fkey',
        'brain_prepared_subject_erasure_tombstones_owner_id_fkey'
      )
      order by conname
    `);

    const initialBlock = await expectDeleteBlocked(db, IDS.krish, "differently_subjected_owner");
    const afterBlockedDelete = await db.query(`
      select jsonb_build_object(
        'operator_user', (select count(*) from auth.users where id = '${IDS.krish}'),
        'workspace', (select count(*) from public.brain_workspaces where id = '${IDS.workspace}'),
        'role', (select count(*) from public.brain_workspace_roles where user_id = '${IDS.krish}'),
        'receipt', (select count(*) from public.brain_prepared_receipts where id = '${IDS.receipt}'),
        'correction', (select count(*) from public.brain_prepared_authority_corrections where id = '${IDS.correction}'),
        'tombstone', (select count(*) from public.brain_prepared_subject_erasure_tombstones where erasure_id = '${IDS.erasure}')
      ) as result
    `);

    await db.exec(`update public.brain_workspaces set owner_id = '${IDS.alex}' where id = '${IDS.workspace}'`);
    const historicalCustodyBlock = await expectDeleteBlocked(db, IDS.krish, "historical_prepared_custody");

    await db.exec(`delete from auth.users where id = '${IDS.sam}'`);
    const roleOnlyRemoval = await db.query(`
      select jsonb_build_object(
        'operator_user', (select count(*) from auth.users where id = '${IDS.sam}'),
        'operator_role', (select count(*) from public.brain_workspace_roles where user_id = '${IDS.sam}'),
        'workspace', (select count(*) from public.brain_workspaces where id = '${IDS.workspace}')
      ) as result
    `);

    await db.exec(`delete from auth.users where id = '${IDS.maya}'`);
    const subjectRemoval = await db.query(`
      select jsonb_build_object(
        'subject_user', (select count(*) from auth.users where id = '${IDS.maya}'),
        'workspace', (select count(*) from public.brain_workspaces where id = '${IDS.workspace}'),
        'receipt', (select count(*) from public.brain_prepared_receipts where id = '${IDS.receipt}'),
        'correction', (select count(*) from public.brain_prepared_authority_corrections where id = '${IDS.correction}'),
        'tombstone', (select count(*) from public.brain_prepared_subject_erasure_tombstones where erasure_id = '${IDS.erasure}')
      ) as result
    `);

    return {
      owner_constraints: ownerConstraints.rows,
      initial_block: initialBlock,
      after_blocked_delete: afterBlockedDelete.rows[0].result,
      historical_custody_block: historicalCustodyBlock,
      role_only_removal: roleOnlyRemoval.rows[0].result,
      subject_removal: subjectRemoval.rows[0].result,
    };
  } finally {
    await db.close();
  }
}

function assertProtected(result) {
  if (result.owner_constraints.length !== 4 || result.owner_constraints.some((row) => row.confdeltype !== "r")) {
    throw new Error(`owner constraints are not all RESTRICT: ${JSON.stringify(result.owner_constraints)}`);
  }
  if (Object.values(result.after_blocked_delete).some((count) => Number(count) !== 1)) {
    throw new Error(`blocked delete changed protected state: ${JSON.stringify(result.after_blocked_delete)}`);
  }
  if (Number(result.role_only_removal.operator_user) !== 0 ||
      Number(result.role_only_removal.operator_role) !== 0 ||
      Number(result.role_only_removal.workspace) !== 1) {
    throw new Error(`role-only removal drifted: ${JSON.stringify(result.role_only_removal)}`);
  }
  if (Object.values(result.subject_removal).some((count) => Number(count) !== 0)) {
    throw new Error(`subject deletion did not stay subject-scoped: ${JSON.stringify(result.subject_removal)}`);
  }
}

const positive = await inspect();
assertProtected(positive);

let cascadeNegative = "not_run";
try {
  const weakened = await inspect(candidate.replaceAll("on delete restrict", "on delete cascade"));
  assertProtected(weakened);
} catch (error) {
  if (/unexpectedly_deleted|not all RESTRICT/i.test(String(error?.message))) {
    cascadeNegative = "failed_as_required";
  } else {
    throw error;
  }
}
if (cascadeNegative !== "failed_as_required") throw new Error("cascade negative control unexpectedly passed");

process.stdout.write(`${JSON.stringify({
  status: "passed",
  runtime: "@electric-sql/pglite@0.5.8",
  ...positive,
  negative_controls: {
    owner_restrict_weakened_to_cascade: cascadeNegative,
  },
}, null, 2)}\n`);
