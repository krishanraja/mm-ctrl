begin;

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
      when nullif(entry.item->>'source_run_id', '') is not null and nullif(entry.item->>'source_event_key', '') is not null
        then concat_ws(':', entry.item->>'source_run_id', entry.item->>'source_event_key')
      else entry.item->>'id'
    end as source_id
    from jsonb_array_elements(coalesce(v_source->'ledger', '[]'::jsonb)) as entry(item)
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

commit;
