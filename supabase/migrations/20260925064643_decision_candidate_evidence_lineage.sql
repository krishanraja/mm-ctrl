-- R148 exact evidence lineage for reconstructed decision candidates.
-- Additive, isolated-pilot first. Raw tables remain closed.

alter table public.brain_decision_answer_candidates
  add constraint brain_decision_answer_candidates_scope_unique
  unique (id, workspace_id, subject_id);

create table public.brain_decision_candidate_evidence_links (
  candidate_id uuid not null,
  evidence_atom_id uuid not null,
  assertion_id uuid not null,
  workspace_id uuid not null,
  subject_id uuid not null,
  stance text not null check (stance in ('supports', 'refutes', 'context')),
  linked_at timestamptz not null default statement_timestamp(),
  primary key (candidate_id, evidence_atom_id),
  foreign key (candidate_id, workspace_id, subject_id)
    references public.brain_decision_answer_candidates(id, workspace_id, subject_id) on delete restrict,
  foreign key (evidence_atom_id, assertion_id, workspace_id, subject_id)
    references public.brain_decision_evidence_atoms(id, assertion_id, workspace_id, subject_id) on delete restrict
);

create index brain_decision_candidate_evidence_atom_idx
  on public.brain_decision_candidate_evidence_links (
    evidence_atom_id, assertion_id, workspace_id, subject_id
  );
create index brain_decision_candidate_evidence_assertion_idx
  on public.brain_decision_candidate_evidence_links (assertion_id);
create index brain_decision_candidate_evidence_scope_idx
  on public.brain_decision_candidate_evidence_links (
    candidate_id, workspace_id, subject_id
  );

create trigger brain_decision_candidate_evidence_links_append_only
before update or delete on public.brain_decision_candidate_evidence_links
for each row execute function private.brain_decision_append_only_guard();

create or replace function public.stage_grounded_brain_decision_candidate_v1(
  p_candidate_id uuid,
  p_question_id uuid,
  p_source_id uuid,
  p_assertion_id uuid,
  p_source_type text,
  p_source_content_ciphertext text,
  p_assertion_ciphertext text,
  p_candidate_ciphertext text,
  p_captured_at timestamptz,
  p_evidence_refs jsonb,
  p_idempotency_key text,
  p_request_fingerprint_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_row public.brain_decision_questions%rowtype;
  evidence_ref jsonb;
  atom_row public.brain_decision_evidence_atoms%rowtype;
  result jsonb;
  linked_count integer := 0;
begin
  if jsonb_typeof(p_evidence_refs) <> 'array'
    or jsonb_array_length(p_evidence_refs) not between 1 and 24
    or exists (
      select 1
      from jsonb_array_elements(p_evidence_refs) item
      where jsonb_typeof(item) <> 'object'
        or not (item ? 'evidence_atom_id' and item ? 'stance')
        or (select count(*) from jsonb_object_keys(item)) <> 2
        or (item->>'evidence_atom_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        or item->>'stance' not in ('supports', 'refutes', 'context')
    )
    or not exists (
      select 1 from jsonb_array_elements(p_evidence_refs) item
      where item->>'stance' = 'supports'
    )
    or exists (
      select 1
      from jsonb_array_elements(p_evidence_refs) item
      group by item->>'evidence_atom_id'
      having count(*) > 1
    )
  then
    raise exception 'brain_decision_candidate_evidence_input_invalid' using errcode = '22023';
  end if;

  select * into question_row
  from public.brain_decision_questions
  where id = p_question_id;
  if not found then raise exception 'brain_decision_question_not_found'; end if;

  perform private.brain_decision_ingress_actor(
    question_row.workspace_id, question_row.subject_id, true
  );

  for evidence_ref in select value from jsonb_array_elements(p_evidence_refs)
  loop
    select * into atom_row
    from public.brain_decision_evidence_atoms
    where id = (evidence_ref->>'evidence_atom_id')::uuid
      and workspace_id = question_row.workspace_id
      and subject_id = question_row.subject_id;
    if not found then
      raise exception 'brain_decision_candidate_evidence_not_found';
    end if;
    if atom_row.causal_watermark_at > statement_timestamp() then
      raise exception 'brain_decision_candidate_evidence_in_future';
    end if;
    if not exists (
      select 1
      from public.brain_decision_evidence_links link
      where link.decision_version_id = question_row.decision_version_id
        and link.evidence_atom_id = atom_row.id
        and link.assertion_id = atom_row.assertion_id
        and link.workspace_id = question_row.workspace_id
        and link.subject_id = question_row.subject_id
    ) then
      raise exception 'brain_decision_candidate_evidence_ineligible';
    end if;
  end loop;

  result := public.stage_brain_decision_candidate_v1(
    p_candidate_id,
    p_question_id,
    p_source_id,
    p_assertion_id,
    p_source_type,
    p_source_content_ciphertext,
    p_assertion_ciphertext,
    p_candidate_ciphertext,
    p_captured_at,
    p_idempotency_key,
    p_request_fingerprint_sha256
  );

  for evidence_ref in select value from jsonb_array_elements(p_evidence_refs)
  loop
    select * into strict atom_row
    from public.brain_decision_evidence_atoms
    where id = (evidence_ref->>'evidence_atom_id')::uuid;
    insert into public.brain_decision_candidate_evidence_links (
      candidate_id, evidence_atom_id, assertion_id, workspace_id, subject_id, stance
    ) values (
      (result->>'candidate_id')::uuid,
      atom_row.id,
      atom_row.assertion_id,
      question_row.workspace_id,
      question_row.subject_id,
      evidence_ref->>'stance'
    ) on conflict (candidate_id, evidence_atom_id) do nothing;
  end loop;

  select count(*)::integer into linked_count
  from public.brain_decision_candidate_evidence_links
  where candidate_id = (result->>'candidate_id')::uuid;
  if linked_count <> jsonb_array_length(p_evidence_refs) then
    raise exception 'brain_decision_candidate_evidence_replay_conflict' using errcode = '23505';
  end if;

  return result || jsonb_build_object('linked_evidence_count', linked_count);
end;
$$;

alter table public.brain_decision_candidate_evidence_links enable row level security;
alter table public.brain_decision_candidate_evidence_links force row level security;

revoke all on table public.brain_decision_candidate_evidence_links
  from public, anon, authenticated, service_role;
grant select on table public.brain_decision_candidate_evidence_links to service_role;

revoke all on function public.stage_grounded_brain_decision_candidate_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, jsonb, text, text
) from public, anon, service_role;
grant execute on function public.stage_grounded_brain_decision_candidate_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, jsonb, text, text
) to authenticated;
