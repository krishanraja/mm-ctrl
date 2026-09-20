const managementToken = process.env.CTRL_PROBE_SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF;
const url = process.env.CTRL_PROBE_SUPABASE_URL;
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD;
const suffix = process.env.CTRL_PROBE_FIXTURE_SUFFIX;
const userIds = ["A", "B", "C", "D", "E"].map((key) => process.env[`CTRL_PROBE_USER_${key}_ID`]);
if (!managementToken || !projectRef || !url || !publishableKey || !password || !suffix || userIds.some((id) => !id)) {
  console.error("Set the isolated project, public key and transient fixture identities.");
  process.exit(2);
}
if (!/^[a-z0-9]{20}$/.test(projectRef) || url !== `https://${projectRef}.supabase.co`) {
  console.error("The probe target is not exact.");
  process.exit(2);
}

const [userAId, userBId, userCId, userDId, userEId] = userIds;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const emails = Object.fromEntries(["A", "B", "C", "D", "E"].map((key) => [key, `r111-${key.toLowerCase()}-${suffix}@example.com`]));
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
  if (!response.ok || !body?.access_token) throw new Error(`sign_in:${response.status}:${body?.error_code ?? "unknown"}`);
  return body.access_token;
}

async function invoke(token, body, { method = "POST", contentType = "application/json", raw = false } = {}) {
  const response = await fetch(`${url}/functions/v1/generate-skill-export`, {
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

const authRows = [[userAId, emails.A], [userBId, emails.B], [userCId, emails.C], [userDId, emails.D], [userEId, emails.E]];
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
insert into public.edge_profiles(user_id, strengths, weaknesses, intelligence_gaps, profile_version)
values (
  ${lit(userAId)}::uuid,
  '[{"label":"commercial precision","summary":"Makes a claim testable with a named consequence and number."}]'::jsonb,
  '[{"label":"premature certainty","summary":"Can move before the disconfirming evidence is explicit."}]'::jsonb,
  '[]'::jsonb, 1
);
insert into public.user_decisions(user_id, decision_text, rationale, status, source)
values (
  ${lit(userAId)}::uuid,
  'Replace weekly generic content meetings with an overnight divergent brief and a human final edit.',
  'The team should spend its hour judging distinctive routes, not transporting information.',
  'active', 'manual'
);
`;

const cleanupSql = `
delete from public.ai_usage_audit where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")});
delete from auth.users where id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")});
`;

let output = {};
let signedTokens = [];
try {
  await dbq(setupSql);
  const [tokenA, tokenB, tokenC, tokenD, tokenE] = await Promise.all(Object.values(emails).map(signIn));
  signedTokens = [tokenA, tokenB, tokenC, tokenD, tokenE];

  const baseTranscript = "Every morning prepare six genuinely different campaign routes. Ground each route in a current customer tension, include the number that would change the call, and show the strongest reason the route may be wrong. I choose the direction. AI then drafts it, another model audits the sources and numbers, and I do the final edit in my own voice before anything ships.";
  const requestId = `r111_primary_${suffix}`;
  const anonymous = await invoke(null, { request_id: requestId, transcript: baseTranscript });
  const wrongMethod = await invoke(tokenA, {}, { method: "GET" });
  const wrongMedia = await invoke(tokenA, "{}", { contentType: "text/plain", raw: true });
  const oversized = await invoke(tokenA, JSON.stringify({ request_id: requestId, transcript: "x".repeat(110_000) }), { raw: true });
  const extra = await invoke(tokenA, { request_id: requestId, transcript: baseTranscript, user_id: userBId });
  const missingRequest = await invoke(tokenA, { transcript: baseTranscript });

  const directRpc = await rest("rpc/reserve_generate_skill_export_run", tokenA, {
    method: "POST",
    body: JSON.stringify({
      p_request_id: `r111_direct_${suffix}`,
      p_request_fingerprint: "a".repeat(64),
      p_transcript_sha: "b".repeat(64),
      p_capability: "not-the-private-capability",
    }),
  });
  const directArtifact = await rest("generated_artifacts", tokenA, {
    method: "POST",
    body: JSON.stringify({ user_id: userAId, kind: "skill", name: "forged", body: "forged", metadata: {} }),
  });

  const first = await invoke(tokenA, { request_id: requestId, transcript: baseTranscript, own_words: baseTranscript, skill_name_hint: "campaign-route-judge" });
  const retry = await invoke(tokenA, { request_id: requestId, transcript: baseTranscript, own_words: baseTranscript, skill_name_hint: "campaign-route-judge" });
  const conflict = await invoke(tokenA, { request_id: requestId, transcript: `${baseTranscript} Changed.`, skill_name_hint: "campaign-route-judge" });

  const artifactId = first.body?.artifact_id;
  const crossTenantArtifact = artifactId
    ? await rest(`generated_artifacts?id=eq.${artifactId}&select=id`, tokenB)
    : { response: { status: 0 }, body: [] };

  const primaryRows = await dbq(`
select
  (select count(*) from public.harness_runs where user_id=${lit(userAId)}::uuid and kind='generate' and request_id=${lit(requestId)})::int as runs,
  (select count(*) from public.skill_exports where user_id=${lit(userAId)}::uuid)::int as exports,
  (select count(*) from public.generated_artifacts where user_id=${lit(userAId)}::uuid and kind='skill')::int as artifacts,
  (select count(*) from public.skill_provenance where user_id=${lit(userAId)}::uuid)::int as provenance,
  (select count(*) from public.evidence_sources where user_id=${lit(userAId)}::uuid and label like 'Skill build:%')::int as cited_sources,
  (select count(*) from public.evidence where user_id=${lit(userAId)}::uuid and source_label like 'Skill build:%')::int as cited_evidence,
  (select count(*) from public.ai_usage_audit where user_id=${lit(userAId)}::uuid and function_name='generate-skill-export')::int as usage,
  (select count(*) from storage.objects where bucket_id='skill-packages' and split_part(name,'/',1)=${lit(userAId)})::int as objects
`);

  for (let i = 0; i < 5; i += 1) {
    await dbq(`insert into public.harness_runs(user_id,kind,status,stage,request_id,stage_detail)
      values (${lit(userBId)}::uuid,'generate','failed','failed',${lit(`r111_limit_${i}_${suffix}`)},'{}'::jsonb)`);
  }
  const sixth = await invoke(tokenB, { request_id: `r111_limit_call_${suffix}`, transcript: baseTranscript });

  await dbq(`insert into public.ai_usage_audit(user_id,function_name,provider,model,purpose,status,est_cost_usd,metadata)
    values (${lit(userEId)}::uuid,'r111-probe','unknown','probe','spend-gate','ok',3.1,'{}'::jsonb)`);
  const spend = await invoke(tokenE, { request_id: `r111_spend_${suffix}`, transcript: baseTranscript });

  const staleRequest = `r111_stale_${suffix}`;
  const stalePromise = invoke(tokenC, { request_id: staleRequest, transcript: baseTranscript });
  for (let i = 0; i < 80; i += 1) {
    const rows = await dbq(`select stage from public.harness_runs where user_id=${lit(userCId)}::uuid and request_id=${lit(staleRequest)} limit 1`);
    if (rows?.[0]?.stage === "generating" || rows?.[0]?.stage === "checking" || rows?.[0]?.stage === "packaging") break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await dbq(`insert into public.user_decisions(user_id,decision_text,rationale,status,source)
    values (${lit(userCId)}::uuid,'Changed while the skill was being built.','Forces a stale source snapshot.','active','manual')`);
  const stale = await stalePromise;
  const staleRows = await dbq(`select
    (select count(*) from public.skill_exports where user_id=${lit(userCId)}::uuid)::int as exports,
    (select count(*) from public.generated_artifacts where user_id=${lit(userCId)}::uuid and kind='skill')::int as artifacts,
    (select count(*) from storage.objects where bucket_id='skill-packages' and split_part(name,'/',1)=${lit(userCId)})::int as objects,
    (select count(*) from public.harness_runs where user_id=${lit(userCId)}::uuid and request_id=${lit(staleRequest)} and status='failed')::int as failed_runs
  `);

  await dbq(`create or replace function public.r111_fail_skill_artifact() returns trigger language plpgsql as $$ begin
    if new.user_id = ${lit(userDId)}::uuid and new.kind = 'skill' then raise exception 'r111_forced_artifact_failure'; end if;
    return new; end $$;
    create trigger r111_fail_skill_artifact before insert on public.generated_artifacts for each row execute function public.r111_fail_skill_artifact();`);
  let atomic;
  try {
    atomic = await invoke(tokenD, { request_id: `r111_atomic_${suffix}`, transcript: baseTranscript });
  } finally {
    await dbq("drop trigger if exists r111_fail_skill_artifact on public.generated_artifacts; drop function if exists public.r111_fail_skill_artifact();");
  }
  const atomicRows = await dbq(`select
    (select count(*) from public.skill_exports where user_id=${lit(userDId)}::uuid)::int as exports,
    (select count(*) from public.generated_artifacts where user_id=${lit(userDId)}::uuid and kind='skill')::int as artifacts,
    (select count(*) from public.skill_provenance where user_id=${lit(userDId)}::uuid)::int as provenance,
    (select count(*) from storage.objects where bucket_id='skill-packages' and split_part(name,'/',1)=${lit(userDId)})::int as objects,
    (select count(*) from public.harness_runs where user_id=${lit(userDId)}::uuid and kind='generate' and status='failed')::int as failed_runs
  `);

  output = {
    anonymous_status: anonymous.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    oversized_status: oversized.response.status,
    extra_field_status: extra.response.status,
    missing_request_status: missingRequest.response.status,
    direct_rpc_status: directRpc.response.status,
    direct_artifact_status: directArtifact.response.status,
    first_status: first.response.status,
    first_triage_result: first.body?.triage?.result ?? null,
    first_skill: Boolean(first.body?.skill?.id),
    first_artifact: Boolean(first.body?.artifact_id),
    first_zip: typeof first.body?.zip_base64 === "string" && first.body.zip_base64.length > 100,
    first_package_sha: /^[a-f0-9]{64}$/.test(first.body?.package_sha256 ?? ""),
    retry_status: retry.response.status,
    retry_idempotent: retry.body?.idempotent === true,
    retry_same_run: retry.body?.run_id === first.body?.run_id,
    retry_same_artifact: retry.body?.result?.artifact_id === first.body?.artifact_id,
    conflict_status: conflict.response.status,
    conflict_error: conflict.body?.error,
    cross_tenant_artifact_rows: Array.isArray(crossTenantArtifact.body) ? crossTenantArtifact.body.length : -1,
    primary: primaryRows?.[0] ?? {},
    sixth_status: sixth.response.status,
    sixth_error: sixth.body?.error,
    spend_status: spend.response.status,
    spend_error: spend.body?.error,
    stale_status: stale.response.status,
    stale_error: stale.body?.error,
    stale: staleRows?.[0] ?? {},
    atomic_status: atomic.response.status,
    atomic_error: atomic.body?.error,
    atomic: atomicRows?.[0] ?? {},
  };
} finally {
  await dbq("drop trigger if exists r111_fail_skill_artifact on public.generated_artifacts; drop function if exists public.r111_fail_skill_artifact();").catch(() => undefined);
  if (signedTokens.length === userIds.length) {
    const objects = await dbq(`select name from storage.objects where bucket_id='skill-packages'
      and split_part(name,'/',1) in (${userIds.map(lit).join(",")})`).catch(() => []);
    for (let index = 0; index < userIds.length; index += 1) {
      const names = (objects ?? []).map((row) => row.name).filter((name) => name.startsWith(`${userIds[index]}/`));
      if (names.length === 0) continue;
      await fetch(`${url}/storage/v1/object/skill-packages`, {
        method: "DELETE",
        headers: { apikey: publishableKey, Authorization: `Bearer ${signedTokens[index]}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: names }),
      }).catch(() => undefined);
    }
  }
  await dbq(cleanupSql).catch(() => undefined);
  const cleanup = await dbq(`select
    (select count(*) from auth.users where id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as auth_users,
    (select count(*) from public.harness_runs where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as runs,
    (select count(*) from public.skill_exports where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as exports,
    (select count(*) from public.generated_artifacts where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as artifacts,
    (select count(*) from public.skill_provenance where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as provenance,
    (select count(*) from public.ai_usage_audit where user_id in (${userIds.map((id) => `${lit(id)}::uuid`).join(",")}))::int as usage,
    (select count(*) from storage.objects where bucket_id='skill-packages' and split_part(name,'/',1) in (${userIds.map(lit).join(",")}))::int as objects
  `);
  output.cleanup = cleanup?.[0] ?? {};
  console.log(JSON.stringify(output));
}
