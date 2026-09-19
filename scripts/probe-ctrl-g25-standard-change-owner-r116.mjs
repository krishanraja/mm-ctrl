import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF ?? "";
const url = process.env.CTRL_PROBE_SUPABASE_URL ?? "";
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY ?? "";
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD ?? "";
const keepFixture = process.env.CTRL_PROBE_KEEP_FIXTURE === "1";
const isolatedProjectRef = "cgkcplcamsijghalintq";

if (projectRef !== isolatedProjectRef || url !== `https://${isolatedProjectRef}.supabase.co` ||
    publishableKey.length < 20 || password.length < 20) {
  console.error("Set the exact isolated project, transient public key and fixture password inputs.");
  process.exit(2);
}

const suffix = crypto.randomBytes(6).toString("hex");
const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
const run1 = crypto.randomUUID();
const run2 = crypto.randomUUID();
const standardArtifact = crypto.randomUUID();
const criterion = crypto.randomUUID();
const captureRun = crypto.randomUUID();
const emailA = `r116-a-${suffix}@example.invalid`;
const emailB = `r116-b-${suffix}@example.invalid`;
const requestSignal = () => AbortSignal.timeout(60_000);
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = async (response) => {
  const value = await response.text();
  try { return JSON.parse(value); } catch { return value; }
};

function dbq(sql, { allowFailure = false } = {}) {
  const executable = process.platform === "win32" ? process.execPath : "npx";
  const prefix = process.platform === "win32"
    ? ["C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js"]
    : [];
  const run = spawnSync(executable, [...prefix,
    "supabase", "db", "query", "--linked", "--project-ref", projectRef,
    "--output-format", "json", sql.trim().replace(/\r?\n/g, " "),
  ], { encoding: "utf8", cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024 });
  if (run.status !== 0) {
    const detail = `${run.error?.message ?? ""}\n${run.stderr ?? ""}\n${run.stdout ?? ""}`.trim().slice(0, 1_500);
    if (allowFailure) return { failed: true, message: detail };
    throw new Error(`db_query_failed:${detail}`);
  }
  return JSON.parse(run.stdout).rows ?? [];
}

async function signIn(email) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: requestSignal(),
  });
  const body = await json(response);
  if (!response.ok || !body?.access_token) throw new Error(`sign_in_failed:${response.status}`);
  return body.access_token;
}

async function invoke(name, token, body, options = {}) {
  const method = options.method ?? "POST";
  const response = await fetch(`${url}/functions/v1/${name}`, {
    method,
    headers: {
      apikey: publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.contentType === false ? {} : { "Content-Type": options.contentType ?? "application/json" }),
    },
    body: method === "POST" ? (options.raw ? String(body) : JSON.stringify(body)) : undefined,
    signal: requestSignal(),
  });
  return { status: response.status, body: await json(response) };
}

async function rest(path, token, options = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    signal: requestSignal(),
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  return { status: response.status, body: await json(response) };
}

function isoWeek(date = new Date()) {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((value - start) / 86_400_000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const week = isoWeek();
const event1 = `${run1}:judgement:proof`;
const event2 = `${run2}:judgement:proof`;
const authRow = (id, email) => `(
  '00000000-0000-0000-0000-000000000000',${lit(id)}::uuid,'authenticated','authenticated',${lit(email)},
  extensions.crypt(${lit(password)},extensions.gen_salt('bf')),now(),'','','','','','','',
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false,false,now(),now())`;
const identityRow = (id, email) => `(
  gen_random_uuid(),${lit(id)},${lit(id)}::uuid,
  jsonb_build_object('sub',${lit(id)},'email',${lit(email)},'email_verified',true),
  'email',now(),now(),now())`;
const evidence = `jsonb_build_object(
  'source_ids',jsonb_build_array(${lit(event1)},${lit(event2)}),
  'lines',jsonb_build_array(
    jsonb_build_object('sourceId',${lit(event1)},'locator',${lit(`review ${run1}, judgement:proof`)},'week',${lit(week)},'surface','proposal','criterion','Proof before confidence','verdict','breaks','quote',null,'disposition','rejected'),
    jsonb_build_object('sourceId',${lit(event2)},'locator',${lit(`review ${run2}, judgement:proof`)},'week',${lit(week)},'surface','proposal','criterion','Proof before confidence','verdict','breaks','quote',null,'disposition','rejected')
  ),
  'criterion_id',${lit(criterion)},'criterion_name','Proof before confidence',
  'surfaces',jsonb_build_array('proposal'),
  'size',jsonb_build_object('delta',0,'paired_obligation','replace the old scope'))`;
const governance = `jsonb_build_object(
  'owner','subject-owner','policy','r116-fixture','standard','exact-source',
  'alternative_explanations',jsonb_build_array('reviewer defect'),
  'expected_effect','fewer false positive blocks','validation','fresh independent check',
  'size_context','replacement not accumulation','privacy','owner-private',
  'dependencies',jsonb_build_array('ctrl-compile','ctrl-build','fresh-ctrl-check'),
  'rollback','restore exact prior head','measurement_plan','review future accepted work')`;

async function makeCandidate(token, ordinal) {
  const proposal = dbq(`select id,proposal_hash from public.proposals
    where user_id=${lit(userA)}::uuid and proposal_key=${lit(`false-positive:proof:${ordinal}`)}`)[0];
  const decision = dbq(`begin;
    select set_config('request.jwt.claim.sub',${lit(userA)},true);
    select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated;
    select public.decide_capture_proposal(
      ${lit(proposal.id)}::uuid,${lit(proposal.proposal_hash)},'accepted',
      jsonb_build_object(
        'accepted_surface','proposal',
        'accepted_delta','Treat this check as advisory for proposal work.',
        'apply_change',false
      )
    ) as result;
    commit;`)[0]?.result;
  if (!decision?.change_request_id) throw new Error(`decision_missing:${ordinal}`);

  const compiled = await invoke("compile-standard-change", token, {
    request_id: `r116_compile_${ordinal}_${suffix}`,
    change_request_id: decision.change_request_id,
    expected_request_hash: decision.change_request_hash,
  });
  const compilationId = compiled.body?.result?.compilation_id;
  const compileHash = compiled.body?.result?.compile_sha256;
  if (compiled.status !== 200 || !compilationId || !compileHash) {
    throw new Error(`compile_failed:${ordinal}:${compiled.status}:${JSON.stringify(compiled.body)}`);
  }
  const built = await invoke("build-standard-change", token, {
    request_id: `r116_build_${ordinal}_${suffix}`,
    compilation_id: compilationId,
    expected_compile_hash: compileHash,
  });
  const buildId = built.body?.result?.build_id;
  const packageHash = built.body?.result?.package_sha256;
  if (built.status !== 200 || !buildId || !packageHash) {
    throw new Error(`build_failed:${ordinal}:${built.status}:${JSON.stringify(built.body)}`);
  }
  const checked = await invoke("check-standard-change", token, {
    request_id: `r116_check_${ordinal}_${suffix}`,
    build_id: buildId,
    expected_package_hash: packageHash,
  });
  const checkId = checked.body?.result?.check_id;
  const resultHash = checked.body?.result?.result_sha256;
  if (checked.status !== 200 || checked.body?.verdict !== "passed" || !checkId || !resultHash) {
    throw new Error(`check_failed:${ordinal}:${checked.status}:${JSON.stringify(checked.body)}`);
  }
  return { ordinal, decision, compiled, built, checked, checkId, resultHash };
}

function ownerAction(action, fields) {
  return { action, ...fields };
}

let output = {};
let probePassed = false;
try {
  dbq(`
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
      reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,is_super_admin,is_sso_user,is_anonymous,created_at,updated_at)
    values ${authRow(userA, emailA)},${authRow(userB, emailB)};
    insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values ${identityRow(userA, emailA)},${identityRow(userB, emailB)};
    insert into public.harness_runs(id,user_id,kind,surface,status,stage,stage_detail,created_at,updated_at) values
      (${lit(run1)}::uuid,${lit(userA)}::uuid,'critique','proposal','done','ready','{}',now()-interval '2 days',now()),
      (${lit(run2)}::uuid,${lit(userA)}::uuid,'critique','proposal','done','ready','{}',now()-interval '1 day',now());
    insert into public.generated_artifacts(id,user_id,kind,name,body,metadata)
    values (${lit(standardArtifact)}::uuid,${lit(userA)}::uuid,'standard','Proposal standard','# Proposal standard\n\n## Proof before confidence\nName the proof before confidence.\n',jsonb_build_object('criteria_version',1));
    insert into public.criteria(id,user_id,surface,name,check_text,observable,weight,disc_verdict,provenance,version,is_current,disposition)
    values (${lit(criterion)}::uuid,${lit(userA)}::uuid,'proposal','Proof before confidence','Name the proof before confidence.','has_number','essential','keep','{"probe":"r116"}',1,true,'blocking');
    insert into public.ledger(user_id,source_run_id,source_event_key,week,surface,signal,criterion_id,criterion_name,verdict,quote,disposition,created_at) values
      (${lit(userA)}::uuid,${lit(run1)}::uuid,'judgement:proof',${lit(week)},'proposal','output',${lit(criterion)}::uuid,'Proof before confidence','breaks','The proof was present elsewhere.','rejected',now()-interval '2 days'),
      (${lit(userA)}::uuid,${lit(run2)}::uuid,'judgement:proof',${lit(week)},'proposal','output',${lit(criterion)}::uuid,'Proof before confidence','breaks','The proof was clear in the table.','rejected',now()-interval '1 day');
  `);

  const source = dbq(`select
    public.current_capture_source_snapshot(${lit(userA)}::uuid,${lit(week)},5) as snapshot,
    encode(extensions.digest(convert_to(body,'UTF8'),'sha256'),'hex') as standard_sha
    from public.generated_artifacts where id=${lit(standardArtifact)}::uuid`)[0];
  dbq(`insert into public.capture_runs(
      id,user_id,capture_week,source_snapshot,standard_artifact_id,standard_sha256,policy,summary,status
    ) values (
      ${lit(captureRun)}::uuid,${lit(userA)}::uuid,${lit(week)},${lit(source.snapshot)},
      ${lit(standardArtifact)}::uuid,${lit(source.standard_sha)},
      jsonb_build_object('window_weeks',5,'probe','r116'),jsonb_build_object('probe','r116'),'ready'
    );
    insert into public.proposals(
      user_id,type,surface,headline,delta_text,if_wrong,size_delta,evidence,status,
      proposal_key,proposal_version,proposal_hash,capture_run_id,source_standard_artifact_id,
      source_standard_sha256,source_snapshot,governance
    )
    select
      ${lit(userA)}::uuid,'false_positive','proposal','Proof check fired too widely',
      'Treat this check as advisory for proposal work.','Weak proposals may pass.',0,${evidence},'awaiting',
      'false-positive:proof:' || ordinal,1,
      encode(extensions.digest(convert_to('r116:' || ${lit(suffix)} || ':' || ordinal,'UTF8'),'sha256'),'hex'),
      ${lit(captureRun)}::uuid,${lit(standardArtifact)}::uuid,${lit(source.standard_sha)},${lit(source.snapshot)},${governance}
    from generate_series(1,3) ordinal;`);

  const [tokenA, tokenB] = await Promise.all([signIn(emailA), signIn(emailB)]);
  const anonymous = await invoke("review-standard-change", null, { action: "prepare" });
  const wrongMethod = await invoke("review-standard-change", tokenA, null, { method: "GET" });
  const wrongMedia = await invoke("review-standard-change", tokenA, "{}", { raw: true, contentType: "text/plain" });
  const oversized = await invoke("review-standard-change", tokenA, `{"action":"prepare","padding":"${"x".repeat(8_300)}"}`, { raw: true });
  const malformed = await invoke("review-standard-change", tokenA, { action: "prepare", unexpected: true });

  const candidates = [];
  for (const ordinal of [1, 2, 3]) candidates.push(await makeCandidate(tokenA, ordinal));
  const prepared = [];
  for (const candidate of candidates) {
    const response = await invoke("review-standard-change", tokenA, ownerAction("prepare", {
      check_id: candidate.checkId,
      expected_result_sha256: candidate.resultHash,
    }));
    if (response.status !== 200 || !response.body?.result?.review_packet_id) {
      throw new Error(`prepare_failed:${candidate.ordinal}:${response.status}:${JSON.stringify(response.body)}`);
    }
    prepared.push(response.body.result);
  }

  const prepareRetry = await invoke("review-standard-change", tokenA, ownerAction("prepare", {
    check_id: candidates[1].checkId,
    expected_result_sha256: candidates[1].resultHash,
  }));
  const crossOwner = await invoke("review-standard-change", tokenB, ownerAction("prepare", {
    check_id: candidates[1].checkId,
    expected_result_sha256: candidates[1].resultHash,
  }));
  const before = dbq(`select
    (select id from public.generated_artifacts where user_id=${lit(userA)}::uuid and kind='standard' order by created_at desc,id desc limit 1) as head_id,
    public.standard_change_text_sha256((select body from public.generated_artifacts where id=${lit(standardArtifact)}::uuid)) as body_sha,
    public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(userA)}::uuid)) as criteria_sha`)[0];

  const rejected = await invoke("review-standard-change", tokenA, ownerAction("decide", {
    review_packet_id: prepared[0].review_packet_id,
    expected_packet_sha256: prepared[0].review_packet_sha256,
    expected_standard_sha256: prepared[0].planned_standard_sha256,
    request_id: `r116_reject_${suffix}`,
    decision: "rejected",
    note: "The owner does not accept this candidate.",
  }));
  const afterReject = dbq(`select
    (select id from public.generated_artifacts where user_id=${lit(userA)}::uuid and kind='standard' order by created_at desc,id desc limit 1) as head_id,
    public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(userA)}::uuid)) as criteria_sha`)[0];

  const directInsert = await rest("standard_change_owner_decisions", tokenA, {
    method: "POST",
    body: JSON.stringify({ user_id: userA }),
  });
  const approveBase = {
    review_packet_id: prepared[1].review_packet_id,
    expected_packet_sha256: prepared[1].review_packet_sha256,
    expected_standard_sha256: prepared[1].planned_standard_sha256,
    decision: "approved",
    note: "I approve this exact bounded change.",
  };
  const approveRequestIds = [`r116_approve_a_${suffix}`, `r116_approve_b_${suffix}`];
  const approvalRace = await Promise.all(approveRequestIds.map((request_id) =>
    invoke("review-standard-change", tokenA, ownerAction("decide", { ...approveBase, request_id }))));
  console.error(`r116_probe:approval_race:${approvalRace.map((item) => item.status).join(",")}`);
  const winnerIndex = approvalRace.findIndex((item) => item.status === 200);
  if (winnerIndex < 0) throw new Error(`approval_race_no_winner:${JSON.stringify(approvalRace)}`);
  const winner = approvalRace[winnerIndex];
  const winningRequestId = approveRequestIds[winnerIndex];
  const applicationId = winner.body?.result?.application_id;
  const applicationHash = winner.body?.result?.application_hash;
  const activeSha = winner.body?.result?.active_standard_sha256;
  if (!applicationId || !applicationHash || !activeSha) throw new Error("approval_receipt_missing");

  const approvalRetry = await invoke("review-standard-change", tokenA, ownerAction("decide", {
    ...approveBase,
    request_id: winningRequestId,
  }));
  console.error(`r116_probe:approval_retry:${approvalRetry.status}`);
  const approvalConflict = await invoke("review-standard-change", tokenA, ownerAction("decide", {
    ...approveBase,
    request_id: winningRequestId,
    note: "Changed retry must not be accepted.",
  }));
  console.error(`r116_probe:approval_conflict:${approvalConflict.status}`);
  console.error("r116_probe:stale_approval:start");
  const staleApproval = await invoke("review-standard-change", tokenA, ownerAction("decide", {
    review_packet_id: prepared[2].review_packet_id,
    expected_packet_sha256: prepared[2].review_packet_sha256,
    expected_standard_sha256: prepared[2].planned_standard_sha256,
    request_id: `r116_stale_${suffix}`,
    decision: "approved",
    note: "This packet is now stale.",
  }));
  console.error(`r116_probe:stale_approval:${staleApproval.status}`);

  const foreignHead = crypto.randomUUID();
  dbq(`insert into public.generated_artifacts(id,user_id,kind,name,body,metadata)
    values (${lit(foreignHead)}::uuid,${lit(userA)}::uuid,'standard','Later unrelated head','# Later unrelated head','{"probe":"r116-non-head"}');`);
  const blockedReversal = await invoke("review-standard-change", tokenA, ownerAction("reverse", {
    application_id: applicationId,
    expected_application_hash: applicationHash,
    expected_active_standard_sha256: activeSha,
    request_id: `r116_reverse_blocked_${suffix}`,
    reason: "Prove that reversal refuses a later head.",
  }));
  dbq(`delete from public.generated_artifacts where id=${lit(foreignHead)}::uuid;`);

  const reverseRequestId = `r116_reverse_${suffix}`;
  const reverseBase = {
    application_id: applicationId,
    expected_application_hash: applicationHash,
    expected_active_standard_sha256: activeSha,
    request_id: reverseRequestId,
    reason: "Restore the exact prior owner-approved standard.",
  };
  const reversed = await invoke("review-standard-change", tokenA, ownerAction("reverse", reverseBase));
  const reversalRetry = await invoke("review-standard-change", tokenA, ownerAction("reverse", reverseBase));
  const reversalConflict = await invoke("review-standard-change", tokenA, ownerAction("reverse", {
    ...reverseBase,
    reason: "Changed retry must conflict.",
  }));

  const after = dbq(`select
    (select public.standard_change_text_sha256(body) from public.generated_artifacts where user_id=${lit(userA)}::uuid and kind='standard' order by created_at desc,id desc limit 1) as body_sha,
    public.standard_change_json_sha256(public.current_standard_criteria_snapshot(${lit(userA)}::uuid)) as criteria_sha,
    (select count(*) from public.standard_change_review_packets where user_id=${lit(userA)}::uuid)::int as review_packets,
    (select count(*) from public.standard_change_owner_decisions where user_id=${lit(userA)}::uuid)::int as decisions,
    (select count(*) from public.standard_change_applications where user_id=${lit(userA)}::uuid)::int as applications,
    (select count(*) from public.standard_change_reversals where user_id=${lit(userA)}::uuid)::int as reversals,
    (select count(*) from public.standard_versions where user_id=${lit(userA)}::uuid)::int as versions`)[0];

  output = {
    transport: {
      anonymous_status: anonymous.status,
      wrong_method_status: wrongMethod.status,
      wrong_media_status: wrongMedia.status,
      oversized_status: oversized.status,
      malformed_status: malformed.status,
    },
    r115_pipeline: candidates.map((item) => ({
      ordinal: item.ordinal,
      compile_status: item.compiled.status,
      build_status: item.built.status,
      check_status: item.checked.status,
      verdict: item.checked.body?.verdict,
    })),
    prepared_count: prepared.length,
    prepare_retry_idempotent: prepareRetry.body?.result?.idempotent === true,
    cross_owner_status: crossOwner.status,
    direct_insert_denied: directInsert.status >= 400,
    rejection_status: rejected.status,
    rejection_mutated_nothing: before.head_id === afterReject.head_id && before.criteria_sha === afterReject.criteria_sha,
    approval_race_statuses: approvalRace.map((item) => item.status).sort((a, b) => a - b),
    approval_retry_idempotent: approvalRetry.body?.result?.idempotent === true,
    approval_changed_retry_status: approvalConflict.status,
    stale_approval_status: staleApproval.status,
    non_head_reversal_status: blockedReversal.status,
    reversal_status: reversed.status,
    reversal_retry_idempotent: reversalRetry.body?.result?.idempotent === true,
    reversal_changed_retry_status: reversalConflict.status,
    exact_standard_restored: after.body_sha === before.body_sha,
    exact_criteria_restored: after.criteria_sha === before.criteria_sha,
    durable_counts: after,
  };

  const required = [
    anonymous.status === 401,
    wrongMethod.status === 405,
    wrongMedia.status === 415,
    oversized.status === 413,
    malformed.status === 400,
    prepared.length === 3,
    prepareRetry.body?.result?.idempotent === true,
    crossOwner.status === 404,
    directInsert.status >= 400,
    rejected.status === 200,
    output.rejection_mutated_nothing,
    JSON.stringify(output.approval_race_statuses) === JSON.stringify([200, 409]),
    approvalRetry.status === 200 && approvalRetry.body?.result?.idempotent === true,
    approvalConflict.status === 409,
    staleApproval.status === 409,
    blockedReversal.status === 409,
    reversed.status === 200,
    reversalRetry.status === 200 && reversalRetry.body?.result?.idempotent === true,
    reversalConflict.status === 409,
    output.exact_standard_restored,
    output.exact_criteria_restored,
    Number(after.applications) === 1,
    Number(after.reversals) === 1,
    Number(after.versions) === 2,
  ];
  if (required.some((value) => !value)) throw new Error(`acceptance_failed:${JSON.stringify(output)}`);
  probePassed = true;
} finally {
  if (keepFixture && probePassed) {
    output.fixture = {
      user_a: userA,
      user_b: userB,
      criterion_id: criterion,
      standard_artifact_id: standardArtifact,
      original_check_text: "Name the proof before confidence.",
    };
    output.cleanup = null;
    console.log(JSON.stringify(output));
  } else {
    dbq(`delete from auth.users where id in (${lit(userA)}::uuid,${lit(userB)}::uuid);`, { allowFailure: true });
    const cleanup = dbq(`select
    (select count(*) from auth.users where id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as auth_users,
    (select count(*) from public.standard_change_review_packets where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as review_packets,
    (select count(*) from public.standard_change_owner_decisions where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as decisions,
    (select count(*) from public.standard_change_applications where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as applications,
    (select count(*) from public.standard_change_reversals where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as reversals,
    (select count(*) from public.standard_versions where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as versions,
    (select count(*) from public.generated_artifacts where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as artifacts,
    (select count(*) from public.criteria where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as criteria`)[0];
    output.cleanup = cleanup;
    if (Object.values(cleanup).some((value) => Number(value) !== 0)) {
      throw new Error(`cleanup_failed:${JSON.stringify(cleanup)}`);
    }
    console.log(JSON.stringify(output));
  }
}
