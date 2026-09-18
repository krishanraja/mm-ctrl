const managementToken = process.env.CTRL_PROBE_SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF;
const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const userAId = process.env.CTRL_PROBE_USER_A_ID;
const userBId = process.env.CTRL_PROBE_USER_B_ID;
const userCId = process.env.CTRL_PROBE_USER_C_ID;
if (!managementToken || !projectRef || !url || !publishableKey || !password || !suffix || !userAId || !userBId || !userCId) {
  console.error("Set the isolated project, public key and transient fixture identities.");
  process.exit(2);
}
if (!/^[a-z0-9]{20}$/.test(projectRef) || url !== `https://${projectRef}.supabase.co`) {
  console.error("The probe target is not exact.");
  process.exit(2);
}

const emailA = `r108-a-${suffix}@example.com`;
const emailB = `r108-b-${suffix}@example.com`;
const emailC = `r108-c-${suffix}@example.com`;
const requestA = `r108_primary_${suffix}`;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const json = async (response) => {
  const value = await response.text();
  try { return JSON.parse(value); } catch { return value; }
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
  if (!response.ok || !body?.access_token) throw new Error(`sign_in:${response.status}:${body?.error_code ?? "unknown"}`);
  return body.access_token;
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

async function rpc(name, token, body) {
  return rest(`rpc/${name}`, token, { method: "POST", body: JSON.stringify(body) });
}

async function insertRows(table, token, rows) {
  const result = await rest(`${table}?select=*`, token, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!result.response.ok || !Array.isArray(result.body)) {
    throw new Error(`insert_${table}:${result.response.status}:${result.body?.message ?? "unknown"}`);
  }
  return result.body;
}

async function patchRows(table, filter, token, value) {
  const result = await rest(`${table}?${filter}&select=*`, token, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(value),
  });
  if (!result.response.ok || !Array.isArray(result.body)) {
    throw new Error(`patch_${table}:${result.response.status}:${result.body?.message ?? "unknown"}`);
  }
  return result.body;
}

async function invokeBuild(token, body, { method = "POST", contentType = "application/json", raw = false } = {}) {
  const response = await fetch(`${url}/functions/v1/build-sort`, {
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

async function invokeIngest(token) {
  const response = await fetch(`${url}/functions/v1/ingest-brain`, {
    method: "POST",
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  return { response, body: await json(response) };
}

async function pollRun(token, runId, timeoutMs = 100_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await rest(`harness_runs?id=eq.${runId}&select=id,status,stage,error,stage_detail,updated_at`, token);
    const row = Array.isArray(result.body) ? result.body[0] : null;
    if (row?.status === "done" || row?.status === "failed") return row;
    await sleep(1_500);
  }
  throw new Error("build_sort_poll_timeout");
}

const authRows = [
  [userAId, emailA],
  [userBId, emailB],
  [userCId, emailC],
];
const setupAuthSql = `
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

const triggerBody = `R108 atomic rollback ${suffix}`;
const installFailureTriggerSql = `
create or replace function public.r108_force_sort_item_failure()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.body = ${lit(triggerBody)} then raise exception 'r108_forced_sort_item_failure'; end if;
  return new;
end;
$$;
revoke all on function public.r108_force_sort_item_failure() from public, anon, authenticated;
drop trigger if exists r108_force_sort_item_failure on public.sort_items;
create trigger r108_force_sort_item_failure before insert on public.sort_items
for each row execute function public.r108_force_sort_item_failure();
`;
const removeFailureTriggerSql = `
drop trigger if exists r108_force_sort_item_failure on public.sort_items;
drop function if exists public.r108_force_sort_item_failure();
`;
const cleanupSql = `
${removeFailureTriggerSql}
delete from public.ai_usage_audit where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")});
delete from public.profiles where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")});
delete from auth.users where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")});
`;

let triggerInstalled = false;
let finalResult;
try {
  await dbq(setupAuthSql);
  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);
  const tokenC = await signIn(emailC);

  const anonymous = await invokeBuild(null, { surface: "board updates", request_id: requestA });
  const wrongMethod = await invokeBuild(tokenA, null, { method: "GET" });
  const wrongMedia = await invokeBuild(tokenA, "plain", { contentType: "text/plain", raw: true });
  const oversized = await invokeBuild(tokenA, "x".repeat(5_000), { raw: true });
  const extraField = await invokeBuild(tokenA, { surface: "board updates", request_id: requestA, target_user_id: userBId });
  const missingRequest = await invokeBuild(tokenA, { surface: "board updates" });
  const invalidDepth = await invokeBuild(tokenA, { surface: "board updates", depth: "enormous", request_id: requestA });

  const labels = [
    ["Numeric specificity", "A recommendation should name the number, baseline, and time window that would make it consequential."],
    ["Stakeholder reality", "A strong update says whose behaviour must change and what could stop them acting."],
    ["Plain language", "The reader should understand the point on the first read without consultancy phrasing."],
    ["Tradeoff honesty", "Every option should state what it sacrifices rather than pretending all benefits can coexist."],
    ["Accountable next move", "The update must end with a named owner, a decision, and the evidence needed next."],
  ];
  await insertRows("user_memory", tokenA, labels.map(([label, value], index) => ({
    user_id: userAId,
    fact_key: `r108_a_${index}_${suffix}`,
    fact_category: "preference",
    fact_label: label,
    fact_value: value,
    confidence_score: 0.9,
    importance: 9,
    verification_status: "verified",
    source_type: "voice",
    is_current: true,
  })));
  const ingestA = await invokeIngest(tokenA);
  if (!ingestA.response.ok) throw new Error(`ingest_a:${ingestA.response.status}`);

  const buildBody = {
    surface: "board updates",
    depth: "short",
    session_label: "R108 hosted authority proof",
    context: "A founder deciding whether to rebuild a marketing organisation around AI. Use realistic budget, adoption and customer-retention numbers.",
    request_id: requestA,
  };
  const first = await invokeBuild(tokenA, buildBody);
  if (first.response.status !== 202 || !first.body?.run_id) {
    throw new Error(`first_build:${first.response.status}:${first.body?.error ?? "unknown"}`);
  }
  const retry = await invokeBuild(tokenA, buildBody);
  const conflict = await invokeBuild(tokenA, { ...buildBody, context: `${buildBody.context} Changed.` });
  const terminalRun = await pollRun(tokenA, first.body.run_id);

  const runsA = await rest(`harness_runs?user_id=eq.${userAId}&kind=eq.sort&select=id,status,stage,request_id,stage_detail`, tokenA);
  const itemsA = await rest(`sort_items?session_id=eq.${first.body.run_id}&select=id,user_id,position,repeat_of,targets,origin,held_out,pair_id,pair_role&order=position.asc`, tokenA);
  const usageA = await rest(`ai_usage_audit?user_id=eq.${userAId}&function_name=eq.build-sort&select=id,metadata,est_cost_usd`, tokenA);
  const itemPositions = Array.isArray(itemsA.body) ? itemsA.body.map((row) => row.position) : [];
  const positionById = new Map((itemsA.body ?? []).map((row) => [row.id, row.position]));
  const repeatsResolveEarlier = (itemsA.body ?? []).filter((row) => row.repeat_of).every((row) => {
    const sourcePosition = positionById.get(row.repeat_of);
    return Number.isInteger(sourcePosition) && sourcePosition < row.position;
  });
  const usageReplay = await rpc("record_build_sort_usage", tokenA, {
    p_run_id: first.body.run_id,
    p_provider: "unknown",
    p_model: "r108-replay",
    p_prompt_tokens: 1,
    p_completion_tokens: 1,
    p_total_tokens: 2,
    p_latency_ms: 1,
    p_est_cost_usd: 0.001,
  });
  const crossTenantRuns = await rest(`harness_runs?user_id=eq.${userAId}&select=id`, tokenB);
  const crossTenantItems = await rest(`sort_items?session_id=eq.${first.body.run_id}&select=id`, tokenB);
  const crossTenantUpdate = await patchRows("harness_runs", `id=eq.${first.body.run_id}`, tokenB, { stage: "tampered" });
  const crossTenantUsage = await rpc("record_build_sort_usage", tokenB, {
    p_run_id: first.body.run_id,
    p_provider: "unknown",
    p_model: "r108-cross-tenant",
    p_prompt_tokens: 1,
    p_completion_tokens: 1,
    p_total_tokens: 2,
    p_latency_ms: 1,
    p_est_cost_usd: 0.001,
  });

  await insertRows("user_memory", tokenB, [{
    user_id: userBId,
    fact_key: `r108_b_${suffix}`,
    fact_category: "preference",
    fact_label: "Atomic finalisation",
    fact_value: "A failed last write must leave no partial deck behind.",
    confidence_score: 1,
    importance: 10,
    verification_status: "verified",
    source_type: "voice",
    is_current: true,
  }]);
  const ingestB = await invokeIngest(tokenB);
  if (!ingestB.response.ok) throw new Error(`ingest_b:${ingestB.response.status}`);
  const candidateB = await rest(`constructs?user_id=eq.${userBId}&status=eq.candidate&select=id&limit=1`, tokenB);
  const constructB = candidateB.body?.[0]?.id;
  if (!constructB) throw new Error("missing_b_construct");
  const reserveB = await rpc("reserve_build_sort_run", tokenB, {
    p_request_id: `r108_atomic_${suffix}`,
    p_request_fingerprint: "b".repeat(64),
    p_surface: "board updates",
    p_depth: "short",
    p_session_label: "R108 atomic proof",
    p_budget: { probe: true },
    p_can_reach_verified: false,
  });
  const runB = reserveB.body?.run_id;
  if (!reserveB.response.ok || !runB) throw new Error(`reserve_b:${reserveB.response.status}`);
  const atomicItem = {
    id: crypto.randomUUID(), surface: "board updates", body: triggerBody, origin: "synthesised",
    pair_id: null, pair_role: null, intended_dimension: null, targets: [constructB],
    held_out: false, repeat_of: null, position: 1,
  };
  await dbq(installFailureTriggerSql);
  triggerInstalled = true;
  const forcedFailure = await rpc("finalize_build_sort_run", tokenB, {
    p_run_id: runB, p_items: [atomicItem], p_stage_detail: { probe: "forced_failure" },
  });
  const itemsAfterFailure = await rest(`sort_items?session_id=eq.${runB}&select=id`, tokenB);
  const runAfterFailure = await rest(`harness_runs?id=eq.${runB}&select=status,stage`, tokenB);
  await dbq(removeFailureTriggerSql);
  triggerInstalled = false;
  await patchRows("constructs", `id=eq.${constructB}`, tokenB, { status: "retired" });
  const staleFinalization = await rpc("finalize_build_sort_run", tokenB, {
    p_run_id: runB,
    p_items: [{ ...atomicItem, id: crypto.randomUUID(), body: "A valid-length item that now targets a retired construct and must be refused." }],
    p_stage_detail: { probe: "stale_construct" },
  });
  const itemsAfterStale = await rest(`sort_items?session_id=eq.${runB}&select=id`, tokenB);

  await dbq(`insert into public.ai_usage_audit(user_id,function_name,provider,model,purpose,status,est_cost_usd,metadata)
    values (${lit(userBId)}::uuid,'r108-spend-gate','unknown','fixture','probe','ok',2.00,'{}'::jsonb);`);
  const spendBlocked = await invokeBuild(tokenB, {
    surface: "board updates", depth: "short", request_id: `r108_spend_${suffix}`,
  });

  const reserveResultsC = [];
  for (let i = 0; i < 5; i += 1) {
    reserveResultsC.push(await rpc("reserve_build_sort_run", tokenC, {
      p_request_id: `r108_limit_${i}_${suffix}`,
      p_request_fingerprint: String(i).padStart(64, "c").slice(-64),
      p_surface: "board updates",
      p_depth: "short",
      p_session_label: "R108 cap proof",
      p_budget: { probe: true },
      p_can_reach_verified: false,
    }));
  }
  const runBlocked = await invokeBuild(tokenC, {
    surface: "board updates", depth: "short", request_id: `r108_limit_5_${suffix}`,
  });

  finalResult = {
    anonymous_status: anonymous.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    oversized_status: oversized.response.status,
    extra_field_status: extraField.response.status,
    missing_request_status: missingRequest.response.status,
    invalid_depth_status: invalidDepth.response.status,
    first_status: first.response.status,
    retry_status: retry.response.status,
    retry_idempotent: retry.body?.idempotent === true,
    retry_same_run: retry.body?.run_id === first.body.run_id,
    conflict_status: conflict.response.status,
    conflict_error: conflict.body?.error ?? null,
    terminal_status: terminalRun.status,
    terminal_stage: terminalRun.stage,
    terminal_error: terminalRun.error,
    one_reserved_run: runsA.body?.length === 1,
    usage_rows: usageA.body?.length ?? null,
    usage_replay_idempotent: usageReplay.body?.already_recorded === true,
    item_count: itemsA.body?.length ?? null,
    positions_contiguous: itemPositions.every((position, index) => position === index + 1),
    repeats_resolve_earlier: repeatsResolveEarlier,
    all_items_owned: (itemsA.body ?? []).every((row) => row.user_id === userAId),
    cross_tenant_run_rows: crossTenantRuns.body?.length ?? null,
    cross_tenant_item_rows: crossTenantItems.body?.length ?? null,
    cross_tenant_update_rows: crossTenantUpdate.length,
    cross_tenant_usage_status: crossTenantUsage.response.status,
    atomic_failure_status: forcedFailure.response.status,
    atomic_failure_zero_items: itemsAfterFailure.body?.length === 0,
    atomic_failure_run_still_running: runAfterFailure.body?.[0]?.status === "running",
    stale_construct_status: staleFinalization.response.status,
    stale_construct_zero_items: itemsAfterStale.body?.length === 0,
    spend_gate_status: spendBlocked.response.status,
    spend_gate_error: spendBlocked.body?.error ?? null,
    first_five_reservations_ok: reserveResultsC.every((result) => result.response.ok && result.body?.run_id),
    daily_run_gate_status: runBlocked.response.status,
    daily_run_gate_error: runBlocked.body?.error ?? null,
  };
} finally {
  if (triggerInstalled) {
    try { await dbq(removeFailureTriggerSql); } catch { /* cleanup retries below */ }
  }
  await dbq(cleanupSql);
  const cleanup = await dbq(`
    select
      (select count(*) from auth.users where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as auth_users,
      (select count(*) from auth.identities where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as identities,
      (select count(*) from public.profiles where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as profiles,
      (select count(*) from public.harness_runs where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as runs,
      (select count(*) from public.sort_items where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as items,
      (select count(*) from public.ai_usage_audit where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as usage,
      (select count(*) from public.constructs where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as constructs,
      (select count(*) from pg_trigger where tgname = 'r108_force_sort_item_failure')::integer as transient_triggers;
  `);
  if (finalResult) finalResult.cleanup = cleanup?.[0] ?? null;
}

console.log(JSON.stringify(finalResult));
