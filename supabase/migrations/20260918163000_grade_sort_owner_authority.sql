begin;

create table if not exists public.sort_grade_submission_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  request_fingerprint text not null,
  run_id uuid not null references public.harness_runs(id) on delete cascade,
  item_id uuid not null references public.sort_items(id) on delete cascade,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sort_grade_receipt_owner_request_unique unique(user_id, request_id),
  constraint sort_grade_receipt_fingerprint_shape check(request_fingerprint ~ '^[a-f0-9]{64}$')
);

alter table public.sort_grade_submission_receipts enable row level security;
drop policy if exists owner_select_sort_grade_submission_receipts on public.sort_grade_submission_receipts;
create policy owner_select_sort_grade_submission_receipts
  on public.sort_grade_submission_receipts for select to authenticated
  using (auth.uid() = user_id);
revoke insert, update, delete, truncate on public.sort_grade_submission_receipts from anon, authenticated;
grant select on public.sort_grade_submission_receipts to authenticated;

create or replace function public.submit_sort_grade_atomic(
  p_request_id text,
  p_request_fingerprint text,
  p_run_id uuid,
  p_item_id uuid,
  p_verdict text,
  p_why text,
  p_ms_to_grade integer,
  p_create_construct boolean,
  p_manip_pair_id uuid,
  p_manip_answer text,
  p_manip_scored boolean,
  p_manip_ok boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.harness_runs%rowtype;
  v_item public.sort_items%rowtype;
  v_existing public.sort_grade_submission_receipts%rowtype;
  v_evidence_id uuid;
  v_construct_id uuid;
  v_result jsonb;
  v_detail jsonb;
  v_prior jsonb;
  v_filtered jsonb;
  v_pair_members integer;
begin
  if v_user_id is null then
    raise exception 'grade_sort_auth_required' using errcode = '42501';
  end if;
  if p_request_id is null or p_request_id !~ '^[A-Za-z0-9_-]{16,120}$'
     or p_request_fingerprint is null or p_request_fingerprint !~ '^[a-f0-9]{64}$'
     or p_run_id is null or p_item_id is null
     or p_verdict not in ('send', 'would_not_send', 'skip')
     or p_why is not null and (length(p_why) < 1 or length(p_why) > 600)
     or p_ms_to_grade is not null and (p_ms_to_grade < 0 or p_ms_to_grade > 86400000)
     or p_create_construct is null
     or (p_create_construct and (p_verdict = 'skip' or p_why is null or length(p_why) < 12))
     or ((p_manip_pair_id is null) <> (p_manip_answer is null))
     or ((p_manip_pair_id is null) <> (p_manip_scored is null))
     or ((p_manip_pair_id is null) <> (p_manip_ok is null))
     or p_manip_answer is not null and (length(p_manip_answer) < 1 or length(p_manip_answer) > 600) then
    raise exception 'grade_sort_invalid_submission' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('grade-sort:' || v_user_id::text || ':' || p_run_id::text, 0));
  select * into v_existing
  from public.sort_grade_submission_receipts
  where user_id = v_user_id and request_id = p_request_id
  limit 1;
  if found then
    if v_existing.request_fingerprint is distinct from p_request_fingerprint then
      raise exception 'grade_sort_request_conflict' using errcode = '23505';
    end if;
    return v_existing.result || jsonb_build_object('idempotent', true);
  end if;

  select * into v_run
  from public.harness_runs
  where id = p_run_id and user_id = v_user_id and kind = 'sort'
  for update;
  if not found then
    raise exception 'grade_sort_run_not_owned' using errcode = '42501';
  end if;
  if v_run.status <> 'done' or v_run.stage <> 'ready' then
    raise exception 'grade_sort_run_not_ready' using errcode = 'P0001';
  end if;

  select * into v_item
  from public.sort_items
  where id = p_item_id and session_id = p_run_id and user_id = v_user_id;
  if not found then
    raise exception 'grade_sort_item_not_owned' using errcode = '42501';
  end if;

  insert into public.sort_grades(user_id, item_id, verdict, why, ms_to_grade)
  values (v_user_id, p_item_id, p_verdict, p_why, p_ms_to_grade)
  on conflict (item_id) do update set
    user_id = excluded.user_id,
    verdict = excluded.verdict,
    why = excluded.why,
    ms_to_grade = excluded.ms_to_grade;

  if p_create_construct and not exists (
    select 1 from public.constructs
    where user_id = v_user_id
      and status in ('candidate', 'elicited', 'compiled')
      and lower(btrim(emergent_pole)) = lower(btrim(left(p_why, 240)))
  ) then
    insert into public.evidence(
      user_id, kind, body, source_label, situated, situation, speaker_is_owner, occurred_at
    ) values (
      v_user_id,
      'grade',
      p_why,
      format('Sort grade, %s, item %s', v_item.surface, v_item.position),
      true,
      format('Grading item %s of a %s sort', v_item.position, v_item.surface),
      true,
      now()
    ) returning id into v_evidence_id;

    insert into public.constructs(user_id, scope, status, emergent_pole, evidence_ids)
    values (v_user_id, 'person', 'candidate', left(p_why, 240), array[v_evidence_id])
    returning id into v_construct_id;
  end if;

  if p_manip_pair_id is not null then
    select count(*)::integer into v_pair_members
    from public.sort_items
    where user_id = v_user_id and session_id = p_run_id and pair_id = p_manip_pair_id;
    if v_pair_members <> 2 or v_item.pair_id is distinct from p_manip_pair_id then
      raise exception 'grade_sort_invalid_manipulation_pair' using errcode = '22023';
    end if;

    update public.sort_items
    set manip_checked = true, manip_ok = case when p_manip_scored then p_manip_ok else null end
    where user_id = v_user_id and session_id = p_run_id and pair_id = p_manip_pair_id;

    v_detail := coalesce(v_run.stage_detail, '{}'::jsonb);
    v_prior := case
      when jsonb_typeof(v_detail->'manip_answers') = 'array' then v_detail->'manip_answers'
      else '[]'::jsonb
    end;
    select coalesce(jsonb_agg(value), '[]'::jsonb) into v_filtered
    from jsonb_array_elements(v_prior)
    where value->>'pair_id' is distinct from p_manip_pair_id::text;
    v_detail := jsonb_set(
      v_detail,
      '{manip_answers}',
      v_filtered || jsonb_build_array(jsonb_build_object(
        'pair_id', p_manip_pair_id,
        'answer', p_manip_answer,
        'matches_key', p_manip_ok,
        'scored', p_manip_scored,
        'at', now()
      )),
      true
    );
    update public.harness_runs set stage_detail = v_detail, updated_at = now() where id = p_run_id;
  end if;

  v_result := jsonb_build_object(
    'run_id', p_run_id,
    'item_id', p_item_id,
    'new_construct_id', v_construct_id,
    'manip_pair_id', p_manip_pair_id,
    'manip_scored', p_manip_scored,
    'manip_ok', p_manip_ok,
    'idempotent', false
  );
  insert into public.sort_grade_submission_receipts(
    user_id, request_id, request_fingerprint, run_id, item_id, result
  ) values (
    v_user_id, p_request_id, p_request_fingerprint, p_run_id, p_item_id, v_result
  );
  return v_result;
end;
$$;

revoke all on function public.submit_sort_grade_atomic(text, text, uuid, uuid, text, text, integer, boolean, uuid, text, boolean, boolean) from public, anon;
grant execute on function public.submit_sort_grade_atomic(text, text, uuid, uuid, text, text, integer, boolean, uuid, text, boolean, boolean) to authenticated, service_role;

comment on function public.submit_sort_grade_atomic(text, text, uuid, uuid, text, text, integer, boolean, uuid, text, boolean, boolean) is
  'Owner-bound idempotent grade, emergent-construct and manipulation-answer transaction.';

commit;
