import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const isolatedProjectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const linkedProjectRef = readFileSync(path.join(root, 'supabase/.temp/project-ref'), 'utf8').trim()
const scratchRoot = path.resolve(process.env.USERPROFILE, '.scratch')
const scratch = path.resolve(scratchRoot, 'mm-ctrl-r143-concurrency')
const candidatePath = path.join(root, 'supabase/candidates/g25_consequential_work_spine_r142.sql')
const testPath = path.join(root, 'supabase/tests/database/g25_consequential_work_spine_r142.test.sql')
const activeSessions = []
let queryCounter = 0

if (linkedProjectRef !== isolatedProjectRef || linkedProjectRef === productionProjectRef) {
  throw new Error(`R143 refuses linked project ${linkedProjectRef || '<missing>'}`)
}
if (!scratch.startsWith(`${scratchRoot}${path.sep}`)) throw new Error('R143 scratch path escaped .scratch')

const candidateTables = [
  'brain_subject_profiles',
  'brain_decision_cases',
  'brain_decision_versions',
  'brain_decision_routes',
  'brain_decision_human_priors',
  'brain_decision_questions',
  'brain_decision_answers',
  'brain_decision_calls',
  'brain_decision_outcomes',
  'brain_decision_evidence_atoms',
  'brain_decision_evidence_links',
  'brain_decision_authority_events',
  'brain_decision_authority_revocations',
  'brain_decision_events',
]

const candidateFunctions = [
  'brain_decision_cipher_aad_sha256',
  'brain_decision_validate_ciphertext',
  'brain_decision_cipher_guard',
  'brain_decision_content_hash_guard',
  'brain_decision_authority_revocation_guard',
  'brain_decision_artifact_scope_guard',
  'brain_decision_draft_guard',
  'brain_decision_version_immutable_guard',
  'brain_decision_append_only_guard',
  'brain_decision_case_identity_guard',
  'brain_decision_owned_record_transition_guard',
  'brain_decision_timestamp_token',
  'brain_decision_evidence_atom_sha256',
  'brain_decision_materialize_evidence_atom',
  'brain_decision_validate_evidence_atom',
  'brain_decision_human_prior_admission_guard',
  'brain_decision_source_atom_guard',
  'brain_decision_evidence_link_atom_guard',
  'brain_decision_referenced_assertion_guard',
  'brain_decision_referenced_source_guard',
  'brain_decision_snapshot_sha256',
  'brain_decision_call_input_sha256',
  'brain_decision_call_version_guard',
  'brain_decision_call_authority_guard',
  'brain_decision_call_event_append',
  'brain_decision_case_chronology_guard',
  'brain_decision_answer_chronology_guard',
  'brain_decision_outcome_chronology_guard',
  'brain_decision_case_event_append',
  'brain_decision_answer_event_append',
  'brain_decision_outcome_event_append',
  'r142_cipher',
  'r142_main_seal_authority',
]

function runCli(args) {
  const npxCli = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js')
  const child = spawn(process.execPath, [npxCli, 'supabase', ...args], {
    cwd: root,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += chunk })
  child.stderr.on('data', (chunk) => { stderr += chunk })
  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, stdout, stderr }))
  })
}

async function query(sql, { allowFailure = false } = {}) {
  queryCounter += 1
  const file = path.join(scratch, `query-${String(queryCounter).padStart(3, '0')}.sql`)
  writeFileSync(file, sql, 'utf8')
  const result = await runCli(['db', 'query', '--linked', '--output-format', 'json', '--file', file])
  if (!allowFailure && result.code !== 0) {
    throw new Error(`R143 database query failed: ${result.stderr}\n${result.stdout}`)
  }
  return result
}

async function queryFile(file) {
  const result = await runCli(['db', 'query', '--linked', '--output-format', 'json', '--file', file])
  if (result.code !== 0) throw new Error(`R143 database file failed: ${result.stderr}\n${result.stdout}`)
  return result
}

function startQuery(sql) {
  const promise = query(sql, { allowFailure: true })
  activeSessions.push(promise)
  return promise
}

function quoteList(values) {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(', ')
}

const preflightSql = `
do $$
begin
  if exists (
    select 1 from pg_catalog.pg_class relation
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public' and relation.relname in (${quoteList(candidateTables)})
  ) then raise exception 'r143_candidate_table_residue'; end if;
  if exists (
    select 1 from pg_catalog.pg_proc routine
    join pg_catalog.pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname in ('private', 'public')
      and routine.proname in (${quoteList([...candidateFunctions, 'seal_brain_decision_version_v1'])})
  ) then raise exception 'r143_candidate_function_residue'; end if;
  if to_regclass('public.brain_workspaces_scope_unique') is not null
    or to_regclass('public.brain_assertions_scope_unique') is not null
  then raise exception 'r143_candidate_index_residue'; end if;
end;
$$;
`

const cleanupSql = `
begin;
do $$
declare routine_row record;
begin
  for routine_row in
    select namespace.nspname, routine.proname, pg_get_function_identity_arguments(routine.oid) as identity_arguments
    from pg_catalog.pg_proc routine
    join pg_catalog.pg_namespace namespace on namespace.oid = routine.pronamespace
    where namespace.nspname in ('private', 'public')
      and routine.proname in (${quoteList([...candidateFunctions, 'seal_brain_decision_version_v1'])})
  loop
    execute format('drop function if exists %I.%I(%s) cascade', routine_row.nspname, routine_row.proname, routine_row.identity_arguments);
  end loop;
end;
$$;
${candidateTables.map((table) => `drop table if exists public.${table} cascade;`).join('\n')}
drop index if exists public.brain_workspaces_scope_unique;
drop index if exists public.brain_assertions_scope_unique;
delete from public.brain_assertions where workspace_id = '14210000-0000-4000-8000-000000000001';
delete from public.brain_audience_grants where workspace_id = '14210000-0000-4000-8000-000000000001';
delete from public.brain_workspace_roles where workspace_id = '14210000-0000-4000-8000-000000000001';
delete from public.brain_workspaces where id = '14210000-0000-4000-8000-000000000001';
delete from auth.users where id in ('14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000002');
commit;
`

function successorBlock(testSql, suffix, version, predecessorId) {
  const anchor = testSql.indexOf("private.r142_cipher('14250000-0000-4000-8000-000000000021', 'decision_version', 'title', 'successor-title')")
  if (anchor < 0) throw new Error('R143 successor fixture anchor missing')
  const start = testSql.lastIndexOf('insert into public.brain_decision_versions (', anchor)
  const end = testSql.indexOf('\ndo $$\ndeclare\n  successor_result jsonb;', anchor)
  if (start < 0 || end < 0) throw new Error('R143 successor fixture boundary missing')
  let block = testSql.slice(start, end)
  const causalControlStart = block.indexOf('\nsavepoint r142_predecessor_authority_control;')
  const causalControlEndMarker = '\nrelease savepoint r142_predecessor_authority_control;'
  const causalControlEnd = block.indexOf(causalControlEndMarker, causalControlStart)
  if (causalControlStart < 0 || causalControlEnd < 0) {
    throw new Error('R143 predecessor-authority causal-control boundary missing')
  }
  block = `${block.slice(0, causalControlStart)}${block.slice(causalControlEnd + causalControlEndMarker.length)}`
  block = block
    .replaceAll('000000000021', `0000000000${suffix[0]}`)
    .replaceAll('000000000022', `0000000000${suffix[1]}`)
    .replaceAll('000000000023', `0000000000${suffix[2]}`)
    .replace(
      "'14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 2,",
      `'14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', ${version},`,
    )
    .replace(
      "'14250000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001'\n);",
      `'${predecessorId}', '14200000-0000-4000-8000-000000000001'\n);`,
    )
  if (!block.includes(`, ${version},`) || !block.includes(`'${predecessorId}'`)) {
    throw new Error(`R143 successor fixture ${version} transform failed`)
  }
  return `begin;\nset local role service_role;\n${block}\ncommit;`
}

async function waitForMarker(marker) {
  await query(`
do $$
declare marker_seen boolean := false;
begin
  for attempt in 1..200 loop
    select exists (
      select 1 from pg_catalog.pg_locks
      where locktype = 'advisory' and classid = 0 and objid = ${marker} and granted
    ) into marker_seen;
    if marker_seen then exit; end if;
    perform pg_sleep(0.1);
  end loop;
  if not marker_seen then raise exception 'r143_concurrency_marker_timeout'; end if;
end;
$$;
`)
}

function requireRejected(result, expected) {
  const combined = `${result.stderr}\n${result.stdout}`
  if (result.code === 0 || !combined.includes(expected)) {
    throw new Error(`R143 expected ${expected}, received exit ${result.code}: ${combined}`)
  }
}

async function runSourceReferenceRace({ label, marker, insertSql, assertionId, expectedRowSql }) {
  const referenceInsert = startQuery(`
begin;
set local role service_role;
${insertSql}
select pg_advisory_xact_lock(${marker});
select pg_sleep(5);
commit;
`)
  try {
    await waitForMarker(marker)
  } catch (markerError) {
    const insertResult = await referenceInsert
    throw new Error(
      `R143 ${label} reference never reached marker ${marker}: `
      + `insert exit ${insertResult.code}: ${insertResult.stderr || insertResult.stdout}; `
      + `marker wait: ${markerError.message}`,
    )
  }
  const rewrite = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
update public.brain_assertions
set statement_ciphertext = 'ciphertext:r143-concurrent-rewrite-${label}'
where id = '${assertionId}';
commit;
`, { allowFailure: true })
  const insertResult = await referenceInsert
  if (insertResult.code !== 0) {
    throw new Error(`R143 ${label} reference insert failed: ${insertResult.stderr || insertResult.stdout}`)
  }
  requireRejected(rewrite, 'brain_decision_referenced_assertion_immutable')
  await query(`
do $$
begin
  if (select statement_ciphertext from public.brain_assertions where id = '${assertionId}')
      = 'ciphertext:r143-concurrent-rewrite-${label}'
    then raise exception 'r143_${label}_source_rewrite_committed'; end if;
  if not (${expectedRowSql})
    then raise exception 'r143_${label}_reference_missing'; end if;
end;
$$;
`)
}

let cleanupCompleted = false
try {
  mkdirSync(scratch, { recursive: true })
  await query(preflightSql)
  await queryFile(candidatePath)

  const testSql = readFileSync(testPath, 'utf8').replaceAll('\r\n', '\n')
  let committedTest = testSql.replace(/\nrollback;\s*$/, '\ncommit;\n')
  if (committedTest === testSql) throw new Error('R143 could not commit the canary fixture')
  const setupPath = path.join(scratch, 'r143-committed-canary.sql')
  writeFileSync(setupPath, committedTest, 'utf8')
  await queryFile(setupPath)
  await query("delete from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000024';")

  await query(successorBlock(
    testSql,
    ['51', '52', '53'],
    3,
    '14250000-0000-4000-8000-000000000021',
  ))

  const sealThree = startQuery(`
begin;
set local role service_role;
select pg_advisory_xact_lock(1431431);
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000051',
  '14290000-0000-4000-8000-000000000051',
  repeat('a', 64),
  'seal-concurrent-evidence-r143'
);
select pg_advisory_xact_lock(1431432);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431432)
  const evidenceWrite = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000051', '14240000-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000051', '14230012-0000-4000-8000-000000000001',
  'context', '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`, { allowFailure: true })
  const sealThreeResult = await sealThree
  if (sealThreeResult.code !== 0) throw new Error(`R143 concurrent v3 seal failed: ${sealThreeResult.stderr || sealThreeResult.stdout}`)
  requireRejected(evidenceWrite, 'brain_decision_governing_lock_busy_retry')
  await query(`
do $$
begin
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000051') <> 'sealed'
    then raise exception 'r143_v3_not_sealed'; end if;
  if (select snapshot_sha256 from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000051')
      <> private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000051')
    then raise exception 'r143_post_seal_snapshot_drift'; end if;
  if exists (
    select 1 from public.brain_decision_evidence_links
    where decision_version_id = '14250000-0000-4000-8000-000000000051'
      and assertion_id = '14230012-0000-4000-8000-000000000001'
      and artifact_kind = 'route'
  ) then raise exception 'r143_concurrent_evidence_committed'; end if;
end;
$$;
`)

  await query(successorBlock(
    testSql,
    ['61', '62', '63'],
    4,
    '14250000-0000-4000-8000-000000000051',
  ))
  const sealFour = startQuery(`
begin;
set local role service_role;
select pg_advisory_xact_lock(1431441);
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000061',
  '14290000-0000-4000-8000-000000000061',
  repeat('a', 64),
  'seal-concurrent-answer-r143'
);
select pg_advisory_xact_lock(1431442);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431442)
  const answerWrite = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_answers (
  id, question_id, decision_version_id, workspace_id, subject_id,
  answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '142c0000-0000-4000-8000-000000000051', '14280000-0000-4000-8000-000000000051',
  '14250000-0000-4000-8000-000000000051', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142c0000-0000-4000-8000-000000000051', 'decision_answer', 'answer', 'concurrent-answer'),
  1, '14230012-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`, { allowFailure: true })
  const sealFourResult = await sealFour
  if (sealFourResult.code !== 0) throw new Error(`R143 concurrent v4 seal failed: ${sealFourResult.stderr || sealFourResult.stdout}`)
  requireRejected(answerWrite, 'brain_decision_governing_lock_busy_retry')
  await query(`
do $$
begin
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000051') <> 'superseded'
    then raise exception 'r143_v3_not_superseded'; end if;
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000061') <> 'sealed'
    then raise exception 'r143_v4_not_sealed'; end if;
  if exists (select 1 from public.brain_decision_answers where id = '142c0000-0000-4000-8000-000000000051')
    then raise exception 'r143_concurrent_answer_committed'; end if;
  if exists (select 1 from public.brain_decision_events where event_type = 'question_answered' and after_ref = '142c0000-0000-4000-8000-000000000051')
    then raise exception 'r143_concurrent_answer_receipted'; end if;
end;
$$;
`)

  await query(successorBlock(
    testSql,
    ['71', '72', '73'],
    5,
    '14250000-0000-4000-8000-000000000061',
  ))
  const sealFive = startQuery(`
begin;
set local role service_role;
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000071',
  '14290000-0000-4000-8000-000000000071',
  repeat('a', 64),
  'seal-before-revocation-r143'
);
select pg_advisory_xact_lock(1431451);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431451)
  const revocationAfterSeal = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_authority_revocations (
  authority_event_id, decision_version_id, workspace_id, subject_id,
  revoked_by, revoked_at, reason_ciphertext, encryption_version
) values (
  '14290000-0000-4000-8000-000000000071', '14250000-0000-4000-8000-000000000071',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000071'),
  private.r142_cipher('14290000-0000-4000-8000-000000000071', 'decision_authority_revocation', 'reason', 'concurrent-backdated-seal-revocation'), 1
);
commit;
`, { allowFailure: true })
  const sealFiveResult = await sealFive
  if (sealFiveResult.code !== 0) throw new Error(`R143 authority-locked v5 seal failed: ${sealFiveResult.stderr || sealFiveResult.stdout}`)
  requireRejected(revocationAfterSeal, 'brain_decision_governing_lock_busy_retry')
  await query(`
do $$
begin
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000071') <> 'sealed'
    then raise exception 'r143_v5_not_sealed'; end if;
  if exists (select 1 from public.brain_decision_authority_revocations where authority_event_id = '14290000-0000-4000-8000-000000000071')
    then raise exception 'r143_post_use_seal_revocation_committed'; end if;
end;
$$;
`)

  await query(successorBlock(
    testSql,
    ['81', '82', '83'],
    6,
    '14250000-0000-4000-8000-000000000071',
  ))
  const revocationBeforeSeal = startQuery(`
begin;
set local role service_role;
insert into public.brain_decision_authority_revocations (
  authority_event_id, decision_version_id, workspace_id, subject_id,
  revoked_by, revoked_at, reason_ciphertext, encryption_version
) values (
  '14290000-0000-4000-8000-000000000081', '14250000-0000-4000-8000-000000000081',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000081'),
  private.r142_cipher('14290000-0000-4000-8000-000000000081', 'decision_authority_revocation', 'reason', 'concurrent-revocation-before-seal'), 1
);
select pg_advisory_xact_lock(1431461);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431461)
  const sealedAfterRevocation = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000081',
  '14290000-0000-4000-8000-000000000081',
  repeat('a', 64),
  'seal-after-revocation-r143'
);
commit;
`, { allowFailure: true })
  const revocationBeforeSealResult = await revocationBeforeSeal
  if (revocationBeforeSealResult.code !== 0) throw new Error(`R143 pre-seal revocation failed: ${revocationBeforeSealResult.stderr || revocationBeforeSealResult.stdout}`)
  requireRejected(sealedAfterRevocation, 'brain_decision_governing_lock_busy_retry')
  await query(`
do $$
begin
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000081') <> 'draft'
    then raise exception 'r143_revoked_v6_was_sealed'; end if;
  if not exists (select 1 from public.brain_decision_authority_revocations where authority_event_id = '14290000-0000-4000-8000-000000000081')
    then raise exception 'r143_pre_seal_revocation_missing'; end if;
end;
$$;
`)

  await query(`
begin;
set local role service_role;
do $$
declare call_at timestamptz := statement_timestamp();
begin
  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values
  (
    '14290000-0000-4000-8000-000000000091', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000091', '14250000-0000-4000-8000-000000000071',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000091', 'decision_call', 'call', 'concurrent-call-wins'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000091', 'decision_call', 'conditions', 'call-wins-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', call_at
    ), call_at, statement_timestamp() + interval '1 day'
  ),
  (
    '14290000-0000-4000-8000-000000000092', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000092', '14250000-0000-4000-8000-000000000071',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000092', 'decision_call', 'call', 'concurrent-revocation-wins'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000092', 'decision_call', 'conditions', 'revocation-wins-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', call_at
    ), call_at, statement_timestamp() + interval '1 day'
  );
end;
$$;
commit;
`)

  const revocationBeforeCall = startQuery(`
begin;
set local role service_role;
insert into public.brain_decision_authority_revocations (
  authority_event_id, decision_version_id, workspace_id, subject_id,
  revoked_by, revoked_at, reason_ciphertext, encryption_version
) values (
  '14290000-0000-4000-8000-000000000092', '14250000-0000-4000-8000-000000000071',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000092'),
  private.r142_cipher('14290000-0000-4000-8000-000000000092', 'decision_authority_revocation', 'reason', 'concurrent-revocation-before-call'), 1
);
select pg_advisory_xact_lock(1431481);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431481)
  const calledAfterRevocation = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000092', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000092', 'decision_call', 'call', 'concurrent-revocation-wins'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000092', 'decision_call', 'conditions', 'revocation-wins-conditions'),
  1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000092',
  'concurrent-revocation-wins-r143', 'current', '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000092')
);
commit;
`, { allowFailure: true })
  const revocationBeforeCallResult = await revocationBeforeCall
  if (revocationBeforeCallResult.code !== 0) throw new Error(`R143 pre-call revocation failed: ${revocationBeforeCallResult.stderr || revocationBeforeCallResult.stdout}`)
  requireRejected(calledAfterRevocation, 'brain_decision_governing_lock_busy_retry')

  const callWins = startQuery(`
begin;
set local role service_role;
insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000091', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000091', 'decision_call', 'call', 'concurrent-call-wins'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000091', 'decision_call', 'conditions', 'call-wins-conditions'),
  1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000091',
  'concurrent-call-wins-r143', 'current', '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000091')
);
select pg_advisory_xact_lock(1431471);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431471)
  const revocationAfterCall = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_authority_revocations (
  authority_event_id, decision_version_id, workspace_id, subject_id,
  revoked_by, revoked_at, reason_ciphertext, encryption_version
) values (
  '14290000-0000-4000-8000-000000000091', '14250000-0000-4000-8000-000000000071',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000091'),
  private.r142_cipher('14290000-0000-4000-8000-000000000091', 'decision_authority_revocation', 'reason', 'concurrent-backdated-call-revocation'), 1
);
commit;
`, { allowFailure: true })
  const callWinsResult = await callWins
  if (callWinsResult.code !== 0) throw new Error(`R143 authority-locked call failed: ${callWinsResult.stderr || callWinsResult.stdout}`)
  requireRejected(revocationAfterCall, 'brain_decision_governing_lock_busy_retry')
  await query(`
do $$
begin
  if not exists (select 1 from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000091')
    then raise exception 'r143_call_winner_missing'; end if;
  if exists (select 1 from public.brain_decision_authority_revocations where authority_event_id = '14290000-0000-4000-8000-000000000091')
    then raise exception 'r143_post_use_call_revocation_committed'; end if;
  if exists (select 1 from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000092')
    then raise exception 'r143_revoked_call_committed'; end if;
  if exists (select 1 from public.brain_decision_events where event_type = 'call_recorded' and after_ref = '142a0000-0000-4000-8000-000000000092')
    then raise exception 'r143_revoked_call_receipted'; end if;
end;
$$;
`)

  await query(`
begin;
set local role service_role;
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000101',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
  statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000103',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
  statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000104',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
  statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values
  (
    '14240000-0000-4000-8000-000000000105',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
    statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14240000-0000-4000-8000-000000000106',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
    statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
  );
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values (
  '14240000-0000-4000-8000-000000000102',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
  statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000101', '14240000-0000-4000-8000-000000000101',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14250000-0000-4000-8000-000000000101', 'decision_version', 'title', 'prior-race-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000101', 'decision_version', 'stakes', 'prior-race-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000101', 'decision_version', 'provisional_view', 'prior-race-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000101', 'decision_version', 'analysis', 'prior-race-analysis'),
  1, repeat('d', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values
  (
    '14250000-0000-4000-8000-000000000105', '14240000-0000-4000-8000-000000000105',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14250000-0000-4000-8000-000000000105', 'decision_version', 'title', 'reverse-batch-a-title'),
    private.r142_cipher('14250000-0000-4000-8000-000000000105', 'decision_version', 'stakes', 'reverse-batch-a-stakes'),
    private.r142_cipher('14250000-0000-4000-8000-000000000105', 'decision_version', 'provisional_view', 'reverse-batch-a-view'),
    private.r142_cipher('14250000-0000-4000-8000-000000000105', 'decision_version', 'analysis', 'reverse-batch-a-analysis'),
    1, repeat('a', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
    '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14250000-0000-4000-8000-000000000106', '14240000-0000-4000-8000-000000000106',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14250000-0000-4000-8000-000000000106', 'decision_version', 'title', 'reverse-batch-b-title'),
    private.r142_cipher('14250000-0000-4000-8000-000000000106', 'decision_version', 'stakes', 'reverse-batch-b-stakes'),
    private.r142_cipher('14250000-0000-4000-8000-000000000106', 'decision_version', 'provisional_view', 'reverse-batch-b-view'),
    private.r142_cipher('14250000-0000-4000-8000-000000000106', 'decision_version', 'analysis', 'reverse-batch-b-analysis'),
    1, repeat('b', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
    '14200000-0000-4000-8000-000000000001'
  );
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000104', '14240000-0000-4000-8000-000000000104',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14250000-0000-4000-8000-000000000104', 'decision_version', 'title', 'atom-identity-deadlock-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000104', 'decision_version', 'stakes', 'atom-identity-deadlock-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000104', 'decision_version', 'provisional_view', 'atom-identity-deadlock-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000104', 'decision_version', 'analysis', 'atom-identity-deadlock-analysis'),
  1, repeat('2', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000102', '14240000-0000-4000-8000-000000000102',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14250000-0000-4000-8000-000000000102', 'decision_version', 'title', 'prior-prewait-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000102', 'decision_version', 'stakes', 'prior-prewait-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000102', 'decision_version', 'provisional_view', 'prior-prewait-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000102', 'decision_version', 'analysis', 'prior-prewait-analysis'),
  1, repeat('e', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values (
  '14250000-0000-4000-8000-000000000103', '14240000-0000-4000-8000-000000000103',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14250000-0000-4000-8000-000000000103', 'decision_version', 'title', 'prior-deadlock-title'),
  private.r142_cipher('14250000-0000-4000-8000-000000000103', 'decision_version', 'stakes', 'prior-deadlock-stakes'),
  private.r142_cipher('14250000-0000-4000-8000-000000000103', 'decision_version', 'provisional_view', 'prior-deadlock-view'),
  private.r142_cipher('14250000-0000-4000-8000-000000000103', 'decision_version', 'analysis', 'prior-deadlock-analysis'),
  1, repeat('f', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
  '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended
) values (
  '14270000-0000-4000-8000-000000000103', '14250000-0000-4000-8000-000000000103',
  '14240000-0000-4000-8000-000000000103', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14270000-0000-4000-8000-000000000103', 'decision_route', 'tab_label', 'prior-deadlock-route'),
  private.r142_cipher('14270000-0000-4000-8000-000000000103', 'decision_route', 'content', 'prior-deadlock-route-content'),
  1, false, false
);
insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended
) values (
  '14270000-0000-4000-8000-000000000104', '14250000-0000-4000-8000-000000000104',
  '14240000-0000-4000-8000-000000000104', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14270000-0000-4000-8000-000000000104', 'decision_route', 'tab_label', 'atom-identity-deadlock-route'),
  private.r142_cipher('14270000-0000-4000-8000-000000000104', 'decision_route', 'content', 'atom-identity-deadlock-route-content'),
  1, false, false
);
insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended
) values
  (
    '14270000-0000-4000-8000-000000000105', '14250000-0000-4000-8000-000000000105',
    '14240000-0000-4000-8000-000000000105', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14270000-0000-4000-8000-000000000105', 'decision_route', 'tab_label', 'reverse-batch-a-route'),
    private.r142_cipher('14270000-0000-4000-8000-000000000105', 'decision_route', 'content', 'reverse-batch-a-content'),
    1, false, false
  ),
  (
    '14270000-0000-4000-8000-000000000106', '14250000-0000-4000-8000-000000000106',
    '14240000-0000-4000-8000-000000000106', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14270000-0000-4000-8000-000000000106', 'decision_route', 'tab_label', 'reverse-batch-b-route'),
    private.r142_cipher('14270000-0000-4000-8000-000000000106', 'decision_route', 'content', 'reverse-batch-b-content'),
    1, false, false
  );
commit;
`)

  await query(`
begin;
set local role service_role;
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0095-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 answer pre-wait provenance', 'delivery_team_private', repeat('5', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0091-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 reverse atom batch provenance', 'delivery_team_private', repeat('1', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0092-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 atom identity inverse deadlock provenance', 'delivery_team_private', repeat('2', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0093-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 inverse human prior deadlock provenance', 'delivery_team_private', repeat('3', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0094-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 human prior pre-wait provenance', 'delivery_team_private', repeat('4', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values (
  '14230095-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '142d0095-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'user_stated', 'delivery_team_private', 'ciphertext:r143-answer-wait-before', 1, repeat('5', 64),
  statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values (
  '14230094-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '142d0094-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'user_stated', 'delivery_team_private', 'ciphertext:r143-prior-wait-before', 1, repeat('4', 64),
  statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values (
  '14230093-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '142d0093-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'user_stated', 'delivery_team_private', 'ciphertext:r143-prior-deadlock-before', 1, repeat('3', 64),
  statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values (
  '14230092-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '142d0092-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'user_stated', 'delivery_team_private', 'ciphertext:r143-atom-identity-before', 1, repeat('2', 64),
  statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values
  (
    '14230091-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0091-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-reverse-batch-x', 1, repeat('1', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230091-0000-4000-8000-000000000002',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0091-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-reverse-batch-y', 1, repeat('1', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  );
commit;
`)

  await query(`
begin;
set local role service_role;
insert into public.brain_decision_cases (
  id, workspace_id, subject_id, owner_id, status, decision_by, opened_at, created_by
) values
  (
    '14240000-0000-4000-8000-000000000107',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
    statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14240000-0000-4000-8000-000000000108',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 'active', statement_timestamp() + interval '7 days',
    statement_timestamp() - interval '1 day', '14200000-0000-4000-8000-000000000001'
  );
insert into public.brain_decision_versions (
  id, decision_id, workspace_id, subject_id, version,
  title_ciphertext, stakes_ciphertext, provisional_view_ciphertext, analysis_ciphertext,
  encryption_version, source_watermark_sha256, generated_at, fresh_until, created_by
) values
  (
    '14250000-0000-4000-8000-000000000107', '14240000-0000-4000-8000-000000000107',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14250000-0000-4000-8000-000000000107', 'decision_version', 'title', 'reverse-version-a-title'),
    private.r142_cipher('14250000-0000-4000-8000-000000000107', 'decision_version', 'stakes', 'reverse-version-a-stakes'),
    private.r142_cipher('14250000-0000-4000-8000-000000000107', 'decision_version', 'provisional_view', 'reverse-version-a-view'),
    private.r142_cipher('14250000-0000-4000-8000-000000000107', 'decision_version', 'analysis', 'reverse-version-a-analysis'),
    1, repeat('7', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
    '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14250000-0000-4000-8000-000000000108', '14240000-0000-4000-8000-000000000108',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14250000-0000-4000-8000-000000000108', 'decision_version', 'title', 'reverse-version-b-title'),
    private.r142_cipher('14250000-0000-4000-8000-000000000108', 'decision_version', 'stakes', 'reverse-version-b-stakes'),
    private.r142_cipher('14250000-0000-4000-8000-000000000108', 'decision_version', 'provisional_view', 'reverse-version-b-view'),
    private.r142_cipher('14250000-0000-4000-8000-000000000108', 'decision_version', 'analysis', 'reverse-version-b-analysis'),
    1, repeat('8', 64), statement_timestamp(), statement_timestamp() + interval '1 day',
    '14200000-0000-4000-8000-000000000001'
  );
insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended
) values
  (
    '14270000-0000-4000-8000-000000000107', '14250000-0000-4000-8000-000000000107',
    '14240000-0000-4000-8000-000000000107', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14270000-0000-4000-8000-000000000107', 'decision_route', 'tab_label', 'reverse-version-a-route'),
    private.r142_cipher('14270000-0000-4000-8000-000000000107', 'decision_route', 'content', 'reverse-version-a-content'),
    1, false, false
  ),
  (
    '14270000-0000-4000-8000-000000000108', '14250000-0000-4000-8000-000000000108',
    '14240000-0000-4000-8000-000000000108', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', 1,
    private.r142_cipher('14270000-0000-4000-8000-000000000108', 'decision_route', 'tab_label', 'reverse-version-b-route'),
    private.r142_cipher('14270000-0000-4000-8000-000000000108', 'decision_route', 'content', 'reverse-version-b-content'),
    1, false, false
  );
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0090-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 reverse governing version batch provenance', 'delivery_team_private', repeat('0', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values
  (
    '14230090-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0090-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-reverse-version-x', 1, repeat('0', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230090-0000-4000-8000-000000000002',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0090-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-reverse-version-y', 1, repeat('0', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230090-0000-4000-8000-000000000003',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0090-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-reverse-version-z', 1, repeat('0', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230090-0000-4000-8000-000000000004',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0090-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-reverse-version-w', 1, repeat('0', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  );
commit;
`)

  const answerHoldingVersionThenUpdatingProvenance = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
insert into public.brain_decision_answers (
  id, question_id, decision_version_id, workspace_id, subject_id,
  answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '142c0000-0000-4000-8000-000000000102', '14280000-0000-4000-8000-000000000071',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142c0000-0000-4000-8000-000000000102', 'decision_answer', 'answer', 'version-lock-holder'),
  1, '14230012-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
select pg_advisory_xact_lock(1431502);
update public.brain_assertions
set statement_ciphertext = 'ciphertext:r143-answer-wait-after'
where id = '14230095-0000-4000-8000-000000000001';
select pg_sleep(60);
commit;
`)
  try {
    await waitForMarker(1431502)
  } catch (markerError) {
    const answerHolderEarlyResult = await answerHoldingVersionThenUpdatingProvenance
    throw new Error(
      `R143 answer version-lock holder ended before marker: ${answerHolderEarlyResult.stderr || answerHolderEarlyResult.stdout}`,
      { cause: markerError },
    )
  }
  const staleWaitingAnswer = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_answers (
  id, question_id, decision_version_id, workspace_id, subject_id,
  answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '142c0000-0000-4000-8000-000000000103', '14280000-0000-4000-8000-000000000071',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142c0000-0000-4000-8000-000000000103', 'decision_answer', 'answer', 'stale-waiting-answer'),
  1, '14230095-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  const [answerHolderResult, staleWaitingAnswerResult] = await Promise.all([
    answerHoldingVersionThenUpdatingProvenance,
    staleWaitingAnswer,
  ])
  if (answerHolderResult.code !== 0) {
    throw new Error(`R143 answer version-lock holder failed: ${answerHolderResult.stderr || answerHolderResult.stdout}`)
  }
  requireRejected(staleWaitingAnswerResult, 'brain_decision_governing_lock_busy_retry')
  await query(`
begin;
set local role service_role;
do $$
begin
  if not exists (select 1 from public.brain_decision_answers
      where id = '142c0000-0000-4000-8000-000000000102')
    then raise exception 'r143_answer_version_holder_missing'; end if;
  if not exists (select 1 from public.brain_decision_events
      where event_type = 'question_answered'
        and after_ref = '142c0000-0000-4000-8000-000000000102')
    then raise exception 'r143_answer_version_holder_receipt_missing'; end if;
  if exists (select 1 from public.brain_decision_answers
      where id = '142c0000-0000-4000-8000-000000000103')
    then raise exception 'r143_stale_waiting_answer_committed'; end if;
  if exists (select 1 from public.brain_decision_events
      where after_ref = '142c0000-0000-4000-8000-000000000103')
    then raise exception 'r143_stale_waiting_answer_left_receipt'; end if;
  if exists (select 1 from public.brain_decision_evidence_atoms
      where assertion_id = '14230095-0000-4000-8000-000000000001')
    then raise exception 'r143_stale_waiting_answer_left_atom'; end if;
end;
$$;
insert into public.brain_decision_answers (
  id, question_id, decision_version_id, workspace_id, subject_id,
  answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '142c0000-0000-4000-8000-000000000104', '14280000-0000-4000-8000-000000000071',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142c0000-0000-4000-8000-000000000104', 'decision_answer', 'answer', 'retry-after-provenance-change'),
  1, '14230095-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
do $$
begin
  if not exists (
    select 1
    from public.brain_decision_answers answer_row
    join public.brain_decision_evidence_atoms atom on atom.id = answer_row.source_evidence_atom_id
    join public.brain_decision_events event_row
      on event_row.event_type = 'question_answered' and event_row.after_ref = answer_row.id
    where answer_row.id = '142c0000-0000-4000-8000-000000000104'
      and atom.assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-answer-wait-after'
  ) then raise exception 'r143_answer_retry_did_not_capture_update'; end if;
end;
$$;
commit;
`)

  const priorHoldingVersionThenUpdatingProvenance = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
insert into public.brain_decision_routes (
  id, decision_version_id, decision_id, workspace_id, subject_id, route_order,
  tab_label_ciphertext, content_ciphertext, encryption_version, is_default, is_recommended
) values (
  '14270000-0000-4000-8000-000000000102', '14250000-0000-4000-8000-000000000102',
  '14240000-0000-4000-8000-000000000102', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', 1,
  private.r142_cipher('14270000-0000-4000-8000-000000000102', 'decision_route', 'tab_label', 'prior-lock-route'),
  private.r142_cipher('14270000-0000-4000-8000-000000000102', 'decision_route', 'content', 'prior-lock-route-content'),
  1, false, false
);
select pg_advisory_xact_lock(1431503);
select pg_sleep(60);
update public.brain_assertions
set statement_ciphertext = 'ciphertext:r143-prior-wait-after'
where id = '14230094-0000-4000-8000-000000000001';
commit;
`)
  try {
    await waitForMarker(1431503)
  } catch (markerError) {
    const priorHolderEarlyResult = await priorHoldingVersionThenUpdatingProvenance
    throw new Error(
      `R143 prior version-lock holder ended before marker: ${priorHolderEarlyResult.stderr || priorHolderEarlyResult.stdout}`,
      { cause: markerError },
    )
  }
  const staleWaitingPrior = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000102', '14250000-0000-4000-8000-000000000102',
  '14240000-0000-4000-8000-000000000102', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000102', 'decision_human_prior', 'position', 'stale-waiting-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000102', 'decision_human_prior', 'rationale', 'stale-waiting-prior-rationale'),
  1, '14230094-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  const [priorHolderResult, staleWaitingPriorResult] = await Promise.all([
    priorHoldingVersionThenUpdatingProvenance,
    staleWaitingPrior,
  ])
  if (priorHolderResult.code !== 0) {
    throw new Error(`R143 prior version-lock holder failed: ${priorHolderResult.stderr || priorHolderResult.stdout}`)
  }
  requireRejected(staleWaitingPriorResult, 'brain_decision_governing_lock_busy_retry')
  await query(`
begin;
set local role service_role;
do $$
begin
  if not exists (select 1 from public.brain_decision_routes
      where id = '14270000-0000-4000-8000-000000000102')
    then raise exception 'r143_prior_version_holder_route_missing'; end if;
  if exists (select 1 from public.brain_decision_human_priors
      where id = '14260000-0000-4000-8000-000000000102')
    then raise exception 'r143_stale_waiting_prior_committed'; end if;
  if exists (select 1 from public.brain_decision_evidence_atoms
      where assertion_id = '14230094-0000-4000-8000-000000000001')
    then raise exception 'r143_stale_waiting_prior_left_atom'; end if;
end;
$$;
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000103', '14250000-0000-4000-8000-000000000102',
  '14240000-0000-4000-8000-000000000102', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000103', 'decision_human_prior', 'position', 'retry-after-provenance-change'),
  private.r142_cipher('14260000-0000-4000-8000-000000000103', 'decision_human_prior', 'rationale', 'retry-after-provenance-change-rationale'),
  1, '14230094-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
do $$
begin
  if not exists (
    select 1
    from public.brain_decision_human_priors prior
    join public.brain_decision_evidence_atoms atom on atom.id = prior.source_evidence_atom_id
    where prior.id = '14260000-0000-4000-8000-000000000103'
      and atom.assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-prior-wait-after'
  ) then raise exception 'r143_prior_retry_did_not_capture_update'; end if;
end;
$$;
commit;
`)

  const provenanceHolderThenEvidenceLink = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
update public.brain_assertions
set statement_ciphertext = 'ciphertext:r143-prior-deadlock-after'
where id = '14230093-0000-4000-8000-000000000001';
select pg_advisory_xact_lock(1431504);
select pg_sleep(60);
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000103', '14240000-0000-4000-8000-000000000103',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000103',
  '14230093-0000-4000-8000-000000000001', 'supports',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  try {
    await waitForMarker(1431504)
  } catch (markerError) {
    const provenanceHolderEarlyResult = await provenanceHolderThenEvidenceLink
    throw new Error(
      `R143 inverse prior deadlock holder ended before marker: ${provenanceHolderEarlyResult.stderr || provenanceHolderEarlyResult.stdout}`,
      { cause: markerError },
    )
  }
  const failFastWaitingPrior = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000104', '14250000-0000-4000-8000-000000000103',
  '14240000-0000-4000-8000-000000000103', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000104', 'decision_human_prior', 'position', 'fail-fast-waiting-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000104', 'decision_human_prior', 'rationale', 'fail-fast-waiting-prior-rationale'),
  1, '14230093-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  const [provenanceHolderResult, failFastWaitingPriorResult] = await Promise.all([
    provenanceHolderThenEvidenceLink,
    failFastWaitingPrior,
  ])
  if (provenanceHolderResult.code !== 0) {
    throw new Error(`R143 inverse prior deadlock holder failed: ${provenanceHolderResult.stderr || provenanceHolderResult.stdout}`)
  }
  requireRejected(failFastWaitingPriorResult, 'brain_decision_evidence_provenance_busy_retry')
  await query(`
begin;
set local role service_role;
do $$
begin
  if exists (select 1 from public.brain_decision_human_priors
      where id = '14260000-0000-4000-8000-000000000104')
    then raise exception 'r143_busy_waiting_prior_committed'; end if;
  if not exists (
    select 1
    from public.brain_decision_evidence_links link
    join public.brain_decision_evidence_atoms atom on atom.id = link.evidence_atom_id
    where link.decision_version_id = '14250000-0000-4000-8000-000000000103'
      and link.assertion_id = '14230093-0000-4000-8000-000000000001'
      and atom.assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-prior-deadlock-after'
  ) then raise exception 'r143_inverse_prior_deadlock_evidence_missing'; end if;
end;
$$;
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000105', '14250000-0000-4000-8000-000000000103',
  '14240000-0000-4000-8000-000000000103', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000105', 'decision_human_prior', 'position', 'retry-after-busy-provenance'),
  private.r142_cipher('14260000-0000-4000-8000-000000000105', 'decision_human_prior', 'rationale', 'retry-after-busy-provenance-rationale'),
  1, '14230093-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
do $$
begin
  if not exists (
    select 1
    from public.brain_decision_human_priors prior
    join public.brain_decision_evidence_atoms atom on atom.id = prior.source_evidence_atom_id
    where prior.id = '14260000-0000-4000-8000-000000000105'
      and atom.assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-prior-deadlock-after'
      and prior.source_evidence_atom_id = (
        select link.evidence_atom_id
        from public.brain_decision_evidence_links link
        where link.decision_version_id = '14250000-0000-4000-8000-000000000103'
          and link.assertion_id = '14230093-0000-4000-8000-000000000001'
      )
  ) then raise exception 'r143_inverse_prior_retry_did_not_reuse_updated_atom'; end if;
end;
$$;
commit;
`)

  const atomIdentityHolderThenEvidenceLink = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
select private.brain_decision_materialize_evidence_atom(
  '14230092-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
select pg_advisory_xact_lock(1431505);
select pg_sleep(60);
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000104', '14240000-0000-4000-8000-000000000104',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000104',
  '14230092-0000-4000-8000-000000000001', 'supports',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  try {
    await waitForMarker(1431505)
  } catch (markerError) {
    const atomIdentityHolderEarlyResult = await atomIdentityHolderThenEvidenceLink
    throw new Error(
      `R143 atom identity holder ended before marker: ${atomIdentityHolderEarlyResult.stderr || atomIdentityHolderEarlyResult.stdout}`,
      { cause: markerError },
    )
  }
  const failFastIdentityPrior = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000106', '14250000-0000-4000-8000-000000000104',
  '14240000-0000-4000-8000-000000000104', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000106', 'decision_human_prior', 'position', 'fail-fast-atom-identity-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000106', 'decision_human_prior', 'rationale', 'fail-fast-atom-identity-rationale'),
  1, '14230092-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  const [atomIdentityHolderResult, failFastIdentityPriorResult] = await Promise.all([
    atomIdentityHolderThenEvidenceLink,
    failFastIdentityPrior,
  ])
  if (atomIdentityHolderResult.code !== 0) {
    throw new Error(`R143 atom identity holder failed: ${atomIdentityHolderResult.stderr || atomIdentityHolderResult.stdout}`)
  }
  requireRejected(failFastIdentityPriorResult, 'brain_decision_evidence_provenance_busy_retry')
  await query(`
begin;
set local role service_role;
do $$
begin
  if exists (select 1 from public.brain_decision_human_priors
      where id = '14260000-0000-4000-8000-000000000106')
    then raise exception 'r143_busy_atom_identity_prior_committed'; end if;
  if (select count(*) from public.brain_decision_evidence_atoms
      where assertion_id = '14230092-0000-4000-8000-000000000001') <> 1
    then raise exception 'r143_atom_identity_holder_count_wrong'; end if;
  if not exists (
    select 1
    from public.brain_decision_evidence_links link
    join public.brain_decision_evidence_atoms atom on atom.id = link.evidence_atom_id
    where link.decision_version_id = '14250000-0000-4000-8000-000000000104'
      and link.assertion_id = '14230092-0000-4000-8000-000000000001'
      and atom.assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-atom-identity-before'
  ) then raise exception 'r143_atom_identity_holder_evidence_missing'; end if;
end;
$$;
insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000107', '14250000-0000-4000-8000-000000000104',
  '14240000-0000-4000-8000-000000000104', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000107', 'decision_human_prior', 'position', 'retry-after-busy-atom-identity'),
  private.r142_cipher('14260000-0000-4000-8000-000000000107', 'decision_human_prior', 'rationale', 'retry-after-busy-atom-identity-rationale'),
  1, '14230092-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
do $$
begin
  if not exists (
    select 1
    from public.brain_decision_human_priors prior
    join public.brain_decision_evidence_links link
      on link.decision_version_id = prior.decision_version_id
      and link.assertion_id = prior.source_assertion_id
    where prior.id = '14260000-0000-4000-8000-000000000107'
      and prior.source_evidence_atom_id = link.evidence_atom_id
  ) then raise exception 'r143_atom_identity_prior_retry_did_not_reuse_atom'; end if;
end;
$$;
commit;
`)

  const reverseBatchHolder = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000106', '14240000-0000-4000-8000-000000000106',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000106',
  '14230091-0000-4000-8000-000000000002', 'supports',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
select pg_advisory_xact_lock(1431506);
select pg_sleep(60);
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000106', '14240000-0000-4000-8000-000000000106',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000106',
  '14230091-0000-4000-8000-000000000001', 'refutes',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  try {
    await waitForMarker(1431506)
  } catch (markerError) {
    const reverseBatchHolderEarlyResult = await reverseBatchHolder
    throw new Error(
      `R143 reverse evidence batch holder ended before marker: ${reverseBatchHolderEarlyResult.stderr || reverseBatchHolderEarlyResult.stdout}`,
      { cause: markerError },
    )
  }
  const reverseBatchLoser = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000105', '14240000-0000-4000-8000-000000000105',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000105',
  '14230091-0000-4000-8000-000000000001', 'supports',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000105', '14240000-0000-4000-8000-000000000105',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000105',
  '14230091-0000-4000-8000-000000000002', 'refutes',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`, { allowFailure: true })
  requireRejected(reverseBatchLoser, 'brain_decision_evidence_provenance_busy_retry')
  const reverseBatchHolderResult = await reverseBatchHolder
  if (reverseBatchHolderResult.code !== 0) {
    throw new Error(`R143 reverse evidence batch holder failed: ${reverseBatchHolderResult.stderr || reverseBatchHolderResult.stdout}`)
  }
  await query(`
begin;
set local role service_role;
do $$
begin
  if exists (select 1 from public.brain_decision_evidence_links
      where decision_version_id = '14250000-0000-4000-8000-000000000105')
    then raise exception 'r143_reverse_batch_loser_left_links'; end if;
  if (select count(*) from public.brain_decision_evidence_links
      where decision_version_id = '14250000-0000-4000-8000-000000000106') <> 2
    then raise exception 'r143_reverse_batch_winner_links_wrong'; end if;
  if (select count(*) from public.brain_decision_evidence_atoms
      where source_id = '142d0091-0000-4000-8000-000000000001') <> 2
    then raise exception 'r143_reverse_batch_atom_count_wrong'; end if;
end;
$$;
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values
  (
    '14250000-0000-4000-8000-000000000105', '14240000-0000-4000-8000-000000000105',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'route', '14270000-0000-4000-8000-000000000105',
    '14230091-0000-4000-8000-000000000001', 'supports',
    '14200000-0000-4000-8000-000000000001', statement_timestamp()
  ),
  (
    '14250000-0000-4000-8000-000000000105', '14240000-0000-4000-8000-000000000105',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'route', '14270000-0000-4000-8000-000000000105',
    '14230091-0000-4000-8000-000000000002', 'refutes',
    '14200000-0000-4000-8000-000000000001', statement_timestamp()
  );
do $$
begin
  if (select count(*) from public.brain_decision_evidence_links loser_link
      join public.brain_decision_evidence_links winner_link
        on winner_link.assertion_id = loser_link.assertion_id
        and winner_link.evidence_atom_id = loser_link.evidence_atom_id
      where loser_link.decision_version_id = '14250000-0000-4000-8000-000000000105'
        and winner_link.decision_version_id = '14250000-0000-4000-8000-000000000106') <> 2
    then raise exception 'r143_reverse_batch_retry_did_not_reuse_atoms'; end if;
end;
$$;
commit;
`)

  const reverseVersionHolder = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000107', '14240000-0000-4000-8000-000000000107',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000107',
  '14230090-0000-4000-8000-000000000001', 'supports',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
select pg_advisory_xact_lock(1431507);
select pg_sleep(60);
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000108', '14240000-0000-4000-8000-000000000108',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000108',
  '14230090-0000-4000-8000-000000000003', 'context',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`)
  try {
    await waitForMarker(1431507)
  } catch (markerError) {
    const reverseVersionHolderEarlyResult = await reverseVersionHolder
    throw new Error(
      `R143 reverse governing-version holder ended before marker: ${reverseVersionHolderEarlyResult.stderr || reverseVersionHolderEarlyResult.stdout}`,
      { cause: markerError },
    )
  }
  const reverseVersionLoser = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000108', '14240000-0000-4000-8000-000000000108',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000108',
  '14230090-0000-4000-8000-000000000002', 'supports',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values (
  '14250000-0000-4000-8000-000000000107', '14240000-0000-4000-8000-000000000107',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'route', '14270000-0000-4000-8000-000000000107',
  '14230090-0000-4000-8000-000000000004', 'refutes',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);
commit;
`, { allowFailure: true })
  requireRejected(reverseVersionLoser, 'brain_decision_governing_lock_busy_retry')
  const reverseVersionHolderResult = await reverseVersionHolder
  if (reverseVersionHolderResult.code !== 0) {
    throw new Error(`R143 reverse governing-version holder failed: ${reverseVersionHolderResult.stderr || reverseVersionHolderResult.stdout}`)
  }
  await query(`
begin;
set local role service_role;
do $$
begin
  if exists (select 1 from public.brain_decision_evidence_links
      where assertion_id in (
        '14230090-0000-4000-8000-000000000002',
        '14230090-0000-4000-8000-000000000004'
      ))
    then raise exception 'r143_reverse_version_loser_left_links'; end if;
  if exists (select 1 from public.brain_decision_evidence_atoms
      where assertion_id in (
        '14230090-0000-4000-8000-000000000002',
        '14230090-0000-4000-8000-000000000004'
      ))
    then raise exception 'r143_reverse_version_loser_left_atoms'; end if;
  if (select count(*) from public.brain_decision_evidence_links
      where assertion_id in (
        '14230090-0000-4000-8000-000000000001',
        '14230090-0000-4000-8000-000000000003'
      )) <> 2
    then raise exception 'r143_reverse_version_winner_links_wrong'; end if;
  if (select count(*) from public.brain_decision_evidence_atoms
      where source_id = '142d0090-0000-4000-8000-000000000001') <> 2
    then raise exception 'r143_reverse_version_atom_count_wrong'; end if;
end;
$$;
insert into public.brain_decision_evidence_links (
  decision_version_id, decision_id, workspace_id, subject_id, artifact_kind,
  artifact_id, assertion_id, stance, linked_by, linked_at
) values
  (
    '14250000-0000-4000-8000-000000000108', '14240000-0000-4000-8000-000000000108',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'route', '14270000-0000-4000-8000-000000000108',
    '14230090-0000-4000-8000-000000000002', 'supports',
    '14200000-0000-4000-8000-000000000001', statement_timestamp()
  ),
  (
    '14250000-0000-4000-8000-000000000107', '14240000-0000-4000-8000-000000000107',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'route', '14270000-0000-4000-8000-000000000107',
    '14230090-0000-4000-8000-000000000004', 'refutes',
    '14200000-0000-4000-8000-000000000001', statement_timestamp()
  );
do $$
begin
  if (select count(*) from public.brain_decision_evidence_links
      where decision_version_id = '14250000-0000-4000-8000-000000000107') <> 2
     or (select count(*) from public.brain_decision_evidence_links
      where decision_version_id = '14250000-0000-4000-8000-000000000108') <> 2
    then raise exception 'r143_reverse_version_retry_links_wrong'; end if;
  if (select count(*) from public.brain_decision_evidence_atoms
      where source_id = '142d0090-0000-4000-8000-000000000001') <> 4
    then raise exception 'r143_reverse_version_retry_atom_count_wrong'; end if;
  if (select count(*)
      from public.brain_decision_evidence_links link
      join public.brain_decision_evidence_atoms atom
        on atom.id = link.evidence_atom_id
       and atom.assertion_id = link.assertion_id
      where link.assertion_id in (
        '14230090-0000-4000-8000-000000000001',
        '14230090-0000-4000-8000-000000000002',
        '14230090-0000-4000-8000-000000000003',
        '14230090-0000-4000-8000-000000000004'
      )) <> 4
    then raise exception 'r143_reverse_version_retry_identity_mismatch'; end if;
end;
$$;
commit;
`)

  await runSourceReferenceRace({
    label: 'prior',
    marker: 1431491,
    assertionId: '14230017-0000-4000-8000-000000000001',
    insertSql: `insert into public.brain_decision_human_priors (
  id, decision_version_id, decision_id, workspace_id, subject_id,
  position_ciphertext, rationale_ciphertext, encryption_version,
  source_assertion_id, recorded_by, recorded_at
) values (
  '14260000-0000-4000-8000-000000000101', '14250000-0000-4000-8000-000000000101',
  '14240000-0000-4000-8000-000000000101', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('14260000-0000-4000-8000-000000000101', 'decision_human_prior', 'position', 'concurrent-prior'),
  private.r142_cipher('14260000-0000-4000-8000-000000000101', 'decision_human_prior', 'rationale', 'concurrent-prior-rationale'),
  1, '14230017-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);`,
    expectedRowSql: "exists (select 1 from public.brain_decision_human_priors where id = '14260000-0000-4000-8000-000000000101')",
  })

  await runSourceReferenceRace({
    label: 'answer',
    marker: 1431492,
    assertionId: '14230018-0000-4000-8000-000000000001',
    insertSql: `insert into public.brain_decision_answers (
  id, question_id, decision_version_id, workspace_id, subject_id,
  answer_ciphertext, encryption_version, source_assertion_id, recorded_by, recorded_at
) values (
  '142c0000-0000-4000-8000-000000000101', '14280000-0000-4000-8000-000000000071',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142c0000-0000-4000-8000-000000000101', 'decision_answer', 'answer', 'concurrent-answer-source'),
  1, '14230018-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);`,
    expectedRowSql: "exists (select 1 from public.brain_decision_answers where id = '142c0000-0000-4000-8000-000000000101')",
  })

  await query(`
begin;
update public.brain_decision_calls
set standing = 'challenged'
where id = '142a0000-0000-4000-8000-000000000091';
set local role service_role;
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values (
  '142d0099-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
  'r143 atom reuse race', 'delivery_team_private', repeat('9', 64),
  statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
);
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values (
  '14230099-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  '142d0099-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
  'user_stated', 'delivery_team_private', 'ciphertext:r143-atom-reuse-race', 1, repeat('9', 64),
  statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
);
commit;
`)

  const authorityMaterializesAtom = startQuery(`
begin;
set local role service_role;
do $$
declare call_at timestamptz := statement_timestamp();
begin
  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    '14290000-0000-4000-8000-000000000101', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000101', '14250000-0000-4000-8000-000000000071',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000101', 'decision_call', 'call', 'concurrent-call-source'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000101', 'decision_call', 'conditions', 'concurrent-call-conditions'),
      1::smallint, '14230099-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', call_at
    ), call_at, statement_timestamp() + interval '1 day'
  );
end;
$$;
select pg_advisory_xact_lock(1431490);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431490)
  const competingAtom = await query(`
begin;
set local role service_role;
set local statement_timeout = '120s';
select private.brain_decision_materialize_evidence_atom(
  '14230099-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
commit;
`, { allowFailure: true })
  const authorityMaterializesAtomResult = await authorityMaterializesAtom
  if (authorityMaterializesAtomResult.code !== 0) {
    throw new Error(`R143 authority atom materialization failed: ${authorityMaterializesAtomResult.stderr || authorityMaterializesAtomResult.stdout}`)
  }
  requireRejected(competingAtom, 'brain_decision_evidence_provenance_busy_retry')
  await query(`
begin;
set local role service_role;
select private.brain_decision_materialize_evidence_atom(
  '14230099-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
commit;
`)
  await query(`
do $$
begin
  if (select count(*) from public.brain_decision_evidence_atoms
      where assertion_id = '14230099-0000-4000-8000-000000000001') <> 1
    then raise exception 'r143_duplicate_evidence_atom_committed'; end if;
  if not exists (select 1 from public.brain_decision_authority_events
      where id = '14290000-0000-4000-8000-000000000101')
    then raise exception 'r143_atom_bound_authority_missing'; end if;
end;
$$;
`)

  await query(`
begin;
set local role service_role;
insert into public.brain_sources (
  id, workspace_id, subject_id, source_type, actor_user_id, captured_at,
  purpose, audience, integrity_sha256, recorded_at, created_by
) values
  (
    '142d0098-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
    'r143 shared-source overlap', 'delivery_team_private', repeat('8', 64),
    statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '142d0097-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
    'r143 formerly deadlocking workflow', 'delivery_team_private', repeat('7', 64),
    statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '142d0096-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'text', '14200000-0000-4000-8000-000000000001', statement_timestamp() - interval '1 hour',
    'r143 waiting materializer chronology', 'delivery_team_private', repeat('6', 64),
    statement_timestamp() - interval '30 minutes', '14200000-0000-4000-8000-000000000001'
  );
insert into public.brain_assertions (
  id, workspace_id, subject_id, source_id, speaker_user_id, epistemic_basis,
  audience, statement_ciphertext, encryption_version, source_span_sha256,
  recorded_at, created_by
) values
  (
    '14230098-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0098-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-shared-source-a', 1, repeat('8', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230098-0000-4000-8000-000000000002',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0098-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-shared-source-b', 1, repeat('8', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230097-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0097-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-deadlock-a', 1, repeat('7', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230097-0000-4000-8000-000000000002',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0097-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-deadlock-b-before', 1, repeat('7', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  ),
  (
    '14230096-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    '142d0096-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'user_stated', 'delivery_team_private', 'ciphertext:r143-waiter-before', 1, repeat('6', 64),
    statement_timestamp() - interval '20 minutes', '14200000-0000-4000-8000-000000000001'
  );
commit;
`)

  const sharedSourceFirst = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '120s';
select private.brain_decision_materialize_evidence_atom(
  '14230098-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
select pg_advisory_xact_lock(1431495);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431495)
  const sharedSourceSecond = await query(`
begin;
set local role service_role;
set local statement_timeout = '4s';
select private.brain_decision_materialize_evidence_atom(
  '14230098-0000-4000-8000-000000000002',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
commit;
`, { allowFailure: true })
  const sharedSourceFirstResult = await sharedSourceFirst
  if (sharedSourceFirstResult.code !== 0 || sharedSourceSecond.code !== 0) {
    throw new Error(
      `R143 shared-source materialization serialized or failed: first ${sharedSourceFirstResult.code} `
      + `${sharedSourceFirstResult.stderr || sharedSourceFirstResult.stdout}; second ${sharedSourceSecond.code} `
      + `${sharedSourceSecond.stderr || sharedSourceSecond.stdout}`,
    )
  }
  await query(`
do $$
begin
  if (select count(*) from public.brain_decision_evidence_atoms
      where source_id = '142d0098-0000-4000-8000-000000000001') <> 2
    then raise exception 'r143_shared_source_atom_count_wrong'; end if;
end;
$$;
`)

  const formerlyDeadlockingFirst = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
do $$
begin
  begin
    perform private.brain_decision_materialize_evidence_atom(
      '14230097-0000-4000-8000-000000000001',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001'
    );
    perform pg_advisory_xact_lock(1431496);
    perform pg_sleep(25);
    perform private.brain_decision_materialize_evidence_atom(
      '14230097-0000-4000-8000-000000000002',
      '14210000-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001'
    );
    raise exception 'r143_stale_shared_source_waiter_was_accepted';
  exception when others then
    if sqlerrm <> 'brain_decision_evidence_provenance_busy_retry' then raise; end if;
  end;
  if exists (select 1 from public.brain_decision_evidence_atoms
      where assertion_id = '14230097-0000-4000-8000-000000000001')
    then raise exception 'r143_rejected_shared_source_waiter_left_partial_atom'; end if;
end;
$$;
commit;
`)
  await waitForMarker(1431496)
  const formerlyDeadlockingSecond = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
update public.brain_assertions
set statement_ciphertext = 'ciphertext:r143-deadlock-b-after'
where id = '14230097-0000-4000-8000-000000000002';
select pg_advisory_xact_lock(1431497);
select private.brain_decision_materialize_evidence_atom(
  '14230097-0000-4000-8000-000000000002',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
select pg_advisory_xact_lock(1431500);
select pg_sleep(20);
commit;
`)
  const [formerlyDeadlockingFirstResult, formerlyDeadlockingSecondResult] = await Promise.all([
    formerlyDeadlockingFirst,
    formerlyDeadlockingSecond,
  ])
  if (formerlyDeadlockingFirstResult.code !== 0 || formerlyDeadlockingSecondResult.code !== 0) {
    throw new Error(
      `R143 formerly deadlocking workflow failed: first ${formerlyDeadlockingFirstResult.code} `
      + `${formerlyDeadlockingFirstResult.stderr || formerlyDeadlockingFirstResult.stdout}; second ${formerlyDeadlockingSecondResult.code} `
      + `${formerlyDeadlockingSecondResult.stderr || formerlyDeadlockingSecondResult.stdout}`,
    )
  }
  await query(`
do $$
begin
  if (select count(*) from public.brain_decision_evidence_atoms
      where source_id = '142d0097-0000-4000-8000-000000000001') <> 1
    then raise exception 'r143_rejected_shared_source_waiter_residue_wrong'; end if;
  if not exists (
    select 1 from public.brain_decision_evidence_atoms
    where assertion_id = '14230097-0000-4000-8000-000000000002'
      and assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-deadlock-b-after'
  ) then raise exception 'r143_shared_source_update_winner_missing'; end if;
end;
$$;
`)
  await query(`
begin;
set local role service_role;
select private.brain_decision_materialize_evidence_atom(
  '14230097-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
select private.brain_decision_materialize_evidence_atom(
  '14230097-0000-4000-8000-000000000002',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
commit;
`)
  await query(`
do $$
declare atom_diagnostics jsonb;
begin
  if (select statement_ciphertext from public.brain_assertions
      where id = '14230097-0000-4000-8000-000000000002') <> 'ciphertext:r143-deadlock-b-after'
    then raise exception 'r143_former_deadlock_update_missing'; end if;
  if (select count(*) from public.brain_decision_evidence_atoms
      where source_id = '142d0097-0000-4000-8000-000000000001') <> 2
  then
    select jsonb_agg(jsonb_build_object(
      'id', atom.id,
      'assertion_id', atom.assertion_id,
      'statement', atom.assertion_snapshot ->> 'statement_ciphertext',
      'materialized_at', atom.materialized_at,
      'assertion_digest', atom.assertion_snapshot_sha256
    ) order by atom.materialized_at, atom.id) into atom_diagnostics
    from public.brain_decision_evidence_atoms atom
    where atom.source_id = '142d0097-0000-4000-8000-000000000001';
    raise exception 'r143_former_deadlock_atom_count_wrong:%', atom_diagnostics;
  end if;
  if not exists (
    select 1 from public.brain_decision_evidence_atoms
    where assertion_id = '14230097-0000-4000-8000-000000000002'
      and assertion_snapshot ->> 'statement_ciphertext' = 'ciphertext:r143-deadlock-b-after'
  ) then raise exception 'r143_former_deadlock_snapshot_wrong'; end if;
end;
$$;
`)

  const provenanceUpdater = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '40s';
update public.brain_assertions
set statement_ciphertext = 'ciphertext:r143-waiter-after'
where id = '14230096-0000-4000-8000-000000000001';
select pg_advisory_xact_lock(1431501);
select pg_sleep(20);
commit;
`)
  await waitForMarker(1431501)
  const staleWaitingMaterializer = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
select private.brain_decision_materialize_evidence_atom(
  '14230096-0000-4000-8000-000000000001',
  '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001'
);
commit;
`, { allowFailure: true })
  const provenanceUpdaterResult = await provenanceUpdater
  if (provenanceUpdaterResult.code !== 0) {
    throw new Error(`R143 provenance updater failed: ${provenanceUpdaterResult.stderr || provenanceUpdaterResult.stdout}`)
  }
  requireRejected(staleWaitingMaterializer, 'brain_decision_evidence_provenance_busy_retry')
  await query(`
begin;
set local role service_role;
do $$
declare retry_atom_id uuid;
begin
  if exists (select 1 from public.brain_decision_evidence_atoms
      where assertion_id = '14230096-0000-4000-8000-000000000001')
    then raise exception 'r143_stale_waiter_left_atom'; end if;
  retry_atom_id := private.brain_decision_materialize_evidence_atom(
    '14230096-0000-4000-8000-000000000001',
    '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001'
  );
  if (select assertion_snapshot ->> 'statement_ciphertext'
      from public.brain_decision_evidence_atoms where id = retry_atom_id)
      <> 'ciphertext:r143-waiter-after'
    then raise exception 'r143_waiter_retry_snapshot_wrong'; end if;
end;
$$;
commit;
`)

  await runSourceReferenceRace({
    label: 'call',
    marker: 1431493,
    assertionId: '14230099-0000-4000-8000-000000000001',
    insertSql: `insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000101', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000071', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000101', 'decision_call', 'call', 'concurrent-call-source'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000101', 'decision_call', 'conditions', 'concurrent-call-conditions'),
  1, '14230099-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000101',
  'concurrent-call-source-r143', 'current', '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000101')
);`,
    expectedRowSql: "exists (select 1 from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000101')",
  })

  await runSourceReferenceRace({
    label: 'outcome',
    marker: 1431494,
    assertionId: '14230020-0000-4000-8000-000000000001',
    insertSql: `insert into public.brain_decision_outcomes (
  id, decision_call_id, decision_id, workspace_id, subject_id,
  result_ciphertext, encryption_version, source_assertion_id,
  observed_at, recorded_by, recorded_at
) values (
  '142b0000-0000-4000-8000-000000000101', '142a0000-0000-4000-8000-000000000101',
  '14240000-0000-4000-8000-000000000001', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142b0000-0000-4000-8000-000000000101', 'decision_outcome', 'result', 'concurrent-outcome-source'),
  1, '14230020-0000-4000-8000-000000000001', statement_timestamp(),
  '14200000-0000-4000-8000-000000000001', statement_timestamp()
);`,
    expectedRowSql: "exists (select 1 from public.brain_decision_outcomes where id = '142b0000-0000-4000-8000-000000000101')",
  })

  await query(`
begin;
update public.brain_decision_calls
set standing = 'challenged'
where id = '142a0000-0000-4000-8000-000000000101';
set local role service_role;
do $$
declare authority_at timestamptz := statement_timestamp();
begin
  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    '14290000-0000-4000-8000-000000000084', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000081', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'seal_analysis', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_snapshot_sha256('14250000-0000-4000-8000-000000000081'),
    authority_at, authority_at + interval '1 day'
  );
end;
$$;
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000081',
  '14290000-0000-4000-8000-000000000084',
  repeat('a', 64),
  'seal-replacement-v6-r143'
);
commit;
`)

  await query(successorBlock(
    testSql,
    ['64', '65', '66'],
    7,
    '14250000-0000-4000-8000-000000000081',
  ))
  await query(`
begin;
set local role service_role;
do $$
declare call_at timestamptz := statement_timestamp() + interval '45 seconds';
begin
  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    '14290000-0000-4000-8000-000000000109', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000081', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000109', '14250000-0000-4000-8000-000000000081',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000109', 'decision_call', 'call', 'successor-first-call'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000109', 'decision_call', 'conditions', 'successor-first-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', call_at
    ), call_at, call_at + interval '1 day'
  );
end;
$$;
commit;
`)

  const successorWinsAgainstCall = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '180s';
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000064',
  '14290000-0000-4000-8000-000000000064',
  repeat('a', 64),
  'seal-successor-before-call-r143'
);
select pg_advisory_xact_lock(1431508);
select pg_sleep(90);
commit;
`)
  await waitForMarker(1431508)
  const callAgainstSealingPredecessor = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000109', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000081', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000109', 'decision_call', 'call', 'successor-first-call'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000109', 'decision_call', 'conditions', 'successor-first-conditions'),
  1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000109',
  'successor-first-call-r143', 'current', '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000109')
);
commit;
`, { allowFailure: true })
  const successorWinsAgainstCallResult = await successorWinsAgainstCall
  if (successorWinsAgainstCallResult.code !== 0) {
    throw new Error(`R143 successor-first seal failed: ${successorWinsAgainstCallResult.stderr || successorWinsAgainstCallResult.stdout}`)
  }
  requireRejected(callAgainstSealingPredecessor, 'brain_decision_governing_lock_busy_retry')
  const staleCallRetry = await query(`
begin;
set local role service_role;
insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000109', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000081', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000109', 'decision_call', 'call', 'successor-first-call'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000109', 'decision_call', 'conditions', 'successor-first-conditions'),
  1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000109',
  'successor-first-call-r143', 'current', '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000109')
);
commit;
`, { allowFailure: true })
  requireRejected(staleCallRetry, 'brain_decision_call_authority_invalid')
  await query(`
do $$
begin
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000081') <> 'superseded'
    then raise exception 'r143_successor_first_predecessor_not_superseded'; end if;
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000064') <> 'sealed'
    then raise exception 'r143_successor_first_version_not_sealed'; end if;
  if (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000109')
      <= (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000064')
    then raise exception 'r143_successor_first_call_was_not_post_seal'; end if;
  if exists (select 1 from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000109')
    then raise exception 'r143_successor_first_call_committed'; end if;
  if exists (select 1 from public.brain_decision_events where event_type = 'call_recorded' and after_ref = '142a0000-0000-4000-8000-000000000109')
    then raise exception 'r143_successor_first_call_receipted'; end if;
end;
$$;
`)

  await query(successorBlock(
    testSql,
    ['74', '75', '76'],
    8,
    '14250000-0000-4000-8000-000000000064',
  ))
  await query(`
begin;
set local role service_role;
do $$
declare call_at timestamptz := statement_timestamp();
begin
  insert into public.brain_decision_authority_events (
    id, decision_id, decision_version_id, workspace_id, subject_id, owner_id,
    event_kind, audience, purpose, actor_user_id, input_sha256, occurred_at, valid_until
  ) values (
    '14290000-0000-4000-8000-000000000110', '14240000-0000-4000-8000-000000000001',
    '14250000-0000-4000-8000-000000000064', '14210000-0000-4000-8000-000000000001',
    '14200000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
    'record_owned_call', 'delivery_team_private', 'operator_decision_preparation',
    '14200000-0000-4000-8000-000000000001',
    private.brain_decision_call_input_sha256(
      '142a0000-0000-4000-8000-000000000110', '14250000-0000-4000-8000-000000000064',
      '14210000-0000-4000-8000-000000000001', '14200000-0000-4000-8000-000000000001',
      private.r142_cipher('142a0000-0000-4000-8000-000000000110', 'decision_call', 'call', 'call-first-successor'),
      private.r142_cipher('142a0000-0000-4000-8000-000000000110', 'decision_call', 'conditions', 'call-first-conditions'),
      1::smallint, '14230012-0000-4000-8000-000000000001',
      '14200000-0000-4000-8000-000000000001', call_at
    ), call_at, call_at + interval '1 day'
  );
end;
$$;
commit;
`)
  const callWinsAgainstSuccessor = startQuery(`
begin;
set local role service_role;
set local statement_timeout = '120s';
insert into public.brain_decision_calls (
  id, decision_id, decision_version_id, workspace_id, subject_id,
  call_ciphertext, conditions_ciphertext, encryption_version, source_assertion_id,
  authority_event_id, idempotency_key, standing, recorded_by, recorded_at
) values (
  '142a0000-0000-4000-8000-000000000110', '14240000-0000-4000-8000-000000000001',
  '14250000-0000-4000-8000-000000000064', '14210000-0000-4000-8000-000000000001',
  '14200000-0000-4000-8000-000000000001',
  private.r142_cipher('142a0000-0000-4000-8000-000000000110', 'decision_call', 'call', 'call-first-successor'),
  private.r142_cipher('142a0000-0000-4000-8000-000000000110', 'decision_call', 'conditions', 'call-first-conditions'),
  1, '14230012-0000-4000-8000-000000000001', '14290000-0000-4000-8000-000000000110',
  'call-first-successor-r143', 'current', '14200000-0000-4000-8000-000000000001',
  (select occurred_at from public.brain_decision_authority_events where id = '14290000-0000-4000-8000-000000000110')
);
select pg_advisory_xact_lock(1431509);
select pg_sleep(60);
commit;
`)
  await waitForMarker(1431509)
  const successorAgainstActiveCall = await query(`
begin;
set local role service_role;
set local statement_timeout = '40s';
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000074',
  '14290000-0000-4000-8000-000000000074',
  repeat('a', 64),
  'seal-successor-after-call-r143'
);
commit;
`, { allowFailure: true })
  const callWinsAgainstSuccessorResult = await callWinsAgainstSuccessor
  if (callWinsAgainstSuccessorResult.code !== 0) {
    throw new Error(`R143 call-first insert failed: ${callWinsAgainstSuccessorResult.stderr || callWinsAgainstSuccessorResult.stdout}`)
  }
  requireRejected(successorAgainstActiveCall, 'brain_decision_governing_lock_busy_retry')
  await query(`
begin;
set local role service_role;
select public.seal_brain_decision_version_v1(
  '14250000-0000-4000-8000-000000000074',
  '14290000-0000-4000-8000-000000000074',
  repeat('a', 64),
  'seal-successor-after-call-r143'
);
commit;
`)
  await query(`
do $$
begin
  if not exists (select 1 from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000110')
    then raise exception 'r143_call_first_call_missing'; end if;
  if not exists (select 1 from public.brain_decision_events where event_type = 'call_recorded' and after_ref = '142a0000-0000-4000-8000-000000000110')
    then raise exception 'r143_call_first_receipt_missing'; end if;
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000064') <> 'superseded'
    then raise exception 'r143_call_first_predecessor_not_superseded'; end if;
  if (select standing from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000074') <> 'sealed'
    then raise exception 'r143_call_first_successor_not_sealed'; end if;
  if (select recorded_at from public.brain_decision_calls where id = '142a0000-0000-4000-8000-000000000110')
      >= (select sealed_at from public.brain_decision_versions where id = '14250000-0000-4000-8000-000000000074')
    then raise exception 'r143_call_first_chronology_wrong'; end if;
end;
$$;
`)

  await query(cleanupSql)
  cleanupCompleted = true
  await query(preflightSql)
  process.stdout.write(`${JSON.stringify({
    status: 'passed',
    project_ref: isolatedProjectRef,
    postgres_version: '17.6',
    concurrent_post_seal_evidence: 'busy_writer_failed_fast_seal_committed',
    concurrent_post_supersession_answer: 'busy_answer_failed_fast_successor_committed',
    concurrent_seal_then_backdated_revocation: 'busy_revocation_failed_fast_seal_committed',
    concurrent_revocation_then_seal: 'busy_seal_failed_fast_revocation_committed',
    concurrent_call_then_backdated_revocation: 'busy_revocation_failed_fast_call_committed',
    concurrent_revocation_then_call: 'busy_call_failed_fast_revocation_committed',
    concurrent_prior_then_assertion_update: 'update_rejected_after_source_lock',
    concurrent_answer_then_assertion_update: 'update_rejected_after_source_lock',
    concurrent_same_assertion_materialization: 'busy_loser_retried_one_atom_authority_remained_valid',
    concurrent_distinct_assertions_same_source: 'completed_without_source_serialization',
    formerly_deadlocking_update_then_materialize: 'stale_partial_attempt_rolled_back_then_retry_committed',
    concurrent_update_then_waiting_materializer: 'stale_waiter_rejected_retry_captured_update',
    concurrent_answer_version_wait_then_provenance_update: 'busy_answer_rejected_without_residue_retry_captured_update',
    concurrent_prior_version_wait_then_provenance_update: 'busy_prior_rejected_without_residue_retry_captured_update',
    concurrent_provenance_update_then_prior_and_evidence_link: 'busy_prior_failed_fast_evidence_committed_retry_reused_atom',
    concurrent_atom_identity_then_prior_and_evidence_link: 'busy_prior_failed_fast_evidence_committed_retry_reused_atom',
    concurrent_reverse_atom_batches: 'busy_loser_rolled_back_winner_committed_retry_reused_two_atoms',
    concurrent_reverse_version_batches: 'busy_loser_rolled_back_winner_committed_retry_completed_four_distinct_links',
    concurrent_successor_then_owned_call: 'busy_call_failed_fast_successor_committed_no_receipt',
    concurrent_owned_call_then_successor: 'busy_successor_failed_fast_call_committed_retry_superseded',
    concurrent_call_then_assertion_update: 'update_rejected_after_source_lock',
    concurrent_outcome_then_assertion_update: 'update_rejected_after_source_lock',
    snapshot_drift: false,
    rollback_residue: 0,
    production_contacted: false,
  }, null, 2)}\n`)
} finally {
  await Promise.allSettled(activeSessions)
  if (!cleanupCompleted) {
    const cleanup = await query(cleanupSql, { allowFailure: true })
    if (cleanup.code === 0) await query(preflightSql, { allowFailure: true })
  }
  if (scratch.startsWith(`${scratchRoot}${path.sep}`)) rmSync(scratch, { recursive: true, force: true })
}
