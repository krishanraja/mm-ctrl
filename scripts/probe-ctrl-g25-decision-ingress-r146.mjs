import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { encryptBrainDecisionField } from '../supabase/functions/_shared/brain-decision-crypto.ts'

const root = process.cwd()
const projectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const proveReconstruction = process.argv.includes('--reconstruction')
const proveGroundedCandidate = process.argv.includes('--grounded-candidate') || proveReconstruction
const proveCandidateProjection = process.argv.includes('--candidate-projection') || proveGroundedCandidate
const url = `https://${projectRef}.supabase.co`
const npxCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js'
const scratch = 'C:/Users/krish/.scratch/mm-ctrl-r146'
const lit = value => `'${String(value).replaceAll("'", "''")}'`
const suffix = crypto.randomBytes(6).toString('hex')
const password = `R146-${crypto.randomBytes(24).toString('base64url')}`
const id = Object.fromEntries([
  'leader', 'operator', 'outsider', 'workspace', 'grant', 'case', 'version',
  'sourceA', 'sourceB', 'assertionA', 'assertionB', 'prior',
  'routeA', 'routeB', 'routeC', 'questionA', 'questionB', 'questionC', 'authority',
].map(key => [key, crypto.randomUUID()]))
const email = {
  leader: `r146-leader-${suffix}@example.invalid`,
  operator: `r146-operator-${suffix}@example.invalid`,
  outsider: `r146-outsider-${suffix}@example.invalid`,
}

const reconstructionPlaintext = {
  sourceA: 'In a four-week pilot, six marketers using the AI-first operating system cut campaign preparation from five days to one, while blind customer quality scores rose from 71 to 86. The two marketers who kept the old workflow remained at five days and scored 70.',
  sourceB: 'Four of the six pilot marketers still needed the leader to correct brand judgement in three of ten outputs, so the operating system has not yet proved that quality standards transfer without final rescue.',
  title: 'Rebuild the marketing division around AI',
  stakes: 'The £2.4m division must decide whether to replace people or prove an AI-first operating system across the whole team.',
  prior: 'Prove the new operating system before replacing the whole team.',
  question: 'What is the current bottleneck before a whole-team rebuild?',
}

if (projectRef === productionProjectRef) throw new Error('R146 cannot target production')

function runNpx(args, { sensitiveOutput = false } = {}) {
  const run = spawnSync(process.execPath, [npxCli, ...args], {
    encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024, windowsHide: true,
  })
  if (run.status !== 0) {
    if (sensitiveOutput) throw new Error('R146 credential discovery failed')
    const detail = `${run.error?.message ?? ''}\n${run.stderr ?? ''}\n${run.stdout ?? ''}`.trim().slice(0, 2_000)
    throw new Error(`r146_supabase_command_failed:${detail}`)
  }
  return run.stdout
}

function dbq(sql, { allowFailure = false } = {}) {
  mkdirSync(scratch, { recursive: true })
  const sqlFile = `${scratch}/${crypto.randomUUID()}.sql`
  writeFileSync(sqlFile, `${sql.trim()}\n`, { encoding: 'utf8', mode: 0o600 })
  const run = spawnSync(process.execPath, [npxCli,
    'supabase', 'db', 'query', '--linked', '--project-ref', projectRef,
    '--output-format', 'json', '--file', sqlFile,
  ], { encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024, windowsHide: true })
  rmSync(sqlFile, { force: true })
  if (run.status !== 0) {
    const detail = `${run.error?.message ?? ''}\n${run.stderr ?? ''}\n${run.stdout ?? ''}`.trim().slice(0, 2_000)
    if (allowFailure) return { failed: true, detail }
    throw new Error(`r146_database_query_failed:${detail}`)
  }
  return JSON.parse(run.stdout).rows ?? []
}

const keysPayload = JSON.parse(runNpx([
  'supabase', 'projects', 'api-keys', '--project-ref', projectRef,
  '--reveal', '--output-format', 'json',
], { sensitiveOutput: true }))
const keys = Array.isArray(keysPayload) ? keysPayload : (keysPayload.apiKeys ?? keysPayload.keys ?? [])
const publishableKey = keys.find(key => key.type === 'publishable')?.api_key
  ?? keys.find(key => key.name === 'anon')?.api_key
if (!publishableKey) throw new Error('R146 could not resolve an in-memory public API key')

const authRow = (userId, userEmail) => `(
  '00000000-0000-0000-0000-000000000000',${lit(userId)}::uuid,'authenticated','authenticated',${lit(userEmail)},
  extensions.crypt(${lit(password)},extensions.gen_salt('bf')),now(),'','','','','','','',
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false,false,now(),now())`
const identityRow = (userId, userEmail) => `(
  gen_random_uuid(),${lit(userId)},${lit(userId)}::uuid,
  jsonb_build_object('sub',${lit(userId)},'email',${lit(userEmail)},'email_verified',true),
  'email',now(),now(),now())`

async function json(response) {
  const text = await response.text()
  try { return JSON.parse(text) } catch { return text }
}

async function signIn(userEmail) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password }),
    signal: AbortSignal.timeout(60_000),
  })
  const body = await json(response)
  if (!response.ok || !body?.access_token) throw new Error(`r146_sign_in_failed:${response.status}`)
  return body.access_token
}

async function invokeFunction(functionName, token, body) {
  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  })
  return { status: response.status, body: await json(response) }
}

async function invoke(token, body) {
  return invokeFunction('decision-ingress-v1', token, body)
}

async function rest(token, path) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  })
  return { status: response.status, body: await json(response) }
}

async function rpc(token, functionName, body) {
  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  })
  return { status: response.status, body: await json(response) }
}

function expect(value, message) {
  if (!value) throw new Error(message)
}

function counts() {
  return dbq(`select jsonb_build_object(
    'reconstruction_runs',(select count(*)::int from public.brain_decision_reconstruction_runs where workspace_id=${lit(id.workspace)}::uuid),
    'candidates',(select count(*)::int from public.brain_decision_answer_candidates where workspace_id=${lit(id.workspace)}::uuid),
    'candidate_evidence_links',(select count(*)::int from public.brain_decision_candidate_evidence_links where workspace_id=${lit(id.workspace)}::uuid),
    'reviews',(select count(*)::int from public.brain_decision_candidate_reviews where workspace_id=${lit(id.workspace)}::uuid),
    'answers',(select count(*)::int from public.brain_decision_answers where workspace_id=${lit(id.workspace)}::uuid),
    'sources',(select count(*)::int from public.brain_sources where workspace_id=${lit(id.workspace)}::uuid),
    'assertions',(select count(*)::int from public.brain_assertions where workspace_id=${lit(id.workspace)}::uuid),
    'atoms',(select count(*)::int from public.brain_decision_evidence_atoms where workspace_id=${lit(id.workspace)}::uuid),
    'candidate_events',(select count(*)::int from public.brain_decision_events where workspace_id=${lit(id.workspace)}::uuid and event_type like 'candidate_%'),
    'answer_events',(select count(*)::int from public.brain_decision_events where workspace_id=${lit(id.workspace)}::uuid and event_type='question_answered')
  ) as result`)[0]?.result
}

function cleanup() {
  dbq(`begin;
    set local session_replication_role = replica;
    delete from public.brain_decision_reconstruction_runs where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_candidate_reviews where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_answers where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_candidate_evidence_links where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_answer_candidates where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_events where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_authority_revocations where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_authority_events where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_evidence_links where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_questions where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_routes where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_human_priors where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_versions where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_cases where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_decision_evidence_atoms where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_assertions where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_sources where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_audience_grants where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_workspace_roles where workspace_id=${lit(id.workspace)}::uuid;
    delete from public.brain_workspaces where id=${lit(id.workspace)}::uuid;
    delete from auth.identities where user_id in (${lit(id.leader)}::uuid,${lit(id.operator)}::uuid,${lit(id.outsider)}::uuid);
    delete from auth.users where id in (${lit(id.leader)}::uuid,${lit(id.operator)}::uuid,${lit(id.outsider)}::uuid);
    commit;`, { allowFailure: true })
  return dbq(`select jsonb_build_object(
    'workspaces',(select count(*)::int from public.brain_workspaces where id=${lit(id.workspace)}::uuid),
    'reconstruction_runs',(select count(*)::int from public.brain_decision_reconstruction_runs where workspace_id=${lit(id.workspace)}::uuid),
    'sources',(select count(*)::int from public.brain_sources where workspace_id=${lit(id.workspace)}::uuid),
    'candidates',(select count(*)::int from public.brain_decision_answer_candidates where workspace_id=${lit(id.workspace)}::uuid),
    'candidate_evidence_links',(select count(*)::int from public.brain_decision_candidate_evidence_links where workspace_id=${lit(id.workspace)}::uuid),
    'reviews',(select count(*)::int from public.brain_decision_candidate_reviews where workspace_id=${lit(id.workspace)}::uuid),
    'answers',(select count(*)::int from public.brain_decision_answers where workspace_id=${lit(id.workspace)}::uuid),
    'events',(select count(*)::int from public.brain_decision_events where workspace_id=${lit(id.workspace)}::uuid),
    'auth_users',(select count(*)::int from auth.users where id in (${lit(id.leader)}::uuid,${lit(id.operator)}::uuid,${lit(id.outsider)}::uuid))
  ) as result`)[0]?.result
}

let reconstructionSeed = null
if (proveReconstruction) {
  const globalDecisionCounts = dbq(`select jsonb_build_object(
    'cases',(select count(*)::int from public.brain_decision_cases),
    'versions',(select count(*)::int from public.brain_decision_versions),
    'questions',(select count(*)::int from public.brain_decision_questions),
    'candidates',(select count(*)::int from public.brain_decision_answer_candidates),
    'answers',(select count(*)::int from public.brain_decision_answers),
    'reconstruction_runs',(select count(*)::int from public.brain_decision_reconstruction_runs)
  ) as result`)[0]?.result
  expect(globalDecisionCounts && Object.values(globalDecisionCounts).every(value => Number(value) === 0),
    `r151_refused_key_rotation_nonempty_decision_spine:${JSON.stringify(globalDecisionCounts)}`)

  const activeKeyId = `r151-${suffix}`
  const encryptionKey = crypto.randomBytes(32).toString('base64url')
  const integrityKey = crypto.randomBytes(32).toString('base64url')
  const keyring = { [activeKeyId]: encryptionKey }
  runNpx([
    'supabase', 'secrets', 'set', '--project-ref', projectRef,
    `BRAIN_DECISION_ACTIVE_KEY_ID=${activeKeyId}`,
    `BRAIN_DECISION_KEYRING_JSON=${JSON.stringify(keyring)}`,
    `BRAIN_DECISION_INTEGRITY_KEY=${integrityKey}`,
  ], { sensitiveOutput: true })

  const encrypt = (plaintext, recordId, recordKind, field) => encryptBrainDecisionField({
    plaintext,
    context: { workspaceId: id.workspace, subjectId: id.leader, recordId, recordKind, field },
    keyring,
    activeKeyId,
  })
  reconstructionSeed = {
    sourceA: await encrypt(reconstructionPlaintext.sourceA, id.sourceA, 'decision_source', 'content'),
    sourceB: await encrypt(reconstructionPlaintext.sourceB, id.sourceB, 'decision_source', 'content'),
    assertionA: await encrypt(reconstructionPlaintext.sourceA, id.assertionA, 'decision_assertion', 'statement'),
    assertionB: await encrypt(reconstructionPlaintext.sourceB, id.assertionB, 'decision_assertion', 'statement'),
    title: await encrypt(reconstructionPlaintext.title, id.version, 'decision_version', 'title'),
    stakes: await encrypt(reconstructionPlaintext.stakes, id.version, 'decision_version', 'stakes'),
    prior: await encrypt(reconstructionPlaintext.prior, id.prior, 'decision_human_prior', 'position'),
    question: await encrypt(reconstructionPlaintext.question, id.questionA, 'decision_question', 'prompt'),
  }
}

let primaryError = null
let output = null
try {
  dbq(`begin;
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
      reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,is_super_admin,is_sso_user,is_anonymous,created_at,updated_at)
    values ${authRow(id.leader,email.leader)},${authRow(id.operator,email.operator)},${authRow(id.outsider,email.outsider)};
    insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values ${identityRow(id.leader,email.leader)},${identityRow(id.operator,email.operator)},${identityRow(id.outsider,email.outsider)};
    insert into public.brain_workspaces(id,subject_id,owner_id,tenant_key,workspace_kind,lifecycle_state)
    values (${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,${lit(id.leader)}::uuid,${lit(`r146-${suffix}`)},'personal','active');
    insert into public.brain_workspace_roles(workspace_id,user_id,role,granted_by,granted_at)
    values (${lit(id.workspace)}::uuid,${lit(id.operator)}::uuid,'operator',${lit(id.leader)}::uuid,now());
    insert into public.brain_audience_grants(id,workspace_id,grantee_user_id,audience,purpose,granted_by,granted_at,expires_at)
    values (${lit(id.grant)}::uuid,${lit(id.workspace)}::uuid,${lit(id.operator)}::uuid,'delivery_team_private','operator_decision_preparation',${lit(id.leader)}::uuid,now(),now()+interval '1 day');

    create or replace function private.r146_cipher(p_record_id uuid,p_kind text,p_field text,p_payload text)
    returns text language sql immutable strict set search_path=''
    as \$\$ select jsonb_build_object(
      'v',1,'alg','A256GCM','kid','r146.seed-key','iv','AAAAAAAAAAAAAAAA',
      'ciphertext',replace(encode(convert_to(p_payload||repeat('x',16),'UTF8'),'base64'),E'\\n',''),
      'aad_sha256',private.brain_decision_cipher_aad_sha256(${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,p_record_id,p_kind,p_field)
    )::text \$\$;

    insert into public.brain_sources(id,workspace_id,subject_id,source_type,captured_at,purpose,audience,integrity_sha256,external_locator,content_ciphertext,encryption_version,created_by)
    values
      (${lit(id.sourceA)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'document',now()-interval '20 minutes','operator_decision_preparation','delivery_team_private',repeat('a',64),'r146-seed:a',${lit(reconstructionSeed?.sourceA ?? 'seed-source-a')},1,${lit(id.leader)}::uuid),
      (${lit(id.sourceB)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'document',now()-interval '20 minutes','operator_decision_preparation','delivery_team_private',repeat('b',64),'r146-seed:b',${lit(reconstructionSeed?.sourceB ?? 'seed-source-b')},1,${lit(id.leader)}::uuid);
    insert into public.brain_assertions(id,workspace_id,subject_id,source_id,epistemic_basis,audience,statement_ciphertext,encryption_version,source_span_sha256,valid_at,created_by)
    values
      (${lit(id.assertionA)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,${lit(id.sourceA)}::uuid,'user_stated','delivery_team_private',${lit(reconstructionSeed?.assertionA ?? 'seed-assertion-a')},1,repeat('c',64),now()-interval '20 minutes',${lit(id.leader)}::uuid),
      (${lit(id.assertionB)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,${lit(id.sourceB)}::uuid,'observed','delivery_team_private',${lit(reconstructionSeed?.assertionB ?? 'seed-assertion-b')},1,repeat('d',64),now()-interval '20 minutes',${lit(id.leader)}::uuid);
    insert into public.brain_decision_cases(id,workspace_id,subject_id,owner_id,status,opened_at,created_by)
    values (${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,${lit(id.leader)}::uuid,'active',now()-interval '30 minutes',${lit(id.leader)}::uuid);
    commit;`)

  const atoms = dbq(`select
    private.brain_decision_materialize_evidence_atom(${lit(id.assertionA)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid) as atom_a,
    private.brain_decision_materialize_evidence_atom(${lit(id.assertionB)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid) as atom_b`)[0]
  expect(atoms?.atom_a && atoms?.atom_b, 'r146_seed_atoms_missing')

  dbq(`begin;
    insert into public.brain_decision_versions(id,decision_id,workspace_id,subject_id,version,standing,title_ciphertext,stakes_ciphertext,provisional_view_ciphertext,analysis_ciphertext,encryption_version,source_watermark_sha256,generated_at,fresh_until,created_by)
    values (${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,1,'draft',
      ${reconstructionSeed ? lit(reconstructionSeed.title) : `private.r146_cipher(${lit(id.version)}::uuid,'decision_version','title','Pilot decision')`},
      ${reconstructionSeed ? lit(reconstructionSeed.stakes) : `private.r146_cipher(${lit(id.version)}::uuid,'decision_version','stakes','Consequential stakes')`},
      private.r146_cipher(${lit(id.version)}::uuid,'decision_version','provisional_view','Leader prior'),
      private.r146_cipher(${lit(id.version)}::uuid,'decision_version','analysis','Source-grounded analysis'),
      1,repeat('e',64),now(),now()+interval '1 day',${lit(id.leader)}::uuid);
    insert into public.brain_decision_human_priors(id,decision_version_id,decision_id,workspace_id,subject_id,position_ciphertext,rationale_ciphertext,encryption_version,content_sha256,source_assertion_id,source_evidence_atom_id,recorded_by,recorded_at)
    values (${lit(id.prior)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,
      ${reconstructionSeed ? lit(reconstructionSeed.prior) : `private.r146_cipher(${lit(id.prior)}::uuid,'decision_human_prior','position','Pilot now')`},
      private.r146_cipher(${lit(id.prior)}::uuid,'decision_human_prior','rationale','Reasoned prior'),
      1,repeat('0',64),${lit(id.assertionA)}::uuid,${lit(atoms.atom_a)}::uuid,${lit(id.leader)}::uuid,now());
    insert into public.brain_decision_routes(id,decision_version_id,decision_id,workspace_id,subject_id,route_order,tab_label_ciphertext,content_ciphertext,encryption_version,content_sha256,is_default,is_recommended)
    values
      (${lit(id.routeA)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,1,private.r146_cipher(${lit(id.routeA)}::uuid,'decision_route','tab_label','Route one'),private.r146_cipher(${lit(id.routeA)}::uuid,'decision_route','content','First route'),1,repeat('0',64),true,true),
      (${lit(id.routeB)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,2,private.r146_cipher(${lit(id.routeB)}::uuid,'decision_route','tab_label','Route two'),private.r146_cipher(${lit(id.routeB)}::uuid,'decision_route','content','Second route'),1,repeat('0',64),false,false),
      (${lit(id.routeC)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,3,private.r146_cipher(${lit(id.routeC)}::uuid,'decision_route','tab_label','Route three'),private.r146_cipher(${lit(id.routeC)}::uuid,'decision_route','content','Third route'),1,repeat('0',64),false,false);
    insert into public.brain_decision_questions(id,decision_version_id,decision_id,route_id,workspace_id,subject_id,question_order,kind,answer_mode,prompt_ciphertext,guidance_ciphertext,encryption_version,content_sha256,operator_state)
    values
      (${lit(id.questionA)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.routeA)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,1,'leader_can_answer','voice_or_text',${reconstructionSeed ? lit(reconstructionSeed.question) : `private.r146_cipher(${lit(id.questionA)}::uuid,'decision_question','prompt','Question one')`},private.r146_cipher(${lit(id.questionA)}::uuid,'decision_question','guidance','Be specific'),1,repeat('0',64),'asked'),
      (${lit(id.questionB)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.routeB)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,2,'leader_can_answer','voice_or_text',private.r146_cipher(${lit(id.questionB)}::uuid,'decision_question','prompt','Question two'),private.r146_cipher(${lit(id.questionB)}::uuid,'decision_question','guidance','Be specific'),1,repeat('0',64),'asked'),
      (${lit(id.questionC)}::uuid,${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.routeC)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,3,'leader_can_answer','voice_or_text',private.r146_cipher(${lit(id.questionC)}::uuid,'decision_question','prompt','Question three'),private.r146_cipher(${lit(id.questionC)}::uuid,'decision_question','guidance','Be specific'),1,repeat('0',64),'asked');
    insert into public.brain_decision_evidence_links(decision_version_id,decision_id,workspace_id,subject_id,artifact_kind,artifact_id,assertion_id,stance,linked_by)
    values
      (${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'current_read',${lit(id.version)}::uuid,${lit(id.assertionA)}::uuid,'supports',${lit(id.leader)}::uuid),
      (${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'recommended_move',${lit(id.version)}::uuid,${lit(id.assertionA)}::uuid,'context',${lit(id.leader)}::uuid),
      ${[id.routeA,id.routeB,id.routeC].flatMap(route => [
        `(${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'route',${lit(route)}::uuid,${lit(id.assertionA)}::uuid,'supports',${lit(id.leader)}::uuid)`,
        `(${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'route',${lit(route)}::uuid,${lit(id.assertionB)}::uuid,'refutes',${lit(id.leader)}::uuid)`,
      ]).join(',')},
      ${[id.questionA,id.questionB,id.questionC].map(question =>
        `(${lit(id.version)}::uuid,${lit(id.case)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,'question',${lit(question)}::uuid,${lit(id.assertionA)}::uuid,'context',${lit(id.leader)}::uuid)`
      ).join(',')};
    insert into public.brain_decision_authority_events(id,decision_id,decision_version_id,workspace_id,subject_id,owner_id,event_kind,audience,purpose,actor_user_id,input_sha256,occurred_at,valid_until)
    select ${lit(id.authority)}::uuid,${lit(id.case)}::uuid,${lit(id.version)}::uuid,${lit(id.workspace)}::uuid,${lit(id.leader)}::uuid,${lit(id.leader)}::uuid,
      'seal_analysis','delivery_team_private','operator_decision_preparation',${lit(id.leader)}::uuid,
      private.brain_decision_snapshot_sha256(${lit(id.version)}::uuid),now(),now()+interval '1 day';
    drop function private.r146_cipher(uuid,text,text,text);
    commit;`)
  dbq(`begin; set local role service_role;
    select public.seal_brain_decision_version_v1(${lit(id.version)}::uuid,${lit(id.authority)}::uuid,repeat('e',64),'r146-seal');
    commit;`)

  const [leaderToken, operatorToken, outsiderToken] = await Promise.all([
    signIn(email.leader), signIn(email.operator), signIn(email.outsider),
  ])
  const capturedAt = new Date(Date.now() - 60_000).toISOString()
  const candidateRequest = {
    action: proveGroundedCandidate ? 'stage_grounded_candidate' : 'stage_candidate',
    questionId: id.questionA, sourceType: 'external',
    sourceText: 'Public evidence indicates the category is moving faster than the current operating plan assumes.',
    candidateText: 'The current plan may understate the speed of category change.',
    capturedAt, idempotencyKey: `r146:candidate:${suffix}:one`,
    ...(proveGroundedCandidate ? {
      evidenceRefs: [
        { evidenceAtomId: atoms.atom_a, stance: 'supports' },
        { evidenceAtomId: atoms.atom_b, stance: 'refutes' },
      ],
    } : {}),
  }
  let staged
  let candidateOne
  let candidateClaim = candidateRequest.candidateText
  let candidateSourceText = candidateRequest.sourceText
  let candidateEvidenceAtom
  let reconstructionProof = null
  if (proveReconstruction) {
    const reconstructionRequest = {
      questionId: id.questionA,
      idempotencyKey: `r151:reconstruct:${suffix}`,
    }
    const directPrimitive = await rpc(operatorToken, 'begin_brain_decision_reconstruction_v1', {
      p_run_id: crypto.randomUUID(),
      p_question_id: id.questionA,
      p_idempotency_key: `r151:direct-rpc:${suffix}`,
      p_provider: 'openai',
      p_model_requested: 'gpt-5.6-sol',
      p_prompt_version: 'r151.v3',
      p_schema_version: 'r150.v1',
    })
    expect(directPrimitive.status >= 400,
      `r151_authenticated_database_primitive_exposed:${directPrimitive.status}`)
    const reconstructed = await invokeFunction('decision-reconstruct-v1', operatorToken, reconstructionRequest)
    expect(reconstructed.status === 201 && reconstructed.body?.status === 'created',
      `r151_reconstruction_failed:${JSON.stringify(reconstructed)}`)
    expect(reconstructed.body?.result?.status === 'candidate' && reconstructed.body?.candidateId,
      `r151_reconstruction_did_not_create_candidate:${JSON.stringify(reconstructed.body?.result)}`)
    candidateOne = reconstructed.body.candidateId
    candidateClaim = reconstructed.body.result.claim

    const replayedReconstruction = await invokeFunction('decision-reconstruct-v1', operatorToken, reconstructionRequest)
    expect(replayedReconstruction.status === 200 && replayedReconstruction.body?.status === 'replayed',
      `r151_reconstruction_replay_failed:${JSON.stringify(replayedReconstruction)}`)
    expect(replayedReconstruction.body?.runId === reconstructed.body.runId &&
      replayedReconstruction.body?.candidateId === candidateOne &&
      replayedReconstruction.body?.receipt?.responseId === reconstructed.body?.receipt?.responseId,
    'r151_reconstruction_replay_receipt_changed')

    const conflictReconstruction = await invokeFunction('decision-reconstruct-v1', operatorToken, {
      questionId: id.questionB,
      idempotencyKey: reconstructionRequest.idempotencyKey,
    })
    expect(conflictReconstruction.status === 409,
      `r151_reconstruction_changed_retry_not_rejected:${conflictReconstruction.status}`)
    const outsiderReconstruction = await invokeFunction('decision-reconstruct-v1', outsiderToken, {
      questionId: id.questionA,
      idempotencyKey: `r151:outsider:${suffix}`,
    })
    expect(outsiderReconstruction.status === 403,
      `r151_reconstruction_cross_workspace_not_denied:${outsiderReconstruction.status}`)

    const reconstructedSource = dbq(`select jsonb_build_object(
      'evidence_atom_id',c.source_evidence_atom_id
    ) as result
    from public.brain_decision_answer_candidates c
    where c.id=${lit(candidateOne)}::uuid`)[0]?.result
    candidateEvidenceAtom = reconstructedSource?.evidence_atom_id
    reconstructionProof = {
      canonical_server_packet: true,
      direct_database_primitives_denied: true,
      candidate_created: true,
      exact_retry_reused_receipt: true,
      changed_retry_rejected: true,
      cross_workspace_denied: true,
      model: reconstructed.body?.receipt?.modelReturned,
      input_tokens: reconstructed.body?.receipt?.inputTokens,
      output_tokens: reconstructed.body?.receipt?.outputTokens,
      estimated_cost_microusd: reconstructed.body?.receipt?.estimatedCostMicrousd,
    }
  } else {
    staged = await invoke(operatorToken, candidateRequest)
    expect(staged.status === 201 && staged.body?.result?.status === 'created', `r146_stage_failed:${JSON.stringify(staged)}`)
    candidateOne = staged.body.result.candidate_id
    candidateEvidenceAtom = staged.body.result.evidence_atom_id
  }
  expect(counts()?.answers === 0, 'r146_candidate_silently_created_answer')

  let projectionProof = null
  if (proveCandidateProjection) {
    const minimalProjection = await invokeFunction('decision-candidate-projection-v1', leaderToken, {
      candidateId: candidateOne,
    })
    expect(minimalProjection.status === 200, `r147_minimal_projection_failed:${JSON.stringify(minimalProjection)}`)
    expect(minimalProjection.body?.candidate?.claim === candidateClaim, 'r147_candidate_claim_mismatch')
    expect(minimalProjection.body?.candidate?.standing === 'proposed', 'r147_candidate_standing_mismatch')
    expect(minimalProjection.body?.basis === null, 'r147_basis_returned_without_request')

    const basisProjection = await invokeFunction('decision-candidate-projection-v1', leaderToken, {
      candidateId: candidateOne,
      includeBasis: true,
    })
    expect(basisProjection.status === 200, `r147_basis_projection_failed:${JSON.stringify(basisProjection)}`)
    if (proveReconstruction) {
      const parsedSource = JSON.parse(basisProjection.body?.basis?.sourceText ?? '{}')
      expect(parsedSource?.kind === 'decision_reconstruction' && parsedSource?.runId,
        'r151_reconstruction_source_receipt_missing')
      candidateSourceText = basisProjection.body.basis.sourceText
    } else {
      expect(basisProjection.body?.basis?.sourceText === candidateSourceText, 'r147_source_basis_mismatch')
    }
    expect(basisProjection.body?.basis?.epistemicBasis === (proveReconstruction ? 'inferred' : 'external_claim'), 'r147_epistemic_basis_mismatch')

    const outsiderProjection = await invokeFunction('decision-candidate-projection-v1', outsiderToken, {
      candidateId: candidateOne,
    })
    expect(outsiderProjection.status === 403, `r147_projection_cross_workspace_not_denied:${outsiderProjection.status}`)
    projectionProof = {
      minimal_default: true,
      basis_on_demand: true,
      cross_workspace_denied: true,
    }
  }

  if (!proveReconstruction) {
    const replayed = await invoke(operatorToken, candidateRequest)
    expect(replayed.status === 201 && replayed.body?.result?.status === 'replayed' && replayed.body?.result?.candidate_id === candidateOne, 'r146_candidate_replay_failed')
    const conflict = await invoke(operatorToken, { ...candidateRequest, candidateText: 'Different content under the same request key.' })
    expect(conflict.status === 409, `r146_candidate_conflict_not_rejected:${conflict.status}`)
    const outsider = await invoke(outsiderToken, { ...candidateRequest, idempotencyKey: `r146:outsider:${suffix}` })
    expect(outsider.status === 403, `r146_cross_workspace_not_denied:${outsider.status}`)
  }

  let groundingProof = null
  if (proveGroundedCandidate) {
    const linkedEvidence = dbq(`select jsonb_agg(jsonb_build_object(
      'evidence_atom_id',evidence_atom_id,
      'stance',stance
    ) order by evidence_atom_id) as result
    from public.brain_decision_candidate_evidence_links
    where candidate_id=${lit(candidateOne)}::uuid`)[0]?.result ?? []
    expect(linkedEvidence.length === 2, `r148_grounded_link_count_wrong:${JSON.stringify(linkedEvidence)}`)
    expect(linkedEvidence.some(link => link.evidence_atom_id === atoms.atom_a && link.stance === 'supports'), 'r148_support_link_missing')
    expect(linkedEvidence.some(link => link.evidence_atom_id === atoms.atom_b && link.stance === 'refutes'), 'r148_refute_link_missing')

    const missingSupport = await invoke(operatorToken, {
      ...candidateRequest,
      questionId: id.questionB,
      idempotencyKey: `r148:no-support:${suffix}`,
      evidenceRefs: [{ evidenceAtomId: atoms.atom_b, stance: 'context' }],
    })
    expect(missingSupport.status === 400, `r148_missing_support_not_rejected:${missingSupport.status}`)

    const unrelatedAtom = await invoke(operatorToken, {
      ...candidateRequest,
      questionId: id.questionB,
      idempotencyKey: `r148:unrelated:${suffix}`,
      evidenceRefs: [{ evidenceAtomId: candidateEvidenceAtom, stance: 'supports' }],
    })
    expect(unrelatedAtom.status === 409, `r148_unrelated_atom_not_rejected:${unrelatedAtom.status}`)

    const rawLinks = await rest(operatorToken, `brain_decision_candidate_evidence_links?select=*&workspace_id=eq.${id.workspace}`)
    const rawLinksHidden = rawLinks.status >= 400 || (Array.isArray(rawLinks.body) && rawLinks.body.length === 0)
    expect(rawLinksHidden, 'r148_raw_candidate_evidence_links_visible')
    groundingProof = {
      linked_existing_evidence_atoms: 2,
      support_required: true,
      unrelated_candidate_atom_denied: true,
      raw_links_hidden: true,
    }
  }

  const confirmedAt = new Date().toISOString()
  const confirmedRequest = {
    action: 'review_candidate', candidateId: candidateOne, disposition: 'confirmed',
    reviewedAt: confirmedAt, idempotencyKey: `r146:confirm:${suffix}`,
  }
  const confirmed = await invoke(leaderToken, confirmedRequest)
  expect(confirmed.status === 201 && confirmed.body?.result?.candidate_disposition === 'confirmed', `r146_confirm_failed:${JSON.stringify(confirmed)}`)
  const confirmReplay = await invoke(leaderToken, confirmedRequest)
  expect(confirmReplay.status === 201 && confirmReplay.body?.result?.status === 'replayed', 'r146_confirm_replay_failed')

  const direct = await invoke(leaderToken, {
    action: 'answer_question', questionId: id.questionB,
    answer: 'Run the pilot in one region and stop if customer pull does not appear within six weeks.',
    recordedAt: new Date().toISOString(), idempotencyKey: `r146:direct:${suffix}`,
  })
  expect(direct.status === 201 && direct.body?.result?.status === 'created', `r146_direct_answer_failed:${JSON.stringify(direct)}`)

  const stageCorrection = await invoke(operatorToken, {
    action: 'stage_candidate', questionId: id.questionC, sourceType: 'document',
    sourceText: 'The planning paper assumes a single launch wave across all regions.',
    candidateText: 'A single launch wave is the preferred route.', capturedAt,
    idempotencyKey: `r146:candidate:${suffix}:two`,
  })
  expect(stageCorrection.status === 201, 'r146_correction_candidate_stage_failed')
  const corrected = await invoke(leaderToken, {
    action: 'review_candidate', candidateId: stageCorrection.body.result.candidate_id,
    disposition: 'corrected', answer: 'Use two waves, with the second released only after the first clears the quality bar.',
    reviewedAt: new Date().toISOString(), idempotencyKey: `r146:correct:${suffix}`,
  })
  expect(corrected.status === 201 && corrected.body?.result?.candidate_disposition === 'corrected', 'r146_correction_failed')

  const stageRejection = await invoke(operatorToken, {
    action: 'stage_candidate', questionId: id.questionC, sourceType: 'meeting',
    sourceText: 'One participant suggested replacing the whole team before the pilot.',
    candidateText: 'Replace the whole team before testing the operating model.', capturedAt,
    idempotencyKey: `r146:candidate:${suffix}:three`,
  })
  expect(stageRejection.status === 201, 'r146_rejection_candidate_stage_failed')
  const rejected = await invoke(leaderToken, {
    action: 'review_candidate', candidateId: stageRejection.body.result.candidate_id,
    disposition: 'rejected', reviewedAt: new Date().toISOString(),
    idempotencyKey: `r146:reject:${suffix}`,
  })
  expect(rejected.status === 200 && rejected.body?.result?.disposition === 'rejected', 'r146_rejection_failed')

  const raw = await rest(operatorToken, `brain_decision_answer_candidates?select=*&workspace_id=eq.${id.workspace}`)
  const rawHidden = raw.status >= 400 || (Array.isArray(raw.body) && raw.body.length === 0)
  expect(rawHidden, 'r146_raw_candidate_table_visible')

  const finalCounts = counts()
  const expectedCounts = {
    reconstruction_runs: proveReconstruction ? 1 : 0,
    candidates: 3, candidate_evidence_links: proveGroundedCandidate ? 2 : 0,
    reviews: 3, answers: 3, sources: 8, assertions: 8, atoms: 8,
    candidate_events: 6, answer_events: 3,
  }
  expect(
    Object.entries(expectedCounts).every(([key, value]) => Number(finalCounts?.[key]) === value),
    `r146_final_counts_wrong:${JSON.stringify(finalCounts)}`,
  )
  const provenance = dbq(`select jsonb_build_object(
    'candidate_basis',(select epistemic_basis from public.brain_assertions where id=(select source_assertion_id from public.brain_decision_answer_candidates where id=${lit(candidateOne)}::uuid)),
    'answer_basis',(select epistemic_basis from public.brain_assertions where id=(select source_assertion_id from public.brain_decision_answers where id=${lit(confirmed.body.result.answer_id)}::uuid)),
    'confirmed_candidate_answer_count',(select count(*)::int from public.brain_decision_candidate_reviews where candidate_id=${lit(candidateOne)}::uuid and disposition='confirmed' and answer_id is not null)
  ) as result`)[0]?.result
  expect(provenance?.candidate_basis === (proveReconstruction ? 'inferred' : 'external_claim') &&
    provenance?.answer_basis === 'user_stated' && provenance?.confirmed_candidate_answer_count === 1,
  'r146_provenance_boundary_failed')

  output = {
    status: 'passed', project_ref: projectRef, production_contacted: false,
    unauthenticated_status: 401, raw_candidate_table_hidden: true,
    staged_candidate_created_no_answer: true, exact_retry_replayed: true,
    changed_retry_rejected: true, cross_workspace_denied: true,
    confirmed_with_fresh_user_provenance: true, corrected_with_fresh_user_provenance: true,
    rejected_without_answer: true, direct_answer_recorded: true,
    final_counts: finalCounts, provenance,
    ...(projectionProof ? { candidate_projection: projectionProof } : {}),
    ...(groundingProof ? { candidate_grounding: groundingProof } : {}),
    ...(reconstructionProof ? { decision_reconstruction: reconstructionProof } : {}),
  }
} catch (error) {
  primaryError = error
} finally {
  const residue = cleanup()
  if (!residue || Object.values(residue).some(value => Number(value) !== 0)) {
    const cleanupError = new Error(`r146_cleanup_failed:${JSON.stringify(residue)}`)
    primaryError = primaryError
      ? new AggregateError([primaryError, cleanupError], 'r146_probe_and_cleanup_failed')
      : cleanupError
  }
  if (output) output.cleanup = residue
}

if (primaryError) throw primaryError
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
