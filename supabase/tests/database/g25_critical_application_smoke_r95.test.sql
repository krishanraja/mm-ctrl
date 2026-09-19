-- G25 critical restored-database application smoke R95
-- Isolated target only. Every fixture is removed before success.

do $smoke$
declare
  v_user uuid := '00000000-0000-4000-8000-000000000795';
  v_current_fact uuid := '00000000-0000-4000-8000-000000000796';
  v_stale_fact uuid := '00000000-0000-4000-8000-000000000797';
  v_briefing uuid := '00000000-0000-4000-8000-000000000798';
  v_case uuid := '00000000-0000-4000-8000-000000000799';
  v_export json;
  v_aggregate jsonb;
  v_count integer;
begin
  if exists (select 1 from auth.users where id=v_user)
    or exists (select 1 from public.user_memory where id in (v_current_fact,v_stale_fact))
    or exists (select 1 from public.briefings where id=v_briefing)
    or exists (select 1 from public.decision_cases where id=v_case) then
    raise exception 'R95 critical application fixture already exists';
  end if;

  insert into auth.users (
    id,email,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous
  ) values (
    v_user,'r95-critical@example.invalid','{"username":"r95_critical"}'::jsonb,
    now(),now(),false,false
  );

  insert into public.user_memory (
    id,user_id,fact_key,fact_category,fact_label,fact_value,
    confidence_score,verification_status,source_type,is_current
  ) values
    (v_current_fact,v_user,'r95_current','preference','R95 current','current',0.9,'verified','manual',true),
    (v_stale_fact,v_user,'r95_stale','preference','R95 stale','stale',0.9,'verified','manual',false);

  v_export := public.export_user_memory(v_user);
  if json_array_length(coalesce(v_export,'[]'::json)) <> 1
    or v_export->0->>'id' <> v_current_fact::text then
    raise exception 'R95 memory export did not preserve current-only semantics';
  end if;

  select count(*) into v_count from public.get_user_memory_context(v_user);
  if v_count <> 1 then
    raise exception 'R95 memory context did not return one qualified current fact';
  end if;

  insert into public.decision_cases (id,user_id,statement,title)
  values (v_case,v_user,'R95 consequential decision','R95 critical path');

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_user::text,'role','authenticated')::text,
    true
  );
  perform public.pin_decision(v_case);
  select count(*) into v_count from public.get_track_record(v_user);
  if v_count <> 1 or not exists (
    select 1 from public.decision_cases where id=v_case and pinned_at is not null
  ) then
    raise exception 'R95 decision owner path failed';
  end if;

  perform set_config('request.jwt.claims','{"role":"service_role"}',true);

  insert into public.briefings (
    id,user_id,briefing_date,script_text,segments,context_snapshot,briefing_type
  ) values (
    v_briefing,v_user,current_date,'R95 readable briefing','[]'::jsonb,
    '{"lens":[{"id":"r95-lens","type":"interest_beat","text":"Applied AI"}]}'::jsonb,
    'default'
  );

  insert into public.briefing_feedback (
    id,briefing_id,segment_index,reaction,lens_item_id
  ) values
    ('00000000-0000-4000-8000-000000000801',v_briefing,0,'not_useful','r95-lens'),
    ('00000000-0000-4000-8000-000000000802',v_briefing,1,'not_useful','r95-lens'),
    ('00000000-0000-4000-8000-000000000803',v_briefing,2,'not_useful','r95-lens');

  v_aggregate := public.sp_aggregate_briefing_feedback(30,3);
  if (v_aggregate->>'scanned_feedback_rows')::integer <> 3
    or (v_aggregate->>'promoted')::integer <> 1
    or not exists (
      select 1 from public.briefing_lens_feedback
      where user_id=v_user
        and lens_item_type='interest_beat'
        and lens_item_text='Applied AI'
        and source='not_useful_aggregate'
        and evidence_count=3
        and weight_delta=-0.4
        and is_active
    ) then
    raise exception 'R95 briefing feedback did not become one governed steering rule';
  end if;

  perform set_config('request.jwt.claims','{}',true);
  delete from public.briefing_feedback where briefing_id=v_briefing;
  delete from public.briefing_lens_feedback where user_id=v_user;
  delete from public.briefings where id=v_briefing;
  delete from public.decision_outcomes where decision_case_id=v_case or user_id=v_user;
  delete from public.decision_cases where id=v_case;
  delete from public.user_memory where id in (v_current_fact,v_stale_fact);
  delete from public.user_roles where user_id=v_user;
  delete from public.profiles where id=v_user;
  delete from auth.users where id=v_user;

  if exists (select 1 from auth.users where id=v_user)
    or exists (select 1 from public.profiles where id=v_user)
    or exists (select 1 from public.user_roles where user_id=v_user)
    or exists (select 1 from public.user_memory where id in (v_current_fact,v_stale_fact))
    or exists (select 1 from public.decision_cases where id=v_case)
    or exists (select 1 from public.briefings where id=v_briefing)
    or exists (select 1 from public.briefing_feedback where briefing_id=v_briefing)
    or exists (select 1 from public.briefing_lens_feedback where user_id=v_user) then
    raise exception 'R95 critical application fixture cleanup failed';
  end if;
end
$smoke$;
