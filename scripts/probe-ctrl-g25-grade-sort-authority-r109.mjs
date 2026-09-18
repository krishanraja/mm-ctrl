const managementToken = process.env.CTRL_PROBE_SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF;
const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const userAId = process.env.CTRL_PROBE_USER_A_ID;
const userBId = process.env.CTRL_PROBE_USER_B_ID;
if (!managementToken || !projectRef || !url || !publishableKey || !password || !suffix || !userAId || !userBId) {
  console.error("Set the isolated project, public key and transient fixture identities.");
  process.exit(2);
}
if (!/^[a-z0-9]{20}$/.test(projectRef) || url !== `https://${projectRef}.supabase.co`) {
  console.error("The probe target is not exact.");
  process.exit(2);
}

const emailA = `r109-a-${suffix}@example.com`;
const emailB = `r109-b-${suffix}@example.com`;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const ids = {
  run: crypto.randomUUID(),
  notReadyRun: crypto.randomUUID(),
  construct: crypto.randomUUID(),
  pair1: crypto.randomUUID(),
  pair2: crypto.randomUUID(),
  item1: crypto.randomUUID(),
  item2: crypto.randomUUID(),
  item3: crypto.randomUUID(),
  item4: crypto.randomUUID(),
  repeat: crypto.randomUUID(),
  notReadyItem: crypto.randomUUID(),
};
const firstWhy = `The accountable owner disappears behind collective language ${suffix}`;
const forcedWhy = `R109 forced construct rollback ${suffix}`;
const manipFailureMarker = `r109-manip-${suffix}`;

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

async function invoke(token, body, { method = "POST", contentType = "application/json", raw = false } = {}) {
  const response = await fetch(`${url}/functions/v1/grade-sort`, {
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

const authRows = [[userAId, emailA], [userBId, emailB]];
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

const installConstructFailureSql = `
create or replace function public.r109_force_construct_failure()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.emergent_pole = ${lit(forcedWhy)} then raise exception 'r109_forced_construct_failure'; end if;
  return new;
end;
$$;
revoke all on function public.r109_force_construct_failure() from public, anon, authenticated;
drop trigger if exists r109_force_construct_failure on public.constructs;
create trigger r109_force_construct_failure before insert on public.constructs
for each row execute function public.r109_force_construct_failure();
`;
const removeConstructFailureSql = `
drop trigger if exists r109_force_construct_failure on public.constructs;
drop function if exists public.r109_force_construct_failure();
`;
const installManipFailureSql = `
create or replace function public.r109_force_manip_failure()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.stage_detail::text like '%' || ${lit(manipFailureMarker)} || '%' then
    raise exception 'r109_forced_manip_failure';
  end if;
  return new;
end;
$$;
revoke all on function public.r109_force_manip_failure() from public, anon, authenticated;
drop trigger if exists r109_force_manip_failure on public.harness_runs;
create trigger r109_force_manip_failure before update on public.harness_runs
for each row execute function public.r109_force_manip_failure();
`;
const removeManipFailureSql = `
drop trigger if exists r109_force_manip_failure on public.harness_runs;
drop function if exists public.r109_force_manip_failure();
`;
const cleanupSql = `
${removeConstructFailureSql}
${removeManipFailureSql}
delete from public.profiles where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")});
delete from auth.users where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")});
`;

let constructTrigger = false;
let manipTrigger = false;
let finalResult;
try {
  await dbq(setupAuthSql);
  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);

  await insertRows("constructs", tokenA, [{
    id: ids.construct,
    user_id: userAId,
    scope: "person",
    status: "candidate",
    emergent_pole: `Names the financial consequence ${suffix}`,
    evidence_ids: [],
  }]);
  await insertRows("harness_runs", tokenA, [
    { id: ids.run, user_id: userAId, kind: "sort", surface: "board updates", status: "done", stage: "ready", stage_detail: {} },
    { id: ids.notReadyRun, user_id: userAId, kind: "sort", surface: "board updates", status: "running", stage: "assembling", stage_detail: {} },
  ]);
  const body = (name) => `${name} reports revenue retention, decision ownership and the next operating move in concrete language.`;
  await insertRows("sort_items", tokenA, [
    { id: ids.item1, user_id: userAId, session_id: ids.run, surface: "board updates", body: body("The first update"), origin: "synthesised", pair_id: ids.pair1, pair_role: "satisfies", intended_dimension: "names the financial consequence", targets: [ids.construct], held_out: false, repeat_of: null, position: 1 },
    { id: ids.item2, user_id: userAId, session_id: ids.run, surface: "board updates", body: body("The second update"), origin: "synthesised", pair_id: ids.pair1, pair_role: "violates", intended_dimension: null, targets: [ids.construct], held_out: false, repeat_of: null, position: 2 },
    { id: ids.item3, user_id: userAId, session_id: ids.run, surface: "board updates", body: body("The third update"), origin: "synthesised", pair_id: ids.pair2, pair_role: "satisfies", intended_dimension: "makes the owner explicit", targets: [ids.construct], held_out: true, repeat_of: null, position: 3 },
    { id: ids.item4, user_id: userAId, session_id: ids.run, surface: "board updates", body: body("The fourth update"), origin: "synthesised", pair_id: ids.pair2, pair_role: "violates", intended_dimension: null, targets: [ids.construct], held_out: true, repeat_of: null, position: 4 },
    { id: ids.repeat, user_id: userAId, session_id: ids.run, surface: "board updates", body: body("The first update"), origin: "synthesised", pair_id: null, pair_role: null, intended_dimension: null, targets: [], held_out: false, repeat_of: ids.item1, position: 5 },
    { id: ids.notReadyItem, user_id: userAId, session_id: ids.notReadyRun, surface: "board updates", body: body("The unfinished update"), origin: "synthesised", pair_id: null, pair_role: null, intended_dimension: null, targets: [], held_out: false, repeat_of: null, position: 1 },
  ]);

  const request1 = `r109_primary_${suffix}`;
  const primary = { run_id: ids.run, item_id: ids.item1, verdict: "send", why: firstWhy, ms_to_grade: 1400, request_id: request1 };
  const anonymous = await invoke(null, primary);
  const wrongMethod = await invoke(tokenA, null, { method: "GET" });
  const wrongMedia = await invoke(tokenA, "plain", { contentType: "text/plain", raw: true });
  const oversized = await invoke(tokenA, "x".repeat(5_000), { raw: true });
  const extraField = await invoke(tokenA, { ...primary, target_user_id: userBId });
  const missingRequest = await invoke(tokenA, { ...primary, request_id: undefined });
  const badMs = await invoke(tokenA, { ...primary, ms_to_grade: -1 });
  const longWhy = await invoke(tokenA, { ...primary, why: "x".repeat(601) });
  const orphanManip = await invoke(tokenA, { ...primary, manip_answer: "The financial result is explicit." });

  const first = await invoke(tokenA, primary);
  const retry = await invoke(tokenA, primary);
  const conflict = await invoke(tokenA, { ...primary, verdict: "would_not_send" });
  const gradeAfterFirst = await rest(`sort_grades?item_id=eq.${ids.item1}&select=id,verdict,why,ms_to_grade`, tokenA);
  const receiptAfterFirst = await rest(`sort_grade_submission_receipts?item_id=eq.${ids.item1}&select=id,request_id,result`, tokenA);
  const emergentAfterFirst = await rest(`constructs?user_id=eq.${userAId}&emergent_pole=eq.${encodeURIComponent(firstWhy.slice(0, 240))}&select=id,evidence_ids`, tokenA);
  const emergentEvidenceId = emergentAfterFirst.body?.[0]?.evidence_ids?.[0];
  const emergentEvidence = emergentEvidenceId
    ? await rest(`evidence?id=eq.${emergentEvidenceId}&select=id,body,kind`, tokenA)
    : { body: [] };

  const changed = await invoke(tokenA, {
    run_id: ids.run, item_id: ids.item1, verdict: "send", request_id: `r109_changed_${suffix}`,
  });
  const gradeAfterChange = await rest(`sort_grades?item_id=eq.${ids.item1}&select=verdict,why,ms_to_grade`, tokenA);

  const pairGrade = await invoke(tokenA, {
    run_id: ids.run,
    item_id: ids.item2,
    verdict: "would_not_send",
    manip_answer: "The stronger one names the financial consequence.",
    pair_id: ids.pair1,
    request_id: `r109_pair_${suffix}`,
  });
  const pairMembers = await rest(`sort_items?pair_id=eq.${ids.pair1}&select=id,manip_checked,manip_ok`, tokenA);
  const runDetail = await rest(`harness_runs?id=eq.${ids.run}&select=stage_detail`, tokenA);
  const manipAnswers = runDetail.body?.[0]?.stage_detail?.manip_answers ?? [];

  const repeat = await invoke(tokenA, {
    run_id: ids.run, item_id: ids.repeat, verdict: "send", request_id: `r109_repeat_${suffix}`,
  });

  const crossTenant = await invoke(tokenB, primary);
  const crossTenantRpc = await rest("rpc/submit_sort_grade_atomic", tokenB, {
    method: "POST",
    body: JSON.stringify({
      p_request_id: `r109_cross_${suffix}`,
      p_request_fingerprint: "b".repeat(64),
      p_run_id: ids.run,
      p_item_id: ids.item3,
      p_verdict: "send",
      p_why: null,
      p_ms_to_grade: null,
      p_create_construct: false,
      p_manip_pair_id: null,
      p_manip_answer: null,
      p_manip_scored: null,
      p_manip_ok: null,
    }),
  });
  const directReceiptInsert = await rest("sort_grade_submission_receipts", tokenA, {
    method: "POST",
    body: JSON.stringify({ user_id: userAId, request_id: `r109_direct_${suffix}`, request_fingerprint: "a".repeat(64), run_id: ids.run, item_id: ids.item3 }),
  });
  const notReady = await invoke(tokenA, {
    run_id: ids.notReadyRun, item_id: ids.notReadyItem, verdict: "send", request_id: `r109_notready_${suffix}`,
  });

  await dbq(installConstructFailureSql);
  constructTrigger = true;
  const forcedConstruct = await invoke(tokenA, {
    run_id: ids.run, item_id: ids.item3, verdict: "send", why: forcedWhy, request_id: `r109_construct_fail_${suffix}`,
  });
  const forcedConstructGrades = await rest(`sort_grades?item_id=eq.${ids.item3}&select=id`, tokenA);
  const forcedConstructEvidence = await rest(`evidence?body=eq.${encodeURIComponent(forcedWhy)}&select=id`, tokenA);
  const forcedConstructReceipts = await rest(`sort_grade_submission_receipts?request_id=eq.r109_construct_fail_${suffix}&select=id`, tokenA);
  await dbq(removeConstructFailureSql);
  constructTrigger = false;

  await dbq(installManipFailureSql);
  manipTrigger = true;
  const forcedManip = await invoke(tokenA, {
    run_id: ids.run,
    item_id: ids.item4,
    verdict: "send",
    manip_answer: `The explicit owner matters ${manipFailureMarker}`,
    pair_id: ids.pair2,
    request_id: `r109_manip_fail_${suffix}`,
  });
  const forcedManipGrades = await rest(`sort_grades?item_id=eq.${ids.item4}&select=id`, tokenA);
  const pair2Members = await rest(`sort_items?pair_id=eq.${ids.pair2}&select=manip_checked,manip_ok`, tokenA);
  const forcedManipReceipts = await rest(`sort_grade_submission_receipts?request_id=eq.r109_manip_fail_${suffix}&select=id`, tokenA);
  const runAfterManipFailure = await rest(`harness_runs?id=eq.${ids.run}&select=stage_detail`, tokenA);
  await dbq(removeManipFailureSql);
  manipTrigger = false;

  finalResult = {
    anonymous_status: anonymous.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    oversized_status: oversized.response.status,
    extra_field_status: extraField.response.status,
    missing_request_status: missingRequest.response.status,
    invalid_ms_status: badMs.response.status,
    long_why_status: longWhy.response.status,
    orphan_manip_status: orphanManip.response.status,
    first_status: first.response.status,
    first_idempotent: first.body?.idempotent ?? null,
    retry_status: retry.response.status,
    retry_idempotent: retry.body?.idempotent ?? null,
    conflict_status: conflict.response.status,
    conflict_error: conflict.body?.error ?? null,
    one_grade_after_retry: gradeAfterFirst.body?.length === 1,
    one_receipt_after_retry: receiptAfterFirst.body?.length === 1,
    one_emergent_construct: emergentAfterFirst.body?.length === 1,
    emergent_evidence_exact: emergentEvidence.body?.[0]?.body === firstWhy && emergentEvidence.body?.[0]?.kind === "grade",
    changed_mind_status: changed.response.status,
    changed_mind_persisted: gradeAfterChange.body?.[0]?.verdict === "send" && gradeAfterChange.body?.[0]?.why === null,
    manipulation_status: pairGrade.response.status,
    pair_split_after_pair: pairGrade.body?.pair_split,
    manipulation_scored: pairGrade.body?.manip?.scored ?? null,
    manipulation_ok: pairGrade.body?.manip?.ok ?? null,
    pair_flags_written: pairMembers.body?.length === 2 && pairMembers.body.every((row) => row.manip_checked === true && row.manip_ok === true),
    one_manip_answer: manipAnswers.length === 1 && manipAnswers[0]?.pair_id === ids.pair1,
    repeat_status: repeat.response.status,
    self_agreement: repeat.body?.self_agreement ?? null,
    cross_tenant_status: crossTenant.response.status,
    cross_tenant_rpc_status: crossTenantRpc.response.status,
    direct_receipt_insert_status: directReceiptInsert.response.status,
    not_ready_status: notReady.response.status,
    forced_construct_status: forcedConstruct.response.status,
    forced_construct_zero_grades: forcedConstructGrades.body?.length === 0,
    forced_construct_zero_evidence: forcedConstructEvidence.body?.length === 0,
    forced_construct_zero_receipts: forcedConstructReceipts.body?.length === 0,
    forced_manip_status: forcedManip.response.status,
    forced_manip_zero_grades: forcedManipGrades.body?.length === 0,
    forced_manip_flags_unchanged: pair2Members.body?.length === 2 && pair2Members.body.every((row) => row.manip_checked === false && row.manip_ok === null),
    forced_manip_zero_receipts: forcedManipReceipts.body?.length === 0,
    forced_manip_no_answer: !(runAfterManipFailure.body?.[0]?.stage_detail?.manip_answers ?? []).some((entry) => entry.pair_id === ids.pair2),
  };
} finally {
  if (constructTrigger) {
    try { await dbq(removeConstructFailureSql); } catch { /* cleanup retries below */ }
  }
  if (manipTrigger) {
    try { await dbq(removeManipFailureSql); } catch { /* cleanup retries below */ }
  }
  await dbq(cleanupSql);
  const cleanup = await dbq(`
    select
      (select count(*) from auth.users where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as auth_users,
      (select count(*) from auth.identities where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as identities,
      (select count(*) from public.profiles where id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as profiles,
      (select count(*) from public.harness_runs where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as runs,
      (select count(*) from public.sort_items where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as items,
      (select count(*) from public.sort_grades where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as grades,
      (select count(*) from public.sort_grade_submission_receipts where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as receipts,
      (select count(*) from public.evidence where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as evidence,
      (select count(*) from public.constructs where user_id in (${authRows.map(([id]) => `${lit(id)}::uuid`).join(",")}))::integer as constructs,
      (select count(*) from pg_trigger where tgname in ('r109_force_construct_failure','r109_force_manip_failure'))::integer as transient_triggers;
  `);
  if (finalResult) finalResult.cleanup = cleanup?.[0] ?? null;
}

console.log(JSON.stringify(finalResult));
