const managementToken = process.env.CTRL_PROBE_SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF;
const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const userAId = process.env.CTRL_PROBE_USER_A_ID;
const userBId = process.env.CTRL_PROBE_USER_B_ID;
if (!managementToken || !projectRef || !url || !publishableKey || !password || !suffix || !userAId || !userBId) {
  console.error("Set the isolated project, public key and transient fixture identity.");
  process.exit(2);
}
if (!/^[a-z0-9]{20}$/.test(projectRef) || url !== `https://${projectRef}.supabase.co`) {
  console.error("The probe target is not exact.");
  process.exit(2);
}

const emailA = `r107-a-${suffix}@example.com`;
const emailB = `r107-b-${suffix}@example.com`;
const rollbackPole = `R107 forced rollback ${suffix}`;
const label = `Decision quality ${suffix}`;
const firstValue = `Spot the weak signal early 🧠 ${suffix}`;
const correctedValue = `Name the weak signal and its cost early 🧠 ${suffix}`;
const secondValue = `Use a real comparison before changing the system ${suffix}`;
const decisionValue = `Should this team rebuild its operating model now ${suffix}?`;
const bValue = `Independent tenant guard ${suffix}`;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;

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
  if (!response.ok || !body?.access_token) {
    throw new Error(`sign_in:${response.status}:${body?.error_code ?? body?.code ?? "unknown"}`);
  }
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

async function invoke(token, body, { method = "POST", contentType = "application/json", raw = false } = {}) {
  const response = await fetch(`${url}/functions/v1/ingest-brain`, {
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

const setupAuthSql = `
insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user,
  is_anonymous, created_at, updated_at
) values
(
  '00000000-0000-0000-0000-000000000000', ${lit(userAId)}::uuid, 'authenticated', 'authenticated', ${lit(emailA)},
  extensions.crypt(${lit(password)}, extensions.gen_salt('bf')), now(), '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false, false, now(), now()
),
(
  '00000000-0000-0000-0000-000000000000', ${lit(userBId)}::uuid, 'authenticated', 'authenticated', ${lit(emailB)},
  extensions.crypt(${lit(password)}, extensions.gen_salt('bf')), now(), '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false, false, now(), now()
);
insert into auth.identities(id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
(
  gen_random_uuid(), ${lit(userAId)}, ${lit(userAId)}::uuid,
  jsonb_build_object('sub', ${lit(userAId)}, 'email', ${lit(emailA)}, 'email_verified', true),
  'email', now(), now(), now()
),
(
  gen_random_uuid(), ${lit(userBId)}, ${lit(userBId)}::uuid,
  jsonb_build_object('sub', ${lit(userBId)}, 'email', ${lit(emailB)}, 'email_verified', true),
  'email', now(), now(), now()
);
`;

const installFailureTriggerSql = `
create or replace function public.r107_force_brain_construct_failure()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.emergent_pole = ${lit(rollbackPole)} then
    raise exception 'r107_forced_late_failure';
  end if;
  return new;
end;
$$;
revoke all on function public.r107_force_brain_construct_failure() from public, anon, authenticated;
drop trigger if exists r107_force_brain_construct_failure on public.constructs;
create trigger r107_force_brain_construct_failure
before insert on public.constructs
for each row execute function public.r107_force_brain_construct_failure();
`;

const removeFailureTriggerSql = `
drop trigger if exists r107_force_brain_construct_failure on public.constructs;
drop function if exists public.r107_force_brain_construct_failure();
`;

const cleanupSql = `
${removeFailureTriggerSql}
delete from public.profiles where id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid);
delete from auth.users where id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid);
`;

let triggerInstalled = false;
let finalResult;
try {
  await dbq(setupAuthSql);
  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);

  const anonymous = await invoke(null, {});
  const emptyB = await invoke(tokenB, {});
  const wrongMethod = await invoke(tokenA, null, { method: "GET" });
  const wrongMedia = await invoke(tokenA, "plain", { contentType: "text/plain", raw: true });
  const extraBody = await invoke(tokenA, { target_user_id: userBId });
  const oversized = await invoke(tokenA, "x".repeat(3_000), { raw: true });

  const [factA] = await insertRows("user_memory", tokenA, [{
    user_id: userAId,
    fact_key: `r107_primary_${suffix}`,
    fact_category: "preference",
    fact_label: rollbackPole,
    fact_value: firstValue,
    confidence_score: 0.95,
    importance: 9,
    verification_status: "verified",
    source_type: "voice",
    is_current: true,
  }]);

  await dbq(installFailureTriggerSql);
  triggerInstalled = true;
  const forcedFailure = await invoke(tokenA, {});
  const rollbackSources = await rest(`evidence_sources?user_id=eq.${userAId}&select=id`, tokenA);
  const rollbackEvidence = await rest(`evidence?user_id=eq.${userAId}&select=id`, tokenA);
  const rollbackConstructs = await rest(`constructs?user_id=eq.${userAId}&select=id`, tokenA);
  const rollbackReceipts = await rest(`brain_ingestion_receipts?user_id=eq.${userAId}&select=id`, tokenA);
  await dbq(removeFailureTriggerSql);
  triggerInstalled = false;

  await patchRows("user_memory", `id=eq.${factA.id}`, tokenA, { fact_label: label });
  await insertRows("user_memory", tokenA, [
    {
      user_id: userAId,
      fact_key: `r107_secondary_${suffix}`,
      fact_category: "preference",
      fact_label: label,
      fact_value: secondValue,
      confidence_score: 0.88,
      importance: 8,
      verification_status: "verified",
      source_type: "voice",
      is_current: true,
    },
    {
      user_id: userAId,
      fact_key: `r107_rejected_${suffix}`,
      fact_category: "preference",
      fact_label: "Rejected input",
      fact_value: `Do not stage this ${suffix}`,
      confidence_score: 0.99,
      importance: 10,
      verification_status: "rejected",
      source_type: "voice",
      is_current: true,
    },
  ]);
  await insertRows("decision_cases", tokenA, [{
    user_id: userAId,
    title: "R107 decision",
    statement: decisionValue,
    status: "active",
    decision_kind: "directional",
    source: "advisor",
  }]);
  await insertRows("user_memory", tokenB, [{
    user_id: userBId,
    fact_key: `r107_guard_${suffix}`,
    fact_category: "identity",
    fact_label: "Tenant guard",
    fact_value: bValue,
    confidence_score: 1,
    importance: 10,
    verification_status: "verified",
    source_type: "voice",
    is_current: true,
  }]);

  const first = await invoke(tokenA, {});
  const retry = await invoke(tokenA, {});
  const bFirst = await invoke(tokenB, {});

  const firstReceiptRows = await rest(
    `brain_ingestion_receipts?id=eq.${first.body?.receipt_id}&select=id,source_id,input_fingerprint,source_counts,evidence_ids,construct_ids,superseded_at`,
    tokenA,
  );
  const firstReceipt = firstReceiptRows.body?.[0];
  const firstConstructs = await rest(
    `constructs?id=in.(${(firstReceipt?.construct_ids ?? []).join(",")})&select=id,status,evidence_ids,emergent_pole`,
    tokenA,
  );
  const accepted = firstConstructs.body.find((row) => row.emergent_pole === label && row.evidence_ids.length === 2);
  if (!accepted) throw new Error("missing_grouped_construct");
  await patchRows("constructs", `id=eq.${accepted.id}`, tokenA, {
    status: "elicited",
    contrast_pole: "Quality that only appears after rescue",
  });

  await patchRows("user_memory", `id=eq.${factA.id}`, tokenA, {
    fact_value: correctedValue,
    verification_status: "corrected",
  });
  const corrected = await invoke(tokenA, {});
  const correctedRetry = await invoke(tokenA, {});

  const receiptHistory = await rest(
    `brain_ingestion_receipts?user_id=eq.${userAId}&select=id,source_id,input_fingerprint,source_counts,evidence_ids,construct_ids,supersedes_receipt_id,superseded_at,superseded_by_receipt_id&order=created_at.asc`,
    tokenA,
  );
  const constructHistory = await rest(
    `constructs?user_id=eq.${userAId}&select=id,status,evidence_ids,emergent_pole&order=created_at.asc`,
    tokenA,
  );
  const sourceHistory = await rest(
    `evidence_sources?user_id=eq.${userAId}&select=id,body&order=created_at.asc`,
    tokenA,
  );
  const evidenceHistory = await rest(
    `evidence?user_id=eq.${userAId}&select=id,source_id,quote,quote_start,quote_end,memory_fact_id,source_ref&order=created_at.asc`,
    tokenA,
  );
  const sourceById = new Map(sourceHistory.body.map((row) => [row.id, row.body]));
  const offsetsExact = evidenceHistory.body.every((row) => {
    const sourceBody = sourceById.get(row.source_id);
    return typeof sourceBody === "string" && sourceBody.slice(row.quote_start, row.quote_end) === row.quote;
  });

  const crossTenantRead = await rest(
    `brain_ingestion_receipts?user_id=eq.${userBId}&select=id`,
    tokenA,
  );
  const directReceiptInsert = await rest("brain_ingestion_receipts", tokenA, {
    method: "POST",
    body: JSON.stringify({
      user_id: userAId,
      input_fingerprint: "a".repeat(64),
      source_counts: {},
    }),
  });
  const bReceipts = await rest(
    `brain_ingestion_receipts?user_id=eq.${userBId}&select=id,superseded_at`,
    tokenB,
  );
  const activeA = receiptHistory.body.filter((row) => row.superseded_at === null);
  const oldReceipt = receiptHistory.body.find((row) => row.id === first.body?.receipt_id);
  const oldConstructIds = new Set(oldReceipt?.construct_ids ?? []);
  const oldConstructs = constructHistory.body.filter((row) => oldConstructIds.has(row.id));
  const newReceipt = receiptHistory.body.find((row) => row.id === corrected.body?.receipt_id);
  const newConstructIds = new Set(newReceipt?.construct_ids ?? []);
  const newConstructs = constructHistory.body.filter((row) => newConstructIds.has(row.id));

  finalResult = {
    anonymous_status: anonymous.response.status,
    empty_brain_status: emptyB.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    extra_body_status: extraBody.response.status,
    oversized_status: oversized.response.status,
    forced_late_failure_status: forcedFailure.response.status,
    forced_failure_zero_sources: rollbackSources.body.length === 0,
    forced_failure_zero_evidence: rollbackEvidence.body.length === 0,
    forced_failure_zero_constructs: rollbackConstructs.body.length === 0,
    forced_failure_zero_receipts: rollbackReceipts.body.length === 0,
    first_status: first.response.status,
    first_already_ingested: first.body?.already_ingested ?? null,
    first_counts: {
      facts: first.body?.facts_used ?? null,
      decisions: first.body?.decisions_used ?? null,
      evidence: first.body?.evidence ?? null,
      constructs: first.body?.constructs ?? null,
      skipped: first.body?.skipped ?? null,
    },
    retry_status: retry.response.status,
    retry_already_ingested: retry.body?.already_ingested ?? null,
    retry_same_receipt: retry.body?.receipt_id === first.body?.receipt_id,
    retry_same_source: retry.body?.source_id === first.body?.source_id,
    retry_same_fingerprint: retry.body?.input_fingerprint === first.body?.input_fingerprint,
    second_tenant_status: bFirst.response.status,
    second_tenant_receipt_count: bReceipts.body.length,
    correction_status: corrected.response.status,
    correction_already_ingested: corrected.body?.already_ingested ?? null,
    correction_new_receipt: corrected.body?.receipt_id !== first.body?.receipt_id,
    correction_new_fingerprint: corrected.body?.input_fingerprint !== first.body?.input_fingerprint,
    correction_supersedes_first: corrected.body?.superseded_receipt_id === first.body?.receipt_id,
    correction_retry_already_ingested: correctedRetry.body?.already_ingested ?? null,
    correction_retry_same_receipt: correctedRetry.body?.receipt_id === corrected.body?.receipt_id,
    receipt_history_count: receiptHistory.body.length,
    active_receipt_count: activeA.length,
    old_receipt_points_forward: oldReceipt?.superseded_by_receipt_id === corrected.body?.receipt_id,
    new_receipt_points_back: newReceipt?.supersedes_receipt_id === first.body?.receipt_id,
    accepted_old_construct_preserved: oldConstructs.some((row) => row.id === accepted.id && row.status === "elicited"),
    stale_old_candidates_retired: oldConstructs.filter((row) => row.id !== accepted.id).every((row) => row.status === "retired"),
    new_constructs_all_candidate: newConstructs.length > 0 && newConstructs.every((row) => row.status === "candidate"),
    exact_offsets_including_unicode: offsetsExact,
    rejected_fact_not_staged: !evidenceHistory.body.some((row) => row.quote?.includes("Do not stage this")),
    cross_tenant_receipt_rows_visible: crossTenantRead.body.length,
    direct_receipt_insert_status: directReceiptInsert.response.status,
  };
} finally {
  if (triggerInstalled) {
    try { await dbq(removeFailureTriggerSql); } catch { /* cleanup below retries */ }
  }
  await dbq(cleanupSql);
  const cleanup = await dbq(`
    select
      (select count(*) from auth.users where id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as auth_users,
      (select count(*) from auth.identities where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as identities,
      (select count(*) from public.profiles where id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as profiles,
      (select count(*) from public.user_memory where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as memory,
      (select count(*) from public.decision_cases where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as decisions,
      (select count(*) from public.evidence_sources where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as sources,
      (select count(*) from public.evidence where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as evidence,
      (select count(*) from public.constructs where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as constructs,
      (select count(*) from public.brain_ingestion_receipts where user_id in (${lit(userAId)}::uuid, ${lit(userBId)}::uuid))::integer as receipts;
  `);
  if (finalResult) finalResult.cleanup = cleanup?.[0] ?? null;
}

console.log(JSON.stringify(finalResult));
