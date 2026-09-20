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
  v_evidence_bindings jsonb;
  v_criteria jsonb;
begin
  v_source := public.current_capture_source(p_user_id, p_capture_week, p_window_weeks);
  v_snapshot := encode(extensions.digest(convert_to((v_source - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');

  select
    coalesce(jsonb_agg(source_id order by source_id), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'source_id', source_id,
      'surface', surface,
      'criterion_id', criterion_id,
      'criterion_name', criterion_name,
      'verdict', verdict,
      'disposition', disposition
    ) order by source_id), '[]'::jsonb)
  into v_evidence_ids, v_evidence_bindings
  from (
    select distinct on (source_id)
      source_id,
      ledger_value->>'surface' as surface,
      ledger_value->>'criterion_id' as criterion_id,
      ledger_value->>'criterion_name' as criterion_name,
      ledger_value->>'verdict' as verdict,
      ledger_value->>'disposition' as disposition
    from (
      select value as ledger_value, case
        when nullif(value->>'source_run_id', '') is not null and nullif(value->>'source_event_key', '') is not null
          then value->>'source_run_id' || ':' || value->>'source_event_key'
        else value->>'id'
      end as source_id
      from jsonb_array_elements(coalesce(v_source->'ledger', '[]'::jsonb)) as entries(value)
    ) ledger_rows
    where source_id is not null and length(source_id) between 1 and 240
    order by source_id
  ) bindings;

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
