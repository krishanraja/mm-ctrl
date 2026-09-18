import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const projectRef = process.env.CTRL_PROBE_SUPABASE_PROJECT_REF ?? "";
const captureSecret = process.env.CTRL_PROBE_CAPTURE_SECRET ?? "";
if (!/^[a-z0-9]{20}$/.test(projectRef) || captureSecret.length < 32) {
  console.error("Set exact isolated project and transient capture secret inputs.");
  process.exit(2);
}

const baseUrl = `https://${projectRef}.supabase.co`;
const lit = (value) => `'${String(value).replaceAll("'", "''")}'`;
const weekOf = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - start) / 86_400_000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
};
const addWeek = (week) => {
  const [year, number] = week.replace("W", "").split("-").map(Number);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (number - 1) * 7 + 7);
  return weekOf(monday);
};

function dbq(sql, { allowFailure = false } = {}) {
  const executable = process.platform === "win32" ? process.execPath : "npx";
  const prefix = process.platform === "win32"
    ? ["C:/Program Files/nodejs/node_modules/npm/bin/npx-cli.js"]
    : [];
  const run = spawnSync(executable, [...prefix,
    "supabase", "db", "query", "--linked", "--project-ref", projectRef, "--output-format", "json", sql.trim().replace(/\r?\n/g, " "),
  ], { encoding: "utf8", cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 });
  if (run.status !== 0) {
    const detail = `${run.error?.message ?? ""}\n${run.stderr ?? ""}\n${run.stdout ?? ""}`.trim().slice(0, 600);
    if (allowFailure) return { failed: true, message: detail };
    throw new Error(`db_query_failed:${detail}`);
  }
  const parsed = JSON.parse(run.stdout);
  return parsed.rows ?? [];
}

async function invoke(body, options = {}) {
  const method = options.method ?? "POST";
  const response = await fetch(`${baseUrl}/functions/v1/capture-week`, {
    method,
    headers: {
      ...(options.authorised === false ? {} : { Authorization: `Bearer ${captureSecret}` }),
      ...(options.contentType === false ? {} : { "Content-Type": options.contentType ?? "application/json" }),
    },
    body: method === "POST" ? (options.raw ? String(body) : JSON.stringify(body)) : undefined,
  });
  const text = await response.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: response.status, body: parsed };
}

const suffix = crypto.randomBytes(6).toString("hex");
const userA = crypto.randomUUID();
const userB = crypto.randomUUID();
const run1 = crypto.randomUUID();
const run2 = crypto.randomUUID();
const artifact = crypto.randomUUID();
const criterion1 = crypto.randomUUID();
const criterion2 = crypto.randomUUID();
const captureWeek = weekOf(new Date());
const nextWeek = addWeek(captureWeek);

const authRow = (id, email) => `(
  '00000000-0000-0000-0000-000000000000',${lit(id)}::uuid,'authenticated','authenticated',${lit(email)},
  '',now(),'','','','','','','','{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,
  false,false,false,now(),now())`;
const setup = `
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
 confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,
 reauthentication_token,phone_change,raw_app_meta_data,raw_user_meta_data,is_super_admin,is_sso_user,is_anonymous,created_at,updated_at)
values ${authRow(userA, `r114-a-${suffix}@example.invalid`)},${authRow(userB, `r114-b-${suffix}@example.invalid`)};
insert into public.harness_runs(id,user_id,kind,surface,status,stage,stage_detail,created_at,updated_at) values
 (${lit(run1)}::uuid,${lit(userA)}::uuid,'critique','campaign recommendation','done','ready','{}',now() - interval '2 days',now()),
 (${lit(run2)}::uuid,${lit(userA)}::uuid,'critique','campaign recommendation','done','ready','{}',now() - interval '1 day',now());
insert into public.generated_artifacts(id,user_id,kind,name,body,metadata) values
 (${lit(artifact)}::uuid,${lit(userA)}::uuid,'standard','Campaign standard','# Campaign standard',jsonb_build_object('criteria_version',1));
insert into public.criteria(id,user_id,surface,name,check_text,observable,weight,disc_verdict,provenance,version,is_current,disposition) values
 (${lit(criterion1)}::uuid,${lit(userA)}::uuid,'campaign recommendation','Named accountability','Name an accountable owner.','named owner','essential','keep','{"probe":"r114"}',1,true,'advisory'),
 (${lit(criterion2)}::uuid,${lit(userA)}::uuid,'campaign recommendation','Commercial proof','Name the result that proves value.','numeric outcome','important','keep','{"probe":"r114"}',1,true,'advisory');
insert into public.capture_policies(user_id,enabled,cadence_days,window_weeks,min_unique_evidence,max_proposals,severity_override,privacy_boundary,retention_days)
values (${lit(userA)}::uuid,true,7,5,2,3,false,'owner-private',365);
insert into public.ledger(id,user_id,source_run_id,source_event_key,week,surface,signal,criterion_id,criterion_name,verdict,quote,disposition,created_at) values
 (gen_random_uuid(),${lit(userA)}::uuid,${lit(run1)}::uuid,'judgement:named-accountability',${lit(captureWeek)},'campaign recommendation','output',${lit(criterion1)}::uuid,'Named accountability','breaks','Owner was named in the appendix.','rejected',now() - interval '2 days'),
 (gen_random_uuid(),${lit(userA)}::uuid,${lit(run2)}::uuid,'judgement:named-accountability',${lit(captureWeek)},'campaign recommendation','output',${lit(criterion1)}::uuid,'Named accountability','breaks','Owner was explicit in the table.','rejected',now() - interval '1 day');`;

let output = {};
try {
  dbq(setup);
  const ownerPolicyUpdate = dbq(`begin; select set_config('request.jwt.claim.sub',${lit(userA)},true); select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated; with changed as (update public.capture_policies set max_proposals=max_proposals where user_id=${lit(userA)}::uuid returning user_id) select count(*)::int as count from changed; rollback;`);
  const crossOwnerPolicyUpdate = dbq(`begin; select set_config('request.jwt.claim.sub',${lit(userB)},true); select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated; with changed as (update public.capture_policies set max_proposals=max_proposals where user_id=${lit(userA)}::uuid returning user_id) select count(*)::int as count from changed; rollback;`);
  const anonymous = await invoke({ capture_week: captureWeek, user_id: userA }, { authorised: false });
  const wrongMethod = await invoke({}, { method: "GET" });
  const wrongMedia = await invoke("{}", { raw: true, contentType: "text/plain" });
  const oversized = await invoke(JSON.stringify({ padding: "x".repeat(5_000) }), { raw: true });
  const extra = await invoke({ capture_week: captureWeek, user_id: userA, target_user_id: userB });
  const first = await invoke({ capture_week: captureWeek, user_id: userA });
  const proposalRows = dbq(`select id,type,proposal_key,proposal_hash,status,evidence,governance from public.proposals where user_id=${lit(userA)}::uuid order by type`);
  const captureRows = dbq(`select id,source_snapshot,summary,status from public.capture_runs where user_id=${lit(userA)}::uuid`);
  const retry = await invoke({ capture_week: captureWeek, user_id: userA });

  const crossTenant = dbq(`begin; select set_config('request.jwt.claim.sub',${lit(userB)},true); select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated; select count(*)::int as count from public.proposals where user_id=${lit(userA)}::uuid; rollback;`);
  const directUpdate = dbq(`begin; select set_config('request.jwt.claim.sub',${lit(userA)},true); select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated; update public.proposals set headline='forged' where user_id=${lit(userA)}::uuid; rollback;`, { allowFailure: true });
  const falsePositive = proposalRows.find((row) => row.type === "false_positive");
  if (!falsePositive) throw new Error("false_positive_fixture_missing");
  const crossDecision = dbq(`begin; select set_config('request.jwt.claim.sub',${lit(userB)},true); select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated; select public.decide_capture_proposal(${lit(falsePositive.id)}::uuid,${lit(falsePositive.proposal_hash)},'rejected','{}'); rollback;`, { allowFailure: true });
  const beforeCriteria = dbq(`select count(*)::int as count, encode(extensions.digest(convert_to(jsonb_agg(to_jsonb(c) order by c.id)::text,'UTF8'),'sha256'),'hex') as hash from public.criteria c where user_id=${lit(userA)}::uuid`)[0];
  const decision = dbq(`begin; select set_config('request.jwt.claim.sub',${lit(userA)},true); select set_config('request.jwt.claim.role','authenticated',true); set local role authenticated; select public.decide_capture_proposal(${lit(falsePositive.id)}::uuid,${lit(falsePositive.proposal_hash)},'accepted',jsonb_build_object('accepted_surface','campaign recommendation','apply_change',false)) as result; commit;`)[0];
  const afterCriteria = dbq(`select count(*)::int as count, encode(extensions.digest(convert_to(jsonb_agg(to_jsonb(c) order by c.id)::text,'UTF8'),'sha256'),'hex') as hash from public.criteria c where user_id=${lit(userA)}::uuid`)[0];
  const next = await invoke({ capture_week: nextWeek, user_id: userA });
  const proposalCountAfterNext = dbq(`select count(*)::int as count from public.proposals where user_id=${lit(userA)}::uuid`)[0]?.count;

  const oldSnapshot = dbq(`select public.current_capture_source_snapshot(${lit(userA)}::uuid,${lit(captureWeek)},5) as snapshot`)[0]?.snapshot;
  const run3 = crypto.randomUUID();
  dbq(`insert into public.harness_runs(id,user_id,kind,surface,status,stage,stage_detail) values (${lit(run3)}::uuid,${lit(userA)}::uuid,'critique','campaign recommendation','done','ready','{}'); insert into public.ledger(user_id,source_run_id,source_event_key,week,surface,signal,criterion_id,criterion_name,verdict,quote,disposition) values (${lit(userA)}::uuid,${lit(run3)}::uuid,'judgement:named-accountability',${lit(captureWeek)},'campaign recommendation','output',${lit(criterion1)}::uuid,'Named accountability','breaks','A materially new review.','rejected');`);
  const stalePublish = dbq(`begin; select set_config('request.jwt.claim.role','service_role',true); set local role service_role; select public.publish_capture_run(${lit(userA)}::uuid,${lit(captureWeek)},${lit(oldSnapshot)},'{}','[]'); rollback;`, { allowFailure: true });

  const hasDurableQuotes = proposalRows.some((row) => JSON.stringify(row.evidence?.lines ?? []).includes("Owner was"));
  const packetsComplete = proposalRows.every((row) => {
    const g = row.governance ?? {};
    return ["owner", "policy", "standard", "alternative_explanations", "expected_effect", "validation", "size_context", "privacy", "dependencies", "rollback", "measurement_plan"].every((key) => key in g);
  });
  output = {
    anonymous_status: anonymous.status,
    wrong_method_status: wrongMethod.status,
    wrong_media_status: wrongMedia.status,
    oversized_status: oversized.status,
    extra_field_status: extra.status,
    first_status: first.status,
    first_published: first.body?.published ?? null,
    proposal_types: proposalRows.map((row) => row.type).sort(),
    proposal_packets_complete: packetsComplete,
    durable_quotes_copied: hasDurableQuotes,
    capture_runs: captureRows.length,
    retry_status: retry.status,
    retry_idempotent: retry.body?.outcomes?.[0]?.idempotent === true,
    cross_tenant_rows: crossTenant.find((row) => "count" in row)?.count ?? -1,
    direct_update_denied: directUpdate.failed === true,
    cross_owner_decision_denied: crossDecision.failed === true,
    owner_decision_change_applied: decision?.result?.change_applied ?? null,
    criteria_unchanged_after_acceptance: beforeCriteria?.count === afterCriteria?.count && beforeCriteria?.hash === afterCriteria?.hash,
    owner_policy_update_count: ownerPolicyUpdate.find((row) => "count" in row)?.count ?? -1,
    cross_owner_policy_update_count: crossOwnerPolicyUpdate.find((row) => "count" in row)?.count ?? -1,
    cadence_hold_status: next.body?.outcomes?.[0]?.status ?? null,
    cadence_hold_reason: next.body?.outcomes?.[0]?.reason ?? null,
    same_evidence_reproposal_count: Number(proposalCountAfterNext) - proposalRows.length,
    stale_source_publication_denied: stalePublish.failed === true,
  };
} finally {
  dbq(`delete from public.proposal_decisions where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid); delete from public.proposals where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid); delete from public.capture_runs where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid); delete from auth.users where id in (${lit(userA)}::uuid,${lit(userB)}::uuid);`);
  const cleanup = dbq(`select (select count(*) from auth.users where id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as auth_users, (select count(*) from public.proposals where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as proposals, (select count(*) from public.capture_runs where user_id in (${lit(userA)}::uuid,${lit(userB)}::uuid))::int as capture_runs`)[0];
  output.cleanup = cleanup;
  console.log(JSON.stringify(output));
}
