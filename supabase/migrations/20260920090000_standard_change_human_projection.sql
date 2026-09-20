-- R118: freeze the exact human-readable projection inside the owner review
-- packet before a leader can approve or reject it. Legacy R116 packets remain
-- valid for headless audit, but the product must fail closed if this projection
-- cannot be built from the accepted proposal and its cited ledger rows.

create or replace function public.build_standard_change_review_presentation(
  p_user_id uuid,
  p_change_request_id uuid,
  p_target_before jsonb,
  p_target_after jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_change public.standard_change_requests%rowtype;
  v_proposal public.proposals%rowtype;
  v_evidence jsonb;
  v_expected_count integer;
  v_resolved_count integer;
  v_current_rule text;
  v_proposed_rule text;
  v_consequence text;
  v_alternatives jsonb;
  v_validation text;
begin
  select * into v_change
  from public.standard_change_requests
  where id = p_change_request_id and user_id = p_user_id;
  if not found then
    raise exception 'standard_change_presentation_request_missing' using errcode = 'P0001';
  end if;

  select * into v_proposal
  from public.proposals
  where id = v_change.proposal_id and user_id = p_user_id;
  if not found
     or v_proposal.proposal_hash <> v_change.proposal_hash
     or v_proposal.status <> 'accepted'
     or v_proposal.surface <> v_change.surface then
    raise exception 'standard_change_presentation_proposal_changed' using errcode = 'P0001';
  end if;

  if jsonb_typeof(coalesce(v_proposal.evidence->'lines', 'null'::jsonb)) <> 'array' then
    raise exception 'standard_change_presentation_evidence_invalid' using errcode = 'P0001';
  end if;
  v_expected_count := jsonb_array_length(v_proposal.evidence->'lines');

  select
    coalesce(jsonb_agg(jsonb_build_object(
      'source_id', source.line->>'sourceId',
      'label', coalesce(nullif(source.line->>'criterion', ''), ledger_row.criterion_name),
      'statement', coalesce(nullif(source.line->>'quote', ''), nullif(ledger_row.quote, '')),
      'occurred_at', ledger_row.created_at,
      'relationship', case
        when coalesce(source.line->>'verdict', ledger_row.verdict) = 'breaks' then 'supports'
        when coalesce(source.line->>'verdict', ledger_row.verdict) = 'holds' then 'challenges'
        else 'qualifies'
      end
    ) order by source.ordinality), '[]'::jsonb),
    count(*)::integer
  into v_evidence, v_resolved_count
  from jsonb_array_elements(v_proposal.evidence->'lines') with ordinality as source(line, ordinality)
  cross join lateral (
    select l.*
    from public.ledger l
    where l.user_id = p_user_id
      and concat(l.source_run_id::text, ':', l.source_event_key) = source.line->>'sourceId'
      and l.surface = v_change.surface
    order by l.created_at desc, l.id desc
    limit 1
  ) ledger_row;

  if v_expected_count < 2
     or v_resolved_count <> v_expected_count
     or exists (
       select 1
       from jsonb_array_elements(v_evidence) item
       where nullif(btrim(item->>'source_id'), '') is null
          or nullif(btrim(item->>'label'), '') is null
          or nullif(btrim(item->>'statement'), '') is null
          or nullif(btrim(item->>'occurred_at'), '') is null
     ) then
    raise exception 'standard_change_presentation_evidence_incomplete' using errcode = 'P0001';
  end if;

  v_current_rule := coalesce(
    nullif(btrim(p_target_before->>'check_text'), ''),
    nullif(btrim(p_target_before->>'name'), '')
  );
  v_proposed_rule := coalesce(
    nullif(btrim(v_proposal.delta_text), ''),
    nullif(btrim(p_target_after->>'check_text'), '')
  );
  v_consequence := nullif(btrim(v_proposal.governance->>'expected_effect'), '');
  v_validation := nullif(btrim(v_proposal.governance->>'validation'), '');
  v_alternatives := v_proposal.governance->'alternative_explanations';

  if v_current_rule is null
     or v_proposed_rule is null
     or v_consequence is null
     or nullif(btrim(v_proposal.headline), '') is null
     or nullif(btrim(v_proposal.if_wrong), '') is null
     or v_validation is null
     or jsonb_typeof(coalesce(v_alternatives, 'null'::jsonb)) <> 'array'
     or jsonb_array_length(v_alternatives) < 1
     or exists (
       select 1 from jsonb_array_elements(v_alternatives) item
       where jsonb_typeof(item) <> 'string'
          or nullif(btrim(item #>> '{}'), '') is null
     ) then
    raise exception 'standard_change_presentation_copy_incomplete' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'schema', 'ctrl.standard-change.owner-review.presentation.v1',
    'question', format('Should this be your %s rule?', replace(v_change.surface, '_', ' ')),
    'headline', v_proposal.headline,
    'current_rule', v_current_rule,
    'proposed_rule', v_proposed_rule,
    'consequence', v_consequence,
    'risk_if_wrong', v_proposal.if_wrong,
    'validation', v_validation,
    'alternative_explanations', v_alternatives,
    'evidence', v_evidence
  );
end;
$$;

revoke all on function public.build_standard_change_review_presentation(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.prepare_standard_change_review_v2(
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
  v_result jsonb;
  v_review public.standard_change_review_packets%rowtype;
  v_presentation jsonb;
  v_packet jsonb;
  v_packet_sha text;
begin
  if v_user_id is null then
    raise exception 'standard_change_review_auth_required' using errcode = '42501';
  end if;

  v_result := public.prepare_standard_change_review(p_check_id, p_expected_result_sha256);
  select * into v_review
  from public.standard_change_review_packets
  where id = (v_result->>'review_packet_id')::uuid and user_id = v_user_id
  for update;
  if not found then
    raise exception 'standard_change_presentation_review_missing' using errcode = 'P0001';
  end if;

  if v_review.packet ? 'presentation' then
    if v_review.packet_sha256 <> public.standard_change_json_sha256(v_review.packet)
       or v_review.packet->'presentation'->>'schema' <>
          'ctrl.standard-change.owner-review.presentation.v1' then
      raise exception 'standard_change_presentation_packet_changed' using errcode = 'P0001';
    end if;
    return v_result;
  end if;

  if v_review.state <> 'ready' then
    raise exception 'standard_change_presentation_locked' using errcode = 'P0001';
  end if;

  v_presentation := public.build_standard_change_review_presentation(
    v_user_id,
    v_review.change_request_id,
    v_review.target_before,
    v_review.target_after
  );
  v_packet := v_review.packet || jsonb_build_object('presentation', v_presentation);
  v_packet_sha := public.standard_change_json_sha256(v_packet);

  update public.standard_change_review_packets
  set packet = v_packet, packet_sha256 = v_packet_sha
  where id = v_review.id and user_id = v_user_id;

  return (v_result - 'packet' - 'review_packet_sha256') || jsonb_build_object(
    'packet', v_packet,
    'review_packet_sha256', v_packet_sha,
    'idempotent', false
  );
end;
$$;

revoke all on function public.prepare_standard_change_review_v2(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.prepare_standard_change_review_v2(uuid, text) to authenticated;
