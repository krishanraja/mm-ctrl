-- Standard-change source drift is a product-domain conflict, not a retryable
-- PostgreSQL serialization failure. Keep it fast and explicit at the Edge.
begin;

create or replace function public.assert_standard_change_source_current(p_request public.standard_change_requests)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_artifact public.generated_artifacts%rowtype;
  v_latest public.generated_artifacts%rowtype;
  v_sha text;
  v_manifest jsonb;
  v_current_criteria jsonb;
begin
  select * into v_artifact from public.generated_artifacts
  where id = p_request.source_standard_artifact_id and user_id = p_request.user_id and kind = 'standard';
  if not found then raise exception 'standard_change_source_missing' using errcode = 'P0001'; end if;
  v_sha := encode(extensions.digest(convert_to(v_artifact.body, 'UTF8'), 'sha256'), 'hex');
  if v_sha <> p_request.source_standard_sha256 then
    raise exception 'standard_change_source_hash_changed' using errcode = 'P0001';
  end if;
  select * into v_latest from public.generated_artifacts
  where user_id = p_request.user_id and kind = 'standard'
  order by created_at desc, id desc limit 1;
  if not found or v_latest.id <> p_request.source_standard_artifact_id
     or encode(extensions.digest(convert_to(v_latest.body, 'UTF8'), 'sha256'), 'hex') <> p_request.source_standard_sha256 then
    raise exception 'standard_change_source_stale' using errcode = 'P0001';
  end if;
  select cr.source_manifest into v_manifest
  from public.proposals p
  join public.capture_runs cr on cr.id = p.capture_run_id
  where p.id = p_request.proposal_id and p.user_id = p_request.user_id;
  if v_manifest is null or encode(extensions.digest(convert_to(v_manifest::text, 'UTF8'), 'sha256'), 'hex') <> p_request.source_manifest_sha256 then
    raise exception 'standard_change_source_manifest_changed' using errcode = 'P0001';
  end if;
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
  into v_current_criteria
  from public.criteria c
  where c.user_id = p_request.user_id and c.is_current = true;
  if v_current_criteria <> coalesce(v_manifest->'criteria', '[]'::jsonb) then
    raise exception 'standard_change_criteria_stale' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'source_body', v_artifact.body,
    'current_standard_artifact_id', v_latest.id,
    'current_standard_sha256', p_request.source_standard_sha256
  );
end;
$$;

revoke all on function public.assert_standard_change_source_current(public.standard_change_requests) from public, anon, authenticated;

commit;
