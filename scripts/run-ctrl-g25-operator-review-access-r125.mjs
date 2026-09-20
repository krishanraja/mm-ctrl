import fs from 'node:fs'
import path from 'node:path'

import { createG25PostgresHarness } from './lib/g25-postgres-harness.mjs'

const root = process.cwd()
const candidatePath = 'supabase/candidates/g25_operator_review_access_r125.sql'
const candidate = fs.readFileSync(path.join(root, candidatePath), 'utf8')

const ids = {
  ownerA: '12500000-0000-4000-8000-000000000001',
  ownerB: '12500000-0000-4000-8000-000000000002',
  operator: '12500000-0000-4000-8000-000000000003',
  operatorPrincipal: '12500000-0000-4000-8000-000000000004',
  workspaceA: '12500000-0000-4000-8000-000000000005',
  workspaceB: '12500000-0000-4000-8000-000000000006',
  roleGrantA: '12500000-0000-4000-8000-000000000007',
  roleGrantB: '12500000-0000-4000-8000-000000000008',
  reviewAOld: '12500000-0000-4000-8000-000000000009',
  reviewANew: '12500000-0000-4000-8000-000000000010',
  reviewB: '12500000-0000-4000-8000-000000000011',
  unknownWorkspace: '12500000-0000-4000-8000-000000000012',
}

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-operator-review-access-r125] ${message}`)
}

const packet = (suffix) => ({
  schema: 'ctrl.standard-change.owner-review.v1',
  presentation: {
    schema: 'ctrl.standard-change.owner-review.presentation.v1',
    question: `Should this become the standard ${suffix}?`,
    headline: `A sharper standard ${suffix}`,
    consequence: `Future work will be judged against ${suffix}.`,
  },
})

async function asAuthenticated(db, userId, action) {
  await db.exec('set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId])
  try {
    return await action()
  } finally {
    await db.exec('reset role')
    await db.exec("select set_config('request.jwt.claim.sub', '', false)")
  }
}

async function expectPrivilegeFailure(action, label) {
  try {
    await action()
  } catch (error) {
    if (String(error?.message).toLowerCase().includes('permission denied')) return
    throw error
  }
  throw new Error(`${label} unexpectedly succeeded`)
}

async function createDatabase(candidateSql = candidate) {
  const db = await createG25PostgresHarness()
  await db.exec(`
    create schema if not exists private;

    create table private.brain_operator_principals (
      id uuid primary key,
      created_at timestamptz not null default now(),
      retired_at timestamptz
    );
    create table private.brain_operator_auth_links (
      operator_principal_id uuid not null
        references private.brain_operator_principals(id) on delete cascade,
      user_id uuid not null references auth.users(id) on delete cascade,
      linked_at timestamptz not null default now(),
      revoked_at timestamptz,
      primary key (operator_principal_id, user_id)
    );

    create table public.standard_change_review_packets (
      id uuid primary key,
      user_id uuid not null references auth.users(id) on delete cascade,
      packet jsonb not null,
      packet_sha256 text not null,
      state text not null check (state in ('ready', 'decided')),
      created_at timestamptz not null default now()
    );

    create or replace function public.standard_change_json_sha256(p_value jsonb)
    returns text language sql immutable security definer set search_path = '' as $$
      select encode(sha256(convert_to(p_value::text, 'UTF8')), 'hex')
    $$;

    revoke all on table public.standard_change_review_packets from public, anon, authenticated;
    grant all on table public.standard_change_review_packets to service_role;
  `)
  await db.exec(candidateSql)
  return db
}

async function seed(db) {
  await db.query(`
    insert into auth.users(id, email) values
      ($1::uuid, 'r125-owner-a@example.test'),
      ($2::uuid, 'r125-owner-b@example.test'),
      ($3::uuid, 'r125-operator@example.test')
  `, [ids.ownerA, ids.ownerB, ids.operator])
  await db.query(`
    insert into public.brain_workspaces(
      id, subject_id, owner_id, tenant_key, lifecycle_state
    ) values
      ($1::uuid, $2::uuid, $2::uuid, 'r125-workspace-a', 'active'),
      ($3::uuid, $4::uuid, $4::uuid, 'r125-workspace-b', 'active')
  `, [ids.workspaceA, ids.ownerA, ids.workspaceB, ids.ownerB])
  await db.query(
    'insert into private.brain_operator_principals(id) values ($1::uuid)',
    [ids.operatorPrincipal],
  )
  await db.query(`
    insert into private.brain_operator_auth_links(operator_principal_id, user_id)
    values ($1::uuid, $2::uuid)
  `, [ids.operatorPrincipal, ids.operator])
  await db.query(`
    insert into public.brain_workspace_roles(
      workspace_id, user_id, role, granted_by, granted_at
    ) values
      ($1::uuid, $2::uuid, 'operator', $3::uuid, '2026-09-19T00:00:00Z'),
      ($4::uuid, $2::uuid, 'operator', $5::uuid, '2026-09-19T00:00:00Z')
  `, [ids.workspaceA, ids.operator, ids.ownerA, ids.workspaceB, ids.ownerB])
  await db.query(`
    insert into public.brain_audience_grants(
      id, workspace_id, grantee_user_id, audience, purpose,
      granted_by, granted_at, expires_at
    ) values
      ($1::uuid, $2::uuid, $3::uuid, 'delivery_team_private',
        'standard_change_review_preparation', $4::uuid,
        '2026-09-19T00:00:00Z', '2026-10-20T00:00:00Z'),
      ($5::uuid, $6::uuid, $3::uuid, 'delivery_team_private',
        'standard_change_review_preparation', $7::uuid,
        '2026-09-19T00:00:00Z', '2026-10-20T00:00:00Z')
  `, [ids.roleGrantA, ids.workspaceA, ids.operator, ids.ownerA,
    ids.roleGrantB, ids.workspaceB, ids.ownerB])

  const packets = [
    [ids.reviewAOld, ids.ownerA, ids.workspaceA, ids.ownerA, packet('A-old'), '2026-09-19T01:00:00Z'],
    [ids.reviewANew, ids.ownerA, ids.workspaceA, ids.ownerA, packet('A-new'), '2026-09-19T02:00:00Z'],
    [ids.reviewB, ids.ownerB, ids.workspaceB, ids.ownerB, packet('B'), '2026-09-19T00:30:00Z'],
  ]
  for (const [id, owner, workspace, subject, body, createdAt] of packets) {
    await db.query(`
      insert into public.standard_change_review_packets(
        id, user_id, packet, packet_sha256, state, created_at,
        workspace_id, subject_id, operator_projection_audience,
        operator_projection_purpose
      ) values (
        $1::uuid, $2::uuid, $3::jsonb,
        public.standard_change_json_sha256($3::jsonb), 'ready', $4::timestamptz,
        $5::uuid, $6::uuid, 'delivery_team_private',
        'standard_change_review_preparation'
      )
    `, [id, owner, JSON.stringify(body), createdAt, workspace, subject])
  }
}

async function readQueue(db, workspaceId = ids.workspaceA, userId = ids.operator) {
  return asAuthenticated(db, userId, async () => {
    const result = await db.query(
      'select public.get_operator_pending_standard_change_review_v1($1::uuid) as result',
      [workspaceId],
    )
    return result.rows[0].result
  })
}

async function latestReceipt(db) {
  const result = await db.query(`
    select outcome, reason, returned_fields,
      receipt_sha256 = public.standard_change_json_sha256(receipt_payload) as hash_valid
    from public.brain_access_receipts
    order by observed_at desc, id desc
    limit 1
  `)
  return result.rows[0]
}

async function runPositiveControl() {
  const db = await createDatabase()
  try {
    await seed(db)
    const first = await readQueue(db)
    assert(first.available === true, 'exact operator grant did not allow the safe projection')
    assert(first.ready_count === 2, 'workspace-ready count did not exclude the second customer')
    assert(first.next.review_packet_id === ids.reviewAOld, 'queue did not select oldest ready review in the selected workspace')
    assert(Object.keys(first.next).sort().join(',') ===
      'consequence,headline,question,ready_since,review_packet_id',
    'allowed projection exposed fields beyond the five-field contract')
    assert(first.decision_authority_granted === false
      && first.active_standard_mutated === false
      && first.notification_sent === false,
    'read implied authority, mutation or notification')
    const allowedReceipt = await latestReceipt(db)
    assert(allowedReceipt.outcome === 'allowed' && allowedReceipt.reason === 'allowed',
      'allowed access was not receipted')
    assert(allowedReceipt.returned_fields.length === 5 && allowedReceipt.hash_valid === true,
      'allowed receipt field set or hash is invalid')

    await db.query(`
      update public.brain_audience_grants set revoked_at = clock_timestamp()
      where id = $1::uuid
    `, [ids.roleGrantA])
    const afterRevocation = await readQueue(db)
    assert(afterRevocation.available === false && afterRevocation.reason === 'not_available',
      'revoked grant remained usable')
    const revokedReceipt = await latestReceipt(db)
    assert(revokedReceipt.outcome === 'denied'
      && revokedReceipt.reason === 'audience_grant_revoked'
      && revokedReceipt.returned_fields.length === 0,
    'revoked access did not fail closed with a private receipt')

    await expectPrivilegeFailure(
      () => asAuthenticated(db, ids.operator, () => db.query(
        "update public.brain_access_receipts set reason = 'tampered'",
      )),
      'authenticated receipt update',
    )
    await expectPrivilegeFailure(
      () => asAuthenticated(db, ids.operator, () => db.query(
        'delete from public.brain_access_receipts',
      )),
      'authenticated receipt delete',
    )

    return {
      exact_operator_read: true,
      oldest_ready_first_within_selected_workspace: true,
      cross_workspace_packet_excluded: true,
      returned_field_count: 5,
      receipt_hash_valid: true,
      immediate_revocation: true,
      receipt_append_only_for_authenticated: true,
      decision_authority_granted: false,
      active_standard_mutated: false,
      notification_sent: false,
    }
  } finally {
    await db.close()
  }
}

const deniedCases = [
  ['stable_operator_identity_required', async (db) => {
    await db.query('delete from private.brain_operator_auth_links where user_id = $1::uuid', [ids.operator])
  }, ids.workspaceA, ids.operator],
  ['workspace_not_available', async () => {}, ids.unknownWorkspace, ids.operator],
  ['workspace_not_active', async (db) => {
    await db.query("update public.brain_workspaces set lifecycle_state = 'paused' where id = $1::uuid", [ids.workspaceA])
  }, ids.workspaceA, ids.operator],
  ['operator_role_missing', async (db) => {
    await db.query('delete from public.brain_workspace_roles where workspace_id = $1::uuid and user_id = $2::uuid', [ids.workspaceA, ids.operator])
  }, ids.workspaceA, ids.operator],
  ['operator_role_revoked', async (db) => {
    await db.query('update public.brain_workspace_roles set revoked_at = clock_timestamp() where workspace_id = $1::uuid and user_id = $2::uuid', [ids.workspaceA, ids.operator])
  }, ids.workspaceA, ids.operator],
  ['operator_role_not_owner_granted', async (db) => {
    await db.query('update public.brain_workspace_roles set granted_by = $1::uuid where workspace_id = $2::uuid and user_id = $1::uuid', [ids.operator, ids.workspaceA])
  }, ids.workspaceA, ids.operator],
  ['audience_grant_missing', async (db) => {
    await db.query('delete from public.brain_audience_grants where workspace_id = $1::uuid and grantee_user_id = $2::uuid', [ids.workspaceA, ids.operator])
  }, ids.workspaceA, ids.operator],
  ['audience_grant_invalid', async (db) => {
    await db.query("update public.brain_audience_grants set purpose = 'prepared_intelligence' where id = $1::uuid", [ids.roleGrantA])
  }, ids.workspaceA, ids.operator],
  ['audience_grant_expiry_required', async (db) => {
    await db.query('update public.brain_audience_grants set expires_at = null where id = $1::uuid', [ids.roleGrantA])
  }, ids.workspaceA, ids.operator],
  ['audience_grant_expired', async (db) => {
    await db.query("update public.brain_audience_grants set expires_at = '2026-09-19T12:00:00Z' where id = $1::uuid", [ids.roleGrantA])
  }, ids.workspaceA, ids.operator],
  ['audience_grant_not_owner_granted', async (db) => {
    await db.query('update public.brain_audience_grants set granted_by = $1::uuid where id = $2::uuid', [ids.operator, ids.roleGrantA])
  }, ids.workspaceA, ids.operator],
  ['review_not_available', async (db) => {
    await db.query('update public.standard_change_review_packets set state = \'decided\' where workspace_id = $1::uuid', [ids.workspaceA])
  }, ids.workspaceA, ids.operator],
  ['review_packet_changed', async (db) => {
    await db.query("update public.standard_change_review_packets set packet = jsonb_set(packet, '{presentation,headline}', '\"tampered\"'::jsonb) where id = $1::uuid", [ids.reviewAOld])
  }, ids.workspaceA, ids.operator],
]

async function runDeniedMatrix() {
  const results = []
  for (const [expectedReason, mutate, workspaceId, userId] of deniedCases) {
    const db = await createDatabase()
    try {
      await seed(db)
      await mutate(db)
      const result = await readQueue(db, workspaceId, userId)
      assert(result.available === false && result.reason === 'not_available' && result.next === null,
        `${expectedReason} leaked a distinct public result`)
      const receipt = await latestReceipt(db)
      assert(receipt.outcome === 'denied' && receipt.reason === expectedReason
        && receipt.returned_fields.length === 0 && receipt.hash_valid === true,
      `${expectedReason} did not produce the exact private receipt`)
      results.push(expectedReason)
    } finally {
      await db.close()
    }
  }
  return results
}

async function runOwnerRouteDenial() {
  const db = await createDatabase()
  try {
    await seed(db)
    await db.query('insert into private.brain_operator_principals(id) values ($1::uuid)', [ids.ownerA])
    await db.query(`
      insert into private.brain_operator_auth_links(operator_principal_id, user_id)
      values ($1::uuid, $1::uuid)
    `, [ids.ownerA])
    const result = await readQueue(db, ids.workspaceA, ids.ownerA)
    const receipt = await latestReceipt(db)
    assert(result.available === false && receipt.reason === 'owner_must_use_owner_route',
      'owner was allowed through the operator route')
    return 'owner_must_use_owner_route'
  } finally {
    await db.close()
  }
}

async function runPurposeNegativeControl() {
  const needle = "or v_grant.purpose <> 'standard_change_review_preparation'"
  assert(candidate.includes(needle), 'purpose mutation target is missing')
  const weakened = candidate.replace(needle, 'or false')
  const db = await createDatabase(weakened)
  try {
    await seed(db)
    await db.query("update public.brain_audience_grants set purpose = 'prepared_intelligence' where id = $1::uuid", [ids.roleGrantA])
    const result = await readQueue(db)
    assert(result.available === true, 'purpose-negative control did not demonstrate the weakened boundary')
    return 'failed_as_required_when_test_expectation_is_preserved'
  } finally {
    await db.close()
  }
}

const positive = await runPositiveControl()
const denied = await runDeniedMatrix()
denied.push(await runOwnerRouteDenial())
const negativeControl = await runPurposeNegativeControl()

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  runtime: '@electric-sql/pglite@0.5.8',
  candidate: candidatePath,
  positive,
  denied_reason_matrix: denied,
  denied_case_count: denied.length,
  purpose_predicate_negative_control: negativeControl,
  residue: 'memory_database_closed_after_each_case',
  production_writes: 0,
}, null, 2)}\n`)
