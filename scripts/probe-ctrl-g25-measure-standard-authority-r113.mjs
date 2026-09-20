const managementToken = process.env.CTRL_PROBE_SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
if (!managementToken || !/^[a-z0-9]{20}$/.test(projectRef ?? "") || !suffix || !password) {
  console.error("Set exact isolated-project and transient fixture inputs.");
  process.exit(2);
}
const url = `https://${projectRef}.supabase.co`;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const parsed = async (response) => {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
};
async function management(path, init = {}) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${managementToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const body = await parsed(response);
  if (!response.ok) throw new Error(`management:${response.status}:${body?.message ?? "unknown"}`);
  return body;
}
const dbq = (query) => management("/database/query", { method: "POST", body: JSON.stringify({ query }) });

const keys = await management("/api-keys?reveal=true");
const publishableKey = keys.find((key) => key.name === "anon")?.api_key;
if (!publishableKey) throw new Error("isolated project public key unavailable");

async function signIn(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await parsed(response);
  if (!response.ok || !body?.access_token) throw new Error(`sign_in:${response.status}`);
  return body.access_token;
}
async function invoke(token, body, options = {}) {
  const method = options.method ?? "POST";
  const response = await fetch(`${url}/functions/v1/measure-standard`, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.contentType === false ? {} : { "Content-Type": options.contentType ?? "application/json" }),
    },
    body: method === "POST" ? (options.raw ? String(body) : JSON.stringify(body)) : undefined,
  });
  return { response, body: await parsed(response) };
}
async function rest(path, token, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  return { response, body: await parsed(response) };
}
async function waitFor(userId, requestId, terminal = true, timeoutMs = 240_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const rows = await dbq(`select id,stage,status,error,stage_detail from public.harness_runs
      where user_id=${lit(userId)}::uuid and kind='measure' and request_id=${lit(requestId)} limit 1`);
    const row = rows?.[0] ?? null;
    if (row && (terminal ? row.status !== "running" : row.stage === "judging" || row.status !== "running")) return row;
    await new Promise((resolve) => setTimeout(resolve, terminal ? 700 : 100));
  }
  throw new Error(`timeout:${requestId}`);
}

const users = Object.fromEntries(["A", "B", "C"].map((key) => [key, crypto.randomUUID()]));
const emails = Object.fromEntries(Object.keys(users).map((key) => [key, `r113-${key.toLowerCase()}-${suffix}@example.com`]));
const sortA = crypto.randomUUID();
const sortB = crypto.randomUUID();
const sortC = crypto.randomUUID();
const artifactA = crypto.randomUUID();
const artifactB = crypto.randomUUID();
const artifactC = crypto.randomUUID();

const good = (n) => `Owner: Priya. Next action: publish campaign route ${n} to the customer panel on Friday. Outcome: at least ${20 + n} qualified replies within fourteen days.`;
const bad = (n) => `Campaign route ${n} should probably be explored because it feels promising and the team can work out the details later.`;
const training = [good(1), good(2), good(3), bad(1), bad(2), bad(3)];
const targets = Array.from({ length: 10 }, (_, i) => i < 5 ? good(i + 10) : bad(i + 10));

function fixtureSql(userId, sortId, artifactId) {
  const itemRows = [];
  const gradeRows = [];
  let position = 1;
  for (let i = 0; i < training.length; i += 1) {
    const itemId = crypto.randomUUID();
    itemRows.push(`(${lit(itemId)}::uuid,${lit(userId)}::uuid,${lit(sortId)}::uuid,'campaign recommendation',${lit(training[i])},'own',false,${position++})`);
    gradeRows.push(`(${lit(userId)}::uuid,${lit(itemId)}::uuid,${lit(i < 3 ? "send" : "would_not_send")},${lit(i < 3 ? "It names accountability, action and proof." : "It leaves accountability and proof vague.")})`);
  }
  for (let i = 0; i < targets.length; i += 1) {
    const itemId = crypto.randomUUID();
    itemRows.push(`(${lit(itemId)}::uuid,${lit(userId)}::uuid,${lit(sortId)}::uuid,'campaign recommendation',${lit(targets[i])},'peer',true,${position++})`);
    gradeRows.push(`(${lit(userId)}::uuid,${lit(itemId)}::uuid,${lit(i < 5 ? "send" : "would_not_send")},null)`);
  }
  return `
insert into public.harness_runs(id,user_id,kind,surface,status,stage,stage_detail)
values (${lit(sortId)}::uuid,${lit(userId)}::uuid,'sort','campaign recommendation','done','ready','{}'::jsonb);
insert into public.sort_items(id,user_id,session_id,surface,body,origin,held_out,position) values ${itemRows.join(",\n")};
insert into public.sort_grades(user_id,item_id,verdict,why) values ${gradeRows.join(",\n")};
insert into public.criteria(user_id,surface,name,check_text,observable,weight,holds_example,breaks_example,disc_verdict,provenance,version,is_current,disposition)
values (${lit(userId)}::uuid,'campaign recommendation','Accountability becomes observable',
  'The recommendation must name an accountable owner, the next action and a measurable outcome.',
  'owner + next action + numeric outcome','essential',${lit(good(1))},${lit(bad(1))},'keep',
  jsonb_build_object('sort_run_id',${lit(sortId)}::uuid),1,true,'advisory');
insert into public.generated_artifacts(id,user_id,kind,name,body,metadata)
values (${lit(artifactId)}::uuid,${lit(userId)}::uuid,'standard','Campaign recommendation standard',
  '# Campaign recommendation standard\n\nDraft until held-out work is measured.',
  jsonb_build_object('sort_run_id',${lit(sortId)}::uuid,'criteria_version',1,'self_agreement',jsonb_build_object('matched',3,'total',3)));
`;
}

const authRows = Object.keys(users).map((key) => `(
  '00000000-0000-0000-0000-000000000000',${lit(users[key])}::uuid,'authenticated','authenticated',${lit(emails[key])},
  extensions.crypt(${lit(password)},extensions.gen_salt('bf')),now(),'','','','','','','',
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false,false,now(),now())`).join(",\n");
const identityRows = Object.keys(users).map((key) => `(
  gen_random_uuid(),${lit(users[key])},${lit(users[key])}::uuid,
  jsonb_build_object('sub',${lit(users[key])},'email',${lit(emails[key])},'email_verified',true),'email',now(),now(),now())`).join(",\n");
const setupSql = `
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
 confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
 reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,is_super_admin,is_sso_user,is_anonymous,created_at,updated_at)
values ${authRows};
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at) values ${identityRows};
${fixtureSql(users.A, sortA, artifactA)}
${fixtureSql(users.B, sortB, artifactB)}
${fixtureSql(users.C, sortC, artifactC)}
`;

let output = {};
try {
  await dbq(setupSql);
  const [tokenA, tokenB, tokenC] = await Promise.all([signIn(emails.A), signIn(emails.B), signIn(emails.C)]);
  const requestA = `r113_primary_${suffix}`;
  const payloadA = { request_id: requestA, sort_run_id: sortA, standard_artifact_id: artifactA };

  const anonymous = await invoke(null, payloadA);
  const wrongMethod = await invoke(tokenA, {}, { method: "GET" });
  const wrongMedia = await invoke(tokenA, "{}", { raw: true, contentType: "text/plain" });
  const oversized = await invoke(tokenA, JSON.stringify({ ...payloadA, padding: "x".repeat(9_000) }), { raw: true });
  const extra = await invoke(tokenA, { ...payloadA, user_id: users.B });
  const directRpc = await rest("rpc/reserve_measure_standard_run", tokenA, {
    method: "POST",
    body: JSON.stringify({
      p_request_id: `r113_direct_${suffix}`, p_request_fingerprint: "a".repeat(64),
      p_sort_run_id: sortA, p_standard_artifact_id: artifactA, p_capability: "not-private",
    }),
  });

  const first = await invoke(tokenA, payloadA);
  const primary = await waitFor(users.A, requestA);
  const retry = await invoke(tokenA, payloadA);
  const conflict = await invoke(tokenA, { ...payloadA, standard_artifact_id: artifactC });
  const measurementRows = await dbq(`select m.label,m.held_out_graded,m.metrics,m.confusion,
    (select count(*) from public.ai_usage_audit u where u.user_id=${lit(users.A)}::uuid and u.function_name='measure-standard' and u.metadata->>'run_id'=m.run_id::text)::int as usage
    from public.standard_measurements m where m.run_id=${lit(primary.id)}::uuid`);
  const crossTenant = await rest(`standard_measurements?run_id=eq.${primary.id}&select=id`, tokenB);

  await dbq(`insert into public.harness_runs(user_id,kind,status,stage,request_id,stage_detail)
    values (${lit(users.A)}::uuid,'measure','failed','failed',${lit(`r113_limit_seed_${suffix}`)},'{}'::jsonb)`);
  const overRunLimit = await invoke(tokenA, { ...payloadA, request_id: `r113_limit_${suffix}` });
  await dbq(`insert into public.ai_usage_audit(user_id,function_name,provider,model,purpose,status,est_cost_usd,metadata)
    values (${lit(users.B)}::uuid,'r113-probe','unknown','probe','spend-gate','ok',10,'{}'::jsonb)`);
  const overSpend = await invoke(tokenB, { request_id: `r113_spend_${suffix}`, sort_run_id: sortB, standard_artifact_id: artifactB });

  void tokenC;
  const requestC = `r113_stale_${suffix}`;
  const staleRunId = crypto.randomUUID();
  await dbq(`insert into public.harness_runs(id,user_id,kind,surface,status,stage,request_id,stage_detail)
    values (${lit(staleRunId)}::uuid,${lit(users.C)}::uuid,'measure','campaign recommendation','running','finalizing',${lit(requestC)},
      jsonb_build_object('sort_run_id',${lit(sortC)}::uuid,'standard_artifact_id',${lit(artifactC)}::uuid,
        'source_snapshot',public.current_standard_measurement_source_snapshot(${lit(users.C)}::uuid,${lit(sortC)}::uuid,${lit(artifactC)}::uuid)));
    update public.sort_items set body=body || ' Source changed during measurement.'
      where id=(select id from public.sort_items where session_id=${lit(sortC)}::uuid and held_out=true order by position limit 1);
    do $$
    declare v_predictions jsonb; v_secret text; v_refused boolean := false;
    begin
      select jsonb_agg(jsonb_build_object('item_id',si.id,'gate','insufficient','scored_criteria',0,'exemplar_ids','[]'::jsonb) order by si.position)
        into v_predictions
      from public.sort_items si join public.sort_grades sg on sg.item_id=si.id
      where si.session_id=${lit(sortC)}::uuid and si.held_out=true and si.repeat_of is null
        and sg.verdict in ('send','would_not_send');
      select decrypted_secret into v_secret from vault.decrypted_secrets where name='measure_standard_rpc_secret' limit 1;
      perform set_config('request.jwt.claim.sub',${lit(users.C)},true);
      begin
        perform public.finish_measure_standard_run(${lit(staleRunId)}::uuid,v_predictions,v_secret,false);
      exception when serialization_failure then
        v_refused := true;
      end;
      if not v_refused then raise exception 'stale finalizer unexpectedly accepted changed source'; end if;
      update public.harness_runs set status='failed',stage='failed',error='source_changed_retry'
        where id=${lit(staleRunId)}::uuid;
    end $$;`);
  const staleRows = await dbq(`select status,stage,error,stage_detail from public.harness_runs where id=${lit(staleRunId)}::uuid`);
  const stale = staleRows?.[0] ?? {};
  const staleMeasurements = await dbq(`select count(*)::int as count from public.standard_measurements where run_id=${lit(staleRunId)}::uuid`);

  output = {
    anonymous_status: anonymous.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    oversized_status: oversized.response.status,
    extra_field_status: extra.response.status,
    direct_rpc_status: directRpc.response.status,
    first_status: first.response.status,
    first_stage: first.body?.stage ?? null,
    primary_status: primary.status,
    primary_stage: primary.stage,
    primary_has_result: Boolean(primary.stage_detail?.result),
    primary_measurement: measurementRows?.[0] ?? null,
    retry_status: retry.response.status,
    retry_idempotent: retry.body?.idempotent === true,
    retry_same_run: retry.body?.run_id === first.body?.run_id,
    conflict_status: conflict.response.status,
    conflict_error: conflict.body?.error ?? null,
    cross_tenant_rows: Array.isArray(crossTenant.body) ? crossTenant.body.length : -1,
    run_limit_status: overRunLimit.response.status,
    run_limit_error: overRunLimit.body?.error ?? null,
    spend_limit_status: overSpend.response.status,
    spend_limit_error: overSpend.body?.error ?? null,
    stale_finalizer_exercised: true,
    stale_status: stale.status,
    stale_stage: stale.stage,
    stale_error: stale.error,
    stale_has_result: Boolean(stale.stage_detail?.result),
    stale_measurements: staleMeasurements?.[0]?.count ?? -1,
  };
} finally {
  const ids = Object.values(users).map((id) => `${lit(id)}::uuid`).join(",");
  await dbq(`delete from public.ai_usage_audit where user_id in (${ids}); delete from auth.users where id in (${ids});`).catch(() => undefined);
  const cleanup = await dbq(`select
    (select count(*) from auth.users where id in (${ids}))::int as auth_users,
    (select count(*) from public.harness_runs where user_id in (${ids}))::int as runs,
    (select count(*) from public.standard_measurements where user_id in (${ids}))::int as measurements,
    (select count(*) from public.ai_usage_audit where user_id in (${ids}))::int as usage`);
  output.cleanup = cleanup?.[0] ?? {};
  console.log(JSON.stringify(output));
}
