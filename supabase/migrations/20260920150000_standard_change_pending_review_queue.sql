-- R123: one read-only owner-private pending review selection.
--
-- The queue does not infer materiality from prose. Until an explicit,
-- evidence-backed priority exists, it selects the oldest ready packet so a
-- consequential review cannot be silently buried by a model-generated score.

create or replace function public.get_pending_standard_change_review_v4()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_review public.standard_change_review_packets%rowtype;
  v_ready_count integer;
begin
  if v_user_id is null then
    raise exception 'standard_change_review_auth_required' using errcode = '42501';
  end if;

  select count(*)::integer into v_ready_count
  from public.standard_change_review_packets
  where user_id = v_user_id and state = 'ready';

  if v_ready_count = 0 then
    return jsonb_build_object(
      'schema', 'ctrl.standard-change.pending-review.v1',
      'ready_count', 0,
      'next', null,
      'selection', jsonb_build_object(
        'method', 'oldest_ready_first',
        'materiality_inferred', false
      ),
      'active_standard_mutated', false,
      'deploy_authorized', false,
      'release_authorized', false
    );
  end if;

  select * into v_review
  from public.standard_change_review_packets
  where user_id = v_user_id and state = 'ready'
  order by created_at asc, id asc
  limit 1;

  if v_review.packet_sha256 <> public.standard_change_json_sha256(v_review.packet)
     or v_review.packet->>'schema' <> 'ctrl.standard-change.owner-review.v1'
     or v_review.packet->'presentation'->>'schema' <>
        'ctrl.standard-change.owner-review.presentation.v1'
     or nullif(btrim(v_review.packet->'presentation'->>'question'), '') is null
     or nullif(btrim(v_review.packet->'presentation'->>'headline'), '') is null
     or nullif(btrim(v_review.packet->'presentation'->>'consequence'), '') is null then
    raise exception 'standard_change_review_packet_changed' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'schema', 'ctrl.standard-change.pending-review.v1',
    'ready_count', v_ready_count,
    'next', jsonb_build_object(
      'review_packet_id', v_review.id,
      'safe_path', '/operator/reviews/' || v_review.id::text,
      'question', v_review.packet->'presentation'->>'question',
      'headline', v_review.packet->'presentation'->>'headline',
      'consequence', v_review.packet->'presentation'->>'consequence',
      'ready_since', v_review.created_at
    ),
    'selection', jsonb_build_object(
      'method', 'oldest_ready_first',
      'materiality_inferred', false
    ),
    'active_standard_mutated', false,
    'deploy_authorized', false,
    'release_authorized', false
  );
end;
$$;

revoke all on function public.get_pending_standard_change_review_v4()
  from public, anon, authenticated, service_role;
grant execute on function public.get_pending_standard_change_review_v4() to authenticated;
