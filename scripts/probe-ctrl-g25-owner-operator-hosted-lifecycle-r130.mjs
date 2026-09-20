import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import { join } from 'node:path'

const root = process.cwd()
const projectRef = 'cgkcplcamsijghalintq'
const productionProjectRef = 'bkyuxvschuwngtcdhsyg'
const url = `https://${projectRef}.supabase.co`
const npxCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js'
const requestSignal = () => AbortSignal.timeout(60_000)
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`

if (projectRef === productionProjectRef) throw new Error('R130 cannot target production')

const parseBody = async (response) => {
  const text = await response.text()
  try { return JSON.parse(text) } catch { return text }
}

function runNpx(args, { sensitiveOutput = false } = {}) {
  const run = spawnSync(process.execPath, [npxCli, ...args], {
    encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024,
  })
  if (run.status !== 0) {
    if (sensitiveOutput) throw new Error('Supabase credential discovery failed')
    const detail = `${run.error?.message ?? ''}\n${run.stderr ?? ''}\n${run.stdout ?? ''}`
      .trim().slice(0, 1_500)
    throw new Error(`supabase_command_failed:${detail}`)
  }
  return run.stdout
}

function dbq(sql, { allowFailure = false } = {}) {
  const run = spawnSync(process.execPath, [npxCli,
    'supabase', 'db', 'query', '--linked', '--project-ref', projectRef,
    '--output-format', 'json', sql.trim().replace(/\r?\n/g, ' '),
  ], { encoding: 'utf8', cwd: root, maxBuffer: 32 * 1024 * 1024 })
  if (run.status !== 0) {
    const detail = `${run.error?.message ?? ''}\n${run.stderr ?? ''}\n${run.stdout ?? ''}`
      .trim().slice(0, 1_500)
    if (allowFailure) return { failed: true, message: detail }
    throw new Error(`db_query_failed:${detail}`)
  }
  return JSON.parse(run.stdout).rows ?? []
}

const keysRaw = runNpx([
  'supabase', 'projects', 'api-keys', '--project-ref', projectRef,
  '--reveal', '--output-format', 'json',
], { sensitiveOutput: true })
const keysPayload = JSON.parse(keysRaw)
const keys = Array.isArray(keysPayload) ? keysPayload : (keysPayload.apiKeys ?? keysPayload.keys ?? [])
const publishableKey = keys.find((key) => key.type === 'publishable')?.api_key
  ?? keys.find((key) => key.name === 'anon')?.api_key
if (!publishableKey) throw new Error('R130 could not resolve an in-memory public API key')

const suffix = crypto.randomBytes(6).toString('hex')
const password = `R130-${crypto.randomBytes(24).toString('base64url')}`
const operator = crypto.randomUUID()
const operatorPrincipal = crypto.randomUUID()
const workspaceA = crypto.randomUUID()
const workspaceA2 = crypto.randomUUID()
const workspaceB = crypto.randomUUID()
const audienceGrant = crypto.randomUUID()
const operatorEmail = `r130-operator-${suffix}@example.invalid`
const authRow = (id, email) => `(
  '00000000-0000-0000-0000-000000000000',${lit(id)}::uuid,'authenticated','authenticated',${lit(email)},
  extensions.crypt(${lit(password)},extensions.gen_salt('bf')),now(),'','','','','','','',
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false,false,now(),now())`
const identityRow = (id, email) => `(
  gen_random_uuid(),${lit(id)},${lit(id)}::uuid,
  jsonb_build_object('sub',${lit(id)},'email',${lit(email)},'email_verified',true),
  'email',now(),now(),now())`

async function signIn(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: requestSignal(),
  })
  const body = await parseBody(response)
  if (!response.ok || !body?.access_token) throw new Error(`sign_in_failed:${response.status}`)
  return body.access_token
}

async function rest(path, token, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body,
    signal: requestSignal(),
  })
  return { status: response.status, body: await parseBody(response) }
}

async function invoke(name, token, body) {
  const response = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: requestSignal(),
  })
  return { status: response.status, body: await parseBody(response) }
}

let ownerA = null
let ownerB = null
let review = null
let output = {}
let primaryError = null

try {
  const ownerProbe = spawnSync(process.execPath, [
    join(root, 'scripts/probe-ctrl-g25-standard-change-owner-r116.mjs'),
  ], {
    encoding: 'utf8', cwd: root, maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60_000,
    env: {
      ...process.env,
      CTRL_PROBE_SUPABASE_PROJECT_REF: projectRef,
      CTRL_PROBE_SUPABASE_URL: url,
      CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      CTRL_PROBE_FIXTURE_PASSWORD: password,
      CTRL_PROBE_KEEP_FIXTURE: '1',
    },
  })
  if (ownerProbe.status !== 0) {
    const detail = `${ownerProbe.error?.message ?? ''}\n${ownerProbe.stderr ?? ''}`.trim().slice(0, 1_500)
    throw new Error(`r116_fixture_failed:${detail}`)
  }
  const ownerResult = JSON.parse(ownerProbe.stdout)
  ownerA = ownerResult.fixture?.user_a ?? null
  ownerB = ownerResult.fixture?.user_b ?? null
  if (!ownerA || !ownerB || ownerResult.prepared_count !== 3) {
    throw new Error('R116 did not return the complete retained owner fixture')
  }

  review = dbq(`select review.id,review.check_id,review.packet_sha256,
      review.planned_standard_sha256,checked.result_sha256,auth_user.email
    from public.standard_change_review_packets review
    join public.standard_change_checks checked
      on checked.id=review.check_id and checked.user_id=review.user_id
    join auth.users auth_user on auth_user.id=review.user_id
    where review.user_id=${lit(ownerA)}::uuid and review.state='ready'
    order by review.created_at asc,review.id asc limit 1`)[0]
  const ownerBEmail = dbq(`select email from auth.users where id=${lit(ownerB)}::uuid`)[0]?.email
  if (!review?.id || !ownerBEmail) throw new Error('Owner fixture is incomplete')

  dbq(`insert into public.brain_workspaces(id,subject_id,owner_id,tenant_key,lifecycle_state)
    values
      (${lit(workspaceA)}::uuid,${lit(ownerA)}::uuid,${lit(ownerA)}::uuid,${lit(`r130-a-${suffix}`)},'active'),
      (${lit(workspaceA2)}::uuid,${lit(ownerA)}::uuid,${lit(ownerA)}::uuid,${lit(`r130-a2-${suffix}`)},'active'),
      (${lit(workspaceB)}::uuid,${lit(ownerB)}::uuid,${lit(ownerB)}::uuid,${lit(`r130-b-${suffix}`)},'active')`)

  const ownerToken = await signIn(review.email)
  const ownerBToken = await signIn(ownerBEmail)
  const bindBody = JSON.stringify({
    p_check_id: review.check_id,
    p_expected_result_sha256: review.result_sha256,
    p_workspace_id: workspaceA,
  })
  const firstBinding = await rest(
    'rpc/prepare_and_bind_standard_change_operator_projection_v1', ownerToken,
    { method: 'POST', body: bindBody },
  )
  if (firstBinding.status !== 200 || firstBinding.body?.review_packet_id !== review.id ||
      firstBinding.body?.idempotent !== false || firstBinding.body?.presentation_complete !== true ||
      firstBinding.body?.operator_access_granted !== false ||
      firstBinding.body?.decision_authority_granted !== false ||
      firstBinding.body?.active_standard_mutated !== false ||
      firstBinding.body?.notification_sent !== false) {
    throw new Error(`owner_binding_failed:${firstBinding.status}`)
  }

  const firstState = dbq(`select workspace_id,subject_id,operator_projection_audience,
      operator_projection_purpose,operator_projection_bound_at,operator_projection_bound_by,
      packet_sha256,planned_standard_sha256,
      packet->'presentation'->>'schema' as presentation_schema,
      packet->'presentation'->>'question' as question,
      packet->'presentation'->>'headline' as headline,
      packet->'presentation'->>'consequence' as consequence
    from public.standard_change_review_packets
    where id=${lit(review.id)}::uuid and user_id=${lit(ownerA)}::uuid`)[0]
  const preProvision = dbq(`select json_build_object(
    'roles',(select count(*) from public.brain_workspace_roles where workspace_id=${lit(workspaceA)}::uuid),
    'grants',(select count(*) from public.brain_audience_grants where workspace_id=${lit(workspaceA)}::uuid)
  ) as counts`)[0].counts

  const retry = await rest(
    'rpc/prepare_and_bind_standard_change_operator_projection_v1', ownerToken,
    { method: 'POST', body: bindBody },
  )
  const retriedBoundAt = dbq(`select operator_projection_bound_at from public.standard_change_review_packets
    where id=${lit(review.id)}::uuid`)[0]?.operator_projection_bound_at
  const rebind = await rest(
    'rpc/prepare_and_bind_standard_change_operator_projection_v1', ownerToken,
    { method: 'POST', body: JSON.stringify({
      p_check_id: review.check_id,
      p_expected_result_sha256: review.result_sha256,
      p_workspace_id: workspaceA2,
    }) },
  )
  const crossOwner = await rest(
    'rpc/prepare_and_bind_standard_change_operator_projection_v1', ownerBToken,
    { method: 'POST', body: bindBody },
  )
  if (retry.status !== 200 || retry.body?.idempotent !== true ||
      retriedBoundAt !== firstState.operator_projection_bound_at ||
      rebind.status < 400 || crossOwner.status < 400) {
    throw new Error('owner binding idempotency or isolation failed')
  }
  if (firstState.workspace_id !== workspaceA || firstState.subject_id !== ownerA ||
      firstState.operator_projection_audience !== 'delivery_team_private' ||
      firstState.operator_projection_purpose !== 'standard_change_review_preparation' ||
      firstState.operator_projection_bound_by !== ownerA ||
      firstState.presentation_schema !== 'ctrl.standard-change.owner-review.presentation.v1' ||
      !firstState.question || !firstState.headline || !firstState.consequence ||
      Number(preProvision.roles) !== 0 || Number(preProvision.grants) !== 0) {
    throw new Error('owner binding scope, presentation or zero-access proof failed')
  }

  const before = dbq(`select json_build_object(
    'head_id',(select id from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'head_sha',(select public.standard_change_text_sha256(body) from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'criteria_sha',public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(ownerA)}::uuid)),
    'packet_state',(select state from public.standard_change_review_packets where id=${lit(review.id)}::uuid)
  ) as snapshot`)[0].snapshot

  dbq(`begin;
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
      reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,is_super_admin,is_sso_user,is_anonymous,created_at,updated_at)
    values ${authRow(operator, operatorEmail)};
    insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values ${identityRow(operator, operatorEmail)};
    insert into private.brain_operator_principals(id) values (${lit(operatorPrincipal)}::uuid);
    insert into private.brain_operator_auth_links(operator_principal_id,user_id)
    values (${lit(operatorPrincipal)}::uuid,${lit(operator)}::uuid);
    insert into public.brain_workspace_roles(workspace_id,user_id,role,granted_by,granted_at)
    values (${lit(workspaceA)}::uuid,${lit(operator)}::uuid,'operator',${lit(ownerA)}::uuid,now());
    insert into public.brain_audience_grants(
      id,workspace_id,grantee_user_id,audience,purpose,granted_by,granted_at,expires_at
    ) values (
      ${lit(audienceGrant)}::uuid,${lit(workspaceA)}::uuid,${lit(operator)}::uuid,
      'delivery_team_private','standard_change_review_preparation',${lit(ownerA)}::uuid,
      now(),now()+interval '1 day'
    );
    commit;`)

  const operatorToken = await signIn(operatorEmail)
  const allowed = await rest('rpc/get_operator_pending_standard_change_review_v1', operatorToken, {
    method: 'POST', body: JSON.stringify({ p_workspace_id: workspaceA }),
  })
  const expectedFields = ['consequence', 'headline', 'question', 'ready_since', 'review_packet_id'].sort()
  const returnedFields = Object.keys(allowed.body?.next ?? {}).sort()
  if (allowed.status !== 200 || allowed.body?.available !== true || allowed.body?.ready_count !== 1 ||
      allowed.body?.next?.review_packet_id !== review.id ||
      JSON.stringify(returnedFields) !== JSON.stringify(expectedFields) ||
      JSON.stringify(allowed.body).includes('sha256') || Object.hasOwn(allowed.body?.next ?? {}, 'packet')) {
    throw new Error(`operator_projection_failed:${allowed.status}`)
  }

  const rawRead = await rest(`standard_change_review_packets?select=*&id=eq.${review.id}`, operatorToken)
  const rawHidden = rawRead.status >= 400 || (Array.isArray(rawRead.body) && rawRead.body.length === 0)
  const decisionAttempt = await invoke('review-standard-change', operatorToken, {
    action: 'decide',
    review_packet_id: review.id,
    expected_packet_sha256: firstState.packet_sha256,
    expected_standard_sha256: firstState.planned_standard_sha256,
    request_id: `r130_operator_decision_${suffix}`,
    decision: 'rejected',
    note: 'An operator must not be able to decide for the owner.',
  })
  const after = dbq(`select json_build_object(
    'head_id',(select id from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'head_sha',(select public.standard_change_text_sha256(body) from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'criteria_sha',public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(ownerA)}::uuid)),
    'packet_state',(select state from public.standard_change_review_packets where id=${lit(review.id)}::uuid)
  ) as snapshot`)[0].snapshot
  const standardUnchanged = before.head_id === after.head_id && before.head_sha === after.head_sha &&
    before.criteria_sha === after.criteria_sha && after.packet_state === 'ready'
  if (!rawHidden || decisionAttempt.status !== 404 || !standardUnchanged) {
    throw new Error('operator secrecy, authority or no-mutation proof failed')
  }

  output = {
    status: 'passed',
    project_ref: projectRef,
    production_project_ref: productionProjectRef,
    production_writes: 0,
    real_owner_candidate_conveyor: true,
    owner_binding: {
      presentation_completed_in_same_transaction: true,
      exact_workspace_subject_audience_purpose: true,
      first_binding_owner_and_time_retained: true,
      exact_retry_idempotent: true,
      first_binding_time_preserved: true,
      cross_workspace_rebind_denied: true,
      cross_owner_denied: true,
      roles_created_by_binding: Number(preProvision.roles),
      grants_created_by_binding: Number(preProvision.grants),
    },
    operator_projection: {
      http_status: allowed.status,
      ready_count: allowed.body.ready_count,
      returned_fields: expectedFields,
      raw_packet_returned: false,
      direct_raw_packet_hidden: rawHidden,
    },
    operator_decision_status: decisionAttempt.status,
    owner_standard_unchanged: standardUnchanged,
    operator_access_granted_by_binding: false,
    decision_authority_granted: false,
    active_standard_mutated: false,
    notification_sent: false,
  }
} catch (error) {
  primaryError = error
} finally {
  if (ownerA && ownerB) {
    try {
      dbq(`begin;
        delete from public.brain_access_receipts
        where authenticated_user_id=${lit(operator)}::uuid
           or selected_workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid);
        update public.standard_change_review_packets set
          workspace_id=null,subject_id=null,
          operator_projection_audience=null,operator_projection_purpose=null,
          operator_projection_bound_at=null,operator_projection_bound_by=null
        where user_id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid);
        delete from public.brain_audience_grants
        where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid);
        delete from public.brain_workspace_roles
        where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid);
        delete from public.brain_workspaces
        where id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid);
        delete from private.brain_operator_auth_links
        where operator_principal_id=${lit(operatorPrincipal)}::uuid or user_id=${lit(operator)}::uuid;
        delete from private.brain_operator_principals where id=${lit(operatorPrincipal)}::uuid;
        delete from auth.users
        where id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid,${lit(operator)}::uuid);
        commit;`)
    } catch (cleanupError) {
      primaryError ??= cleanupError
    }

    const cleanup = dbq(`select json_build_object(
      'auth_users',(select count(*) from auth.users where id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid,${lit(operator)}::uuid)),
      'operator_principals',(select count(*) from private.brain_operator_principals where id=${lit(operatorPrincipal)}::uuid),
      'operator_auth_links',(select count(*) from private.brain_operator_auth_links where operator_principal_id=${lit(operatorPrincipal)}::uuid or user_id=${lit(operator)}::uuid),
      'workspaces',(select count(*) from public.brain_workspaces where id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid)),
      'roles',(select count(*) from public.brain_workspace_roles where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid)),
      'grants',(select count(*) from public.brain_audience_grants where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid)),
      'access_receipts',(select count(*) from public.brain_access_receipts where authenticated_user_id=${lit(operator)}::uuid or selected_workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceA2)}::uuid,${lit(workspaceB)}::uuid)),
      'review_packets',(select count(*) from public.standard_change_review_packets where user_id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid)),
      'candidate_requests',(select count(*) from public.standard_change_requests where user_id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid)),
      'artifacts',(select count(*) from public.generated_artifacts where user_id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid)),
      'criteria',(select count(*) from public.criteria where user_id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid))
    ) as cleanup`)[0].cleanup
    output.cleanup = cleanup
    if (Object.values(cleanup).some((value) => Number(value) !== 0)) {
      primaryError ??= new Error(`cleanup_failed:${JSON.stringify(cleanup)}`)
    }
  }
}

if (primaryError) throw primaryError
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
