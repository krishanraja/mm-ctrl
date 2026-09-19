begin;

-- Carry the frozen applicable-review set into every stage packet. Drift is an
-- absence claim, so these opportunities are its provenance rather than cited
-- ledger lines.
create or replace function public.current_standard_change_packet(p_request public.standard_change_requests)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_request.id,
    'version', p_request.request_version,
    'request_hash', p_request.request_hash,
    'surface', p_request.surface,
    'accepted_scope', p_request.accepted_scope,
    'proposal', p_request.proposal_snapshot,
    'decision', p_request.decision_snapshot,
    'source', jsonb_build_object(
      'standard_artifact_id', p_request.source_standard_artifact_id,
      'standard_sha256', p_request.source_standard_sha256,
      'source_snapshot', p_request.source_snapshot,
      'source_manifest_sha256', p_request.source_manifest_sha256,
      'evidence_ids', coalesce(p_request.source_manifest->'evidence_ids', '[]'::jsonb),
      'evidence_bindings', coalesce(p_request.source_manifest->'evidence_bindings', '[]'::jsonb),
      'opportunity_bindings', coalesce(p_request.source_manifest->'opportunity_bindings', '[]'::jsonb),
      'criteria', coalesce(p_request.source_manifest->'criteria', '[]'::jsonb)
    )
  );
$$;

revoke all on function public.current_standard_change_packet(public.standard_change_requests) from public, anon, authenticated;

commit;
