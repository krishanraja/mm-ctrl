-- R114: governed learning capture.
--
-- Repeated runtime evidence may earn an owner proposal. It may never edit a
-- criterion, standard, skill or deployed surface. Publication is pinned to an
-- exact source snapshot; decisions are append-only and owner-authenticated.

do $$
begin
  if to_regclass('public.ledger') is not null then
    alter table public.ledger drop constraint if exists ledger_source_run_owner_fk;
  end if;
  if to_regclass('public.capture_runs') is not null then
    alter table public.capture_runs drop constraint if exists capture_runs_standard_owner_fk;
  end if;
  if to_regclass('public.proposals') is not null then
    alter table public.proposals drop constraint if exists proposals_standard_owner_fk;
  end if;
end
$$;

alter table public.harness_runs drop constraint if exists harness_runs_id_user_unique;
alter table public.harness_runs
  add constraint harness_runs_id_user_unique unique (id, user_id);

alter table public.generated_artifacts drop constraint if exists generated_artifacts_id_user_unique;
alter table public.generated_artifacts
  add constraint generated_artifacts_id_user_unique unique (id, user_id);

alter table public.ledger
  add column if not exists source_run_id uuid,
  add column if not exists source_event_key text,
  add column if not exists release_version text;

alter table public.ledger
  drop constraint if exists ledger_source_run_owner_fk;
alter table public.ledger
  add constraint ledger_source_run_owner_fk
  foreign key (source_run_id, user_id)
  references public.harness_runs(id, user_id)
  on delete cascade;

create unique index if not exists ledger_source_event_unique
  on public.ledger(user_id, source_run_id, source_event_key);

create table if not exists public.capture_policies (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  cadence_days smallint not null check (cadence_days between 1 and 90),
  window_weeks smallint not null check (window_weeks between 1 and 26),
  min_unique_evidence smallint not null check (min_unique_evidence between 2 and 20),
  max_proposals smallint not null check (max_proposals between 1 and 10),
  severity_override boolean not null default false,
  privacy_boundary text not null,
  retention_days integer check (retention_days is null or retention_days between 1 and 3650),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.capture_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_week text not null,
  source_snapshot text not null check (source_snapshot ~ '^[0-9a-f]{64}$'),
  standard_artifact_id uuid not null,
  standard_sha256 text not null check (standard_sha256 ~ '^[0-9a-f]{64}$'),
  policy jsonb not null,
  summary jsonb not null,
  status text not null check (status in ('ready', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  constraint capture_runs_standard_owner_fk
    foreign key (standard_artifact_id, user_id)
    references public.generated_artifacts(id, user_id)
    on delete restrict,
  constraint capture_runs_owner_week_snapshot_unique
    unique (user_id, capture_week, source_snapshot)
);

alter table public.capture_runs drop constraint if exists capture_runs_standard_owner_fk;
alter table public.capture_runs
  add constraint capture_runs_standard_owner_fk
  foreign key (standard_artifact_id, user_id)
  references public.generated_artifacts(id, user_id)
  on delete restrict;

alter table public.proposals
  add column if not exists proposal_key text,
  add column if not exists proposal_version integer not null default 1,
  add column if not exists proposal_hash text,
  add column if not exists capture_run_id uuid,
  add column if not exists source_standard_artifact_id uuid,
  add column if not exists source_standard_sha256 text,
  add column if not exists source_snapshot text,
  add column if not exists governance jsonb not null default '{}'::jsonb,
  add column if not exists decided_by uuid,
  add column if not exists decision_scope jsonb;

update public.proposals
set proposal_key = coalesce(nullif(evidence->>'key', ''), 'legacy:' || id::text),
    proposal_hash = coalesce(proposal_hash, encode(extensions.digest(convert_to(id::text, 'UTF8'), 'sha256'), 'hex')),
    source_snapshot = coalesce(source_snapshot, encode(extensions.digest(convert_to(id::text, 'UTF8'), 'sha256'), 'hex')),
    source_standard_sha256 = coalesce(source_standard_sha256, repeat('0', 64))
where proposal_key is null or proposal_hash is null or source_snapshot is null or source_standard_sha256 is null;

alter table public.proposals
  alter column proposal_key set not null,
  alter column proposal_hash set not null,
  alter column source_snapshot set not null,
  alter column source_standard_sha256 set not null;

alter table public.proposals
  drop constraint if exists proposals_status_check;
alter table public.proposals
  add constraint proposals_status_check check (status in (
    'awaiting', 'accepted', 'rejected', 'needs_evidence', 'superseded',
    'released', 'effective', 'ineffective', 'uncertain'
  ));

alter table public.proposals
  drop constraint if exists proposals_capture_run_owner_fk;
alter table public.proposals
  add constraint proposals_capture_run_owner_fk
  foreign key (capture_run_id) references public.capture_runs(id) on delete restrict;

alter table public.proposals
  drop constraint if exists proposals_standard_owner_fk;
alter table public.proposals
  add constraint proposals_standard_owner_fk
  foreign key (source_standard_artifact_id, user_id)
  references public.generated_artifacts(id, user_id)
  on delete restrict;

create unique index if not exists proposals_owner_key_snapshot_unique
  on public.proposals(user_id, proposal_key, source_snapshot);
create index if not exists proposals_owner_key_version_idx
  on public.proposals(user_id, proposal_key, proposal_version desc);

create table if not exists public.proposal_decisions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_hash text not null check (proposal_hash ~ '^[0-9a-f]{64}$'),
  decision text not null check (decision in ('accepted', 'rejected', 'needs_evidence', 'superseded')),
  scope jsonb not null,
  decision_hash text not null unique check (decision_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

alter table public.capture_policies enable row level security;
alter table public.capture_runs enable row level security;
alter table public.proposal_decisions enable row level security;

drop policy if exists "owners manage capture policy" on public.capture_policies;
create policy "owners manage capture policy" on public.capture_policies
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "owners read capture runs" on public.capture_runs;
create policy "owners read capture runs" on public.capture_runs
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "owners read proposal decisions" on public.proposal_decisions;
create policy "owners read proposal decisions" on public.proposal_decisions
  for select to authenticated using (user_id = auth.uid());

-- Proposals are machine-published but never machine-decided. Owners can read
-- them; the narrow decision RPC below is the only authenticated write path.
drop policy if exists "owner_insert_proposals" on public.proposals;
drop policy if exists "owner_update_proposals" on public.proposals;
drop policy if exists "owner_delete_proposals" on public.proposals;
revoke insert, update, delete, truncate on public.proposals from public, anon, authenticated;
revoke insert, update, delete, truncate on public.capture_runs from public, anon, authenticated;
revoke insert, update, delete, truncate on public.proposal_decisions from public, anon, authenticated;
revoke all on public.capture_policies from public, anon, authenticated;
grant select on public.capture_policies, public.capture_runs, public.proposals, public.proposal_decisions to authenticated;
grant insert, update, delete on public.capture_policies to authenticated;

create or replace function public.current_capture_source(
  p_user_id uuid,
  p_capture_week text,
  p_window_weeks integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_week_start date;
  v_window_start date;
begin
  if p_capture_week !~ '^\d{4}-W\d{2}$' or p_window_weeks not between 1 and 26 then
    raise exception 'capture_source_invalid_window' using errcode = '22023';
  end if;
  v_week_start := to_date(p_capture_week || '-1', 'IYYY-"W"IW-ID');
  v_window_start := v_week_start - ((p_window_weeks - 1) * 7);

  return jsonb_build_object(
    'schema', 'ctrl.capture.source.v1',
    'owner_id', p_user_id,
    'capture_week', p_capture_week,
    'window', jsonb_build_object('from', v_window_start, 'through', v_week_start + 6),
    'policy', coalesce((
      select to_jsonb(cp) - 'created_at' - 'updated_at'
      from public.capture_policies cp where cp.user_id = p_user_id
    ), '{}'::jsonb),
    'standard', coalesce((
      select jsonb_build_object(
        'id', a.id,
        'body_sha256', encode(extensions.digest(convert_to(a.body, 'UTF8'), 'sha256'), 'hex'),
        'metadata', a.metadata,
        'created_at', a.created_at
      )
      from public.generated_artifacts a
      where a.user_id = p_user_id and a.kind = 'standard'
      order by a.created_at desc, a.id desc limit 1
    ), '{}'::jsonb),
    'criteria', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'surface', c.surface, 'name', c.name, 'weight', c.weight,
        'disposition', c.disposition, 'version', c.version, 'observable', c.observable
      ) order by c.surface, c.name, c.id)
      from public.criteria c
      where c.user_id = p_user_id and c.is_current = true
    ), '[]'::jsonb),
    'ledger', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'source_run_id', l.source_run_id, 'source_event_key', l.source_event_key,
        'release_version', l.release_version, 'week', l.week, 'surface', l.surface,
        'signal', l.signal, 'class', l.class, 'criterion_id', l.criterion_id,
        'criterion_name', l.criterion_name, 'verdict', l.verdict, 'quote', l.quote,
        'disposition', l.disposition, 'created_at', l.created_at
      ) order by l.created_at, l.id)
      from public.ledger l
      where l.user_id = p_user_id
        and l.created_at >= v_window_start::timestamptz
        and l.created_at < (v_week_start + 7)::timestamptz
    ), '[]'::jsonb),
    'opportunities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'run_id', r.id, 'surface', r.surface, 'created_at', r.created_at,
        'source_snapshot', r.stage_detail->>'source_snapshot'
      ) order by r.created_at, r.id)
      from public.harness_runs r
      where r.user_id = p_user_id and r.kind = 'critique' and r.status = 'done'
        and r.created_at >= v_window_start::timestamptz
        and r.created_at < (v_week_start + 7)::timestamptz
    ), '[]'::jsonb),
    'proposal_history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'key', p.proposal_key, 'version', p.proposal_version,
        'hash', p.proposal_hash, 'status', p.status,
        'source_ids', coalesce(p.evidence->'source_ids', '[]'::jsonb)
      ) order by p.created_at, p.id)
      from public.proposals p where p.user_id = p_user_id
    ), '[]'::jsonb),
    'latest_measurement', coalesce((
      select jsonb_build_object(
        'id', m.id, 'label', m.label, 'created_at', m.created_at,
        'standard_artifact_id', m.standard_artifact_id, 'metrics', m.metrics,
        'confusion', m.confusion, 'held_out_graded', m.held_out_graded
      )
      from public.standard_measurements m
      where m.user_id = p_user_id
      order by m.created_at desc, m.id desc limit 1
    ), '{}'::jsonb)
  );
end;
$$;

create or replace function public.current_capture_source_snapshot(
  p_user_id uuid,
  p_capture_week text,
  p_window_weeks integer
)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select encode(extensions.digest(convert_to((public.current_capture_source(
    p_user_id, p_capture_week, p_window_weeks
  ) - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function public.current_capture_source_packet(
  p_user_id uuid,
  p_capture_week text,
  p_window_weeks integer
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with source as (
    select public.current_capture_source(p_user_id, p_capture_week, p_window_weeks) as value
  )
  select jsonb_build_object(
    'source', value,
    'snapshot', encode(extensions.digest(convert_to((value - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex')
  ) from source;
$$;

revoke all on function public.current_capture_source(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.current_capture_source_snapshot(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.current_capture_source_packet(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.current_capture_source(uuid, text, integer) to service_role;
grant execute on function public.current_capture_source_snapshot(uuid, text, integer) to service_role;
grant execute on function public.current_capture_source_packet(uuid, text, integer) to service_role;

create or replace function public.publish_capture_run(
  p_user_id uuid,
  p_capture_week text,
  p_source_snapshot text,
  p_summary jsonb,
  p_proposals jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_policy public.capture_policies%rowtype;
  v_source jsonb;
  v_snapshot text;
  v_standard_id uuid;
  v_standard_sha text;
  v_run_id uuid;
  v_existing uuid;
  v_proposal jsonb;
  v_key text;
  v_type text;
  v_source_ids jsonb;
  v_prior public.proposals%rowtype;
  v_version integer;
  v_hash text;
  v_inserted integer := 0;
  v_skipped integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'capture_publish_service_role_required' using errcode = '42501';
  end if;
  if p_source_snapshot !~ '^[0-9a-f]{64}$' or jsonb_typeof(p_proposals) <> 'array' then
    raise exception 'capture_publish_invalid_input' using errcode = '22023';
  end if;

  select * into v_policy from public.capture_policies where user_id = p_user_id and enabled = true;
  if not found then raise exception 'capture_policy_missing_or_disabled' using errcode = 'P0001'; end if;
  if jsonb_array_length(p_proposals) > v_policy.max_proposals then
    raise exception 'capture_proposal_cap_exceeded' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('capture:' || p_user_id::text || ':' || p_capture_week, 0));
  v_source := public.current_capture_source(p_user_id, p_capture_week, v_policy.window_weeks);
  v_snapshot := encode(extensions.digest(convert_to((v_source - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');
  if v_snapshot <> p_source_snapshot then
    raise exception 'capture_source_changed_retry' using errcode = '40001';
  end if;
  v_standard_id := nullif(v_source->'standard'->>'id', '')::uuid;
  v_standard_sha := v_source->'standard'->>'body_sha256';
  if v_standard_id is null or v_standard_sha !~ '^[0-9a-f]{64}$'
     or jsonb_array_length(coalesce(v_source->'criteria', '[]'::jsonb)) = 0 then
    raise exception 'capture_active_standard_required' using errcode = 'P0001';
  end if;

  select id into v_existing from public.capture_runs
  where user_id = p_user_id and capture_week = p_capture_week and source_snapshot = p_source_snapshot;
  if found then
    return jsonb_build_object('run_id', v_existing, 'idempotent', true, 'inserted', 0, 'skipped', 0);
  end if;

  insert into public.capture_runs(
    user_id, capture_week, source_snapshot, standard_artifact_id,
    standard_sha256, policy, summary, status
  ) values (
    p_user_id, p_capture_week, p_source_snapshot, v_standard_id,
    v_standard_sha, to_jsonb(v_policy) - 'created_at' - 'updated_at', p_summary, 'ready'
  ) returning id into v_run_id;

  for v_proposal in select value from jsonb_array_elements(p_proposals)
  loop
    v_key := nullif(v_proposal->>'proposal_key', '');
    v_type := v_proposal->>'type';
    v_source_ids := coalesce(v_proposal->'evidence'->'source_ids', '[]'::jsonb);
    if v_key is null or v_type not in ('uncovered', 'false_positive', 'drift')
       or jsonb_typeof(v_source_ids) <> 'array'
       or jsonb_typeof(coalesce(v_proposal->'governance', '{}'::jsonb)) <> 'object'
       or not ((v_proposal->'governance') ?& array[
         'owner', 'policy', 'standard', 'alternative_explanations', 'expected_effect',
         'validation', 'size_context', 'privacy', 'dependencies', 'rollback', 'measurement_plan'
       ]) then
      raise exception 'capture_proposal_packet_invalid' using errcode = '22023';
    end if;
    if v_type <> 'drift' and jsonb_array_length(v_source_ids) < v_policy.min_unique_evidence then
      raise exception 'capture_proposal_evidence_below_policy' using errcode = '22023';
    end if;

    select * into v_prior from public.proposals
    where user_id = p_user_id and proposal_key = v_key
    order by proposal_version desc, created_at desc limit 1;
    if found and v_prior.status = 'awaiting' then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    if found and v_source_ids <@ coalesce(v_prior.evidence->'source_ids', '[]'::jsonb) then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_version := case when found then v_prior.proposal_version + 1 else 1 end;
    v_hash := encode(extensions.digest(convert_to((v_proposal || jsonb_build_object(
      'proposal_version', v_version, 'source_snapshot', p_source_snapshot
    ))::text, 'UTF8'), 'sha256'), 'hex');

    insert into public.proposals(
      user_id, type, surface, headline, delta_text, if_wrong, size_delta, evidence,
      status, proposal_key, proposal_version, proposal_hash, capture_run_id,
      source_standard_artifact_id, source_standard_sha256, source_snapshot, governance
    ) values (
      p_user_id, v_type, v_proposal->>'surface', v_proposal->>'headline',
      nullif(v_proposal->>'delta_text', ''), v_proposal->>'if_wrong',
      coalesce((v_proposal->>'size_delta')::integer, 0), v_proposal->'evidence',
      'awaiting', v_key, v_version, v_hash, v_run_id,
      v_standard_id, v_standard_sha, p_source_snapshot, v_proposal->'governance'
    );
    v_inserted := v_inserted + 1;
  end loop;

  update public.capture_runs
  set summary = p_summary || jsonb_build_object('published', v_inserted, 'deduplicated', v_skipped)
  where id = v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id, 'idempotent', false, 'inserted', v_inserted, 'skipped', v_skipped
  );
end;
$$;

revoke all on function public.publish_capture_run(uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.publish_capture_run(uuid, text, text, jsonb, jsonb) to service_role;

create or replace function public.decide_capture_proposal(
  p_proposal_id uuid,
  p_expected_hash text,
  p_decision text,
  p_scope jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.proposals%rowtype;
  v_decision_hash text;
begin
  if v_user_id is null then raise exception 'capture_decision_auth_required' using errcode = '42501'; end if;
  if p_decision not in ('accepted', 'rejected', 'needs_evidence', 'superseded')
     or jsonb_typeof(p_scope) <> 'object' then
    raise exception 'capture_decision_invalid' using errcode = '22023';
  end if;
  select * into v_proposal from public.proposals
  where id = p_proposal_id and user_id = v_user_id for update;
  if not found then raise exception 'capture_proposal_not_owned' using errcode = '42501'; end if;
  if v_proposal.proposal_hash <> p_expected_hash then
    raise exception 'capture_proposal_changed' using errcode = '40001';
  end if;
  if v_proposal.status <> 'awaiting' then
    raise exception 'capture_proposal_already_decided' using errcode = '23505';
  end if;
  if p_decision = 'accepted' and p_scope = '{}'::jsonb then
    raise exception 'capture_acceptance_scope_required' using errcode = '22023';
  end if;
  if v_proposal.type = 'drift' and not (
    p_scope->>'freshness_decision' in ('retain', 'revise', 'gather_evidence', 'retire')
  ) then
    raise exception 'capture_freshness_decision_required' using errcode = '22023';
  end if;

  v_decision_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'proposal_id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
    'decision', p_decision, 'scope', p_scope, 'owner', v_user_id
  )::text, 'UTF8'), 'sha256'), 'hex');

  insert into public.proposal_decisions(
    proposal_id, user_id, proposal_hash, decision, scope, decision_hash
  ) values (
    v_proposal.id, v_user_id, v_proposal.proposal_hash, p_decision, p_scope, v_decision_hash
  );
  update public.proposals
  set status = p_decision, decided_at = now(), decided_by = v_user_id, decision_scope = p_scope
  where id = v_proposal.id;

  return jsonb_build_object(
    'proposal_id', v_proposal.id, 'proposal_hash', v_proposal.proposal_hash,
    'decision', p_decision, 'decision_hash', v_decision_hash,
    'change_applied', false, 'next', case when p_decision = 'accepted' then 'versioned_change_request' else null end
  );
end;
$$;

revoke all on function public.decide_capture_proposal(uuid, text, text, jsonb) from public, anon;
grant execute on function public.decide_capture_proposal(uuid, text, text, jsonb) to authenticated;
