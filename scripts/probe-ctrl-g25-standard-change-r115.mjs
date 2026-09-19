import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF ?? "";
const url = process.env.CTRL_PROBE_SUPABASE_URL ?? "";
const publishableKey = process.env.CTRL_PROBE_SUPABASE_PUBLISHABLE_KEY ?? "";
const password = process.env.CTRL_PROBE_FIXTURE_PASSWORD ?? "";
const isolatedProjectRef = "cgkcplcamsijghalintq";
if (projectRef !== isolatedProjectRef || url !== `https://${isolatedProjectRef}.supabase.co` ||
    publishableKey.length < 20 || password.length < 20) {
  console.error("Set the exact isolated project, transient public key and fixture password inputs.");
  process.exit(2);
}

const suffix = crypto.randomBytes(6).toString("hex");
const requestSignal = () => AbortSignal.timeout(20_000);
const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
const run1 = crypto.randomUUID();
const run2 = crypto.randomUUID();
const artifact = crypto.randomUUID();
const criterion = crypto.randomUUID();
const driftCriterion = crypto.randomUUID();
const holdoutItem = crypto.randomUUID();
const emailA = `r115-a-${suffix}@example.invalid`;
const emailB = `r115-b-${suffix}@example.invalid`;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = async (response) => {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
};

function dbq(sql, { allowFailure = false } = {}) {
  const executable = process.platform === "win32" ? process.execPath : "npx";
  const prefix = process.platform === "win32"
    ? ["C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js"]
    : [];
  const run = spawnSync(executable, [...prefix,
    "supabase", "db", "query", "--linked", "--project-ref", projectRef,
    "--output-format", "json", sql.trim().replace(/\r?\n/g, " "),
  ], { encoding: "utf8", cwd: process.cwd(), maxBuffer: 12 * 1024 * 1024 });
  if (run.status !== 0) {
    const detail = `${run.error?.message ?? ""}\n${run.stderr ?? ""}\n${run.stdout ?? ""}`.trim().slice(0, 900);
    if (allowFailure) return { failed: true, message: detail };
    throw new Error(`db_query_failed:${detail}`);
  }
  return JSON.parse(run.stdout).rows ?? [];
}

function verifyDeploymentIdentity() {
  const run = spawnSync(
    process.execPath,
    ["scripts/verify-ctrl-g25-standard-change-r115-deployment.mjs"],
    { encoding: "utf8", cwd: process.cwd(), maxBuffer: 12 * 1024 * 1024 },
  );
  if (run.status !== 0) {
    const detail = `${run.error?.message ?? ""}\n${run.stderr ?? ""}\n${run.stdout ?? ""}`.trim().slice(0, 900);
    throw new Error(`deployment_identity_failed:${detail}`);
  }
  return JSON.parse(run.stdout);
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
const event3 = `${run1}:judgement:gap`;
const event4 = `${run2}:judgement:gap`;
const authRow = (id, email) => `(
  '00000000-0000-0000-0000-000000000000',${lit(id)}::uuid,'authenticated','authenticated',${lit(email)},
  extensions.crypt(${lit(password)},extensions.gen_salt('bf')),now(),'','','','','','','',
  '{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,false,false,false,now(),now())`;
const identityRow = (id, email) => `(
  gen_random_uuid(),${lit(id)},${lit(id)}::uuid,
  jsonb_build_object('sub',${lit(id)},'email',${lit(email)},'email_verified',true),
  'email',now(),now(),now())`;

const governance = `jsonb_build_object(
  'owner','subject-owner','policy','r115-fixture','standard','exact-source',
  'alternative_explanations',jsonb_build_array('reviewer defect'),
  'expected_effect','fewer false positive blocks','validation','fresh independent check',
  'size_context','replacement not accumulation','privacy','owner-private',
  'dependencies',jsonb_build_array('ctrl-compile','ctrl-build','fresh-ctrl-check'),
  'rollback','keep current standard active','measurement_plan','review future accepted work')`;
const evidence = `jsonb_build_object(
  'source_ids',jsonb_build_array(${lit(event1)},${lit(event2)}),
  'lines',jsonb_build_array(
    jsonb_build_object('sourceId',${lit(event1)},'locator',${lit(`review ${run1}, judgement:proof`)},'week',${lit(week)},'surface','proposal','criterion','Proof before confidence','verdict','breaks','quote',null,'disposition','rejected'),
    jsonb_build_object('sourceId',${lit(event2)},'locator',${lit(`review ${run2}, judgement:proof`)},'week',${lit(week)},'surface','proposal','criterion','Proof before confidence','verdict','breaks','quote',null,'disposition','rejected')
  ),
  'criterion_id',${lit(criterion)},'criterion_name','Proof before confidence',
  'surfaces',jsonb_build_array('proposal'),
  'size',jsonb_build_object('delta',0,'paired_obligation','replace the old scope'))`;
const uncoveredEvidence = `jsonb_build_object(
  'source_ids',jsonb_build_array(${lit(event3)},${lit(event4)}),
  'lines',jsonb_build_array(
    jsonb_build_object('sourceId',${lit(event3)},'locator',${lit(`review ${run1}, judgement:gap`)},'week',${lit(week)},'surface','strategy','criterion','uncovered','verdict','uncovered','quote',null,'disposition','unknown'),
    jsonb_build_object('sourceId',${lit(event4)},'locator',${lit(`review ${run2}, judgement:gap`)},'week',${lit(week)},'surface','strategy','criterion','uncovered','verdict','uncovered','quote',null,'disposition','unknown')
  ),
  'topic','Name the commercial consequence before recommending the move',
  'size',jsonb_build_object('delta',1,'paired_obligation','validate the new context cost'))`;
const driftEvidence = `jsonb_build_object(
  'source_ids',jsonb_build_array(),
  'lines',jsonb_build_array(),
  'criterion_id',${lit(driftCriterion)},'criterion_name','Name the dissent',
  'last_fired_week',null,'opportunities',2,
  'question','Has the problem been solved, or has this rule stopped working?',
  'size',jsonb_build_object('delta',0,'paired_obligation','ask before changing anything'))`;

const setup = `
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
values (${lit(artifact)}::uuid,${lit(userA)}::uuid,'standard','Proposal standard','# Proposal standard\n\n## Proof before confidence\nName the proof before confidence.\n',jsonb_build_object('criteria_version',1));
  insert into public.criteria(id,user_id,surface,name,check_text,observable,weight,disc_verdict,provenance,version,is_current,disposition)
  values
   (${lit(criterion)}::uuid,${lit(userA)}::uuid,'proposal','Proof before confidence','Name the proof before confidence.','has_number','essential','keep','{"probe":"r115"}',1,true,'blocking'),
   (${lit(driftCriterion)}::uuid,${lit(userA)}::uuid,'proposal','Name the dissent','Name the strongest grounded dissent.','names_tradeoff','important','keep','{"probe":"r115-drift"}',1,true,'blocking');
insert into public.sort_items(id,user_id,session_id,surface,body,origin,held_out,position)
values (${lit(holdoutItem)}::uuid,${lit(userA)}::uuid,${lit(run1)}::uuid,'proposal','Sealed holdout answer that must never enter candidate runtime.','own',true,91);
insert into public.sort_grades(user_id,item_id,verdict,why)
values (${lit(userA)}::uuid,${lit(holdoutItem)}::uuid,'would_not_send','This is a sealed expected answer and must stay outside candidate generation.');
insert into public.capture_policies(user_id,enabled,cadence_days,window_weeks,min_unique_evidence,max_proposals,severity_override,privacy_boundary,retention_days)
values (${lit(userA)}::uuid,true,7,5,2,3,false,'owner-private',365);
insert into public.ledger(user_id,source_run_id,source_event_key,week,surface,signal,criterion_id,criterion_name,verdict,quote,disposition,created_at) values
  (${lit(userA)}::uuid,${lit(run1)}::uuid,'judgement:proof',${lit(week)},'proposal','output',${lit(criterion)}::uuid,'Proof before confidence','breaks','The proof was present elsewhere.','rejected',now()-interval '2 days'),
  (${lit(userA)}::uuid,${lit(run2)}::uuid,'judgement:proof',${lit(week)},'proposal','output',${lit(criterion)}::uuid,'Proof before confidence','breaks','The proof was clear in the table.','rejected',now()-interval '1 day'),
  (${lit(userA)}::uuid,${lit(run1)}::uuid,'judgement:gap',${lit(week)},'strategy','output',null,'uncovered','uncovered','Name the commercial consequence before recommending the move.','unknown',now()-interval '2 days'),
  (${lit(userA)}::uuid,${lit(run2)}::uuid,'judgement:gap',${lit(week)},'strategy','output',null,'uncovered','uncovered','Name the commercial consequence before recommending the move.','unknown',now()-interval '1 day');`;

const deploymentIdentityBefore = verifyDeploymentIdentity();
let output = {};
try {
  dbq(setup);
  const [tokenA, tokenB] = await Promise.all([signIn(emailA), signIn(emailB)]);
  const snapshot = dbq(`select public.current_capture_source_snapshot(${lit(userA)}::uuid,${lit(week)},5) as value`)[0]?.value;
  const publish = dbq(`begin;
    select set_config('request.jwt.claim.role','service_role',true); set local role service_role;
    select public.publish_capture_run(
      ${lit(userA)}::uuid,${lit(week)},${lit(snapshot)},
      jsonb_build_object('probe','r115'),
      jsonb_build_array(
        jsonb_build_object(
          'proposal_key','false-positive:proof','type','false_positive','surface','proposal',
          'headline','Proof check fired too widely','delta_text','Treat this check as advisory for proposal work.',
          'if_wrong','Weak proposals may pass.','size_delta',0,'evidence',${evidence},'governance',${governance}
        ),
        jsonb_build_object(
          'proposal_key','uncovered:strategy:commercial-consequence','type','uncovered','surface','strategy',
          'headline','A repeated commercial consequence has no rule','delta_text','Add a bounded advisory check for the commercial consequence.',
          'if_wrong','The gate may ask for a consequence that does not matter.','size_delta',1,'evidence',${uncoveredEvidence},'governance',${governance}
        ),
        jsonb_build_object(
          'proposal_key',${lit(`drift:${driftCriterion}`)},'type','drift','surface','proposal',
          'headline','Name the dissent did not fire across two reviews','delta_text',null,
          'if_wrong','Retiring it could remove a useful challenge.','size_delta',0,'evidence',${driftEvidence},'governance',${governance}
        )
      )
    ) as result; commit;`)[0]?.result;
  const proposals = dbq(`select id,proposal_hash,capture_run_id,proposal_key,type from public.proposals where user_id=${lit(userA)}::uuid order by type,proposal_key`);
  const proposal = proposals.find((row) => row.type === "false_positive");
  const uncoveredProposal = proposals.find((row) => row.type === "uncovered");
  const driftProposal = proposals.find((row) => row.type === "drift");
  if (!proposal || !uncoveredProposal || !driftProposal) {
    throw new Error(`proposal_type_coverage_missing:${JSON.stringify(proposals.map((row) => row.type))}`);
  }
  const before = dbq(`select
    encode(extensions.digest(convert_to((select body from public.generated_artifacts where id=${lit(artifact)}::uuid),'UTF8'),'sha256'),'hex') as standard_sha,
    encode(extensions.digest(convert_to(jsonb_agg(to_jsonb(c) order by c.id)::text,'UTF8'),'sha256'),'hex') as criteria_sha
    from public.criteria c where c.user_id=${lit(userA)}::uuid`)[0];
  const decision = dbq(`begin;
    select set_config('request.jwt.claim.sub',${lit(userA)},true);
    select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated;
    select public.decide_capture_proposal(${lit(proposal.id)}::uuid,${lit(proposal.proposal_hash)},'accepted',
      jsonb_build_object('accepted_surface','proposal','accepted_delta','Treat this check as advisory for proposal work.','apply_change',false)) as result;
    commit;`)[0]?.result;
  const uncoveredDecision = dbq(`begin;
    select set_config('request.jwt.claim.sub',${lit(userA)},true);
    select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated;
    select public.decide_capture_proposal(${lit(uncoveredProposal.id)}::uuid,${lit(uncoveredProposal.proposal_hash)},'accepted',
      jsonb_build_object('accepted_surface','strategy','accepted_delta','Add a bounded advisory check for the commercial consequence.','apply_change',false)) as result;
    commit;`)[0]?.result;
  const driftDecision = dbq(`begin;
    select set_config('request.jwt.claim.sub',${lit(userA)},true);
    select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated;
    select public.decide_capture_proposal(${lit(driftProposal.id)}::uuid,${lit(driftProposal.proposal_hash)},'accepted',
      jsonb_build_object('accepted_surface','proposal','freshness_decision','retain','apply_change',false)) as result;
    commit;`)[0]?.result;
  const changeRequestId = decision?.change_request_id;
  const changeRequestHash = decision?.change_request_hash;
  if (!changeRequestId || !changeRequestHash) throw new Error("change_request_missing");

  const anonymous = await invoke("compile-standard-change", null, {
    request_id: `r115_anon_${suffix}`, change_request_id: changeRequestId, expected_request_hash: changeRequestHash,
  });
  const wrongMethod = await invoke("compile-standard-change", tokenA, {}, { method: "GET" });
  const wrongMedia = await invoke("compile-standard-change", tokenA, "{}", { raw: true, contentType: "text/plain" });
  const oversized = await invoke("compile-standard-change", tokenA, JSON.stringify({ padding: "x".repeat(5_000) }), { raw: true });
  const extra = await invoke("compile-standard-change", tokenA, {
    request_id: `r115_extra_${suffix}`, change_request_id: changeRequestId,
    expected_request_hash: changeRequestHash, target_user_id: userB,
  });
  const crossOwner = await invoke("compile-standard-change", tokenB, {
    request_id: `r115_cross_${suffix}`, change_request_id: changeRequestId, expected_request_hash: changeRequestHash,
  });
  const directRpcProbes = [
    ["reserve_standard_change_compile", {
      p_request_id: `r115_direct_${suffix}`, p_request_fingerprint: "a".repeat(64),
      p_change_request_id: changeRequestId, p_expected_request_hash: changeRequestHash,
    }],
    ["finalize_standard_change_compile", { p_run_id: crypto.randomUUID(), p_compiled: {}, p_compile_sha256: "a".repeat(64) }],
    ["reserve_standard_change_build", {
      p_request_id: `r115_direct_b_${suffix}`, p_request_fingerprint: "a".repeat(64),
      p_compilation_id: crypto.randomUUID(), p_expected_compile_sha256: "a".repeat(64),
    }],
    ["finalize_standard_change_build", { p_run_id: crypto.randomUUID(), p_compilation_id: crypto.randomUUID(), p_build: {} }],
    ["reserve_standard_change_check", {
      p_request_id: `r115_direct_c_${suffix}`, p_request_fingerprint: "a".repeat(64),
      p_build_id: crypto.randomUUID(), p_expected_package_sha256: "a".repeat(64),
    }],
    ["finalize_standard_change_check", { p_run_id: crypto.randomUUID(), p_build_id: crypto.randomUUID(), p_check: {}, p_result_sha256: "a".repeat(64) }],
    ["fail_standard_change_stage", { p_run_id: crypto.randomUUID(), p_error: "probe" }],
  ];
  const directRpcs = await Promise.all(directRpcProbes.map(([name, params]) => rest(`rpc/${name}`, tokenA, {
    method: "POST", body: JSON.stringify({ ...params, p_capability: "not-a-valid-capability" }),
  })));

  const compileRequestIds = [`r115_compile_a_${suffix}`, `r115_compile_b_${suffix}`];
  const compileRace = await Promise.all(compileRequestIds.map((request_id) => invoke("compile-standard-change", tokenA, {
    request_id, change_request_id: changeRequestId, expected_request_hash: changeRequestHash,
  })));
  const winnerIndex = compileRace.findIndex((item) => item.status === 200);
  const compiled = compileRace[winnerIndex];
  const compileRequestId = compileRequestIds[winnerIndex];
  if (winnerIndex < 0 || compileRace.filter((item) => item.status === 409).length !== 1) {
    throw new Error(`compile_race_not_exclusive:${JSON.stringify(compileRace.map((item) => item.status))}`);
  }
  const compilationId = compiled.body?.result?.compilation_id;
  const compileHash = compiled.body?.result?.compile_sha256;
  if (!compilationId || !compileHash) {
    throw new Error(`compile_missing:${compiled.status}:${JSON.stringify(compiled.body)}:` + JSON.stringify({
      request_id_length: compileRequestId.length,
      change_request_id_length: String(changeRequestId).length,
      change_request_hash_length: String(changeRequestHash).length,
      change_request_id_type: typeof changeRequestId,
      change_request_hash_type: typeof changeRequestHash,
      change_request_id_shape: String(changeRequestId).replace(/[0-9a-f]/gi, "x"),
      uuid_version_character: String(changeRequestId)[14],
      uuid_variant_character: String(changeRequestId)[19],
    }));
  }
  const compileRetry = await invoke("compile-standard-change", tokenA, {
    request_id: compileRequestId, change_request_id: changeRequestId, expected_request_hash: changeRequestHash,
  });
  const compileConflict = await invoke("compile-standard-change", tokenA, {
    request_id: compileRequestId, change_request_id: changeRequestId, expected_request_hash: `${changeRequestHash.slice(0, 63)}0`,
  });

  const buildRequestId = `r115_build_${suffix}`;
  const built = await invoke("build-standard-change", tokenA, {
    request_id: buildRequestId, compilation_id: compilationId, expected_compile_hash: compileHash,
  });
  const buildId = built.body?.result?.build_id;
  const packageHash = built.body?.result?.package_sha256;
  if (!buildId || !packageHash) throw new Error(`build_missing:${built.status}:${JSON.stringify(built.body)}`);
  const buildRetry = await invoke("build-standard-change", tokenA, {
    request_id: buildRequestId, compilation_id: compilationId, expected_compile_hash: compileHash,
  });

  const checkRequestId = `r115_check_${suffix}`;
  const checked = await invoke("check-standard-change", tokenA, {
    request_id: checkRequestId, build_id: buildId, expected_package_hash: packageHash,
  });
  const checkRetry = await invoke("check-standard-change", tokenA, {
    request_id: checkRequestId, build_id: buildId, expected_package_hash: packageHash,
  });

  const driftCompiled = await invoke("compile-standard-change", tokenA, {
    request_id: `r115_drift_compile_${suffix}`,
    change_request_id: driftDecision.change_request_id,
    expected_request_hash: driftDecision.change_request_hash,
  });
  const driftCompilationId = driftCompiled.body?.result?.compilation_id;
  const driftCompileHash = driftCompiled.body?.result?.compile_sha256;
  if (!driftCompilationId || !driftCompileHash) {
    throw new Error(`drift_compile_missing:${driftCompiled.status}:${JSON.stringify(driftCompiled.body)}`);
  }
  const driftBuilt = await invoke("build-standard-change", tokenA, {
    request_id: `r115_drift_build_${suffix}`,
    compilation_id: driftCompilationId,
    expected_compile_hash: driftCompileHash,
  });
  const driftBuildId = driftBuilt.body?.result?.build_id;
  const driftPackageHash = driftBuilt.body?.result?.package_sha256;
  if (!driftBuildId || !driftPackageHash) {
    throw new Error(`drift_build_missing:${driftBuilt.status}:${JSON.stringify(driftBuilt.body)}`);
  }
  const driftChecked = await invoke("check-standard-change", tokenA, {
    request_id: `r115_drift_check_${suffix}`,
    build_id: driftBuildId,
    expected_package_hash: driftPackageHash,
  });
  const driftDurable = dbq(`select c.candidate_status, k.verdict,
    coalesce((select finding->>'status' from jsonb_array_elements(k.findings) finding where finding->>'criterion_id'='provenance.evidence' limit 1),'missing') as provenance_status
    from public.standard_change_compilations c
    join public.standard_change_builds b on b.compilation_id=c.id
    join public.standard_change_checks k on k.build_id=b.id
    where c.id=${lit(driftCompilationId)}::uuid`)[0];

  const durable = dbq(`select
    r.state, c.candidate_status, b.package_sha256, k.verdict,
    b.holdout_manifest_sha256, b.holdout_item_count, b.holdout_intersection_count,
    jsonb_array_length(k.findings)::int as findings,
    (select count(*) from public.standard_change_requests where user_id=${lit(userA)}::uuid)::int as requests,
    (select count(*) from public.standard_change_compilations where user_id=${lit(userA)}::uuid)::int as compilations,
    (select count(*) from public.standard_change_builds where user_id=${lit(userA)}::uuid)::int as builds,
    (select count(*) from public.standard_change_checks where user_id=${lit(userA)}::uuid)::int as checks,
    cr.source_manifest_sha256,
    jsonb_array_length(cr.source_manifest->'evidence_ids')::int as manifest_evidence
    from public.standard_change_requests r
    join public.standard_change_compilations c on c.change_request_id=r.id
    join public.standard_change_builds b on b.compilation_id=c.id
    join public.standard_change_checks k on k.build_id=b.id
    join public.proposals p on p.id=r.proposal_id
    join public.capture_runs cr on cr.id=p.capture_run_id
    where r.id=${lit(changeRequestId)}::uuid`)[0];
  const after = dbq(`select
    encode(extensions.digest(convert_to((select body from public.generated_artifacts where id=${lit(artifact)}::uuid),'UTF8'),'sha256'),'hex') as standard_sha,
    encode(extensions.digest(convert_to(jsonb_agg(to_jsonb(c) order by c.id)::text,'UTF8'),'sha256'),'hex') as criteria_sha
    from public.criteria c where c.user_id=${lit(userA)}::uuid`)[0];
  const crossTenantRows = await Promise.all([
    "standard_change_requests", "standard_change_stage_runs", "standard_change_compilations", "standard_change_builds", "standard_change_checks",
  ].map((table) => rest(`${table}?select=id`, tokenB)));
  const directUpdate = await rest(`standard_change_requests?id=eq.${changeRequestId}`, tokenA, {
    method: "PATCH", body: JSON.stringify({ state: "checked" }),
  });

  const staleProposalId = crypto.randomUUID();
  const staleProposalHash = "f".repeat(64);
  dbq(`insert into public.proposals(
    id,user_id,type,surface,headline,delta_text,if_wrong,size_delta,evidence,status,
    proposal_key,proposal_version,proposal_hash,capture_run_id,source_standard_artifact_id,
    source_standard_sha256,source_snapshot,governance
  ) select
    ${lit(staleProposalId)}::uuid,user_id,type,surface,'Second bounded change',delta_text,if_wrong,size_delta,evidence,'awaiting',
    'false-positive:proof:stale',1,${lit(staleProposalHash)},capture_run_id,source_standard_artifact_id,
    source_standard_sha256,source_snapshot,governance
  from public.proposals where id=${lit(proposal.id)}::uuid;`);
  const staleDecision = dbq(`begin;
    select set_config('request.jwt.claim.sub',${lit(userA)},true);
    select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated;
    select public.decide_capture_proposal(${lit(staleProposalId)}::uuid,${lit(staleProposalHash)},'accepted',
      jsonb_build_object('accepted_surface','proposal','accepted_delta','Treat this check as advisory for proposal work.','apply_change',false)) as result;
    commit;`)[0]?.result;
  dbq(`insert into public.generated_artifacts(user_id,kind,name,body,metadata)
    values (${lit(userA)}::uuid,'standard','Newer synthetic standard','# Newer synthetic standard','{}');`);
  const staleCompile = await invoke("compile-standard-change", tokenA, {
    request_id: `r115_stale_${suffix}`,
    change_request_id: staleDecision.change_request_id,
    expected_request_hash: staleDecision.change_request_hash,
  });
  const staleRows = dbq(`select count(*)::int as count from public.standard_change_compilations where change_request_id=${lit(staleDecision.change_request_id)}::uuid`)[0]?.count;
  const deploymentIdentityAfter = verifyDeploymentIdentity();
  const deploymentInventoryStableAcrossExercise =
    JSON.stringify(deploymentIdentityBefore.functions) === JSON.stringify(deploymentIdentityAfter.functions);
  if (!deploymentInventoryStableAcrossExercise) throw new Error("deployment_changed_during_hosted_exercise");

  output = {
    deployment_identity: {
      before: deploymentIdentityBefore,
      after: deploymentIdentityAfter,
      inventory_stable_across_exercise: true,
    },
    publish_inserted: publish?.inserted ?? null,
    proposal_types_inserted: proposals.map((row) => row.type).sort(),
    uncovered_change_request_created: Boolean(uncoveredDecision?.change_request_id),
    drift_change_request_created: Boolean(driftDecision?.change_request_id),
    decision_change_applied: decision?.change_applied ?? null,
    decision_next: decision?.next ?? null,
    anonymous_status: anonymous.status,
    wrong_method_status: wrongMethod.status,
    wrong_media_status: wrongMedia.status,
    oversized_status: oversized.status,
    extra_field_status: extra.status,
    cross_owner_status: crossOwner.status,
    direct_rpc_statuses: directRpcs.map((item) => item.status),
    compile_race_statuses: compileRace.map((item) => item.status).sort((a, b) => a - b),
    compile_status: compiled.status,
    compile_retry_idempotent: compileRetry.body?.idempotent === true,
    compile_conflict_status: compileConflict.status,
    build_status: built.status,
    build_retry_idempotent: buildRetry.body?.idempotent === true,
    check_status: checked.status,
    check_verdict: checked.body?.verdict ?? null,
    check_findings: checked.body?.findings?.length ?? null,
    check_retry_idempotent: checkRetry.body?.idempotent === true,
    drift_compile_status: driftCompiled.status,
    drift_build_status: driftBuilt.status,
    drift_check_status: driftChecked.status,
    drift_check_verdict: driftChecked.body?.verdict ?? null,
    drift_candidate_status: driftDurable?.candidate_status ?? null,
    drift_provenance_status: driftDurable?.provenance_status ?? null,
    durable,
    active_standard_unchanged: before?.standard_sha === after?.standard_sha,
    active_criteria_unchanged: before?.criteria_sha === after?.criteria_sha,
    cross_tenant_rows: crossTenantRows.map((item) => Array.isArray(item.body) ? item.body.length : -1),
    direct_update_denied: directUpdate.status >= 400,
    stale_compile_status: staleCompile.status,
    stale_compilations: Number(staleRows),
  };
} finally {
  dbq(`
    delete from public.standard_change_checks where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.standard_change_builds where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.standard_change_compilations where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.standard_change_stage_runs where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.standard_change_requests where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.proposal_decisions where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.proposals where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from public.capture_runs where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
    delete from auth.users where id in (${lit(userA)}::uuid,${lit(userB)}::uuid);
  `, { allowFailure: true });
  const cleanup = dbq(`select
    (select count(*) from auth.users where id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as auth_users,
    (select count(*) from public.standard_change_requests where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as requests,
    (select count(*) from public.standard_change_stage_runs where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as stage_runs,
    (select count(*) from public.standard_change_compilations where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as compilations,
    (select count(*) from public.standard_change_builds where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as builds,
    (select count(*) from public.standard_change_checks where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as checks,
    (select count(*) from public.proposals where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as proposals,
    (select count(*) from public.sort_items where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as sort_items`)[0];
  output.cleanup = cleanup;
  console.log(JSON.stringify(output));
}
