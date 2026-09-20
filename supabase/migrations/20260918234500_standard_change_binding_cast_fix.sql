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
  v_evidence_ids jsonb := '[]'::jsonb;
  v_evidence_bindings jsonb := '[]'::jsonb;
  v_criteria jsonb;
  v_item jsonb;
  v_source_id text;
begin
  v_source := public.current_capture_source(p_user_id, p_capture_week, p_window_weeks);
  v_snapshot := encode(extensions.digest(convert_to((v_source - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');

  for v_item in select jsonb_array_elements(coalesce(v_source->'ledger', '[]'::jsonb))
  loop
    v_source_id := case
      when nullif(jsonb_extract_path_text(v_item::jsonb, 'source_run_id'), '') is not null
           and nullif(jsonb_extract_path_text(v_item::jsonb, 'source_event_key'), '') is not null
        then jsonb_extract_path_text(v_item::jsonb, 'source_run_id') || ':' || jsonb_extract_path_text(v_item::jsonb, 'source_event_key')
      else jsonb_extract_path_text(v_item::jsonb, 'id')
    end;
    if v_source_id is not null and length(v_source_id) between 1 and 240
       and not (v_evidence_ids @> jsonb_build_array(v_source_id)) then
      v_evidence_ids := v_evidence_ids || jsonb_build_array(v_source_id);
      v_evidence_bindings := v_evidence_bindings || jsonb_build_array(jsonb_build_object(
        'source_id', v_source_id,
        'surface', jsonb_extract_path_text(v_item::jsonb, 'surface'),
        'criterion_id', jsonb_extract_path_text(v_item::jsonb, 'criterion_id'),
        'criterion_name', jsonb_extract_path_text(v_item::jsonb, 'criterion_name'),
        'verdict', jsonb_extract_path_text(v_item::jsonb, 'verdict'),
        'disposition', jsonb_extract_path_text(v_item::jsonb, 'disposition')
      ));
    end if;
  end loop;

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
    'schema', 'ctrl.capture.source-manifest.v2',
    'owner_id', p_user_id,
    'capture_week', p_capture_week,
    'source_snapshot', v_snapshot,
    'standard', jsonb_build_object(
      'id', v_source->'standard'->>'id',
      'body_sha256', v_source->'standard'->>'body_sha256'
    ),
    'criteria', v_criteria,
    'evidence_ids', v_evidence_ids,
    'evidence_bindings', v_evidence_bindings
  );
end;
$$;

revoke all on function public.build_capture_source_manifest(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.build_capture_source_manifest(uuid, text, integer) to service_role;

commit;
