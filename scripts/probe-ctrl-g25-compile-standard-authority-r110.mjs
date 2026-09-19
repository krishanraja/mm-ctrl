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

const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const jsonLit = (value) => `${lit(JSON.stringify(value))}::jsonb`;
const emailA = `r110-a-${suffix}@example.com`;
const emailB = `r110-b-${suffix}@example.com`;
const ids = {
  evidence1: crypto.randomUUID(),
  evidence2: crypto.randomUUID(),
  evidenceB1: crypto.randomUUID(),
  evidenceB2: crypto.randomUUID(),
  primary: crypto.randomUUID(),
  stale: crypto.randomUUID(),
  atomic: crypto.randomUUID(),
  halt: crypto.randomUUID(),
  template: crypto.randomUUID(),
  sixth: crypto.randomUUID(),
  incomplete: crypto.randomUUID(),
  unreceipted: crypto.randomUUID(),
  notReady: crypto.randomUUID(),
  spend: crypto.randomUUID(),
};
const surfaces = {
  primary: `R110 board standard ${suffix}`,
  stale: `R110 stale snapshot ${suffix}`,
  atomic: `R110 atomic rollback ${suffix}`,
  halt: `R110 honest halt ${suffix}`,
  template: `R110 template route ${suffix}`,
  sixth: `R110 sixth compile ${suffix}`,
  incomplete: `R110 incomplete grades ${suffix}`,
  unreceipted: `R110 unreceipted grades ${suffix}`,
  notReady: `R110 unfinished sort ${suffix}`,
  spend: `R110 spend gate ${suffix}`,
};
const constructFor = Object.fromEntries(Object.keys(surfaces).map((key) => [key, crypto.randomUUID()]));
const authRows = [[userAId, emailA], [userBId, emailB]];

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

async function invoke(token, body, { method = "POST", contentType = "application/json", raw = false } = {}) {
  const response = await fetch(`${url}/functions/v1/compile-standard`, {
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

async function waitForRun(token, runId, terminal = ["ready", "failed", "halted", "template_and_voice"]) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const result = await rest(`harness_runs?id=eq.${runId}&select=id,status,stage,stage_detail,error`, token);
    const row = result.body?.[0];
    if (row && terminal.includes(row.stage)) return row;
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  throw new Error(`terminal_timeout:${runId}`);
}

function makeDeck(key, userId, mode = "split") {
  const runId = ids[key];
  const constructId = constructFor[key];
  const items = [];
  const grades = [];
  const receipts = [];
  const originals = [];
  for (let index = 0; index < 4; index += 1) {
    const pairId = crypto.randomUUID();
    const satisfiesId = crypto.randomUUID();
    const violatesId = crypto.randomUUID();
    originals.push(satisfiesId);
    items.push({
      id: satisfiesId, user_id: userId, session_id: runId, surface: surfaces[key],
      body: `Revenue retention improved by ${12 + index}% and the named owner will report the next move.`,
      origin: "synthesised", pair_id: pairId, pair_role: "satisfies",
      intended_dimension: "includes a specific number", targets: [constructId], held_out: false,
      repeat_of: null, position: index * 2 + 1,
    });
    items.push({
      id: violatesId, user_id: userId, session_id: runId, surface: surfaces[key],
      body: "Revenue retention improved and the team will report the next move.",
      origin: "synthesised", pair_id: pairId, pair_role: "violates",
      intended_dimension: null, targets: [constructId], held_out: false,
      repeat_of: null, position: index * 2 + 2,
    });
    const satisfiesVerdict = "send";
    const violatesVerdict = mode === "halt" ? "send" : "would_not_send";
    grades.push({ item_id: satisfiesId, verdict: satisfiesVerdict, why: "The number makes the consequence testable.", ms: 900 });
    grades.push({ item_id: violatesId, verdict: violatesVerdict, why: "It hides the size of the result.", ms: 950 });
  }
  for (let index = 0; index < 3; index += 1) {
    const id = crypto.randomUUID();
    const repeatVerdict = mode === "template" ? "would_not_send" : "send";
    items.push({
      id, user_id: userId, session_id: runId, surface: surfaces[key],
      body: `Revenue retention improved by ${12 + index}% and the named owner will report the next move.`,
      origin: "synthesised", pair_id: null, pair_role: null, intended_dimension: null,
      targets: [], held_out: false, repeat_of: originals[index], position: 9 + index,
    });
    grades.push({ item_id: id, verdict: repeatVerdict, why: null, ms: 700 });
  }
  for (const [index, grade] of grades.entries()) {
    receipts.push({
      id: crypto.randomUUID(), user_id: userId, request_id: `r110_grade_${key}_${index}_${suffix}`,
      request_fingerprint: "a".repeat(64), run_id: runId, item_id: grade.item_id, result: {},
    });
  }
  return { items, grades, receipts };
}

const decks = {
  primary: makeDeck("primary", userAId),
  stale: makeDeck("stale", userAId),
  atomic: makeDeck("atomic", userAId),
  halt: makeDeck("halt", userAId, "halt"),
  template: makeDeck("template", userAId, "template"),
  sixth: makeDeck("sixth", userAId),
  spend: makeDeck("spend", userBId),
};
const allDecks = Object.values(decks);

function itemValues(items) {
  return items.map((item) => `(
    ${lit(item.id)}::uuid, ${lit(item.user_id)}::uuid, ${lit(item.session_id)}::uuid,
    ${lit(item.surface)}, ${lit(item.body)}, ${lit(item.origin)},
    ${item.pair_id ? `${lit(item.pair_id)}::uuid` : "null"}, ${item.pair_role ? lit(item.pair_role) : "null"},
    ${item.intended_dimension ? lit(item.intended_dimension) : "null"},
    ${item.targets.length ? `array[${item.targets.map((id) => `${lit(id)}::uuid`).join(",")}]` : "array[]::uuid[]"}, ${item.held_out},
    ${item.repeat_of ? `${lit(item.repeat_of)}::uuid` : "null"}, ${item.position}
  )`).join(",\n");
}
function gradeValues(deck, userId) {
  return deck.grades.map((grade) => `(
    ${lit(userId)}::uuid, ${lit(grade.item_id)}::uuid, ${lit(grade.verdict)},
    ${grade.why ? lit(grade.why) : "null"}, ${grade.ms}
  )`).join(",\n");
}
function receiptValues(receipts) {
  return receipts.map((receipt) => `(
    ${lit(receipt.id)}::uuid, ${lit(receipt.user_id)}::uuid, ${lit(receipt.request_id)},
    ${lit(receipt.request_fingerprint)}, ${lit(receipt.run_id)}::uuid, ${lit(receipt.item_id)}::uuid, '{}'::jsonb
  )`).join(",\n");
}

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

const runEntries = [
  ["primary", userAId, "done", "ready"], ["stale", userAId, "done", "ready"],
  ["atomic", userAId, "done", "ready"], ["halt", userAId, "done", "ready"],
  ["template", userAId, "done", "ready"], ["sixth", userAId, "done", "ready"],
  ["incomplete", userAId, "done", "ready"], ["unreceipted", userAId, "done", "ready"],
  ["notReady", userAId, "running", "assembling"], ["spend", userBId, "done", "ready"],
];
const setupDataSql = `
insert into public.evidence(id,user_id,kind,body,source_label,situated,situation,speaker_is_owner,occurred_at)
values
(${lit(ids.evidence1)}::uuid,${lit(userAId)}::uuid,'grade','I trust claims when the consequence has a number.','R110 fixture',true,'grading board updates',true,now()),
(${lit(ids.evidence2)}::uuid,${lit(userAId)}::uuid,'grade','A number makes the claim answerable.','R110 fixture',true,'grading board updates',true,now()),
(${lit(ids.evidenceB1)}::uuid,${lit(userBId)}::uuid,'grade','I trust claims when the consequence has a number.','R110 fixture',true,'grading board updates',true,now()),
(${lit(ids.evidenceB2)}::uuid,${lit(userBId)}::uuid,'grade','A number makes the claim answerable.','R110 fixture',true,'grading board updates',true,now());
insert into public.constructs(id,user_id,scope,status,emergent_pole,rationale,observable,evidence_ids)
values
${Object.entries(constructFor).map(([key, id]) => `(
  ${lit(id)}::uuid,
  ${lit(key === "spend" ? userBId : userAId)}::uuid,
  'person','candidate','Includes a specific number','A claim should make its consequence testable.','has_number',
  array[${key === "spend" ? `${lit(ids.evidenceB1)}::uuid,${lit(ids.evidenceB2)}::uuid` : `${lit(ids.evidence1)}::uuid,${lit(ids.evidence2)}::uuid`}]
)`).join(",\n")};
insert into public.harness_runs(id,user_id,kind,surface,status,stage,stage_detail)
values
${runEntries.map(([key, userId, status, stage]) => `(
  ${lit(ids[key])}::uuid,${lit(userId)}::uuid,'sort',${lit(surfaces[key])},${lit(status)},${lit(stage)},'{}'::jsonb
)`).join(",\n")};
insert into public.sort_items(
  id,user_id,session_id,surface,body,origin,pair_id,pair_role,intended_dimension,targets,held_out,repeat_of,position
) values
${itemValues(allDecks.flatMap((deck) => deck.items))};
insert into public.sort_grades(user_id,item_id,verdict,why,ms_to_grade) values
${allDecks.map((deck, index) => gradeValues(deck, index === allDecks.length - 1 ? userBId : userAId)).join(",\n")};
insert into public.sort_grade_submission_receipts(
  id,user_id,request_id,request_fingerprint,run_id,item_id,result
) values
${receiptValues(allDecks.flatMap((deck) => deck.receipts))};
`;

const incompleteItem1 = crypto.randomUUID();
const incompleteItem2 = crypto.randomUUID();
const unreceiptedItem = crypto.randomUUID();
const notReadyItem = crypto.randomUUID();
const setupEdgeSql = `
insert into public.sort_items(id,user_id,session_id,surface,body,origin,targets,held_out,position)
values
(${lit(incompleteItem1)}::uuid,${lit(userAId)}::uuid,${lit(ids.incomplete)}::uuid,${lit(surfaces.incomplete)},'Revenue grew by 12%.','own',array[${lit(constructFor.incomplete)}::uuid],false,1),
(${lit(incompleteItem2)}::uuid,${lit(userAId)}::uuid,${lit(ids.incomplete)}::uuid,${lit(surfaces.incomplete)},'Revenue grew.','own',array[${lit(constructFor.incomplete)}::uuid],false,2),
(${lit(unreceiptedItem)}::uuid,${lit(userAId)}::uuid,${lit(ids.unreceipted)}::uuid,${lit(surfaces.unreceipted)},'Revenue grew by 12%.','own',array[${lit(constructFor.unreceipted)}::uuid],false,1),
(${lit(notReadyItem)}::uuid,${lit(userAId)}::uuid,${lit(ids.notReady)}::uuid,${lit(surfaces.notReady)},'Revenue grew by 12%.','own',array[${lit(constructFor.notReady)}::uuid],false,1);
insert into public.sort_grades(user_id,item_id,verdict,why,ms_to_grade) values
(${lit(userAId)}::uuid,${lit(incompleteItem1)}::uuid,'send','The number is explicit.',500),
(${lit(userAId)}::uuid,${lit(unreceiptedItem)}::uuid,'send','The number is explicit.',500);
insert into public.sort_grade_submission_receipts(user_id,request_id,request_fingerprint,run_id,item_id,result)
values(${lit(userAId)}::uuid,${lit(`r110_incomplete_${suffix}`)},${lit("b".repeat(64))},${lit(ids.incomplete)}::uuid,${lit(incompleteItem1)}::uuid,'{}'::jsonb);
insert into public.ai_usage_audit(user_id,function_name,provider,model,purpose,status,est_cost_usd,metadata)
values(${lit(userBId)}::uuid,'r110-spend-fixture','unknown','fixture','probe','ok',2.00,'{}'::jsonb);
`;

const installFailureTriggersSql = `
create or replace function public.r110_force_stale_grade()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_sort uuid; v_item uuid;
begin
  if new.function_name='compile-standard' and new.user_id=${lit(userAId)}::uuid then
    select (stage_detail->>'sort_run_id')::uuid into v_sort from public.harness_runs
    where id=(new.metadata->>'run_id')::uuid and surface=${lit(surfaces.stale)};
    if v_sort is not null then
      select i.id into v_item from public.sort_items i join public.sort_grades g on g.item_id=i.id
      where i.session_id=v_sort and g.verdict='would_not_send' order by i.position limit 1;
      update public.sort_grades set verdict='send' where item_id=v_item;
    end if;
  end if;
  return new;
end; $$;
revoke all on function public.r110_force_stale_grade() from public,anon,authenticated;
drop trigger if exists r110_force_stale_grade on public.ai_usage_audit;
create trigger r110_force_stale_grade after insert on public.ai_usage_audit
for each row execute function public.r110_force_stale_grade();

create or replace function public.r110_force_artifact_failure()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if new.kind='standard' and new.metadata->>'surface'=${lit(surfaces.atomic)} then
    raise exception 'r110_forced_artifact_failure';
  end if;
  return new;
end; $$;
revoke all on function public.r110_force_artifact_failure() from public,anon,authenticated;
drop trigger if exists r110_force_artifact_failure on public.generated_artifacts;
create trigger r110_force_artifact_failure before insert on public.generated_artifacts
for each row execute function public.r110_force_artifact_failure();
`;
const removeTriggersSql = `
drop trigger if exists r110_force_stale_grade on public.ai_usage_audit;
drop function if exists public.r110_force_stale_grade();
drop trigger if exists r110_force_artifact_failure on public.generated_artifacts;
drop function if exists public.r110_force_artifact_failure();
`;
const cleanupSql = `
${removeTriggersSql}
delete from public.ai_usage_audit where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid);
delete from public.profiles where id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid);
delete from auth.users where id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid);
`;

let triggersInstalled = false;
let finalResult;
try {
  await dbq(setupAuthSql);
  await dbq(setupDataSql);
  await dbq(setupEdgeSql);
  await dbq(installFailureTriggersSql);
  triggersInstalled = true;
  const tokenA = await signIn(emailA);
  const tokenB = await signIn(emailB);
  const primaryRequest = `r110_primary_${suffix}`;
  const primaryPayload = { run_id: ids.primary, request_id: primaryRequest };

  const anonymous = await invoke(null, primaryPayload);
  const wrongMethod = await invoke(tokenA, null, { method: "GET" });
  const wrongMedia = await invoke(tokenA, "plain", { contentType: "text/plain", raw: true });
  const oversized = await invoke(tokenA, "x".repeat(3_000), { raw: true });
  const extraField = await invoke(tokenA, { ...primaryPayload, target_user_id: userBId });
  const missingRequest = await invoke(tokenA, { run_id: ids.primary });
  const invalidRun = await invoke(tokenA, { run_id: "not-a-uuid", request_id: primaryRequest });
  const crossTenant = await invoke(tokenB, primaryPayload);
  const crossTenantRpc = await rest("rpc/reserve_compile_standard_run", tokenB, {
    method: "POST",
    body: JSON.stringify({
      p_request_id: `r110_cross_${suffix}`,
      p_request_fingerprint: "c".repeat(64),
      p_sort_run_id: ids.primary,
      p_thresholds: {},
      p_capability: "wrong".repeat(16),
    }),
  });
  const directOwnerRpc = await rest("rpc/reserve_compile_standard_run", tokenA, {
    method: "POST",
    body: JSON.stringify({
      p_request_id: `r110_direct_${suffix}`,
      p_request_fingerprint: "d".repeat(64),
      p_sort_run_id: ids.sixth,
      p_thresholds: {},
      p_capability: "wrong".repeat(16),
    }),
  });
  const directCriteria = await rest("criteria", tokenA, {
    method: "POST",
    body: JSON.stringify({
      user_id: userAId, scope: "person", construct_id: constructFor.primary,
      surface: surfaces.primary, name: "Forged", check_text: "Forged", weight: "important",
      disc_verdict: "untested", provenance: { forged: true }, disposition: "advisory",
    }),
  });
  const incomplete = await invoke(tokenA, { run_id: ids.incomplete, request_id: `r110_incomplete_run_${suffix}` });
  const unreceipted = await invoke(tokenA, { run_id: ids.unreceipted, request_id: `r110_unreceipted_${suffix}` });
  const notReady = await invoke(tokenA, { run_id: ids.notReady, request_id: `r110_notready_${suffix}` });

  const first = await invoke(tokenA, primaryPayload);
  const retry = await invoke(tokenA, primaryPayload);
  const conflict = await invoke(tokenA, { run_id: ids.sixth, request_id: primaryRequest });
  const primaryTerminal = await waitForRun(tokenA, first.body?.run_id);
  const primaryRuns = await rest(`harness_runs?id=eq.${first.body?.run_id}&select=id,stage,status,stage_detail`, tokenA);
  const primaryCriteria = await rest(`criteria?surface=eq.${encodeURIComponent(surfaces.primary)}&is_current=eq.true&select=id,name,version,disposition,provenance`, tokenA);
  const primaryArtifacts = await rest(`generated_artifacts?metadata->>compile_run_id=eq.${first.body?.run_id}&select=id,kind,body,metadata`, tokenA);
  const primaryUsage = await rest(`ai_usage_audit?function_name=eq.compile-standard&metadata->>run_id=eq.${first.body?.run_id}&select=id`, tokenA);

  const stale = await invoke(tokenA, { run_id: ids.stale, request_id: `r110_stale_${suffix}` });
  const staleTerminal = await waitForRun(tokenA, stale.body?.run_id);
  const staleCriteria = await rest(`criteria?surface=eq.${encodeURIComponent(surfaces.stale)}&select=id`, tokenA);
  const staleArtifacts = await rest(`generated_artifacts?metadata->>compile_run_id=eq.${stale.body?.run_id}&select=id`, tokenA);

  const atomic = await invoke(tokenA, { run_id: ids.atomic, request_id: `r110_atomic_${suffix}` });
  const atomicTerminal = await waitForRun(tokenA, atomic.body?.run_id);
  const atomicCriteria = await rest(`criteria?surface=eq.${encodeURIComponent(surfaces.atomic)}&select=id`, tokenA);
  const atomicArtifacts = await rest(`generated_artifacts?metadata->>compile_run_id=eq.${atomic.body?.run_id}&select=id`, tokenA);
  const atomicConstruct = await rest(`constructs?id=eq.${constructFor.atomic}&select=status,contrast_pole`, tokenA);

  const halt = await invoke(tokenA, { run_id: ids.halt, request_id: `r110_halt_${suffix}` });
  const haltTerminal = await waitForRun(tokenA, halt.body?.run_id);
  const haltUsage = await rest(`ai_usage_audit?function_name=eq.compile-standard&metadata->>run_id=eq.${halt.body?.run_id}&select=id`, tokenA);
  const template = await invoke(tokenA, { run_id: ids.template, request_id: `r110_template_${suffix}` });
  const templateTerminal = await waitForRun(tokenA, template.body?.run_id);
  const templateUsage = await rest(`ai_usage_audit?function_name=eq.compile-standard&metadata->>run_id=eq.${template.body?.run_id}&select=id`, tokenA);

  const sixth = await invoke(tokenA, { run_id: ids.sixth, request_id: `r110_sixth_${suffix}` });
  const spend = await invoke(tokenB, { run_id: ids.spend, request_id: `r110_spend_${suffix}` });

  finalResult = {
    anonymous_status: anonymous.response.status,
    wrong_method_status: wrongMethod.response.status,
    wrong_media_status: wrongMedia.response.status,
    oversized_status: oversized.response.status,
    extra_field_status: extraField.response.status,
    missing_request_status: missingRequest.response.status,
    invalid_run_status: invalidRun.response.status,
    cross_tenant_status: crossTenant.response.status,
    cross_tenant_rpc_status: crossTenantRpc.response.status,
    direct_owner_rpc_status: directOwnerRpc.response.status,
    direct_criteria_insert_status: directCriteria.response.status,
    incomplete_status: incomplete.response.status,
    incomplete_error: incomplete.body?.error ?? null,
    unreceipted_status: unreceipted.response.status,
    unreceipted_error: unreceipted.body?.error ?? null,
    not_ready_status: notReady.response.status,
    first_status: first.response.status,
    retry_status: retry.response.status,
    retry_idempotent: retry.body?.idempotent ?? null,
    retry_same_run: retry.body?.run_id === first.body?.run_id,
    conflict_status: conflict.response.status,
    conflict_error: conflict.body?.error ?? null,
    primary_stage: primaryTerminal.stage,
    primary_status: primaryTerminal.status,
    primary_runs: primaryRuns.body?.length ?? 0,
    primary_criteria: primaryCriteria.body?.length ?? 0,
    primary_all_advisory: (primaryCriteria.body ?? []).every((row) => row.disposition === "advisory"),
    primary_version_one: (primaryCriteria.body ?? []).every((row) => row.version === 1),
    primary_provenance_exact: (primaryCriteria.body ?? []).every((row) => row.provenance?.sort_run_id === ids.primary && row.provenance?.compile_run_id === first.body?.run_id),
    primary_artifacts: primaryArtifacts.body?.length ?? 0,
    primary_artifact_nonempty: typeof primaryArtifacts.body?.[0]?.body === "string" && primaryArtifacts.body[0].body.length > 100,
    primary_usage: primaryUsage.body?.length ?? 0,
    stale_status: stale.response.status,
    stale_terminal_stage: staleTerminal.stage,
    stale_zero_criteria: staleCriteria.body?.length === 0,
    stale_zero_artifacts: staleArtifacts.body?.length === 0,
    atomic_status: atomic.response.status,
    atomic_terminal_stage: atomicTerminal.stage,
    atomic_zero_criteria: atomicCriteria.body?.length === 0,
    atomic_zero_artifacts: atomicArtifacts.body?.length === 0,
    atomic_construct_unchanged: atomicConstruct.body?.[0]?.status === "candidate" && atomicConstruct.body?.[0]?.contrast_pole === null,
    halt_status: halt.response.status,
    halt_terminal_stage: haltTerminal.stage,
    halt_zero_usage: haltUsage.body?.length === 0,
    template_status: template.response.status,
    template_terminal_stage: templateTerminal.stage,
    template_zero_usage: templateUsage.body?.length === 0,
    sixth_status: sixth.response.status,
    sixth_error: sixth.body?.error ?? null,
    spend_status: spend.response.status,
    spend_error: spend.body?.error ?? null,
  };
} finally {
  if (triggersInstalled) {
    try { await dbq(removeTriggersSql); } catch { /* cleanup retries below */ }
  }
  await dbq(cleanupSql);
  const cleanup = await dbq(`
    select
      (select count(*) from auth.users where id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as auth_users,
      (select count(*) from auth.identities where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as identities,
      (select count(*) from public.profiles where id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as profiles,
      (select count(*) from public.harness_runs where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as runs,
      (select count(*) from public.sort_items where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as items,
      (select count(*) from public.sort_grades where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as grades,
      (select count(*) from public.sort_grade_submission_receipts where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as receipts,
      (select count(*) from public.criteria where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as criteria,
      (select count(*) from public.generated_artifacts where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as artifacts,
      (select count(*) from public.ai_usage_audit where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as usage,
      (select count(*) from public.evidence where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as evidence,
      (select count(*) from public.constructs where user_id in (${lit(userAId)}::uuid,${lit(userBId)}::uuid))::integer as constructs,
      (select count(*) from pg_trigger where tgname in ('r110_force_stale_grade','r110_force_artifact_failure'))::integer as transient_triggers;
  `);
  if (finalResult) finalResult.cleanup = cleanup?.[0] ?? null;
}

console.log(JSON.stringify(finalResult));
