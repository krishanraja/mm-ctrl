import fs from 'node:fs'
import path from 'node:path'

import { createG25PostgresHarness } from './lib/g25-postgres-harness.mjs'

const root = process.cwd()
const r125 = fs.readFileSync(path.join(root, 'supabase/candidates/g25_operator_review_access_r125.sql'), 'utf8')
const candidatePath = 'supabase/candidates/g25_owner_operator_projection_binding_r129.sql'
const candidate = fs.readFileSync(path.join(root, candidatePath), 'utf8')

const ids = {
  ownerA: '12900000-0000-4000-8000-000000000001',
  ownerB: '12900000-0000-4000-8000-000000000002',
  workspaceA: '12900000-0000-4000-8000-000000000003',
  workspaceA2: '12900000-0000-4000-8000-000000000004',
  workspaceB: '12900000-0000-4000-8000-000000000005',
  checkReady: '12900000-0000-4000-8000-000000000006',
  reviewReady: '12900000-0000-4000-8000-000000000007',
  checkDecided: '12900000-0000-4000-8000-000000000008',
  reviewDecided: '12900000-0000-4000-8000-000000000009',
}

const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-owner-operator-projection-binding-r129] ${message}`)
}

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

async function expectFailure(action, fragment) {
  try {
    await action()
  } catch (error) {
    if (String(error?.message).includes(fragment)) return
    throw error
  }
  throw new Error(`expected failure containing ${fragment}`)
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
      operator_principal_id uuid not null references private.brain_operator_principals(id),
      user_id uuid not null references auth.users(id),
      linked_at timestamptz not null default now(),
      revoked_at timestamptz,
      primary key (operator_principal_id,user_id)
    );
    create table public.standard_change_checks (
      id uuid primary key,
      user_id uuid not null references auth.users(id),
      result_sha256 text not null
    );
    create table public.standard_change_review_packets (
      id uuid primary key,
      user_id uuid not null references auth.users(id),
      check_id uuid not null references public.standard_change_checks(id),
      packet jsonb not null,
      packet_sha256 text not null,
      state text not null check (state in ('ready','decided')),
      decided_at timestamptz,
      created_at timestamptz not null default now()
    );
    create table public.standard_sentinel (
      user_id uuid primary key references auth.users(id),
      active_sha256 text not null
    );
    create or replace function public.standard_change_json_sha256(p_value jsonb)
    returns text language sql immutable security definer set search_path = '' as $$
      select encode(sha256(convert_to(p_value::text, 'UTF8')), 'hex')
    $$;
  `)
  await db.exec(r125)
  await db.exec(`
    create or replace function public.prepare_standard_change_review_v2(
      p_check_id uuid,
      p_expected_result_sha256 text
    ) returns jsonb language plpgsql security definer set search_path = '' as $$
    declare
      v_user_id uuid := auth.uid();
      v_check public.standard_change_checks%rowtype;
      v_review public.standard_change_review_packets%rowtype;
      v_packet jsonb;
      v_hash text;
    begin
      if v_user_id is null then raise exception 'standard_change_review_auth_required'; end if;
      select * into v_check from public.standard_change_checks
      where id=p_check_id and user_id=v_user_id;
      if not found or v_check.result_sha256<>p_expected_result_sha256 then
        raise exception 'standard_change_check_not_available';
      end if;
      select * into v_review from public.standard_change_review_packets
      where check_id=p_check_id and user_id=v_user_id for update;
      if not found then raise exception 'standard_change_review_missing'; end if;
      if v_review.state<>'ready' then raise exception 'standard_change_presentation_locked'; end if;
      if v_review.packet_sha256<>public.standard_change_json_sha256(v_review.packet) then
        raise exception 'standard_change_presentation_packet_changed';
      end if;
      if v_review.packet ? 'presentation' then
        if v_review.packet->'presentation'->>'schema'<>'ctrl.standard-change.owner-review.presentation.v1' then
          raise exception 'standard_change_presentation_packet_changed';
        end if;
      else
        v_packet := v_review.packet || jsonb_build_object('presentation',jsonb_build_object(
          'schema','ctrl.standard-change.owner-review.presentation.v1',
          'question','Should this become the standard?',
          'headline','A sharper standard',
          'consequence','Future work will be judged against it.'
        ));
        v_hash := public.standard_change_json_sha256(v_packet);
        update public.standard_change_review_packets
        set packet=v_packet,packet_sha256=v_hash where id=v_review.id;
        v_review.packet:=v_packet; v_review.packet_sha256:=v_hash;
      end if;
      return jsonb_build_object(
        'review_packet_id',v_review.id,
        'review_packet_sha256',v_review.packet_sha256
      );
    end;
    $$;
    revoke all on function public.prepare_standard_change_review_v2(uuid,text)
      from public,anon,authenticated,service_role;
    grant execute on function public.prepare_standard_change_review_v2(uuid,text)
      to authenticated;
  `)
  await db.exec(candidateSql)
  return db
}

const barePacket = (suffix) => ({
  schema: 'ctrl.standard-change.owner-review.v1',
  suffix,
})

async function seed(db) {
  await db.query(`insert into auth.users(id,email) values
    ($1::uuid,'r129-owner-a@example.test'),($2::uuid,'r129-owner-b@example.test')`,
  [ids.ownerA, ids.ownerB])
  await db.query(`insert into public.brain_workspaces(
      id,subject_id,owner_id,tenant_key,lifecycle_state
    ) values
      ($1::uuid,$2::uuid,$2::uuid,'r129-a','active'),
      ($3::uuid,$2::uuid,$2::uuid,'r129-a2','active'),
      ($4::uuid,$5::uuid,$5::uuid,'r129-b','active')`,
  [ids.workspaceA, ids.ownerA, ids.workspaceA2, ids.workspaceB, ids.ownerB])
  await db.query(`insert into public.standard_change_checks(id,user_id,result_sha256) values
    ($1::uuid,$2::uuid,$3),($4::uuid,$2::uuid,$5)`,
  [ids.checkReady, ids.ownerA, 'a'.repeat(64), ids.checkDecided, 'b'.repeat(64)])
  for (const [id, check, state, body] of [
    [ids.reviewReady, ids.checkReady, 'ready', barePacket('ready')],
    [ids.reviewDecided, ids.checkDecided, 'decided', barePacket('decided')],
  ]) {
    await db.query(`insert into public.standard_change_review_packets(
        id,user_id,check_id,packet,packet_sha256,state
      ) values ($1::uuid,$2::uuid,$3::uuid,$4::jsonb,
        public.standard_change_json_sha256($4::jsonb),$5)`,
    [id, ids.ownerA, check, JSON.stringify(body), state])
  }
  await db.query(`insert into public.standard_sentinel(user_id,active_sha256)
    values ($1::uuid,$2)`, [ids.ownerA, 'c'.repeat(64)])
}

async function bind(db, userId, workspace = ids.workspaceA, check = ids.checkReady, expected = 'a'.repeat(64)) {
  return asAuthenticated(db, userId, async () => {
    const result = await db.query(`select
      public.prepare_and_bind_standard_change_operator_projection_v1(
        $1::uuid,$2,$3::uuid
      ) as result`, [check, expected, workspace])
    return result.rows[0].result
  })
}

async function runPositive() {
  const db = await createDatabase()
  try {
    await seed(db)
    const first = await bind(db, ids.ownerA)
    const afterFirst = (await db.query(`select
      workspace_id,subject_id,operator_projection_audience,
      operator_projection_purpose,operator_projection_bound_at,
      operator_projection_bound_by,packet,state
      from public.standard_change_review_packets where id=$1::uuid`,
    [ids.reviewReady])).rows[0]
    const firstBoundAt = afterFirst.operator_projection_bound_at
    const retry = await bind(db, ids.ownerA)
    const afterRetry = (await db.query(`select operator_projection_bound_at
      from public.standard_change_review_packets where id=$1::uuid`,
    [ids.reviewReady])).rows[0]
    const roleCount = Number((await db.query('select count(*) as count from public.brain_workspace_roles')).rows[0].count)
    const grantCount = Number((await db.query('select count(*) as count from public.brain_audience_grants')).rows[0].count)
    const standard = (await db.query('select active_sha256 from public.standard_sentinel where user_id=$1::uuid', [ids.ownerA])).rows[0]

    assert(first.idempotent === false && retry.idempotent === true, 'exact retry is not idempotent')
    assert(first.presentation_complete === true, 'presentation was not completed atomically')
    assert(first.operator_access_granted === false && first.decision_authority_granted === false
      && first.active_standard_mutated === false && first.notification_sent === false,
    'binding implied access, decision, standard mutation or notification')
    assert(afterFirst.workspace_id === ids.workspaceA && afterFirst.subject_id === ids.ownerA,
      'packet is not bound to the exact workspace subject')
    assert(afterFirst.operator_projection_audience === 'delivery_team_private'
      && afterFirst.operator_projection_purpose === 'standard_change_review_preparation',
    'packet audience-purpose scope drifted')
    assert(afterFirst.operator_projection_bound_by === ids.ownerA && firstBoundAt,
      'binding does not retain owner and time')
    assert(afterRetry.operator_projection_bound_at.toISOString() === firstBoundAt.toISOString(),
      'idempotent retry changed the first binding time')
    assert(afterFirst.packet.presentation?.schema === 'ctrl.standard-change.owner-review.presentation.v1',
      'bound packet lacks the complete presentation')
    assert(roleCount === 0 && grantCount === 0, 'binding silently granted access')
    assert(standard.active_sha256 === 'c'.repeat(64), 'binding mutated the active standard')

    await expectFailure(() => bind(db, ids.ownerB), 'workspace_not_available')
    await expectFailure(() => bind(db, ids.ownerA, ids.workspaceA2), 'rebind_forbidden')
    await expectFailure(() => bind(db, ids.ownerA, ids.workspaceA, ids.checkReady, 'd'.repeat(64)), 'check_not_available')
    await expectFailure(() => bind(db, ids.ownerA, ids.workspaceA, ids.checkDecided, 'b'.repeat(64)), 'presentation_locked')
    await expectFailure(() => asAuthenticated(db, ids.ownerA, () => db.query(
      `update public.standard_change_review_packets set operator_projection_bound_by=$1::uuid
       where id=$2::uuid`, [ids.ownerB, ids.reviewReady],
    )), 'permission denied')

    await expectFailure(() => db.query(`update public.standard_change_review_packets set
      workspace_id=null where id=$1::uuid`, [ids.reviewReady]),
    'standard_change_review_packets_operator_scope_all_or_none')

    return {
      presentation_completed_in_same_transaction: true,
      exact_binding: true,
      owner_and_time_retained: true,
      retry_idempotent: true,
      first_binding_time_preserved: true,
      cross_owner_denied: true,
      cross_workspace_rebind_denied: true,
      stale_check_denied: true,
      decided_packet_denied: true,
      direct_authenticated_update_denied: true,
      partial_scope_denied: true,
      roles_created: roleCount,
      grants_created: grantCount,
      operator_access_granted: false,
      decision_authority_granted: false,
      active_standard_mutated: false,
      notification_sent: false,
    }
  } finally {
    await db.close()
  }
}

async function runNegativeControl() {
  const marker = "  else\n    raise exception 'standard_change_operator_projection_rebind_forbidden' using errcode = 'P0001';\n  end if;"
  assert(candidate.includes(marker), 'rebind negative-control marker is missing')
  const mutated = candidate.replace(marker, '  else\n    v_idempotent := true;\n  end if;')
  const db = await createDatabase(mutated)
  try {
    await seed(db)
    await bind(db, ids.ownerA)
    let detected = false
    try {
      await bind(db, ids.ownerA, ids.workspaceA2)
    } catch {
      detected = true
    }
    assert(!detected, 'mutated rebind guard still denied the attack')
    return 'failed_as_required_when_rebind_expectation_is_preserved'
  } finally {
    await db.close()
  }
}

const positive = await runPositive()
const negativeControl = await runNegativeControl()

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  runtime: '@electric-sql/pglite@0.5.8',
  candidate: candidatePath,
  positive,
  rebind_guard_negative_control: negativeControl,
  production_writes: 0,
}, null, 2)}\n`)
