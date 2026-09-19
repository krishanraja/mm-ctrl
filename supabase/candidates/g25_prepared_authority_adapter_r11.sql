-- G25 R11 current-authority adapter candidate.
-- This is a non-migration overlay for the R10 candidate.

create or replace function private.brain_authority_row_sha256(
  p_authority_kind text,
  p_projection jsonb
)
returns text
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select encode(
    sha256(convert_to(
      'brain-current-authority-r11' || chr(10) || p_authority_kind || chr(10) || private.brain_canonical_jsonb(p_projection),
      'UTF8'
    )),
    'hex'
  )
$$;

create or replace function private.brain_current_prepared_authority(
  p_authority_kind text,
  p_authority_record_id uuid,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_subject_id uuid,
  p_audience text,
  p_purpose text
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  authority_projection jsonb;
  authority_version text;
  authority_recorded_at timestamptz;
begin
  if p_purpose <> 'prepared_intelligence'
    or p_audience not in ('person_private', 'delivery_team_private')
  then return null; end if;

  if p_authority_kind = 'brain_item_version' then
    select
      jsonb_build_object(
        'id', version_row.id,
        'brain_item_id', version_row.brain_item_id,
        'workspace_id', version_row.workspace_id,
        'subject_id', version_row.subject_id,
        'version', version_row.version,
        'title', version_row.title,
        'meaning_ciphertext', version_row.meaning_ciphertext,
        'encryption_version', version_row.encryption_version,
        'human_views', version_row.human_views,
        'epistemic_basis', version_row.epistemic_basis,
        'maturity', version_row.maturity,
        'standing', version_row.standing,
        'audience', version_row.audience,
        'consequence_permission', version_row.consequence_permission,
        'applicability', version_row.applicability,
        'exclusions', version_row.exclusions,
        'evidence_quality', version_row.evidence_quality,
        'corroboration', version_row.corroboration,
        'recency', version_row.recency,
        'transfer', version_row.transfer,
        'human_confirmation', version_row.human_confirmation,
        'valid_from', version_row.valid_from,
        'valid_until', version_row.valid_until,
        'predecessor_version_id', version_row.predecessor_version_id,
        'superseded_by_version_id', version_row.superseded_by_version_id,
        'recorded_at', version_row.recorded_at,
        'created_by', version_row.created_by
      ),
      version_row.version::text,
      version_row.recorded_at
    into authority_projection, authority_version, authority_recorded_at
    from public.brain_item_versions version_row
    join public.brain_workspaces workspace_row on workspace_row.id = version_row.workspace_id
    where version_row.id = p_authority_record_id
      and version_row.workspace_id = p_workspace_id
      and workspace_row.owner_id = p_owner_id
      and version_row.subject_id = p_subject_id
      and version_row.audience = p_audience
      and version_row.standing in ('current', 'disputed')
      and version_row.valid_until is null
      and version_row.superseded_by_version_id is null
      and version_row.consequence_permission <> 'prohibited_in_context';
  elsif p_authority_kind = 'external_source_receipt' then
    select
      jsonb_build_object(
        'id', source_row.id,
        'workspace_id', source_row.workspace_id,
        'subject_id', source_row.subject_id,
        'source_type', source_row.source_type,
        'actor_user_id', source_row.actor_user_id,
        'speaker_label', source_row.speaker_label,
        'captured_at', source_row.captured_at,
        'purpose', source_row.purpose,
        'audience', source_row.audience,
        'retention_expires_at', source_row.retention_expires_at,
        'integrity_sha256', source_row.integrity_sha256,
        'external_locator', source_row.external_locator,
        'content_ciphertext', source_row.content_ciphertext,
        'encryption_version', source_row.encryption_version,
        'recorded_at', source_row.recorded_at,
        'created_by', source_row.created_by
      ),
      '1',
      source_row.recorded_at
    into authority_projection, authority_version, authority_recorded_at
    from public.brain_sources source_row
    join public.brain_workspaces workspace_row on workspace_row.id = source_row.workspace_id
    where source_row.id = p_authority_record_id
      and source_row.workspace_id = p_workspace_id
      and workspace_row.owner_id = p_owner_id
      and source_row.subject_id = p_subject_id
      and source_row.audience = p_audience
      and source_row.source_type = 'external'
      and source_row.purpose = 'prepared_intelligence'
      and source_row.integrity_sha256 is not null
      and nullif(btrim(source_row.external_locator), '') is not null
      and (source_row.retention_expires_at is null or source_row.retention_expires_at > now());
  else
    return null;
  end if;

  if authority_projection is null then return null; end if;

  return jsonb_build_object(
    'authority_kind', p_authority_kind,
    'authority_record_id', p_authority_record_id,
    'authority_version', authority_version,
    'authority_sha256', private.brain_authority_row_sha256(p_authority_kind, authority_projection),
    'recorded_at', authority_recorded_at,
    'workspace_id', p_workspace_id,
    'owner_id', p_owner_id,
    'subject_id', p_subject_id,
    'audience', p_audience,
    'purpose', p_purpose
  );
end;
$$;

create or replace function private.brain_prepared_authority_current(
  p_authority_kind text,
  p_authority_record_id uuid,
  p_authority_version text,
  p_authority_sha256 text,
  p_observed_at timestamptz,
  p_workspace_id uuid,
  p_owner_id uuid,
  p_subject_id uuid,
  p_audience text,
  p_purpose text
)
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  current_authority jsonb;
begin
  current_authority := private.brain_current_prepared_authority(
    p_authority_kind,
    p_authority_record_id,
    p_workspace_id,
    p_owner_id,
    p_subject_id,
    p_audience,
    p_purpose
  );
  return current_authority is not null
    and current_authority ->> 'authority_version' = p_authority_version
    and current_authority ->> 'authority_sha256' = p_authority_sha256
    and (current_authority ->> 'recorded_at')::timestamptz <= p_observed_at;
end;
$$;

revoke all on function private.brain_authority_row_sha256(text, jsonb) from public, anon, authenticated;
revoke all on function private.brain_current_prepared_authority(text, uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function private.brain_prepared_authority_current(text, uuid, text, text, timestamptz, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function private.brain_authority_row_sha256(text, jsonb) to service_role;
grant execute on function private.brain_current_prepared_authority(text, uuid, uuid, uuid, uuid, text, text) to service_role;
grant execute on function private.brain_prepared_authority_current(text, uuid, text, text, timestamptz, uuid, uuid, uuid, text, text) to service_role;
