-- R116: explicit subject-owner review, atomic apply and head-safe reversal.
--
-- This migration preserves the R115 candidate-only boundary. A passed Check
-- becomes active only through the authenticated owner's exact frozen review.
-- Apply and reversal create new standard artefacts. They never deploy or
-- release a package and they never delete historical criteria or artefacts.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'standard_change_checks_id_user_unique'
      and conrelid = 'public.standard_change_checks'::regclass
  ) then
    alter table public.standard_change_checks
      add constraint standard_change_checks_id_user_unique unique (id, user_id);
  end if;
end $$;

alter table public.standard_change_requests
  drop constraint if exists standard_change_requests_state_check;
alter table public.standard_change_requests
  add constraint standard_change_requests_state_check check (state in (
    'accepted', 'compiling', 'compiled', 'building', 'built', 'checking',
    'checked', 'needs_evidence', 'blocked', 'review_ready', 'applied',
    'rejected', 'reversed'
  ));

create table if not exists public.standard_change_review_packets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null,
  check_id uuid not null,
  source_standard_artifact_id uuid not null,
  source_standard_sha256 text not null check (source_standard_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_before jsonb not null check (jsonb_typeof(criteria_before) = 'array'),
  criteria_before_sha256 text not null check (criteria_before_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_after jsonb not null check (jsonb_typeof(criteria_after) = 'array'),
  criteria_after_sha256 text not null check (criteria_after_sha256 ~ '^[0-9a-f]{64}$'),
  target_before jsonb not null check (jsonb_typeof(target_before) = 'object'),
  target_after jsonb not null check (jsonb_typeof(target_after) = 'object'),
  planned_standard_artifact_id uuid not null unique,
  planned_standard_version_id uuid not null unique,
  planned_application_id uuid not null unique,
  planned_standard_name text not null check (length(planned_standard_name) between 1 and 240),
  planned_standard_body text not null check (octet_length(planned_standard_body) between 1 and 2097152),
  planned_standard_sha256 text not null check (planned_standard_sha256 ~ '^[0-9a-f]{64}$'),
  packet jsonb not null check (jsonb_typeof(packet) = 'object'),
  packet_sha256 text not null unique check (packet_sha256 ~ '^[0-9a-f]{64}$'),
  state text not null default 'ready' check (state in ('ready', 'decided')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint standard_change_review_packets_request_owner_fk
    foreign key (change_request_id, user_id)
    references public.standard_change_requests(id, user_id) on delete restrict,
  constraint standard_change_review_packets_check_owner_fk
    foreign key (check_id, user_id)
    references public.standard_change_checks(id, user_id) on delete restrict,
  constraint standard_change_review_packets_source_owner_fk
    foreign key (source_standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_change_review_packets_check_unique unique (check_id),
  constraint standard_change_review_packets_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_owner_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_packet_id uuid not null,
  request_id text not null check (request_id ~ '^[A-Za-z0-9_-]{16,120}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  decision text not null check (decision in ('approved', 'rejected')),
  note text check (note is null or length(note) <= 2000),
  reviewed_hashes jsonb not null check (jsonb_typeof(reviewed_hashes) = 'object'),
  decision_hash text not null unique check (decision_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  constraint standard_change_owner_decisions_review_owner_fk
    foreign key (review_packet_id, user_id)
    references public.standard_change_review_packets(id, user_id) on delete restrict,
  constraint standard_change_owner_decisions_review_unique unique (review_packet_id),
  constraint standard_change_owner_decisions_request_unique unique (user_id, request_id),
  constraint standard_change_owner_decisions_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_applications (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null,
  review_packet_id uuid not null,
  owner_decision_id uuid not null,
  source_standard_artifact_id uuid not null,
  target_standard_artifact_id uuid not null,
  target_criterion_id uuid not null,
  source_standard_sha256 text not null check (source_standard_sha256 ~ '^[0-9a-f]{64}$'),
  target_standard_sha256 text not null check (target_standard_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_before jsonb not null check (jsonb_typeof(criteria_before) = 'array'),
  criteria_before_sha256 text not null check (criteria_before_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_after jsonb not null check (jsonb_typeof(criteria_after) = 'array'),
  criteria_after_sha256 text not null check (criteria_after_sha256 ~ '^[0-9a-f]{64}$'),
  application_hash text not null unique check (application_hash ~ '^[0-9a-f]{64}$'),
  deploy_authorized boolean not null default false check (deploy_authorized = false),
  release_authorized boolean not null default false check (release_authorized = false),
  created_at timestamptz not null default now(),
  constraint standard_change_applications_request_owner_fk
    foreign key (change_request_id, user_id)
    references public.standard_change_requests(id, user_id) on delete restrict,
  constraint standard_change_applications_review_owner_fk
    foreign key (review_packet_id, user_id)
    references public.standard_change_review_packets(id, user_id) on delete restrict,
  constraint standard_change_applications_decision_owner_fk
    foreign key (owner_decision_id, user_id)
    references public.standard_change_owner_decisions(id, user_id) on delete restrict,
  constraint standard_change_applications_source_owner_fk
    foreign key (source_standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_change_applications_target_owner_fk
    foreign key (target_standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_change_applications_target_criterion_fk
    foreign key (target_criterion_id) references public.criteria(id) on delete restrict,
  constraint standard_change_applications_request_unique unique (change_request_id),
  constraint standard_change_applications_review_unique unique (review_packet_id),
  constraint standard_change_applications_decision_unique unique (owner_decision_id),
  constraint standard_change_applications_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_change_reversals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null,
  request_id text not null check (request_id ~ '^[A-Za-z0-9_-]{16,120}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  reason text not null check (length(reason) between 1 and 2000),
  active_standard_artifact_id uuid not null,
  restored_standard_artifact_id uuid not null,
  active_standard_sha256 text not null check (active_standard_sha256 ~ '^[0-9a-f]{64}$'),
  restored_standard_sha256 text not null check (restored_standard_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_before_sha256 text not null check (criteria_before_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_restored_sha256 text not null check (criteria_restored_sha256 ~ '^[0-9a-f]{64}$'),
  reversal_hash text not null unique check (reversal_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  constraint standard_change_reversals_application_owner_fk
    foreign key (application_id, user_id)
    references public.standard_change_applications(id, user_id) on delete restrict,
  constraint standard_change_reversals_active_owner_fk
    foreign key (active_standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_change_reversals_restored_owner_fk
    foreign key (restored_standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_change_reversals_application_unique unique (application_id),
  constraint standard_change_reversals_request_unique unique (user_id, request_id),
  constraint standard_change_reversals_id_user_unique unique (id, user_id)
);

create table if not exists public.standard_versions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  artifact_id uuid not null,
  parent_artifact_id uuid not null,
  root_artifact_id uuid not null,
  version integer not null check (version between 1 and 100000),
  event_type text not null check (event_type in ('application', 'reversal')),
  application_id uuid,
  reversal_id uuid,
  body_sha256 text not null check (body_sha256 ~ '^[0-9a-f]{64}$'),
  criteria_snapshot jsonb not null check (jsonb_typeof(criteria_snapshot) = 'array'),
  criteria_sha256 text not null check (criteria_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  constraint standard_versions_artifact_owner_fk
    foreign key (artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_versions_parent_owner_fk
    foreign key (parent_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_versions_root_owner_fk
    foreign key (root_artifact_id, user_id)
    references public.generated_artifacts(id, user_id) on delete restrict,
  constraint standard_versions_application_owner_fk
    foreign key (application_id, user_id)
    references public.standard_change_applications(id, user_id) on delete restrict,
  constraint standard_versions_reversal_owner_fk
    foreign key (reversal_id, user_id)
    references public.standard_change_reversals(id, user_id) on delete restrict,
  constraint standard_versions_event_check check (
    (event_type = 'application' and application_id is not null and reversal_id is null)
    or (event_type = 'reversal' and reversal_id is not null and application_id is null)
  ),
  constraint standard_versions_artifact_unique unique (artifact_id),
  constraint standard_versions_owner_version_unique unique (user_id, version),
  constraint standard_versions_id_user_unique unique (id, user_id)
);

create index if not exists standard_change_review_packets_owner_state_idx
  on public.standard_change_review_packets(user_id, state, created_at desc);
create index if not exists standard_change_owner_decisions_owner_created_idx
  on public.standard_change_owner_decisions(user_id, created_at desc);
create index if not exists standard_change_applications_owner_created_idx
  on public.standard_change_applications(user_id, created_at desc);
create index if not exists standard_change_reversals_owner_created_idx
  on public.standard_change_reversals(user_id, created_at desc);
create index if not exists standard_versions_owner_created_idx
  on public.standard_versions(user_id, created_at desc);
create index if not exists standard_versions_parent_idx
  on public.standard_versions(parent_artifact_id);
create index if not exists standard_versions_root_idx
  on public.standard_versions(root_artifact_id);

alter table public.standard_change_review_packets enable row level security;
alter table public.standard_change_owner_decisions enable row level security;
alter table public.standard_change_applications enable row level security;
alter table public.standard_change_reversals enable row level security;
alter table public.standard_versions enable row level security;
alter table public.standard_change_review_packets force row level security;
alter table public.standard_change_owner_decisions force row level security;
alter table public.standard_change_applications force row level security;
alter table public.standard_change_reversals force row level security;
alter table public.standard_versions force row level security;

drop policy if exists "owners read standard change review packets" on public.standard_change_review_packets;
create policy "owners read standard change review packets"
  on public.standard_change_review_packets for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change owner decisions" on public.standard_change_owner_decisions;
create policy "owners read standard change owner decisions"
  on public.standard_change_owner_decisions for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change applications" on public.standard_change_applications;
create policy "owners read standard change applications"
  on public.standard_change_applications for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard change reversals" on public.standard_change_reversals;
create policy "owners read standard change reversals"
  on public.standard_change_reversals for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "owners read standard versions" on public.standard_versions;
create policy "owners read standard versions"
  on public.standard_versions for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.standard_change_review_packets,
  public.standard_change_owner_decisions,
  public.standard_change_applications,
  public.standard_change_reversals,
  public.standard_versions
  from public, anon, authenticated;
grant select on public.standard_change_review_packets,
  public.standard_change_owner_decisions,
  public.standard_change_applications,
  public.standard_change_reversals,
  public.standard_versions
  to authenticated;

create or replace function public.standard_change_json_sha256(p_value jsonb)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_value::text, 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.standard_change_text_sha256(p_value text)
returns text
language sql
immutable
security definer
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_value, 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.current_standard_criteria_snapshot(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(to_jsonb(c) order by c.id::text), '[]'::jsonb)
  from public.criteria c
  where c.user_id = p_user_id and c.is_current = true
$$;

create or replace function public.render_governed_standard_body(
  p_root_body text,
  p_change_request_id uuid,
  p_source_sha256 text,
  p_operation text,
  p_surface text,
  p_instruction text,
  p_criteria jsonb
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_criteria text := '';
  v_instruction text := coalesce(nullif(btrim(regexp_replace(coalesce(p_instruction, ''), E'[\r\n]+', ' ', 'g')), ''), 'No replacement wording was required.');
begin
  if jsonb_typeof(p_criteria) <> 'array' then
    raise exception 'standard_change_render_criteria_invalid' using errcode = '22023';
  end if;
  for v_row in select value from jsonb_array_elements(p_criteria) order by value->>'surface', value->>'name', value->>'id'
  loop
    v_criteria := v_criteria || format(
      E'\n### %s\n\n- Surface: %s\n- Standing: %s\n- Weight: %s\n- Check: %s\n- Observable: %s\n- Criterion ID: %s\n',
      regexp_replace(coalesce(v_row->>'name', 'Unnamed criterion'), E'[\r\n]+', ' ', 'g'),
      regexp_replace(coalesce(v_row->>'surface', 'unknown'), E'[\r\n]+', ' ', 'g'),
      coalesce(v_row->>'disposition', 'advisory'),
      coalesce(v_row->>'weight', 'important'),
      regexp_replace(coalesce(v_row->>'check_text', 'NOT ESTABLISHED'), E'[\r\n]+', ' ', 'g'),
      regexp_replace(coalesce(v_row->>'observable', 'NOT ESTABLISHED'), E'[\r\n]+', ' ', 'g'),
      coalesce(v_row->>'id', 'missing')
    );
  end loop;
  if v_criteria = '' then v_criteria := E'\nNo active criteria.\n'; end if;
  return format(
    E'---\nname: governed-standard\nstatus: active\nchange-request: %s\nsource-sha256: %s\ndeploy-authorized: false\nrelease-authorized: false\n---\n\n# Your active standard\n\nThis is the current owner-approved version. The criteria below are authoritative. The source profile remains attached for context and provenance.\n\n## Owner-approved change\n\n- Operation: %s\n- Surface: %s\n- Accepted wording: %s\n\n## Current criteria\n%s\n## Source profile\n\n%s\n',
    p_change_request_id,
    p_source_sha256,
    p_operation,
    regexp_replace(p_surface, E'[\r\n]+', ' ', 'g'),
    v_instruction,
    v_criteria,
    btrim(p_root_body)
  );
end;
$$;

revoke all on function public.standard_change_json_sha256(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.standard_change_text_sha256(text) from public, anon, authenticated, service_role;
revoke all on function public.current_standard_criteria_snapshot(uuid) from public, anon, authenticated, service_role;
revoke all on function public.render_governed_standard_body(text, uuid, text, text, text, text, jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.prepare_standard_change_review(
  p_check_id uuid,
  p_expected_result_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.standard_change_review_packets%rowtype;
  v_check public.standard_change_checks%rowtype;
  v_build public.standard_change_builds%rowtype;
  v_compile public.standard_change_compilations%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_source public.generated_artifacts%rowtype;
  v_root public.generated_artifacts%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_target_before jsonb;
  v_target_after jsonb;
  v_amendment jsonb;
  v_operation text;
  v_instruction text;
  v_target_id uuid;
  v_new_criterion_id uuid := gen_random_uuid();
  v_planned_artifact_id uuid := gen_random_uuid();
  v_planned_version_id uuid := gen_random_uuid();
  v_planned_application_id uuid := gen_random_uuid();
  v_next_criterion_version integer;
  v_before_sha text;
  v_after_sha text;
  v_planned_body text;
  v_planned_sha text;
  v_root_id uuid;
  v_packet jsonb;
  v_packet_sha text;
  v_review_id uuid;
  v_created_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then raise exception 'standard_change_review_auth_required' using errcode = '42501'; end if;
  if p_expected_result_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'standard_change_review_hash_invalid' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('standard-change-owner:' || v_user_id::text, 0));

  select * into v_existing from public.standard_change_review_packets
  where check_id = p_check_id and user_id = v_user_id;
  if found then
    select * into v_check from public.standard_change_checks where id = p_check_id and user_id = v_user_id;
    if not found or v_check.result_sha256 <> p_expected_result_sha256 then
      raise exception 'standard_change_review_check_changed' using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'review_packet_id', v_existing.id,
      'review_packet_sha256', v_existing.packet_sha256,
      'planned_standard_sha256', v_existing.planned_standard_sha256,
      'state', v_existing.state,
      'packet', v_existing.packet,
      'idempotent', true,
      'active_standard_mutated', false,
      'deploy_authorized', false,
      'release_authorized', false
    );
  end if;

  select * into v_check from public.standard_change_checks
  where id = p_check_id and user_id = v_user_id for update;
  if not found then raise exception 'standard_change_check_not_owned' using errcode = '42501'; end if;
  if v_check.result_sha256 <> p_expected_result_sha256 then
    raise exception 'standard_change_review_check_changed' using errcode = 'P0001';
  end if;
  if v_check.verdict <> 'passed'
     or exists (select 1 from jsonb_array_elements(v_check.findings) f where f->>'status' <> 'holds') then
    raise exception 'standard_change_review_check_not_passed' using errcode = 'P0001';
  end if;
  select * into v_build from public.standard_change_builds
  where id = v_check.build_id and user_id = v_user_id;
  select * into v_compile from public.standard_change_compilations
  where id = v_build.compilation_id and user_id = v_user_id;
  select * into v_change from public.standard_change_requests
  where id = v_check.change_request_id and user_id = v_user_id for update;
  if not found or v_change.state <> 'checked' then
    raise exception 'standard_change_review_not_ready' using errcode = 'P0001';
  end if;
  if v_compile.candidate_status <> 'compiled' then
    raise exception 'standard_change_review_candidate_not_actionable' using errcode = 'P0001';
  end if;
  v_amendment := v_compile.compiled->'amendment';
  v_operation := v_amendment->>'operation';
  v_instruction := nullif(btrim(v_amendment->>'instruction'), '');
  if v_operation not in ('narrow_applicability', 'downgrade_to_advisory', 'revise', 'retire')
     or v_amendment->>'activation' <> 'candidate_only'
     or jsonb_array_length(coalesce(v_amendment->'unresolved', '[]'::jsonb)) <> 0
     or v_amendment->'target_criterion'->>'id' is null then
    raise exception 'standard_change_review_candidate_not_actionable' using errcode = 'P0001';
  end if;
  v_target_id := (v_amendment->'target_criterion'->>'id')::uuid;
  perform public.assert_standard_change_source_current(v_change);
  select * into v_source from public.generated_artifacts
  where id = v_change.source_standard_artifact_id and user_id = v_user_id and kind = 'standard';
  if not found then raise exception 'standard_change_source_missing' using errcode = 'P0001'; end if;

  v_before := public.current_standard_criteria_snapshot(v_user_id);
  v_before_sha := public.standard_change_json_sha256(v_before);
  select value into v_target_before from jsonb_array_elements(v_before)
  where value->>'id' = v_target_id::text;
  if v_target_before is null then raise exception 'standard_change_target_not_current' using errcode = 'P0001'; end if;
  if v_target_before->>'surface' <> v_change.surface
     or v_target_before->>'name' <> v_amendment->'target_criterion'->>'name'
     or (v_target_before->>'version')::integer <> (v_amendment->'target_criterion'->>'version')::integer then
    raise exception 'standard_change_target_changed' using errcode = 'P0001';
  end if;

  select coalesce(max(version), 0) + 1 into v_next_criterion_version
  from public.criteria where user_id = v_user_id and surface = v_change.surface;
  v_target_after := v_target_before || jsonb_build_object(
    'id', v_new_criterion_id,
    'version', v_next_criterion_version,
    'created_at', v_created_at,
    'is_current', v_operation <> 'retire',
    'provenance', coalesce(v_target_before->'provenance', '{}'::jsonb) || jsonb_build_object(
      'standard_change_request_id', v_change.id,
      'standard_change_check_id', v_check.id,
      'supersedes_criterion_id', v_target_id,
      'owner_review_required', true
    )
  );
  if v_operation in ('narrow_applicability', 'revise') then
    if v_instruction is null or v_instruction = v_target_before->>'check_text' then
      raise exception 'standard_change_review_no_effect' using errcode = 'P0001';
    end if;
    v_target_after := v_target_after || jsonb_build_object('check_text', v_instruction);
  elsif v_operation = 'downgrade_to_advisory' then
    if v_target_before->>'disposition' = 'advisory' then
      raise exception 'standard_change_review_no_effect' using errcode = 'P0001';
    end if;
    v_target_after := v_target_after || jsonb_build_object('disposition', 'advisory');
  elsif v_operation = 'retire' then
    if v_target_before->>'disposition' = 'retired' then
      raise exception 'standard_change_review_no_effect' using errcode = 'P0001';
    end if;
    v_target_after := v_target_after || jsonb_build_object('disposition', 'retired');
  end if;

  select coalesce(jsonb_agg(item order by item->>'id'), '[]'::jsonb) into v_after
  from (
    select value as item from jsonb_array_elements(v_before)
    where value->>'id' <> v_target_id::text
    union all
    select v_target_after where v_operation <> 'retire'
  ) s;
  v_after_sha := public.standard_change_json_sha256(v_after);
  if v_before_sha = v_after_sha then raise exception 'standard_change_review_no_effect' using errcode = 'P0001'; end if;

  select coalesce(sv.root_artifact_id, v_source.id) into v_root_id
  from (select 1) anchor
  left join public.standard_versions sv on sv.artifact_id = v_source.id and sv.user_id = v_user_id;
  select * into v_root from public.generated_artifacts
  where id = v_root_id and user_id = v_user_id and kind = 'standard';
  if not found then raise exception 'standard_change_root_missing' using errcode = 'P0001'; end if;
  v_planned_body := public.render_governed_standard_body(
    v_root.body, v_change.id, v_change.source_standard_sha256, v_operation,
    v_change.surface, v_instruction, v_after
  );
  v_planned_sha := public.standard_change_text_sha256(v_planned_body);

  v_packet := jsonb_build_object(
    'schema', 'ctrl.standard-change.owner-review.v1',
    'owner_id', v_user_id,
    'change_request', jsonb_build_object('id', v_change.id, 'sha256', v_change.request_hash),
    'candidate', jsonb_build_object(
      'compilation_id', v_compile.id, 'compile_sha256', v_compile.compile_sha256,
      'build_id', v_build.id, 'package_sha256', v_build.package_sha256,
      'check_id', v_check.id, 'check_sha256', v_check.result_sha256, 'verdict', v_check.verdict
    ),
    'source', jsonb_build_object(
      'standard_artifact_id', v_source.id, 'standard_sha256', v_change.source_standard_sha256,
      'criteria_sha256', v_before_sha
    ),
    'change', jsonb_build_object(
      'operation', v_operation, 'surface', v_change.surface, 'instruction', v_instruction,
      'target_before', v_target_before, 'target_after', v_target_after,
      'evidence_ids', coalesce(v_amendment->'evidence_ids', '[]'::jsonb),
      'opportunity_run_ids', coalesce(v_amendment->'opportunity_run_ids', '[]'::jsonb)
    ),
    'criteria_before', v_before,
    'criteria_before_sha256', v_before_sha,
    'criteria_after', v_after,
    'criteria_after_sha256', v_after_sha,
    'planned', jsonb_build_object(
      'standard_artifact_id', v_planned_artifact_id,
      'standard_version_id', v_planned_version_id,
      'application_id', v_planned_application_id,
      'standard_sha256', v_planned_sha
    ),
    'consequences', jsonb_build_object(
      'new_active_standard_version', true,
      'reversible_while_current_head', true,
      'deploy_authorized', false,
      'release_authorized', false
    )
  );
  v_packet_sha := public.standard_change_json_sha256(v_packet);
  insert into public.standard_change_review_packets(
    user_id, change_request_id, check_id, source_standard_artifact_id,
    source_standard_sha256, criteria_before, criteria_before_sha256,
    criteria_after, criteria_after_sha256, target_before, target_after,
    planned_standard_artifact_id, planned_standard_version_id, planned_application_id,
    planned_standard_name, planned_standard_body, planned_standard_sha256,
    packet, packet_sha256
  ) values (
    v_user_id, v_change.id, v_check.id, v_source.id,
    v_change.source_standard_sha256, v_before, v_before_sha,
    v_after, v_after_sha, v_target_before, v_target_after,
    v_planned_artifact_id, v_planned_version_id, v_planned_application_id,
    v_source.name, v_planned_body, v_planned_sha,
    v_packet, v_packet_sha
  ) returning id into v_review_id;
  update public.standard_change_requests set state = 'review_ready', updated_at = now()
  where id = v_change.id;
  return jsonb_build_object(
    'review_packet_id', v_review_id,
    'review_packet_sha256', v_packet_sha,
    'planned_standard_sha256', v_planned_sha,
    'state', 'ready',
    'packet', v_packet,
    'idempotent', false,
    'active_standard_mutated', false,
    'deploy_authorized', false,
    'release_authorized', false
  );
end;
$$;

create or replace function public.decide_standard_change_review(
  p_review_packet_id uuid,
  p_expected_packet_sha256 text,
  p_expected_standard_sha256 text,
  p_request_id text,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_fingerprint text;
  v_existing public.standard_change_owner_decisions%rowtype;
  v_review public.standard_change_review_packets%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_source public.generated_artifacts%rowtype;
  v_latest public.generated_artifacts%rowtype;
  v_target jsonb;
  v_current jsonb;
  v_current_sha text;
  v_decision_id uuid := gen_random_uuid();
  v_decision_hash text;
  v_application_hash text;
  v_result jsonb;
  v_root_id uuid;
  v_standard_version integer;
begin
  if v_user_id is null then raise exception 'standard_change_owner_auth_required' using errcode = '42501'; end if;
  if p_expected_packet_sha256 !~ '^[0-9a-f]{64}$'
     or p_expected_standard_sha256 !~ '^[0-9a-f]{64}$'
     or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or p_decision not in ('approved', 'rejected')
     or length(coalesce(p_note, '')) > 2000 then
    raise exception 'standard_change_owner_decision_invalid' using errcode = '22023';
  end if;
  v_fingerprint := public.standard_change_json_sha256(jsonb_build_object(
    'review_packet_id', p_review_packet_id,
    'expected_packet_sha256', p_expected_packet_sha256,
    'expected_standard_sha256', p_expected_standard_sha256,
    'request_id', p_request_id,
    'decision', p_decision,
    'note', p_note,
    'owner_id', v_user_id
  ));
  perform pg_advisory_xact_lock(hashtextextended('standard-change-owner:' || v_user_id::text, 0));
  select * into v_existing from public.standard_change_owner_decisions
  where user_id = v_user_id and request_id = p_request_id;
  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception 'standard_change_owner_request_conflict' using errcode = '23505';
    end if;
    return v_existing.result || jsonb_build_object('idempotent', true);
  end if;
  if exists (
    select 1 from public.standard_change_owner_decisions
    where user_id = v_user_id and review_packet_id = p_review_packet_id
  ) then raise exception 'standard_change_review_already_decided' using errcode = '23505'; end if;

  select * into v_review from public.standard_change_review_packets
  where id = p_review_packet_id and user_id = v_user_id for update;
  if not found then raise exception 'standard_change_review_not_owned' using errcode = '42501'; end if;
  if v_review.state <> 'ready'
     or v_review.packet_sha256 <> p_expected_packet_sha256
     or v_review.planned_standard_sha256 <> p_expected_standard_sha256
     or public.standard_change_json_sha256(v_review.packet) <> v_review.packet_sha256
     or public.standard_change_text_sha256(v_review.planned_standard_body) <> v_review.planned_standard_sha256 then
    raise exception 'standard_change_review_changed' using errcode = 'P0001';
  end if;
  select * into v_change from public.standard_change_requests
  where id = v_review.change_request_id and user_id = v_user_id for update;
  if not found or v_change.state <> 'review_ready' then
    raise exception 'standard_change_review_not_ready' using errcode = 'P0001';
  end if;
  v_decision_hash := public.standard_change_json_sha256(jsonb_build_object(
    'review_packet_sha256', v_review.packet_sha256,
    'planned_standard_sha256', v_review.planned_standard_sha256,
    'decision', p_decision,
    'note', p_note,
    'request_id', p_request_id,
    'owner_id', v_user_id
  ));
  if p_decision = 'rejected' then
    v_result := jsonb_build_object(
      'review_packet_id', v_review.id,
      'decision_id', v_decision_id,
      'decision', 'rejected',
      'decision_hash', v_decision_hash,
      'active_standard_mutated', false,
      'application_id', null,
      'deploy_authorized', false,
      'release_authorized', false
    );
    insert into public.standard_change_owner_decisions(
      id, user_id, review_packet_id, request_id, request_fingerprint,
      decision, note, reviewed_hashes, decision_hash, result
    ) values (
      v_decision_id, v_user_id, v_review.id, p_request_id, v_fingerprint,
      'rejected', nullif(btrim(p_note), ''),
      jsonb_build_object('packet', v_review.packet_sha256, 'standard', v_review.planned_standard_sha256),
      v_decision_hash, v_result
    );
    update public.standard_change_review_packets set state = 'decided', decided_at = now() where id = v_review.id;
    update public.standard_change_requests set state = 'rejected', updated_at = now() where id = v_change.id;
    return v_result || jsonb_build_object('idempotent', false);
  end if;

  select * into v_source from public.generated_artifacts
  where id = v_review.source_standard_artifact_id and user_id = v_user_id and kind = 'standard';
  select * into v_latest from public.generated_artifacts
  where user_id = v_user_id and kind = 'standard'
  order by created_at desc, id desc limit 1 for update;
  if not found or v_latest.id <> v_source.id
     or public.standard_change_text_sha256(v_source.body) <> v_review.source_standard_sha256 then
    raise exception 'standard_change_review_source_stale' using errcode = 'P0001';
  end if;
  v_current := public.current_standard_criteria_snapshot(v_user_id);
  v_current_sha := public.standard_change_json_sha256(v_current);
  if v_current_sha <> v_review.criteria_before_sha256 or v_current <> v_review.criteria_before then
    raise exception 'standard_change_review_criteria_stale' using errcode = 'P0001';
  end if;
  v_target := v_review.target_after;

  update public.criteria set is_current = false
  where id = (v_review.target_before->>'id')::uuid and user_id = v_user_id and is_current = true;
  if not found then raise exception 'standard_change_review_target_stale' using errcode = 'P0001'; end if;
  insert into public.criteria(
    id, user_id, scope, owner_label, construct_id, surface, name, check_text,
    observable, weight, holds_example, breaks_example, n_rejected,
    n_rejected_failing, n_accepted, n_accepted_failing, disc_verdict,
    provenance, version, is_current, disposition, created_at
  ) values (
    (v_target->>'id')::uuid,
    v_user_id,
    v_target->>'scope',
    v_target->>'owner_label',
    nullif(v_target->>'construct_id', '')::uuid,
    v_target->>'surface',
    v_target->>'name',
    v_target->>'check_text',
    v_target->>'observable',
    v_target->>'weight',
    v_target->>'holds_example',
    v_target->>'breaks_example',
    nullif(v_target->>'n_rejected', '')::integer,
    nullif(v_target->>'n_rejected_failing', '')::integer,
    nullif(v_target->>'n_accepted', '')::integer,
    nullif(v_target->>'n_accepted_failing', '')::integer,
    v_target->>'disc_verdict',
    v_target->'provenance',
    (v_target->>'version')::integer,
    (v_target->>'is_current')::boolean,
    v_target->>'disposition',
    (v_target->>'created_at')::timestamptz
  );

  v_current := public.current_standard_criteria_snapshot(v_user_id);
  v_current_sha := public.standard_change_json_sha256(v_current);
  if v_current <> v_review.criteria_after or v_current_sha <> v_review.criteria_after_sha256 then
    raise exception 'standard_change_apply_criteria_mismatch' using errcode = 'P0001';
  end if;
  insert into public.generated_artifacts(id, user_id, kind, name, body, metadata, created_at)
  values (
    v_review.planned_standard_artifact_id,
    v_user_id,
    'standard',
    v_review.planned_standard_name,
    v_review.planned_standard_body,
    v_source.metadata || jsonb_build_object(
      'status', 'active',
      'standard_version_id', v_review.planned_standard_version_id,
      'parent_artifact_id', v_source.id,
      'change_request_id', v_change.id,
      'review_packet_id', v_review.id,
      'application_id', v_review.planned_application_id,
      'criteria_snapshot_sha256', v_review.criteria_after_sha256,
      'deploy_authorized', false,
      'release_authorized', false
    ),
    clock_timestamp()
  );

  v_application_hash := public.standard_change_json_sha256(jsonb_build_object(
    'application_id', v_review.planned_application_id,
    'decision_hash', v_decision_hash,
    'source_standard_artifact_id', v_source.id,
    'source_standard_sha256', v_review.source_standard_sha256,
    'target_standard_artifact_id', v_review.planned_standard_artifact_id,
    'target_standard_sha256', v_review.planned_standard_sha256,
    'criteria_before_sha256', v_review.criteria_before_sha256,
    'criteria_after_sha256', v_review.criteria_after_sha256
  ));
  v_result := jsonb_build_object(
    'review_packet_id', v_review.id,
    'decision_id', v_decision_id,
    'decision', 'approved',
    'decision_hash', v_decision_hash,
    'application_id', v_review.planned_application_id,
    'application_hash', v_application_hash,
    'active_standard_artifact_id', v_review.planned_standard_artifact_id,
    'active_standard_sha256', v_review.planned_standard_sha256,
    'criteria_sha256', v_review.criteria_after_sha256,
    'active_standard_mutated', true,
    'deploy_authorized', false,
    'release_authorized', false,
    'reversible_while_current_head', true
  );
  insert into public.standard_change_owner_decisions(
    id, user_id, review_packet_id, request_id, request_fingerprint,
    decision, note, reviewed_hashes, decision_hash, result
  ) values (
    v_decision_id, v_user_id, v_review.id, p_request_id, v_fingerprint,
    'approved', nullif(btrim(p_note), ''),
    jsonb_build_object(
      'packet', v_review.packet_sha256,
      'source_standard', v_review.source_standard_sha256,
      'planned_standard', v_review.planned_standard_sha256,
      'criteria_before', v_review.criteria_before_sha256,
      'criteria_after', v_review.criteria_after_sha256
    ),
    v_decision_hash, v_result
  );
  insert into public.standard_change_applications(
    id, user_id, change_request_id, review_packet_id, owner_decision_id,
    source_standard_artifact_id, target_standard_artifact_id, target_criterion_id,
    source_standard_sha256, target_standard_sha256,
    criteria_before, criteria_before_sha256, criteria_after, criteria_after_sha256,
    application_hash
  ) values (
    v_review.planned_application_id, v_user_id, v_change.id, v_review.id, v_decision_id,
    v_source.id, v_review.planned_standard_artifact_id, (v_target->>'id')::uuid,
    v_review.source_standard_sha256, v_review.planned_standard_sha256,
    v_review.criteria_before, v_review.criteria_before_sha256,
    v_review.criteria_after, v_review.criteria_after_sha256,
    v_application_hash
  );
  select coalesce(root_artifact_id, v_source.id) into v_root_id
  from (select 1) anchor
  left join public.standard_versions sv on sv.artifact_id = v_source.id and sv.user_id = v_user_id;
  select coalesce(max(version), 0) + 1 into v_standard_version
  from public.standard_versions where user_id = v_user_id;
  insert into public.standard_versions(
    id, user_id, artifact_id, parent_artifact_id, root_artifact_id, version,
    event_type, application_id, body_sha256, criteria_snapshot, criteria_sha256
  ) values (
    v_review.planned_standard_version_id, v_user_id,
    v_review.planned_standard_artifact_id, v_source.id, v_root_id,
    v_standard_version, 'application', v_review.planned_application_id,
    v_review.planned_standard_sha256, v_review.criteria_after, v_review.criteria_after_sha256
  );
  update public.standard_change_review_packets set state = 'decided', decided_at = now() where id = v_review.id;
  update public.standard_change_requests set state = 'applied', updated_at = now() where id = v_change.id;
  return v_result || jsonb_build_object('idempotent', false);
end;
$$;

create or replace function public.reverse_standard_change_application(
  p_application_id uuid,
  p_expected_application_hash text,
  p_expected_active_standard_sha256 text,
  p_request_id text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_fingerprint text;
  v_existing public.standard_change_reversals%rowtype;
  v_application public.standard_change_applications%rowtype;
  v_change public.standard_change_requests%rowtype;
  v_active public.generated_artifacts%rowtype;
  v_source public.generated_artifacts%rowtype;
  v_current jsonb;
  v_current_sha text;
  v_restored jsonb;
  v_restored_sha text;
  v_reversal_id uuid := gen_random_uuid();
  v_restored_artifact_id uuid := gen_random_uuid();
  v_version_id uuid := gen_random_uuid();
  v_reversal_hash text;
  v_result jsonb;
  v_root_id uuid;
  v_standard_version integer;
  v_expected_count integer;
  v_restored_count integer;
begin
  if v_user_id is null then raise exception 'standard_change_reversal_auth_required' using errcode = '42501'; end if;
  if p_expected_application_hash !~ '^[0-9a-f]{64}$'
     or p_expected_active_standard_sha256 !~ '^[0-9a-f]{64}$'
     or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or length(btrim(coalesce(p_reason, ''))) not between 1 and 2000 then
    raise exception 'standard_change_reversal_invalid' using errcode = '22023';
  end if;
  v_fingerprint := public.standard_change_json_sha256(jsonb_build_object(
    'application_id', p_application_id,
    'expected_application_hash', p_expected_application_hash,
    'expected_active_standard_sha256', p_expected_active_standard_sha256,
    'request_id', p_request_id,
    'reason', p_reason,
    'owner_id', v_user_id
  ));
  perform pg_advisory_xact_lock(hashtextextended('standard-change-owner:' || v_user_id::text, 0));
  select * into v_existing from public.standard_change_reversals
  where user_id = v_user_id and request_id = p_request_id;
  if found then
    if v_existing.request_fingerprint <> v_fingerprint then
      raise exception 'standard_change_reversal_request_conflict' using errcode = '23505';
    end if;
    return v_existing.result || jsonb_build_object('idempotent', true);
  end if;
  if exists (
    select 1 from public.standard_change_reversals
    where user_id = v_user_id and application_id = p_application_id
  ) then raise exception 'standard_change_application_already_reversed' using errcode = '23505'; end if;
  select * into v_application from public.standard_change_applications
  where id = p_application_id and user_id = v_user_id for update;
  if not found then raise exception 'standard_change_application_not_owned' using errcode = '42501'; end if;
  if v_application.application_hash <> p_expected_application_hash
     or v_application.target_standard_sha256 <> p_expected_active_standard_sha256 then
    raise exception 'standard_change_application_changed' using errcode = 'P0001';
  end if;
  select * into v_active from public.generated_artifacts
  where user_id = v_user_id and kind = 'standard'
  order by created_at desc, id desc limit 1 for update;
  if not found or v_active.id <> v_application.target_standard_artifact_id
     or public.standard_change_text_sha256(v_active.body) <> v_application.target_standard_sha256 then
    raise exception 'standard_change_reversal_head_changed' using errcode = 'P0001';
  end if;
  v_current := public.current_standard_criteria_snapshot(v_user_id);
  v_current_sha := public.standard_change_json_sha256(v_current);
  if v_current <> v_application.criteria_after or v_current_sha <> v_application.criteria_after_sha256 then
    raise exception 'standard_change_reversal_criteria_changed' using errcode = 'P0001';
  end if;
  select * into v_source from public.generated_artifacts
  where id = v_application.source_standard_artifact_id and user_id = v_user_id and kind = 'standard';
  if not found or public.standard_change_text_sha256(v_source.body) <> v_application.source_standard_sha256 then
    raise exception 'standard_change_reversal_source_changed' using errcode = 'P0001';
  end if;

  update public.criteria set is_current = false where user_id = v_user_id and is_current = true;
  select jsonb_array_length(v_application.criteria_before) into v_expected_count;
  update public.criteria c set is_current = true
  where c.user_id = v_user_id and c.id in (
    select (value->>'id')::uuid from jsonb_array_elements(v_application.criteria_before)
  );
  get diagnostics v_restored_count = row_count;
  if v_restored_count <> v_expected_count then
    raise exception 'standard_change_reversal_prior_criteria_missing' using errcode = 'P0001';
  end if;
  v_restored := public.current_standard_criteria_snapshot(v_user_id);
  v_restored_sha := public.standard_change_json_sha256(v_restored);
  if v_restored <> v_application.criteria_before or v_restored_sha <> v_application.criteria_before_sha256 then
    raise exception 'standard_change_reversal_restore_mismatch' using errcode = 'P0001';
  end if;

  insert into public.generated_artifacts(id, user_id, kind, name, body, metadata, created_at)
  values (
    v_restored_artifact_id,
    v_user_id,
    'standard',
    v_source.name,
    v_source.body,
    v_source.metadata || jsonb_build_object(
      'status', 'active',
      'reversal_id', v_reversal_id,
      'reverses_application_id', v_application.id,
      'restored_from_artifact_id', v_source.id,
      'criteria_snapshot_sha256', v_application.criteria_before_sha256,
      'deploy_authorized', false,
      'release_authorized', false
    ),
    clock_timestamp()
  );
  v_reversal_hash := public.standard_change_json_sha256(jsonb_build_object(
    'reversal_id', v_reversal_id,
    'application_hash', v_application.application_hash,
    'active_standard_artifact_id', v_active.id,
    'active_standard_sha256', v_application.target_standard_sha256,
    'restored_standard_artifact_id', v_restored_artifact_id,
    'restored_standard_sha256', v_application.source_standard_sha256,
    'criteria_before_sha256', v_application.criteria_after_sha256,
    'criteria_restored_sha256', v_application.criteria_before_sha256,
    'reason', p_reason
  ));
  v_result := jsonb_build_object(
    'application_id', v_application.id,
    'reversal_id', v_reversal_id,
    'reversal_hash', v_reversal_hash,
    'active_standard_artifact_id', v_restored_artifact_id,
    'active_standard_sha256', v_application.source_standard_sha256,
    'criteria_sha256', v_application.criteria_before_sha256,
    'restored', true,
    'deploy_authorized', false,
    'release_authorized', false
  );
  insert into public.standard_change_reversals(
    id, user_id, application_id, request_id, request_fingerprint, reason,
    active_standard_artifact_id, restored_standard_artifact_id,
    active_standard_sha256, restored_standard_sha256,
    criteria_before_sha256, criteria_restored_sha256,
    reversal_hash, result
  ) values (
    v_reversal_id, v_user_id, v_application.id, p_request_id, v_fingerprint, btrim(p_reason),
    v_active.id, v_restored_artifact_id,
    v_application.target_standard_sha256, v_application.source_standard_sha256,
    v_application.criteria_after_sha256, v_application.criteria_before_sha256,
    v_reversal_hash, v_result
  );
  select coalesce(root_artifact_id, v_source.id) into v_root_id
  from (select 1) anchor
  left join public.standard_versions sv on sv.artifact_id = v_source.id and sv.user_id = v_user_id;
  select coalesce(max(version), 0) + 1 into v_standard_version
  from public.standard_versions where user_id = v_user_id;
  insert into public.standard_versions(
    id, user_id, artifact_id, parent_artifact_id, root_artifact_id, version,
    event_type, reversal_id, body_sha256, criteria_snapshot, criteria_sha256
  ) values (
    v_version_id, v_user_id, v_restored_artifact_id, v_active.id, v_root_id,
    v_standard_version, 'reversal', v_reversal_id,
    v_application.source_standard_sha256, v_application.criteria_before,
    v_application.criteria_before_sha256
  );
  select * into v_change from public.standard_change_requests
  where id = v_application.change_request_id and user_id = v_user_id for update;
  update public.standard_change_requests set state = 'reversed', updated_at = now()
  where id = v_change.id;
  return v_result || jsonb_build_object('idempotent', false);
end;
$$;

revoke all on function public.prepare_standard_change_review(uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.decide_standard_change_review(uuid, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.reverse_standard_change_application(uuid, text, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.prepare_standard_change_review(uuid, text) to authenticated;
grant execute on function public.decide_standard_change_review(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.reverse_standard_change_application(uuid, text, text, text, text) to authenticated;

comment on table public.standard_change_review_packets is
  'Immutable owner-readable review packets that freeze one passed candidate, its exact diff and planned active bytes.';
comment on table public.standard_change_owner_decisions is
  'Append-only subject-owner approvals or rejections over one exact standard-change review packet.';
comment on table public.standard_change_applications is
  'Atomic receipts for owner-approved criteria and active-standard version changes. Deployment and release remain false.';
comment on table public.standard_change_reversals is
  'Append-only head-safe reversal receipts. Reversal creates a new active artifact and deletes no history.';
comment on table public.standard_versions is
  'Version lineage for governed standard applications and reversals while newest generated_artifacts remains the active-head contract.';
