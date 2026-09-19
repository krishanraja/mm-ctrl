begin;

-- R115: an accepted Capture proposal enters a candidate-only Compile, Build
-- and fresh Check conveyor. No object in this migration can edit criteria,
-- replace the active standard, install a skill, deploy a package or release it.

alter table public.capture_runs
  add column if not exists source_manifest jsonb,
  add column if not exists source_manifest_sha256 text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'capture_runs_source_manifest_sha_check'
      and conrelid = 'public.capture_runs'::regclass
  ) then
    alter table public.capture_runs add constraint capture_runs_source_manifest_sha_check
      check (source_manifest_sha256 is null or source_manifest_sha256 ~ '^[0-9a-f]{64}$');
  end if;
end $$;

create or replace function public.build_capture_source_manifest(
  p_user_id uuid,
  p_capture_week text,
  p_window_weeks integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_source jsonb;
  v_snapshot text;
  v_evidence_ids jsonb;
  v_criteria jsonb;
begin
  v_source := public.current_capture_source(p_user_id, p_capture_week, p_window_weeks);
  v_snapshot := encode(extensions.digest(convert_to((v_source - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');
  select coalesce(jsonb_agg(source_id order by source_id), '[]'::jsonb)
  into v_evidence_ids
  from (
    select distinct case
      when nullif(item->>'source_run_id', '') is not null and nullif(item->>'source_event_key', '') is not null
        then item->>'source_run_id' || ':' || item->>'source_event_key'
      else item->>'id'
    end as source_id
    from jsonb_array_elements(coalesce(v_source->'ledger', '[]'::jsonb)) item
  ) ids
  where source_id is not null and length(source_id) between 1 and 240;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'surface', c.surface,
    'name', c.name,
    'check_text', c.check_text,
    'observable', c.observable,
    'weight', c.weight,
    'disposition', c.disposition,
    'disc_verdict', c.disc_verdict,
    'version', c.version,
    'provenance', c.provenance
  ) order by c.surface, c.name, c.id), '[]'::jsonb)
  into v_criteria
  from public.criteria c
  where c.user_id = p_user_id and c.is_current = true;

  return jsonb_build_object(
    'schema', 'ctrl.capture.source-manifest.v1',
    'owner_id', p_user_id,
    'capture_week', p_capture_week,
    'source_snapshot', v_snapshot,
    'standard', jsonb_build_object(
      'id', v_source->'standard'->>'id',
      'body_sha256', v_source->'standard'->>'body_sha256'
    ),
    'criteria', v_criteria,
    'evidence_ids', v_evidence_ids
  );
end;
$$;

revoke all on function public.build_capture_source_manifest(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.build_capture_source_manifest(uuid, text, integer) to service_role;

create or replace function public.set_capture_source_manifest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window integer;
  v_manifest jsonb;
begin
  begin
    v_window := (new.policy->>'window_weeks')::integer;
  exception when others then
    raise exception 'capture_source_manifest_invalid_window' using errcode = '22023';
  end;
  v_manifest := public.build_capture_source_manifest(new.user_id, new.capture_week, v_window);
  if v_manifest->>'source_snapshot' is distinct from new.source_snapshot
     or v_manifest->'standard'->>'id' is distinct from new.standard_artifact_id::text
     or v_manifest->'standard'->>'body_sha256' is distinct from new.standard_sha256 then
    raise exception 'capture_source_manifest_mismatch' using errcode = '40001';
  end if;
  new.source_manifest := v_manifest;
  new.source_manifest_sha256 := encode(
    extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'),
    'hex'
  );
  return new;
end;
$$;

drop trigger if exists capture_runs_set_source_manifest on public.capture_runs;
create trigger capture_runs_set_source_manifest
before insert on public.capture_runs
for each row execute function public.set_capture_source_manifest();

create or replace function public.validate_capture_proposal_manifest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.capture_runs%rowtype;
  v_source_ids jsonb;
  v_lines jsonb;
begin
  select * into v_run from public.capture_runs where id = new.capture_run_id;
  if not found or v_run.user_id <> new.user_id
     or v_run.source_manifest is null or v_run.source_manifest_sha256 is null
     or v_run.source_snapshot <> new.source_snapshot
     or v_run.standard_artifact_id <> new.source_standard_artifact_id
     or v_run.standard_sha256 <> new.source_standard_sha256 then
    raise exception 'capture_proposal_manifest_mismatch' using errcode = '22023';
  end if;
  v_source_ids := coalesce(new.evidence->'source_ids', '[]'::jsonb);
  v_lines := coalesce(new.evidence->'lines', '[]'::jsonb);
  if jsonb_typeof(v_source_ids) <> 'array' or jsonb_array_length(v_source_ids) = 0
     or jsonb_typeof(v_lines) <> 'array'
     or jsonb_array_length(v_lines) <> jsonb_array_length(v_source_ids)
     or not (v_run.source_manifest->'evidence_ids' @> v_source_ids)
     or exists (
       select 1 from jsonb_array_elements(v_source_ids) value
       where jsonb_typeof(value) <> 'string' or length(value #>> '{}') not between 1 and 240
     )
     or exists (
       select 1 from jsonb_array_elements(v_lines) line
       where jsonb_typeof(line) <> 'object'
          or jsonb_typeof(line->'sourceId') <> 'string'
          or not (v_source_ids @> jsonb_build_array(line->>'sourceId'))
          or (line ? 'quote' and line->'quote' <> 'null'::jsonb)
     ) then
    raise exception 'capture_proposal_evidence_not_in_manifest' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists proposals_validate_capture_manifest on public.proposals;
create trigger proposals_validate_capture_manifest
before insert on public.proposals
for each row when (new.capture_run_id is not null)
execute function public.validate_capture_proposal_manifest();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposals_id_user_unique' and conrelid = 'public.proposals'::regclass
  ) then
    alter table public.proposals add constraint proposals_id_user_unique unique (id, user_id);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'proposal_decisions_id_user_unique' and conrelid = 'public.proposal_decisions'::regclass
  ) then
    alter table public.proposal_decisions add constraint proposal_decisions_id_user_unique unique (id, user_id);
  end if;
end $$;

create table if not exists public.standard_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid not null,
  proposal_decision_id uuid not null,
  request_version integer not null default 1 check (request_version between 1 and 1000),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  proposal_hash text not null check (proposal_hash ~ '^[0-9a-f]{64}$'),
  decision_hash text not null check (decision_hash ~ '^[0-9a-f]{64}$'),
  source_standard_artifact_id uuid not null,
  source_standard_sha256 text not null check (source_standard_sha256 ~ '^[0-9a-f]{64}$'),
  source_snapshot text not null check (source_snapshot ~ '^[0-9a-f]{64}$'),
  source_manifest_sha256 text not null check (source_manifest_sha256 ~ '^[0-9a-f]{64}$'),
  surface text not null check (length(surface) between 1 and 120),
  change_type text not null check (change_type in ('false_positive', 'uncovered', 'drift')),
  accepted_scope jsonb not null check (jsonb_typeof(accepted_scope) = 'object'),
  state text not null default 'accepted' check (state in (
    'accepted', 'compiling', 'compiled', 'building', 'built', 'checking',
    'checked', 'needs_evidence', 'blocked'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standard_change_requests_proposal_owner_fk foreign key (proposal_id, user_id)
    references public.proposals(id, user_id) on delete restrict,
  constraint standard_change_requests_decision_owner_fk foreign key (proposal_decision_id, user_id)
    references public.proposal_decisions(id, user_id) on delete restrict,
  constraint standard_change_requests_standard_owner_fk foreign key (source_standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_change_requests_proposal_version_unique unique (proposal_id, request_version),
  constraint standard_change_requests_decision_unique unique (proposal_decision_id),
  constraint standard_change_requests_hash_unique unique (request_hash),
  constraint standard_change_requests_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_stage_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null,
  stage text not null check (stage in ('compile', 'build', 'check')),
  request_id text not null check (request_id ~ '^[A-Za-z0-9_-]{16,120}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  result jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standard_change_stage_runs_request_owner_fk foreign key (change_request_id, user_id)
    references public.standard_change_requests(id, user_id) on delete restrict,
  constraint standard_change_stage_runs_owner_stage_request_unique unique (user_id, stage, request_id),
  constraint standard_change_stage_runs_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_compilations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null,
  stage_run_id uuid not null,
  candidate_version integer not null default 1 check (candidate_version between 1 and 1000),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  compiled jsonb not null check (jsonb_typeof(compiled) = 'object'),
  compile_sha256 text not null check (compile_sha256 ~ '^[0-9a-f]{64}$'),
  database_sha256 text not null check (database_sha256 ~ '^[0-9a-f]{64}$'),
  candidate_status text not null check (candidate_status in ('compiled', 'needs_evidence', 'no_change')),
  created_at timestamptz not null default now(),
  constraint standard_change_compilations_request_owner_fk foreign key (change_request_id, user_id)
    references public.standard_change_requests(id, user_id) on delete restrict,
  constraint standard_change_compilations_run_owner_fk foreign key (stage_run_id, user_id)
    references public.standard_change_stage_runs(id, user_id) on delete restrict,
  constraint standard_change_compilations_request_version_unique unique (change_request_id, candidate_version),
  constraint standard_change_compilations_stage_run_unique unique (stage_run_id),
  constraint standard_change_compilations_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null,
  compilation_id uuid not null,
  stage_run_id uuid not null,
  build_version integer not null default 1 check (build_version between 1 and 1000),
  runtime_body text not null check (octet_length(runtime_body) between 1 and 2097152),
  runtime_sha256 text not null check (runtime_sha256 ~ '^[0-9a-f]{64}$'),
  evaluation_manifest jsonb not null check (jsonb_typeof(evaluation_manifest) = 'object'),
  evaluation_sha256 text not null check (evaluation_sha256 ~ '^[0-9a-f]{64}$'),
  build_manifest jsonb not null check (jsonb_typeof(build_manifest) = 'object'),
  build_manifest_sha256 text not null check (build_manifest_sha256 ~ '^[0-9a-f]{64}$'),
  package_sha256 text not null check (package_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  constraint standard_change_builds_request_owner_fk foreign key (change_request_id, user_id)
    references public.standard_change_requests(id, user_id) on delete restrict,
  constraint standard_change_builds_compilation_owner_fk foreign key (compilation_id, user_id)
    references public.standard_change_compilations(id, user_id) on delete restrict,
  constraint standard_change_builds_run_owner_fk foreign key (stage_run_id, user_id)
    references public.standard_change_stage_runs(id, user_id) on delete restrict,
  constraint standard_change_builds_compilation_version_unique unique (compilation_id, build_version),
  constraint standard_change_builds_stage_run_unique unique (stage_run_id),
  constraint standard_change_builds_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null,
  build_id uuid not null,
  stage_run_id uuid not null,
  check_version integer not null default 1 check (check_version between 1 and 1000),
  fresh_context_id uuid not null default gen_random_uuid(),
  checker_contract text not null default 'ctrl-check.v1',
  verdict text not null check (verdict in ('passed', 'blocked', 'needs_evidence')),
  findings jsonb not null check (jsonb_typeof(findings) = 'array'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  result_sha256 text not null check (result_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  constraint standard_change_checks_request_owner_fk foreign key (change_request_id, user_id)
    references public.standard_change_requests(id, user_id) on delete restrict,
  constraint standard_change_checks_build_owner_fk foreign key (build_id, user_id)
    references public.standard_change_builds(id, user_id) on delete restrict,
  constraint standard_change_checks_run_owner_fk foreign key (stage_run_id, user_id)
    references public.standard_change_stage_runs(id, user_id) on delete restrict,
  constraint standard_change_checks_build_version_unique unique (build_id, check_version),
  constraint standard_change_checks_stage_run_unique unique (stage_run_id),
  constraint standard_change_checks_fresh_context_unique unique (fresh_context_id)
);

create index if not exists standard_change_requests_owner_state_idx
  on public.standard_change_requests(user_id, state, created_at desc);
create index if not exists standard_change_stage_runs_request_idx
  on public.standard_change_stage_runs(change_request_id, stage, created_at desc);
create index if not exists standard_change_compilations_owner_idx
  on public.standard_change_compilations(user_id, change_request_id, created_at desc);
create index if not exists standard_change_builds_request_idx
  on public.standard_change_builds(change_request_id, created_at desc);
create index if not exists standard_change_checks_request_idx
  on public.standard_change_checks(change_request_id, created_at desc);

alter table public.standard_change_requests enable row level security;
alter table public.standard_change_stage_runs enable row level security;
alter table public.standard_change_compilations enable row level security;
alter table public.standard_change_builds enable row level security;
alter table public.standard_change_checks enable row level security;

drop policy if exists "owners read standard change requests" on public.standard_change_requests;
create policy "owners read standard change requests" on public.standard_change_requests
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change stage runs" on public.standard_change_stage_runs;
create policy "owners read standard change stage runs" on public.standard_change_stage_runs
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change compilations" on public.standard_change_compilations;
create policy "owners read standard change compilations" on public.standard_change_compilations
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change builds" on public.standard_change_builds;
create policy "owners read standard change builds" on public.standard_change_builds
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change checks" on public.standard_change_checks;
create policy "owners read standard change checks" on public.standard_change_checks
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.standard_change_requests, public.standard_change_stage_runs,
  public.standard_change_compilations, public.standard_change_builds, public.standard_change_checks
  from public, anon, authenticated;
grant select on public.standard_change_requests, public.standard_change_stage_runs,
  public.standard_change_compilations, public.standard_change_builds, public.standard_change_checks
  to authenticated;

create or replace function public.queue_standard_change_request_from_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposal public.proposals%rowtype;
  v_capture public.capture_runs%rowtype;
  v_payload jsonb;
  v_hash text;
begin
  if new.decision <> 'accepted' then return new; end if;
  select * into v_proposal from public.proposals
  where id = new.proposal_id and user_id = new.user_id;
  if not found or v_proposal.proposal_hash <> new.proposal_hash
     or v_proposal.capture_run_id is null or v_proposal.source_standard_artifact_id is null then
    raise exception 'standard_change_proposal_lineage_invalid' using errcode = '22023';
  end if;
  if new.scope->>'apply_change' = 'true' then
    raise exception 'standard_change_acceptance_cannot_apply' using errcode = '22023';
  end if;
  select * into v_capture from public.capture_runs where id = v_proposal.capture_run_id;
  if not found or v_capture.user_id <> new.user_id
     or v_capture.source_manifest is null or v_capture.source_manifest_sha256 is null then
    raise exception 'standard_change_source_manifest_required' using errcode = 'P0001';
  end if;
  v_payload := jsonb_build_object(
    'schema', 'ctrl.standard-change.request.v1',
    'owner_id', new.user_id,
    'proposal_id', v_proposal.id,
    'proposal_hash', v_proposal.proposal_hash,
    'decision_id', new.id,
    'decision_hash', new.decision_hash,
    'request_version', 1,
    'source_standard_artifact_id', v_proposal.source_standard_artifact_id,
    'source_standard_sha256', v_proposal.source_standard_sha256,
    'source_snapshot', v_proposal.source_snapshot,
    'source_manifest_sha256', v_capture.source_manifest_sha256,
    'surface', v_proposal.surface,
    'change_type', v_proposal.type,
    'accepted_scope', new.scope
  );
  v_hash := encode(extensions.digest(convert_to(v_payload::text, 'UTF8'), 'sha256'), 'hex');
  insert into public.standard_change_requests(
    user_id, proposal_id, proposal_decision_id, request_version, request_hash,
    proposal_hash, decision_hash, source_standard_artifact_id, source_standard_sha256,
    source_snapshot, source_manifest_sha256, surface, change_type, accepted_scope
  ) values (
    new.user_id, v_proposal.id, new.id, 1, v_hash,
    v_proposal.proposal_hash, new.decision_hash, v_proposal.source_standard_artifact_id,
    v_proposal.source_standard_sha256, v_proposal.source_snapshot,
    v_capture.source_manifest_sha256, v_proposal.surface, v_proposal.type, new.scope
  ) on conflict (proposal_decision_id) do nothing;
  return new;
end;
$$;

drop trigger if exists proposal_decisions_queue_standard_change on public.proposal_decisions;
create trigger proposal_decisions_queue_standard_change
after insert on public.proposal_decisions
for each row execute function public.queue_standard_change_request_from_decision();

create or replace function public.assert_standard_change_pipeline_capability(p_capability text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_capability is null or length(p_capability) < 32 or not exists (
    select 1 from vault.decrypted_secrets
    where name = 'standard_change_pipeline_rpc_secret' and decrypted_secret = p_capability
  ) then
    raise exception 'standard_change_pipeline_capability_required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_standard_change_pipeline_capability(text) from public, anon, authenticated;

create or replace function public.current_standard_change_packet(p_request public.standard_change_requests)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_proposal public.proposals%rowtype;
  v_decision public.proposal_decisions%rowtype;
  v_capture public.capture_runs%rowtype;
begin
  select * into v_proposal from public.proposals where id = p_request.proposal_id;
  select * into v_decision from public.proposal_decisions where id = p_request.proposal_decision_id;
  select * into v_capture from public.capture_runs where id = v_proposal.capture_run_id;
  return jsonb_build_object(
    'id', p_request.id,
    'version', p_request.request_version,
    'request_hash', p_request.request_hash,
    'surface', p_request.surface,
    'accepted_scope', p_request.accepted_scope,
    'proposal', jsonb_build_object(
      'id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
      'type', v_proposal.type, 'surface', v_proposal.surface,
      'headline', v_proposal.headline, 'delta_text', v_proposal.delta_text,
      'evidence', v_proposal.evidence
    ),
    'decision', jsonb_build_object('id', v_decision.id, 'decision_hash', v_decision.decision_hash),
    'source', jsonb_build_object(
      'standard_artifact_id', p_request.source_standard_artifact_id,
      'standard_sha256', p_request.source_standard_sha256,
      'source_snapshot', p_request.source_snapshot,
      'source_manifest_sha256', p_request.source_manifest_sha256,
      'evidence_ids', coalesce(v_capture.source_manifest->'evidence_ids', '[]'::jsonb),
      'criteria', coalesce(v_capture.source_manifest->'criteria', '[]'::jsonb)
    )
  );
end;
$$;

revoke all on function public.current_standard_change_packet(public.standard_change_requests) from public, anon, authenticated;

create or replace function public.assert_standard_change_source_current(p_request public.standard_change_requests)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_artifact public.generated_artifacts%rowtype;
  v_latest public.generated_artifacts%rowtype;
  v_sha text;
  v_manifest jsonb;
  v_current_criteria jsonb;
begin
  select * into v_artifact from public.generated_artifacts
  where id = p_request.source_standard_artifact_id and user_id = p_request.user_id and kind = 'standard';
  if not found then raise exception 'standard_change_source_missing' using errcode = 'P0001'; end if;
  v_sha := encode(extensions.digest(convert_to(v_artifact.body, 'UTF8'), 'sha256'), 'hex');
  if v_sha <> p_request.source_standard_sha256 then
    raise exception 'standard_change_source_hash_changed' using errcode = '40001';
  end if;
  select * into v_latest from public.generated_artifacts
  where user_id = p_request.user_id and kind = 'standard'
  order by created_at desc, id desc limit 1;
  if not found or v_latest.id <> p_request.source_standard_artifact_id
     or encode(extensions.digest(convert_to(v_latest.body, 'UTF8'), 'sha256'), 'hex') <> p_request.source_standard_sha256 then
    raise exception 'standard_change_source_stale' using errcode = '40001';
  end if;
  select cr.source_manifest into v_manifest
  from public.proposals p
  join public.capture_runs cr on cr.id = p.capture_run_id
  where p.id = p_request.proposal_id and p.user_id = p_request.user_id;
  if v_manifest is null or encode(extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'), 'hex') <> p_request.source_manifest_sha256 then
    raise exception 'standard_change_source_manifest_changed' using errcode = '40001';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'surface', c.surface,
    'name', c.name,
    'check_text', c.check_text,
    'observable', c.observable,
    'weight', c.weight,
    'disposition', c.disposition,
    'disc_verdict', c.disc_verdict,
    'version', c.version,
    'provenance', c.provenance
  ) order by c.surface, c.name, c.id), '[]'::jsonb)
  into v_current_criteria
  from public.criteria c
  where c.user_id = p_request.user_id and c.is_current = true;
  if v_current_criteria <> coalesce(v_manifest->'criteria', '[]'::jsonb) then
    raise exception 'standard_change_criteria_stale' using errcode = '40001';
  end if;
  return jsonb_build_object(
    'source_body', v_artifact.body,
    'current_standard_artifact_id', v_latest.id,
    'current_standard_sha256', p_request.source_standard_sha256
  );
end;
$$;

revoke all on function public.assert_standard_change_source_current(public.standard_change_requests) from public, anon, authenticated;

create or replace function public.reserve_standard_change_compile(
  p_request_id text,
  p_request_fingerprint text,
  p_change_request_id uuid,
  p_expected_request_hash text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_change public.standard_change_requests%rowtype;
  v_existing public.standard_change_stage_runs%rowtype;
  v_run_id uuid;
  v_source jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if p_request_id !~ '^[A-Za-z0-9_-]{16,120}$' or p_request_fingerprint !~ '^[0-9a-f]{64}$'
     or p_expected_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'standard_change_invalid_compile_reservation' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('standard-change:compile:' || v_user_id::text || ':' || p_change_request_id::text, 0));
  select * into v_existing from public.standard_change_stage_runs
  where user_id = v_user_id and stage = 'compile' and request_id = p_request_id;
  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then raise exception 'standard_change_request_conflict' using errcode = '23505'; end if;
    return jsonb_build_object('run_id', v_existing.id, 'status', v_existing.status, 'result', v_existing.result, 'idempotent', true);
  end if;
  select * into v_change from public.standard_change_requests
  where id = p_change_request_id and user_id = v_user_id for update;
  if not found then raise exception 'standard_change_request_not_owned' using errcode = '42501'; end if;
  if v_change.request_hash <> p_expected_request_hash then raise exception 'standard_change_request_changed' using errcode = '40001'; end if;
  if v_change.state not in ('accepted', 'compiling') then raise exception 'standard_change_not_compile_ready' using errcode = 'P0001'; end if;
  if exists (select 1 from public.standard_change_compilations where change_request_id = v_change.id) then
    raise exception 'standard_change_already_compiled' using errcode = '23505';
  end if;
  v_source := public.assert_standard_change_source_current(v_change);
  insert into public.standard_change_stage_runs(user_id, change_request_id, stage, request_id, request_fingerprint)
  values (v_user_id, v_change.id, 'compile', p_request_id, p_request_fingerprint)
  returning id into v_run_id;
  update public.standard_change_requests set state = 'compiling', updated_at = now() where id = v_change.id;
  return jsonb_build_object(
    'run_id', v_run_id,
    'status', 'running',
    'idempotent', false,
    'request', public.current_standard_change_packet(v_change),
    'source_body', v_source->>'source_body',
    'current_standard_artifact_id', v_source->>'current_standard_artifact_id',
    'current_standard_sha256', v_source->>'current_standard_sha256'
  );
end;
$$;

create or replace function public.finalize_standard_change_compile(
  p_run_id uuid,
  p_compiled jsonb,
  p_compile_sha256 text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.standard_change_stage_runs%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_id uuid;
  v_status text;
  v_result jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if jsonb_typeof(p_compiled) <> 'object' or p_compiled->>'schema' <> 'ctrl.standard-change.compile.v1'
     or p_compile_sha256 !~ '^[0-9a-f]{64}$' or octet_length(p_compiled::text) > 524288 then
    raise exception 'standard_change_invalid_compilation' using errcode = '22023';
  end if;
  select * into v_run from public.standard_change_stage_runs
  where id = p_run_id and user_id = v_user_id and stage = 'compile' for update;
  if not found then raise exception 'standard_change_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' then return v_run.result || jsonb_build_object('already_finalized', true); end if;
  if v_run.status <> 'running' then raise exception 'standard_change_run_not_running' using errcode = 'P0001'; end if;
  select * into v_change from public.standard_change_requests where id = v_run.change_request_id for update;
  perform public.assert_standard_change_source_current(v_change);
  if p_compiled->'change_request'->>'id' <> v_change.id::text
     or p_compiled->'change_request'->>'sha256' <> v_change.request_hash
     or p_compiled->'proposal'->>'sha256' <> v_change.proposal_hash
     or p_compiled->'decision'->>'sha256' <> v_change.decision_hash
     or p_compiled->'boundaries'->>'active_standard_mutated' <> 'false'
     or p_compiled->'boundaries'->>'deploy_authorized' <> 'false'
     or p_compiled->'boundaries'->>'owner_apply_required' <> 'true'
     or jsonb_array_length(coalesce(p_compiled->'boundaries'->'holdout_ids_loaded', '[]'::jsonb)) <> 0 then
    raise exception 'standard_change_compilation_lineage_invalid' using errcode = '22023';
  end if;
  v_status := p_compiled->>'candidate_status';
  if v_status not in ('compiled', 'needs_evidence', 'no_change') then raise exception 'standard_change_candidate_status_invalid' using errcode = '22023'; end if;
  insert into public.standard_change_compilations(
    user_id, change_request_id, stage_run_id, candidate_version, request_hash,
    compiled, compile_sha256, database_sha256, candidate_status
  ) values (
    v_user_id, v_change.id, v_run.id, 1, v_change.request_hash,
    p_compiled, p_compile_sha256,
    encode(extensions.digest(convert_to(p_compiled::text, 'UTF8'), 'sha256'), 'hex'),
    v_status
  ) returning id into v_id;
  v_result := jsonb_build_object(
    'change_request_id', v_change.id, 'compilation_id', v_id,
    'candidate_version', 1, 'candidate_status', v_status,
    'compile_sha256', p_compile_sha256, 'active_standard_mutated', false,
    'apply_authorized', false, 'deploy_authorized', false
  );
  update public.standard_change_stage_runs set status = 'done', result = v_result, updated_at = now() where id = v_run.id;
  update public.standard_change_requests set state = 'compiled', updated_at = now() where id = v_change.id;
  return v_result || jsonb_build_object('already_finalized', false);
end;
$$;

create or replace function public.reserve_standard_change_build(
  p_request_id text,
  p_request_fingerprint text,
  p_compilation_id uuid,
  p_expected_compile_sha256 text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_compile public.standard_change_compilations%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_existing public.standard_change_stage_runs%rowtype;
  v_run_id uuid;
  v_source jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if p_request_id !~ '^[A-Za-z0-9_-]{16,120}$' or p_request_fingerprint !~ '^[0-9a-f]{64}$'
     or p_expected_compile_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'standard_change_invalid_build_reservation' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('standard-change:build:' || v_user_id::text || ':' || p_compilation_id::text, 0));
  select * into v_existing from public.standard_change_stage_runs
  where user_id = v_user_id and stage = 'build' and request_id = p_request_id;
  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then raise exception 'standard_change_request_conflict' using errcode = '23505'; end if;
    return jsonb_build_object('run_id', v_existing.id, 'status', v_existing.status, 'result', v_existing.result, 'idempotent', true);
  end if;
  select * into v_compile from public.standard_change_compilations
  where id = p_compilation_id and user_id = v_user_id;
  if not found then raise exception 'standard_change_compilation_not_owned' using errcode = '42501'; end if;
  if v_compile.compile_sha256 <> p_expected_compile_sha256 then raise exception 'standard_change_compilation_changed' using errcode = '40001'; end if;
  select * into v_change from public.standard_change_requests where id = v_compile.change_request_id for update;
  if v_change.state not in ('compiled', 'building') then raise exception 'standard_change_not_build_ready' using errcode = 'P0001'; end if;
  if exists (select 1 from public.standard_change_builds where compilation_id = v_compile.id) then raise exception 'standard_change_already_built' using errcode = '23505'; end if;
  v_source := public.assert_standard_change_source_current(v_change);
  insert into public.standard_change_stage_runs(user_id, change_request_id, stage, request_id, request_fingerprint)
  values (v_user_id, v_change.id, 'build', p_request_id, p_request_fingerprint) returning id into v_run_id;
  update public.standard_change_requests set state = 'building', updated_at = now() where id = v_change.id;
  return jsonb_build_object(
    'run_id', v_run_id, 'status', 'running', 'idempotent', false,
    'request', public.current_standard_change_packet(v_change),
    'compiled', v_compile.compiled, 'compile_sha256', v_compile.compile_sha256,
    'source_body', v_source->>'source_body'
  );
end;
$$;

create or replace function public.finalize_standard_change_build(
  p_run_id uuid,
  p_compilation_id uuid,
  p_build jsonb,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.standard_change_stage_runs%rowtype;
  v_compile public.standard_change_compilations%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_id uuid;
  v_result jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if jsonb_typeof(p_build) <> 'object' or p_build->>'schema' <> 'ctrl.standard-change.build.v1'
     or octet_length(p_build::text) > 3145728
     or p_build->>'runtime_sha256' !~ '^[0-9a-f]{64}$'
     or p_build->>'evaluation_sha256' !~ '^[0-9a-f]{64}$'
     or p_build->>'build_manifest_sha256' !~ '^[0-9a-f]{64}$'
     or p_build->>'package_sha256' !~ '^[0-9a-f]{64}$' then
    raise exception 'standard_change_invalid_build' using errcode = '22023';
  end if;
  select * into v_run from public.standard_change_stage_runs
  where id = p_run_id and user_id = v_user_id and stage = 'build' for update;
  if not found then raise exception 'standard_change_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' then return v_run.result || jsonb_build_object('already_finalized', true); end if;
  if v_run.status <> 'running' then raise exception 'standard_change_run_not_running' using errcode = 'P0001'; end if;
  select * into v_compile from public.standard_change_compilations
  where id = p_compilation_id and user_id = v_user_id and change_request_id = v_run.change_request_id;
  if not found then raise exception 'standard_change_compilation_not_owned' using errcode = '42501'; end if;
  select * into v_change from public.standard_change_requests where id = v_run.change_request_id for update;
  perform public.assert_standard_change_source_current(v_change);
  if p_build->'build_manifest'->'change_request'->>'sha256' <> v_change.request_hash
     or p_build->'build_manifest'->>'compile_sha256' <> v_compile.compile_sha256
     or p_build->'build_manifest'->'statuses'->>'release' <> 'closed'
     or p_build->'build_manifest'->'statuses'->>'deploy_authorized' <> 'false'
     or p_build->'build_manifest'->'statuses'->>'apply_authorized' <> 'false'
     or p_build->'build_manifest'->'exclusions'->>'expected_answers_in_runtime' <> 'false'
     or jsonb_array_length(coalesce(p_build->'build_manifest'->'exclusions'->'holdout_ids', '[]'::jsonb)) <> 0 then
    raise exception 'standard_change_build_lineage_invalid' using errcode = '22023';
  end if;
  insert into public.standard_change_builds(
    user_id, change_request_id, compilation_id, stage_run_id, build_version,
    runtime_body, runtime_sha256, evaluation_manifest, evaluation_sha256,
    build_manifest, build_manifest_sha256, package_sha256
  ) values (
    v_user_id, v_change.id, v_compile.id, v_run.id, 1,
    p_build->>'runtime_body', p_build->>'runtime_sha256', p_build->'evaluation_manifest',
    p_build->>'evaluation_sha256', p_build->'build_manifest',
    p_build->>'build_manifest_sha256', p_build->>'package_sha256'
  ) returning id into v_id;
  v_result := jsonb_build_object(
    'change_request_id', v_change.id, 'build_id', v_id, 'build_version', 1,
    'package_sha256', p_build->>'package_sha256', 'release', 'closed',
    'active_standard_mutated', false, 'apply_authorized', false, 'deploy_authorized', false
  );
  update public.standard_change_stage_runs set status = 'done', result = v_result, updated_at = now() where id = v_run.id;
  update public.standard_change_requests set state = 'built', updated_at = now() where id = v_change.id;
  return v_result || jsonb_build_object('already_finalized', false);
end;
$$;

create or replace function public.reserve_standard_change_check(
  p_request_id text,
  p_request_fingerprint text,
  p_build_id uuid,
  p_expected_package_sha256 text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_build public.standard_change_builds%rowtype;
  v_compile public.standard_change_compilations%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_existing public.standard_change_stage_runs%rowtype;
  v_run_id uuid;
  v_source jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if p_request_id !~ '^[A-Za-z0-9_-]{16,120}$' or p_request_fingerprint !~ '^[0-9a-f]{64}$'
     or p_expected_package_sha256 !~ '^[0-9a-f]{64}$' then raise exception 'standard_change_invalid_check_reservation' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('standard-change:check:' || v_user_id::text || ':' || p_build_id::text, 0));
  select * into v_existing from public.standard_change_stage_runs
  where user_id = v_user_id and stage = 'check' and request_id = p_request_id;
  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then raise exception 'standard_change_request_conflict' using errcode = '23505'; end if;
    return jsonb_build_object('run_id', v_existing.id, 'status', v_existing.status, 'result', v_existing.result, 'idempotent', true);
  end if;
  select * into v_build from public.standard_change_builds where id = p_build_id and user_id = v_user_id;
  if not found then raise exception 'standard_change_build_not_owned' using errcode = '42501'; end if;
  if v_build.package_sha256 <> p_expected_package_sha256 then raise exception 'standard_change_build_changed' using errcode = '40001'; end if;
  select * into v_compile from public.standard_change_compilations where id = v_build.compilation_id and user_id = v_user_id;
  select * into v_change from public.standard_change_requests where id = v_build.change_request_id for update;
  if v_change.state not in ('built', 'checking') then raise exception 'standard_change_not_check_ready' using errcode = 'P0001'; end if;
  if exists (select 1 from public.standard_change_checks where build_id = v_build.id) then raise exception 'standard_change_already_checked' using errcode = '23505'; end if;
  v_source := public.assert_standard_change_source_current(v_change);
  insert into public.standard_change_stage_runs(user_id, change_request_id, stage, request_id, request_fingerprint)
  values (v_user_id, v_change.id, 'check', p_request_id, p_request_fingerprint) returning id into v_run_id;
  update public.standard_change_requests set state = 'checking', updated_at = now() where id = v_change.id;
  return jsonb_build_object(
    'run_id', v_run_id, 'status', 'running', 'idempotent', false,
    'request', public.current_standard_change_packet(v_change),
    'compiled', v_compile.compiled, 'compile_sha256', v_compile.compile_sha256,
    'build', jsonb_build_object(
      'schema', 'ctrl.standard-change.build.v1',
      'runtime_body', v_build.runtime_body, 'runtime_sha256', v_build.runtime_sha256,
      'evaluation_manifest', v_build.evaluation_manifest, 'evaluation_sha256', v_build.evaluation_sha256,
      'build_manifest', v_build.build_manifest, 'build_manifest_sha256', v_build.build_manifest_sha256,
      'package_sha256', v_build.package_sha256
    ),
    'source_body', v_source->>'source_body',
    'current_standard_artifact_id', v_source->>'current_standard_artifact_id',
    'current_standard_sha256', v_source->>'current_standard_sha256'
  );
end;
$$;

create or replace function public.finalize_standard_change_check(
  p_run_id uuid,
  p_build_id uuid,
  p_check jsonb,
  p_result_sha256 text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.standard_change_stage_runs%rowtype;
  v_build public.standard_change_builds%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_id uuid;
  v_verdict text;
  v_result jsonb;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if jsonb_typeof(p_check) <> 'object' or p_check->>'schema' <> 'ctrl.standard-change.check.v1'
     or jsonb_typeof(p_check->'findings') <> 'array' or jsonb_array_length(p_check->'findings') < 8
     or p_result_sha256 !~ '^[0-9a-f]{64}$' or octet_length(p_check::text) > 524288 then
    raise exception 'standard_change_invalid_check' using errcode = '22023';
  end if;
  select * into v_run from public.standard_change_stage_runs
  where id = p_run_id and user_id = v_user_id and stage = 'check' for update;
  if not found then raise exception 'standard_change_run_not_owned' using errcode = '42501'; end if;
  if v_run.status = 'done' then return v_run.result || jsonb_build_object('already_finalized', true); end if;
  if v_run.status <> 'running' then raise exception 'standard_change_run_not_running' using errcode = 'P0001'; end if;
  select * into v_build from public.standard_change_builds
  where id = p_build_id and user_id = v_user_id and change_request_id = v_run.change_request_id;
  if not found then raise exception 'standard_change_build_not_owned' using errcode = '42501'; end if;
  select * into v_change from public.standard_change_requests where id = v_run.change_request_id for update;
  perform public.assert_standard_change_source_current(v_change);
  v_verdict := p_check->>'verdict';
  if v_verdict not in ('passed', 'blocked', 'needs_evidence')
     or p_check->'frozen'->>'request_sha256' <> v_change.request_hash
     or p_check->'frozen'->>'runtime_sha256' <> v_build.runtime_sha256
     or p_check->'frozen'->>'build_manifest_sha256' <> v_build.build_manifest_sha256
     or p_check->'release'->>'active_standard_mutated' <> 'false'
     or p_check->'release'->>'apply_authorized' <> 'false'
     or p_check->'release'->>'deploy_authorized' <> 'false' then
    raise exception 'standard_change_check_lineage_invalid' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_check->'findings') finding
    where finding->>'criterion_id' is null
       or finding->>'status' not in ('holds', 'breaks', 'insufficient-evidence', 'not-applicable')
       or finding->>'evidence_locator' is null
  ) then raise exception 'standard_change_check_finding_invalid' using errcode = '22023'; end if;
  insert into public.standard_change_checks(
    user_id, change_request_id, build_id, stage_run_id, check_version,
    verdict, findings, result, result_sha256
  ) values (
    v_user_id, v_change.id, v_build.id, v_run.id, 1,
    v_verdict, p_check->'findings', p_check, p_result_sha256
  ) returning id into v_id;
  v_result := jsonb_build_object(
    'change_request_id', v_change.id, 'check_id', v_id, 'check_version', 1,
    'verdict', v_verdict, 'result_sha256', p_result_sha256,
    'active_standard_mutated', false, 'apply_authorized', false,
    'deploy_authorized', false, 'release_authorized', false
  );
  update public.standard_change_stage_runs set status = 'done', result = v_result, updated_at = now() where id = v_run.id;
  update public.standard_change_requests
  set state = case v_verdict when 'passed' then 'checked' when 'needs_evidence' then 'needs_evidence' else 'blocked' end,
      updated_at = now()
  where id = v_change.id;
  return v_result || jsonb_build_object('already_finalized', false);
end;
$$;

create or replace function public.fail_standard_change_stage(
  p_run_id uuid,
  p_error text,
  p_capability text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.standard_change_stage_runs%rowtype;
  v_restore text;
begin
  perform public.assert_standard_change_pipeline_capability(p_capability);
  if v_user_id is null then raise exception 'standard_change_auth_required' using errcode = '42501'; end if;
  if p_error is null or length(p_error) not between 1 and 1000 then raise exception 'standard_change_invalid_failure' using errcode = '22023'; end if;
  select * into v_run from public.standard_change_stage_runs where id = p_run_id and user_id = v_user_id for update;
  if not found then raise exception 'standard_change_run_not_owned' using errcode = '42501'; end if;
  if v_run.status <> 'running' then return jsonb_build_object('run_id', v_run.id, 'status', v_run.status, 'already_finished', true); end if;
  v_restore := case v_run.stage when 'compile' then 'accepted' when 'build' then 'compiled' else 'built' end;
  update public.standard_change_stage_runs set status = 'failed', error = p_error, updated_at = now() where id = v_run.id;
  update public.standard_change_requests set state = v_restore, updated_at = now() where id = v_run.change_request_id;
  return jsonb_build_object('run_id', v_run.id, 'status', 'failed', 'already_finished', false);
end;
$$;

-- Acceptance creates the request but still applies nothing.
create or replace function public.decide_capture_proposal(
  p_proposal_id uuid,
  p_expected_hash text,
  p_decision text,
  p_scope jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals%rowtype;
  v_decision_id uuid;
  v_decision_hash text;
  v_change public.standard_change_requests%rowtype;
begin
  if v_user_id is null then raise exception 'capture_decision_auth_required' using errcode = '42501'; end if;
  if p_decision not in ('accepted', 'rejected', 'needs_evidence', 'superseded')
     or jsonb_typeof(p_scope) <> 'object' then raise exception 'capture_decision_invalid' using errcode = '22023'; end if;
  select * into v_proposal from public.proposals where id = p_proposal_id and user_id = v_user_id for update;
  if not found then raise exception 'capture_proposal_not_owned' using errcode = '42501'; end if;
  if v_proposal.proposal_hash <> p_expected_hash then raise exception 'capture_proposal_changed' using errcode = '40001'; end if;
  if v_proposal.status <> 'awaiting' then raise exception 'capture_proposal_already_decided' using errcode = '23505'; end if;
  if p_decision = 'accepted' and p_scope = '{}'::jsonb then raise exception 'capture_acceptance_scope_required' using errcode = '22023'; end if;
  if p_decision = 'accepted' and p_scope->>'apply_change' = 'true' then raise exception 'capture_acceptance_cannot_apply' using errcode = '22023'; end if;
  if v_proposal.type = 'drift' and not (p_scope->>'freshness_decision' in ('retain', 'revise', 'gather_evidence', 'retire')) then
    raise exception 'capture_freshness_decision_required' using errcode = '22023';
  end if;
  v_decision_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'proposal_id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
    'decision', p_decision, 'scope', p_scope, 'owner', v_user_id
  )::text, 'UTF8'), 'sha256'), 'hex');
  insert into public.proposal_decisions(proposal_id, user_id, proposal_hash, decision, scope, decision_hash)
  values (v_proposal.id, v_user_id, v_proposal.proposal_hash, p_decision, p_scope, v_decision_hash)
  returning id into v_decision_id;
  update public.proposals set status = p_decision, decided_at = now(), decided_by = v_user_id, decision_scope = p_scope
  where id = v_proposal.id;
  if p_decision = 'accepted' then
    select * into v_change from public.standard_change_requests where proposal_decision_id = v_decision_id;
  end if;
  return jsonb_build_object(
    'proposal_id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
    'decision', p_decision, 'decision_hash', v_decision_hash,
    'change_applied', false,
    'change_request_id', v_change.id,
    'change_request_hash', v_change.request_hash,
    'next', case when p_decision = 'accepted' then 'compile_candidate' else null end
  );
end;
$$;

revoke all on function public.reserve_standard_change_compile(text, text, uuid, text, text) from public, anon;
revoke all on function public.finalize_standard_change_compile(uuid, jsonb, text, text) from public, anon;
revoke all on function public.reserve_standard_change_build(text, text, uuid, text, text) from public, anon;
revoke all on function public.finalize_standard_change_build(uuid, uuid, jsonb, text) from public, anon;
revoke all on function public.reserve_standard_change_check(text, text, uuid, text, text) from public, anon;
revoke all on function public.finalize_standard_change_check(uuid, uuid, jsonb, text, text) from public, anon;
revoke all on function public.fail_standard_change_stage(uuid, text, text) from public, anon;
grant execute on function public.reserve_standard_change_compile(text, text, uuid, text, text) to authenticated, service_role;
grant execute on function public.finalize_standard_change_compile(uuid, jsonb, text, text) to authenticated, service_role;
grant execute on function public.reserve_standard_change_build(text, text, uuid, text, text) to authenticated, service_role;
grant execute on function public.finalize_standard_change_build(uuid, uuid, jsonb, text) to authenticated, service_role;
grant execute on function public.reserve_standard_change_check(text, text, uuid, text, text) to authenticated, service_role;
grant execute on function public.finalize_standard_change_check(uuid, uuid, jsonb, text, text) to authenticated, service_role;
grant execute on function public.fail_standard_change_stage(uuid, text, text) to authenticated, service_role;
revoke all on function public.decide_capture_proposal(uuid, text, text, jsonb) from public, anon;
grant execute on function public.decide_capture_proposal(uuid, text, text, jsonb) to authenticated;

commit;
