const managementToken = process.env.CTRL_PROBE_SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF;
const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
if (!managementToken || !projectRef || !url || !publishableKey || !password || !suffix) {
  console.error("Set the isolated project, public key and transient fixture identity inputs.");
  process.exit(2);
}
if (!/^[a-z0-9]{20}$/.test(projectRef) || url !== `https://${projectRef}.supabase.co`) {
  console.error("The probe target is not exact.");
  process.exit(2);
}

const userIds = ["A", "B", "C", "D", "E"].map(() => crypto.randomUUID());
const [userAId, userBId, userCId, userDId, userEId] = userIds;
const emails = Object.fromEntries(
  ["A", "B", "C", "D", "E"].map((key) => [key, `r112-${key.toLowerCase()}-${suffix}@example.com`]),
);
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = async (response) => {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
};

async function dbq(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${managementToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await json(response);
  if (!response.ok) throw new Error(`management_sql:${response.status}:${body?.message ?? "unknown"}`);
  return body;
}

async function signIn(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await json(response);
  if (!response.ok || !body?.access_token) {
    throw new Error(`sign_in:${response.status}:${body?.error_code ?? "unknown"}`);
  }
  return body.access_token;
}

async function invoke(token, body, { method = "POST", contentType = "application/json", raw = false } = {}) {
  const response = await fetch(`${url}/functions/v1/critique-artefact`, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body: method === "POST" ? (raw ? String(body) : JSON.stringify(body)) : undefined,
  });
  return { response, body: await json(response) };
}

async function rest(path, token, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  return { response, body: await json(response) };
}

async function waitForRun(userId, requestId, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await dbq(`select id,stage,status,error,stage_detail from public.harness_runs
      where user_id=${lit(userId)}::uuid and kind='critique' and request_id=${lit(requestId)} limit 1`);
    const row = rows?.[0] ?? null;
    if (row && row.status !== "running") return row;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`run_timeout:${requestId}`);
}

async function waitForStage(userId, requestId, stages, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await dbq(`select id,stage,status,error from public.harness_runs
      where user_id=${lit(userId)}::uuid and kind='critique' and request_id=${lit(requestId)} limit 1`);
    const row = rows?.[0] ?? null;
    if (row && stages.includes(row.stage)) return row;
    if (row && row.status !== "running") return row;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`stage_timeout:${requestId}`);
}

const authRows = [
  [userAId, emails.A], [userBId, emails.B], [userCId, emails.C],
  [userDId, emails.D], [userEId, emails.E],
];
const setupSql = `
insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user,
  is_anonymous, created_at, updated_at
) values
${authRows.map(([id, email]) => `(
  '00000000-0000-0000-0000-000000000000', ${lit(id)}::uuid, 'authenticated', 'authenticated', ${lit(email)},
  extensions.crypt(${lit(password)}, extensions.gen_salt('bf')), now(), '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false, false, now(), now()
)`).join(",\n")};
insert into auth.identities(id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
${authRows.map(([id, email]) => `(
  gen_random_uuid(), ${lit(id)}, ${lit(id)}::uuid,
  jsonb_build_object('sub', ${lit(id)}, 'email', ${lit(email)}, 'email_verified', true),
  'email', now(), now(), now()
)`).join(",\n")};
`;

const cleanupSql = `
delete from public.ai_usage_audit where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")});
delete from auth.users where id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")});
`;

const work = [
  "The recommendation is to stop the weekly content brainstorming meeting and replace it with an overnight route brief.",
  "The brief should contain six materially different campaign directions, the customer tension behind each one, and the strongest reason each direction may fail.",
  "The team must verify every number and source before presenting the routes.",
  "A human chooses the direction, improves the final twenty per cent in the brand's voice, and remains accountable for what ships.",
  "The claimed benefit is better ideas faster, not more interchangeable copy faster.",
].join("\n\n");

let output = {};
try {
  await dbq(setupSql);
  const [tokenA, tokenB, tokenC, tokenD, tokenE] = await Promise.all(
    Object.values(emails).map(signIn),
  );

  const primaryId = `r112_primary_${suffix}`;
  const anonymous = await invoke(null, { request_id: primaryId, body: work });
  const wrongMethod = await invoke(tokenA, {}, { method: "GET" });
  const wrongMedia = await invoke(tokenA, "{}", { contentType: "text/plain", raw: true });
  const oversized = await invoke(
    tokenA,
    JSON.stringify({ request_id: primaryId, body: "x".repeat(33_000) }),
    { raw: true },
  );
  const extra = await invoke(tokenA, { request_id: primaryId, body: work, user_id: userBId });
  const missingRequest = await invoke(tokenA, { body: work });

  const directRpc = await rest("rpc/reserve_critique_artefact_run", tokenA, {
    method: "POST",
    body: JSON.stringify({
      p_request_id: `r112_direct_${suffix}`,
      p_request_fingerprint: "a".repeat(64),
      p_source_type: "paste",
      p_artifact_id: null,
      p_body_sha256: "b".repeat(64),
      p_surface: "campaign direction",
      p_lenses: ["standard"],
      p_capability: "not-the-private-capability",
    }),
  });

  const first = await invoke(tokenA, {
    request_id: primaryId,
    body: work,
    surface: "campaign direction",
  });
  const primaryRun = await waitForRun(userAId, primaryId);
  const retry = await invoke(tokenA, {
    request_id: primaryId,
    body: work,
    surface: "campaign direction",
  });
  const conflict = await invoke(tokenA, {
    request_id: primaryId,
    body: `${work}\n\nA conflicting extra sentence.`,
    surface: "campaign direction",
  });
  const crossTenantRun = await rest(
    `harness_runs?id=eq.${primaryRun.id}&select=id`,
    tokenB,
  );
  const primaryRows = await dbq(`select
    (select count(*) from public.harness_runs where user_id=${lit(userAId)}::uuid and kind='critique' and request_id=${lit(primaryId)})::int as runs,
    (select count(*) from public.ai_usage_audit where user_id=${lit(userAId)}::uuid and function_name='critique-artefact')::int as usage,
    (select count(distinct metadata->>'purpose') from public.ai_usage_audit where user_id=${lit(userAId)}::uuid and function_name='critique-artefact')::int as distinct_purposes
  `);

  for (let i = 0; i < 8; i += 1) {
    await dbq(`insert into public.harness_runs(user_id,kind,status,stage,request_id,stage_detail)
      values (${lit(userBId)}::uuid,'critique','failed','failed',${lit(`r112_limit_${i}_${suffix}`)},'{}'::jsonb)`);
  }
  const ninth = await invoke(tokenB, { request_id: `r112_limit_call_${suffix}`, body: work });

  await dbq(`insert into public.ai_usage_audit(user_id,function_name,provider,model,purpose,status,est_cost_usd,metadata)
    values (${lit(userEId)}::uuid,'r112-probe','unknown','probe','spend-gate','ok',5.1,'{}'::jsonb)`);
  const spend = await invoke(tokenE, { request_id: `r112_spend_${suffix}`, body: work });

  const staleId = `r112_stale_${suffix}`;
  const staleStart = await invoke(tokenC, { request_id: staleId, body: work });
  await waitForStage(userCId, staleId, ["lenses", "meta", "ready", "failed"]);
  await dbq(`insert into public.evidence_sources(user_id,kind,label,body)
    values (${lit(userCId)}::uuid,'paste','R112 stale source','New evidence arrived during review.') returning id`)
    .then(async (rows) => {
      const sourceId = rows?.[0]?.id;
      if (!sourceId) throw new Error("stale_source_insert_failed");
      await dbq(`insert into public.evidence(user_id,kind,body,quote,source_id,source_label,situated,situation)
        values (${lit(userCId)}::uuid,'observation','New evidence arrived during review.','New evidence arrived during review.',${lit(sourceId)}::uuid,'R112 stale source',true,'R112 hosted stale-source probe')`);
    });
  const staleRun = await waitForRun(userCId, staleId);

  await dbq(`create or replace function public.r112_fail_critique_ready() returns trigger language plpgsql as $$ begin
    if new.user_id = ${lit(userDId)}::uuid and new.kind = 'critique' and new.stage = 'ready' then
      raise exception 'r112_forced_ready_failure';
    end if;
    return new;
  end $$;
  create trigger r112_fail_critique_ready before update on public.harness_runs
  for each row execute function public.r112_fail_critique_ready();`);
  const atomicId = `r112_atomic_${suffix}`;
  let atomicStart;
  let atomicRun;
  try {
    atomicStart = await invoke(tokenD, { request_id: atomicId, body: work });
    atomicRun = await waitForRun(userDId, atomicId);
  } finally {
    await dbq("drop trigger if exists r112_fail_critique_ready on public.harness_runs; drop function if exists public.r112_fail_critique_ready();");
  }

  output = {
    anonymous_status: anonymous.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    oversized_status: oversized.response.status,
    extra_field_status: extra.response.status,
    missing_request_status: missingRequest.response.status,
    direct_rpc_status: directRpc.response.status,
    first_status: first.response.status,
    first_stage: first.body?.stage ?? null,
    primary_terminal_stage: primaryRun.stage,
    primary_terminal_status: primaryRun.status,
    primary_has_result: Boolean(primaryRun.stage_detail?.result),
    primary_lenses_asked: primaryRun.stage_detail?.result?.lenses?.asked ?? [],
    primary_lenses_ran: primaryRun.stage_detail?.result?.lenses?.ran ?? [],
    primary_meta_ran: primaryRun.stage_detail?.result?.lenses?.metaRan ?? false,
    retry_status: retry.response.status,
    retry_idempotent: retry.body?.idempotent === true,
    retry_same_run: retry.body?.run_id === first.body?.run_id,
    conflict_status: conflict.response.status,
    conflict_error: conflict.body?.error,
    cross_tenant_run_rows: Array.isArray(crossTenantRun.body) ? crossTenantRun.body.length : -1,
    primary: primaryRows?.[0] ?? {},
    ninth_status: ninth.response.status,
    ninth_error: ninth.body?.error,
    spend_status: spend.response.status,
    spend_error: spend.body?.error,
    stale_start_status: staleStart.response.status,
    stale_terminal_stage: staleRun.stage,
    stale_terminal_status: staleRun.status,
    stale_error: staleRun.error,
    stale_has_result: Boolean(staleRun.stage_detail?.result),
    atomic_start_status: atomicStart?.response?.status ?? 0,
    atomic_terminal_stage: atomicRun?.stage ?? null,
    atomic_terminal_status: atomicRun?.status ?? null,
    atomic_error: atomicRun?.error ?? null,
    atomic_has_result: Boolean(atomicRun?.stage_detail?.result),
  };
} finally {
  await dbq("drop trigger if exists r112_fail_critique_ready on public.harness_runs; drop function if exists public.r112_fail_critique_ready();").catch(() => undefined);
  await dbq(cleanupSql).catch(() => undefined);
  const cleanup = await dbq(`select
    (select count(*) from auth.users where id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as auth_users,
    (select count(*) from public.harness_runs where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as runs,
    (select count(*) from public.evidence where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as evidence,
    (select count(*) from public.evidence_sources where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as evidence_sources,
    (select count(*) from public.ai_usage_audit where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as usage
  `);
  output.cleanup = cleanup?.[0] ?? {};
  console.log(JSON.stringify(output));
}
