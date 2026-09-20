-- R122: stable owner-private address for an already frozen review packet.
--
-- Opening is read-only. It cannot prepare a new packet, apply a standard,
-- reverse a standard, deploy or release anything. Unknown and cross-owner
-- packet identifiers deliberately produce the same result.

create or replace function public.open_standard_change_review_v3(
  p_review_packet_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_review public.standard_change_review_packets%rowtype;
begin
  if v_user_id is null then
    raise exception 'standard_change_review_auth_required' using errcode = '42501';
  end if;

  select * into v_review
  from public.standard_change_review_packets
  where id = p_review_packet_id and user_id = v_user_id;

  if not found then
    raise exception 'standard_change_review_not_owned' using errcode = 'P0001';
  end if;
  if v_review.state <> 'ready' then
    raise exception 'standard_change_review_not_ready' using errcode = 'P0001';
  end if;
  if v_review.packet_sha256 <> public.standard_change_json_sha256(v_review.packet)
     or v_review.packet->>'schema' <> 'ctrl.standard-change.owner-review.v1'
     or v_review.packet->'presentation'->>'schema' <>
        'ctrl.standard-change.owner-review.presentation.v1' then
    raise exception 'standard_change_review_packet_changed' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'review_packet_id', v_review.id,
    'review_packet_sha256', v_review.packet_sha256,
    'planned_standard_sha256', v_review.planned_standard_sha256,
    'state', v_review.state,
    'packet', v_review.packet,
    'active_standard_mutated', false,
    'deploy_authorized', false,
    'release_authorized', false
  );
end;
$$;

revoke all on function public.open_standard_change_review_v3(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.open_standard_change_review_v3(uuid) to authenticated;
