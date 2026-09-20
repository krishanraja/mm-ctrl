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
const json = async (response) => {
  const text = await response.text()
  try { return JSON.parse(text) } catch { return text }
}

if (projectRef === productionProjectRef) throw new Error('R128 cannot target production')

function runNpx(args, { sensitiveOutput = false } = {}) {
  const run = spawnSync(process.execPath, [npxCli, ...args], {
    encoding: 'utf8',
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
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
if (!publishableKey) throw new Error('R128 could not resolve an in-memory public API key')

const suffix = crypto.randomBytes(6).toString('hex')
const password = `R128-${crypto.randomBytes(24).toString('base64url')}`
const operator = crypto.randomUUID()
const operatorPrincipal = crypto.randomUUID()
const workspaceA = crypto.randomUUID()
const workspaceB = crypto.randomUUID()
const audienceGrant = crypto.randomUUID()
const operatorEmail = `r128-operator-${suffix}@example.invalid`
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
  const body = await json(response)
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
      ...(options.headers ?? {}),
    },
    body: options.body,
    signal: requestSignal(),
  })
  return { status: response.status, body: await json(response) }
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
  return { status: response.status, body: await json(response) }
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
    encoding: 'utf8',
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
    timeout: 15 * 60_000,
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
  if (!review?.id) throw new Error('No real ready owner review packet remained for R128')

  const ownerToken = await signIn(review.email)
  const projected = await rest('rpc/prepare_standard_change_review_v2', ownerToken, {
    method: 'POST',
    body: JSON.stringify({
      p_check_id: review.check_id,
      p_expected_result_sha256: review.result_sha256,
    }),
  })
  if (projected.status !== 200 || projected.body?.review_packet_id !== review.id) {
    throw new Error(`owner_projection_failed:${projected.status}`)
  }
  review = dbq(`select id,packet_sha256,planned_standard_sha256
    from public.standard_change_review_packets
    where id=${lit(review.id)}::uuid and user_id=${lit(ownerA)}::uuid and state='ready'`)[0]

  dbq(`begin;
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
      reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,is_super_admin,is_sso_user,is_anonymous,created_at,updated_at)
    values ${authRow(operator, operatorEmail)};
    insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values ${identityRow(operator, operatorEmail)};
    insert into public.brain_workspaces(id,subject_id,owner_id,tenant_key,lifecycle_state)
    values
      (${lit(workspaceA)}::uuid,${lit(ownerA)}::uuid,${lit(ownerA)}::uuid,${lit(`r128-a-${suffix}`)},'active'),
      (${lit(workspaceB)}::uuid,${lit(ownerB)}::uuid,${lit(ownerB)}::uuid,${lit(`r128-b-${suffix}`)},'active');
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
    update public.standard_change_review_packets set
      workspace_id=${lit(workspaceA)}::uuid,
      subject_id=${lit(ownerA)}::uuid,
      operator_projection_audience='delivery_team_private',
      operator_projection_purpose='standard_change_review_preparation'
    where id=${lit(review.id)}::uuid and user_id=${lit(ownerA)}::uuid and state='ready';
    commit;`)

  const before = dbq(`select json_build_object(
    'head_id',(select id from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'head_sha',(select public.standard_change_text_sha256(body) from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'criteria_sha',public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(ownerA)}::uuid)),
    'packet_state',(select state from public.standard_change_review_packets where id=${lit(review.id)}::uuid),
    'packet_decided_at',(select decided_at from public.standard_change_review_packets where id=${lit(review.id)}::uuid)
  ) as snapshot`)[0].snapshot

  const token = await signIn(operatorEmail)
  const allowed = await rest('rpc/get_operator_pending_standard_change_review_v1', token, {
    method: 'POST', body: JSON.stringify({ p_workspace_id: workspaceA }),
  })
  const nextFields = Object.keys(allowed.body?.next ?? {}).sort()
  const expectedFields = ['consequence', 'headline', 'question', 'ready_since', 'review_packet_id'].sort()
  if (allowed.status !== 200 || allowed.body?.available !== true ||
      allowed.body?.ready_count !== 1 ||
      JSON.stringify(nextFields) !== JSON.stringify(expectedFields) ||
      allowed.body?.next?.review_packet_id !== review.id ||
      JSON.stringify(allowed.body).includes('sha256') ||
      Object.hasOwn(allowed.body?.next ?? {}, 'packet')) {
    const privateReason = dbq(`select reason from public.brain_access_receipts
      where authenticated_user_id=${lit(operator)}::uuid
      order by observed_at desc,id desc limit 1`)[0]?.reason ?? 'missing_receipt'
    throw new Error(`allowed_projection_failed:${JSON.stringify({
      status: allowed.status,
      available: allowed.body?.available,
      reason: allowed.body?.reason,
      private_reason: privateReason,
      ready_count: allowed.body?.ready_count,
      next_fields: nextFields,
      review_id_matches: allowed.body?.next?.review_packet_id === review.id,
      contains_sha256: JSON.stringify(allowed.body).includes('sha256'),
      contains_packet: Object.hasOwn(allowed.body?.next ?? {}, 'packet'),
    })}`)
  }

  const rawPacketRead = await rest(
    `standard_change_review_packets?select=*&id=eq.${review.id}`,
    token,
  )
  const receiptRead = await rest(
    `brain_access_receipts?select=*&authenticated_user_id=eq.${operator}`,
    token,
  )
  const rawPacketHidden = rawPacketRead.status >= 400 ||
    (Array.isArray(rawPacketRead.body) && rawPacketRead.body.length === 0)
  const receiptTableHidden = receiptRead.status >= 400 ||
    (Array.isArray(receiptRead.body) && receiptRead.body.length === 0)
  if (!rawPacketHidden || !receiptTableHidden) {
    throw new Error('operator gained a direct raw-packet or receipt-table path')
  }

  const decisionAttempt = await invoke('review-standard-change', token, {
    action: 'decide',
    review_packet_id: review.id,
    expected_packet_sha256: review.packet_sha256,
    expected_standard_sha256: review.planned_standard_sha256,
    request_id: `r128_operator_decision_${suffix}`,
    decision: 'rejected',
    note: 'An operator must not be able to decide for the owner.',
  })
  if (decisionAttempt.status !== 404) {
    throw new Error(`operator_decision_not_denied:${decisionAttempt.status}`)
  }

  const crossWorkspace = await rest('rpc/get_operator_pending_standard_change_review_v1', token, {
    method: 'POST', body: JSON.stringify({ p_workspace_id: workspaceB }),
  })
  if (crossWorkspace.status !== 200 || crossWorkspace.body?.available !== false ||
      crossWorkspace.body?.reason !== 'not_available' || crossWorkspace.body?.next !== null) {
    throw new Error(`cross_workspace_not_uniform:${crossWorkspace.status}`)
  }

  dbq(`update public.brain_audience_grants set revoked_at=clock_timestamp()
    where id=${lit(audienceGrant)}::uuid and revoked_at is null`)
  const afterRevocation = await rest('rpc/get_operator_pending_standard_change_review_v1', token, {
    method: 'POST', body: JSON.stringify({ p_workspace_id: workspaceA }),
  })
  if (afterRevocation.status !== 200 || afterRevocation.body?.available !== false ||
      afterRevocation.body?.reason !== 'not_available' || afterRevocation.body?.next !== null) {
    throw new Error(`revocation_not_immediate:${afterRevocation.status}`)
  }

  const receipts = dbq(`select outcome,reason,returned_fields,
      receipt_sha256=public.standard_change_json_sha256(receipt_payload) as hash_valid,
      receipt_payload->>'decision_authority_granted' as decision_authority_granted,
      receipt_payload->>'active_standard_mutated' as active_standard_mutated,
      receipt_payload->>'notification_sent' as notification_sent
    from public.brain_access_receipts
    where authenticated_user_id=${lit(operator)}::uuid
    order by observed_at,id`)
  const after = dbq(`select json_build_object(
    'head_id',(select id from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'head_sha',(select public.standard_change_text_sha256(body) from public.generated_artifacts where user_id=${lit(ownerA)}::uuid and kind='standard' order by created_at desc,id desc limit 1),
    'criteria_sha',public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(ownerA)}::uuid)),
    'packet_state',(select state from public.standard_change_review_packets where id=${lit(review.id)}::uuid),
    'packet_decided_at',(select decided_at from public.standard_change_review_packets where id=${lit(review.id)}::uuid)
  ) as snapshot`)[0].snapshot

  const receiptReasons = receipts.map((receipt) => receipt.reason)
  const receiptOutcomes = receipts.map((receipt) => receipt.outcome)
  const receiptFields = receipts.map((receipt) => receipt.returned_fields.length)
  const standardUnchanged = before.head_id === after.head_id &&
    before.head_sha === after.head_sha && before.criteria_sha === after.criteria_sha &&
    after.packet_state === 'ready' && after.packet_decided_at === null
  if (JSON.stringify(receiptReasons) !== JSON.stringify([
    'allowed', 'operator_role_missing', 'audience_grant_revoked',
  ]) || JSON.stringify(receiptOutcomes) !== JSON.stringify(['allowed', 'denied', 'denied']) ||
      JSON.stringify(receiptFields) !== JSON.stringify([5, 0, 0]) ||
      receipts.some((receipt) => receipt.hash_valid !== true ||
        receipt.decision_authority_granted !== 'false' ||
        receipt.active_standard_mutated !== 'false' ||
        receipt.notification_sent !== 'false') || !standardUnchanged) {
    throw new Error('hosted receipt or no-mutation proof failed')
  }

  output = {
    status: 'passed',
    project_ref: projectRef,
    production_project_ref: productionProjectRef,
    production_writes: 0,
    real_owner_candidate_conveyor: true,
    allowed_projection: {
      http_status: allowed.status,
      ready_count: allowed.body.ready_count,
      returned_fields: expectedFields,
      raw_packet_returned: false,
    },
    direct_raw_packet_hidden: rawPacketHidden,
    direct_receipt_table_hidden: receiptTableHidden,
    operator_decision_status: decisionAttempt.status,
    cross_workspace: {
      http_status: crossWorkspace.status,
      public_reason: crossWorkspace.body.reason,
      private_receipt_reason: receiptReasons[1],
    },
    immediate_revocation: {
      http_status: afterRevocation.status,
      public_reason: afterRevocation.body.reason,
      private_receipt_reason: receiptReasons[2],
    },
    receipts: {
      count: receipts.length,
      outcomes: receiptOutcomes,
      returned_field_counts: receiptFields,
      hashes_valid: true,
      append_only_table_hidden_from_operator: true,
    },
    owner_standard_unchanged: standardUnchanged,
    decision_authority_granted: false,
    active_standard_mutated: false,
    notification_sent: false,
  }
} catch (error) {
  primaryError = error
} finally {
  if (ownerA && ownerB) {
    dbq(`begin;
      delete from public.brain_access_receipts
      where authenticated_user_id=${lit(operator)}::uuid
         or selected_workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid);
      update public.standard_change_review_packets set
        workspace_id=null,subject_id=null,
        operator_projection_audience=null,operator_projection_purpose=null
      where user_id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid);
      delete from public.brain_audience_grants
      where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid);
      delete from public.brain_workspace_roles
      where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid);
      delete from public.brain_workspaces
      where id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid);
      delete from private.brain_operator_auth_links
      where operator_principal_id=${lit(operatorPrincipal)}::uuid or user_id=${lit(operator)}::uuid;
      delete from private.brain_operator_principals where id=${lit(operatorPrincipal)}::uuid;
      delete from auth.users
      where id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid,${lit(operator)}::uuid);
      commit;`, { allowFailure: false })

    const cleanup = dbq(`select json_build_object(
      'auth_users',(select count(*) from auth.users where id in (${lit(ownerA)}::uuid,${lit(ownerB)}::uuid,${lit(operator)}::uuid)),
      'operator_principals',(select count(*) from private.brain_operator_principals where id=${lit(operatorPrincipal)}::uuid),
      'operator_auth_links',(select count(*) from private.brain_operator_auth_links where operator_principal_id=${lit(operatorPrincipal)}::uuid or user_id=${lit(operator)}::uuid),
      'workspaces',(select count(*) from public.brain_workspaces where id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid)),
      'roles',(select count(*) from public.brain_workspace_roles where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid)),
      'grants',(select count(*) from public.brain_audience_grants where workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid)),
      'access_receipts',(select count(*) from public.brain_access_receipts where authenticated_user_id=${lit(operator)}::uuid or selected_workspace_id in (${lit(workspaceA)}::uuid,${lit(workspaceB)}::uuid)),
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
