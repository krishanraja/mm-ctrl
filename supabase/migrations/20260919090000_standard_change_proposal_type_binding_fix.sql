begin;

-- R115 correction: the three Capture proposal types have different evidence
-- shapes. False positives and uncovered gaps cite exact ledger lines. Drift is
-- deliberately a question inferred from the absence of a criterion across a
-- bounded set of applicable reviews, so it has no cited ledger lines at all.
-- Keep both forms exact instead of forcing every type through one shape.

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
  v_opportunity_bindings jsonb := '[]'::jsonb;
  v_criteria jsonb;
  v_item jsonb;
  v_source_id text;
  v_run_id text;
begin
  v_source := public.current_capture_source(p_user_id, p_capture_week, p_window_weeks);
  v_snapshot := encode(extensions.digest(convert_to((v_source - 'proposal_history')::text, 'UTF8'), 'sha256'), 'hex');

  for v_item in select jsonb_array_elements(coalesce(v_source->'ledger', '[]'::jsonb))
  loop
    v_source_id := case
      when nullif(jsonb_extract_path_text(v_item::jsonb, 'source_run_id'), '') is not null
           and nullif(jsonb_extract_path_text(v_item::jsonb, 'source_event_key'), '') is not null
        then jsonb_extract_path_text(v_item::jsonb, 'source_run_id') || ':' ||
             jsonb_extract_path_text(v_item::jsonb, 'source_event_key')
      else jsonb_extract_path_text(v_item::jsonb, 'id')
    end;
    if v_source_id is not null and length(v_source_id) between 1 and 240
       and not (v_evidence_ids @> jsonb_build_array(v_source_id)) then
      v_evidence_ids := v_evidence_ids || jsonb_build_array(v_source_id);
      v_evidence_bindings := v_evidence_bindings || jsonb_build_array(jsonb_build_object(
        'source_id', v_source_id,
        'locator', case
          when nullif(jsonb_extract_path_text(v_item::jsonb, 'source_run_id'), '') is not null
               and nullif(jsonb_extract_path_text(v_item::jsonb, 'source_event_key'), '') is not null
            then 'review ' || jsonb_extract_path_text(v_item::jsonb, 'source_run_id') || ', ' ||
                 jsonb_extract_path_text(v_item::jsonb, 'source_event_key')
          else 'ledger ' || jsonb_extract_path_text(v_item::jsonb, 'id')
        end,
        'week', jsonb_extract_path_text(v_item::jsonb, 'week'),
        'surface', jsonb_extract_path_text(v_item::jsonb, 'surface'),
        'signal', jsonb_extract_path_text(v_item::jsonb, 'signal'),
        'criterion_id', jsonb_extract_path_text(v_item::jsonb, 'criterion_id'),
        'criterion_name', jsonb_extract_path_text(v_item::jsonb, 'criterion_name'),
        'verdict', jsonb_extract_path_text(v_item::jsonb, 'verdict'),
        'disposition', jsonb_extract_path_text(v_item::jsonb, 'disposition')
      ));
    end if;
  end loop;

  for v_item in select jsonb_array_elements(coalesce(v_source->'opportunities', '[]'::jsonb))
  loop
    v_run_id := nullif(jsonb_extract_path_text(v_item::jsonb, 'run_id'), '');
    if v_run_id is not null
       and nullif(jsonb_extract_path_text(v_item::jsonb, 'surface'), '') is not null
       and not (v_opportunity_bindings @> jsonb_build_array(jsonb_build_object('run_id', v_run_id))) then
      v_opportunity_bindings := v_opportunity_bindings || jsonb_build_array(jsonb_build_object(
        'run_id', v_run_id,
        'surface', jsonb_extract_path_text(v_item::jsonb, 'surface')
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
    'schema', 'ctrl.capture.source-manifest.v3',
    'owner_id', p_user_id,
    'capture_week', p_capture_week,
    'source_snapshot', v_snapshot,
    'standard', jsonb_build_object(
      'id', v_source->'standard'->>'id',
      'body_sha256', v_source->'standard'->>'body_sha256'
    ),
    'criteria', v_criteria,
    'evidence_ids', v_evidence_ids,
    'evidence_bindings', v_evidence_bindings,
    'opportunity_bindings', v_opportunity_bindings
  );
end;
$$;

revoke all on function public.build_capture_source_manifest(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.build_capture_source_manifest(uuid, text, integer) to service_role;

create or replace function public.validate_capture_proposal_manifest()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.capture_runs%rowtype;
  v_source_ids jsonb;
  v_lines jsonb;
  v_criterion_id text;
  v_criterion_name text;
  v_opportunities integer;
  v_bound_opportunities integer;
begin
  select * into v_run from public.capture_runs where id = new.capture_run_id;
  if not found or v_run.user_id <> new.user_id
     or v_run.source_manifest is null or v_run.source_manifest_sha256 is null
     or v_run.source_manifest->>'schema' <> 'ctrl.capture.source-manifest.v3'
     or v_run.source_snapshot <> new.source_snapshot
     or v_run.standard_artifact_id <> new.source_standard_artifact_id
     or v_run.standard_sha256 <> new.source_standard_sha256 then
    raise exception 'capture_proposal_manifest_mismatch' using errcode = '22023';
  end if;

  if jsonb_typeof(new.evidence) <> 'object' then
    raise exception 'capture_proposal_evidence_invalid' using errcode = '22023';
  end if;

  v_source_ids := coalesce(new.evidence->'source_ids', '[]'::jsonb);
  v_lines := coalesce(new.evidence->'lines', '[]'::jsonb);
  v_criterion_id := nullif(new.evidence->>'criterion_id', '');
  v_criterion_name := nullif(new.evidence->>'criterion_name', '');

  if jsonb_typeof(v_source_ids) <> 'array' or jsonb_typeof(v_lines) <> 'array' then
    raise exception 'capture_proposal_evidence_invalid' using errcode = '22023';
  end if;

  if new.type = 'drift' then
    -- Drift is an absence claim: no line is cited, the exact current criterion
    -- is named, and the opportunity count must equal the frozen review set.
    if jsonb_array_length(v_source_ids) <> 0
       or jsonb_array_length(v_lines) <> 0
       or new.evidence ? 'surfaces'
       or v_criterion_id is null
       or v_criterion_name is null
       or not exists (
         select 1
         from jsonb_array_elements(coalesce(v_run.source_manifest->'criteria', '[]'::jsonb)) as criteria_entries(criterion_value)
         where jsonb_extract_path_text(criterion_value, 'id') = v_criterion_id
           and jsonb_extract_path_text(criterion_value, 'surface') = new.surface
           and jsonb_extract_path_text(criterion_value, 'name') = v_criterion_name
       )
       or exists (
         select 1
         from jsonb_array_elements(coalesce(v_run.source_manifest->'evidence_bindings', '[]'::jsonb)) as binding_entries(binding_value)
         where jsonb_extract_path_text(binding_value, 'signal') = 'output'
           and jsonb_extract_path_text(binding_value, 'surface') = new.surface
           and (
             jsonb_extract_path_text(binding_value, 'criterion_id') = v_criterion_id
             or jsonb_extract_path_text(binding_value, 'criterion_name') = v_criterion_name
           )
       )
       or new.evidence->'last_fired_week' is distinct from 'null'::jsonb then
      raise exception 'capture_drift_evidence_not_exactly_bound' using errcode = '22023';
    end if;

    begin
      if jsonb_typeof(new.evidence->'opportunities') <> 'number' then
        raise exception 'capture_drift_opportunities_invalid' using errcode = '22023';
      end if;
      v_opportunities := (new.evidence->>'opportunities')::integer;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'capture_drift_opportunities_invalid' using errcode = '22023';
    end;

    select count(*)::integer into v_bound_opportunities
    from jsonb_array_elements(coalesce(v_run.source_manifest->'opportunity_bindings', '[]'::jsonb)) as opportunity_entries(opportunity_value)
    where jsonb_extract_path_text(opportunity_value, 'surface') = new.surface;

    if v_opportunities <> v_bound_opportunities
       or v_opportunities < coalesce((v_run.policy->>'min_unique_evidence')::integer, 2) then
      raise exception 'capture_drift_opportunities_not_exactly_bound' using errcode = '22023';
    end if;

    return new;
  end if;

  -- Evidence-bearing types use a strict bijection: every source ID appears
  -- once, every line points to one of those IDs, and every line equals the
  -- non-secret frozen binding for that source.
  if jsonb_array_length(v_source_ids) = 0
     or jsonb_array_length(v_lines) <> jsonb_array_length(v_source_ids) then
    raise exception 'capture_proposal_evidence_shape_invalid:%', new.type using errcode = '22023';
  end if;
  if not (v_run.source_manifest->'evidence_ids' @> v_source_ids) then
    raise exception 'capture_proposal_source_not_in_manifest:%', new.type using errcode = '22023';
  end if;
  if (select count(distinct source_value #>> '{}') from jsonb_array_elements(v_source_ids) as source_entries(source_value))
       <> jsonb_array_length(v_source_ids) then
    raise exception 'capture_proposal_source_ids_not_unique:%', new.type using errcode = '22023';
  end if;
  if (select count(distinct jsonb_extract_path_text(line_value, 'sourceId')) from jsonb_array_elements(v_lines) as line_entries(line_value))
       <> jsonb_array_length(v_lines) then
    raise exception 'capture_proposal_lines_not_unique:%', new.type using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_source_ids) as source_entries(source_value)
    where jsonb_typeof(source_value) <> 'string' or length(source_value #>> '{}') not between 1 and 240
  ) then
    raise exception 'capture_proposal_source_id_invalid:%', new.type using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_source_ids) as source_entries(source_value)
    where not exists (
      select 1 from jsonb_array_elements(v_lines) as line_entries(line_value)
      where jsonb_extract_path_text(line_value, 'sourceId') = source_value #>> '{}'
    )
  ) then
    raise exception 'capture_proposal_source_line_bijection_invalid:%', new.type using errcode = '22023';
  end if;
  if exists (
       select 1 from jsonb_array_elements(v_lines) as line_entries(line_value)
       where jsonb_typeof(line_value) <> 'object'
          or jsonb_typeof(line_value->'sourceId') <> 'string'
          or jsonb_extract_path_text(line_value, 'surface') is distinct from new.surface
          or not (line_value ? 'quote')
          or line_value->'quote' <> 'null'::jsonb
          or not exists (
            select 1
            from jsonb_array_elements(coalesce(v_run.source_manifest->'evidence_bindings', '[]'::jsonb)) as binding_entries(binding_value)
            where jsonb_extract_path_text(binding_value, 'source_id') = jsonb_extract_path_text(line_value, 'sourceId')
              and jsonb_extract_path_text(binding_value, 'locator') is not distinct from jsonb_extract_path_text(line_value, 'locator')
              and jsonb_extract_path_text(binding_value, 'week') is not distinct from jsonb_extract_path_text(line_value, 'week')
              and jsonb_extract_path_text(binding_value, 'surface') is not distinct from jsonb_extract_path_text(line_value, 'surface')
              and jsonb_extract_path_text(binding_value, 'criterion_name') is not distinct from jsonb_extract_path_text(line_value, 'criterion')
              and jsonb_extract_path_text(binding_value, 'verdict') is not distinct from jsonb_extract_path_text(line_value, 'verdict')
              and jsonb_extract_path_text(binding_value, 'disposition') is not distinct from jsonb_extract_path_text(line_value, 'disposition')
           )
  ) then
    raise exception 'capture_proposal_line_binding_invalid:%', new.type using errcode = '22023';
  end if;

  if new.type = 'false_positive' then
    if v_criterion_id is null or v_criterion_name is null
       or jsonb_typeof(coalesce(new.evidence->'surfaces', 'null'::jsonb)) <> 'array'
       or jsonb_array_length(new.evidence->'surfaces') <> 1
       or new.evidence->'surfaces'->>0 <> new.surface
       or not exists (
         select 1
         from jsonb_array_elements(coalesce(v_run.source_manifest->'criteria', '[]'::jsonb)) as criteria_entries(criterion_value)
         where jsonb_extract_path_text(criterion_value, 'id') = v_criterion_id
           and jsonb_extract_path_text(criterion_value, 'surface') = new.surface
           and jsonb_extract_path_text(criterion_value, 'name') = v_criterion_name
       )
       or exists (
         select 1
         from jsonb_array_elements(v_lines) as line_entries(line_value)
         where jsonb_extract_path_text(line_value, 'verdict') <> 'breaks'
            or jsonb_extract_path_text(line_value, 'disposition') <> 'rejected'
            or not exists (
              select 1
              from jsonb_array_elements(coalesce(v_run.source_manifest->'evidence_bindings', '[]'::jsonb)) as binding_entries(binding_value)
              where jsonb_extract_path_text(binding_value, 'source_id') = jsonb_extract_path_text(line_value, 'sourceId')
                and jsonb_extract_path_text(binding_value, 'signal') = 'output'
                and jsonb_extract_path_text(binding_value, 'criterion_id') = v_criterion_id
            )
       ) then
      raise exception 'capture_false_positive_evidence_not_exactly_bound' using errcode = '22023';
    end if;
  elsif new.type = 'uncovered' then
    if new.evidence ? 'criterion_id'
       or new.evidence ? 'criterion_name'
       or new.evidence ? 'surfaces'
       or nullif(new.evidence->>'topic', '') is null
       or exists (
         select 1
         from jsonb_array_elements(v_lines) as line_entries(line_value)
         where jsonb_extract_path_text(line_value, 'verdict') <> 'uncovered'
            or not exists (
              select 1
              from jsonb_array_elements(coalesce(v_run.source_manifest->'evidence_bindings', '[]'::jsonb)) as binding_entries(binding_value)
              where jsonb_extract_path_text(binding_value, 'source_id') = jsonb_extract_path_text(line_value, 'sourceId')
                and jsonb_extract_path_text(binding_value, 'signal') = 'output'
            )
       ) then
      raise exception 'capture_uncovered_evidence_not_exactly_bound' using errcode = '22023';
    end if;
  else
    raise exception 'capture_proposal_type_invalid' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_capture_proposal_manifest() from public, anon, authenticated;

commit;
