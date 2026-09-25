-- R151.2: browsers may call only the Edge route. The database primitives are
-- service-only and receive the already verified actor identity from that route.

create or replace function private.brain_decision_set_verified_edge_actor(
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null then
    raise exception 'brain_decision_auth_required' using errcode = '42501';
  end if;
  perform set_config('request.jwt.claim.sub', p_actor_id::text, true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated')::text,
    true
  );
end;
$$;

create or replace function public.begin_brain_decision_reconstruction_service_v1(
  p_actor_id uuid,
  p_run_id uuid,
  p_question_id uuid,
  p_idempotency_key text,
  p_provider text,
  p_model_requested text,
  p_prompt_version text,
  p_schema_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.brain_decision_set_verified_edge_actor(p_actor_id);
  return public.begin_brain_decision_reconstruction_v1(
    p_run_id, p_question_id, p_idempotency_key, p_provider,
    p_model_requested, p_prompt_version, p_schema_version
  );
end;
$$;

create or replace function public.commit_brain_decision_reconstruction_candidate_service_v1(
  p_actor_id uuid,
  p_run_id uuid,
  p_candidate_id uuid,
  p_source_id uuid,
  p_assertion_id uuid,
  p_source_content_ciphertext text,
  p_assertion_ciphertext text,
  p_candidate_ciphertext text,
  p_evidence_refs jsonb,
  p_request_fingerprint_sha256 text,
  p_output_ciphertext text,
  p_output_sha256 text,
  p_model_returned text,
  p_provider_response_id text,
  p_pricing_version text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_microusd bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.brain_decision_set_verified_edge_actor(p_actor_id);
  return public.commit_brain_decision_reconstruction_candidate_v1(
    p_run_id, p_candidate_id, p_source_id, p_assertion_id,
    p_source_content_ciphertext, p_assertion_ciphertext, p_candidate_ciphertext,
    p_evidence_refs, p_request_fingerprint_sha256, p_output_ciphertext,
    p_output_sha256, p_model_returned, p_provider_response_id, p_pricing_version,
    p_input_tokens, p_output_tokens, p_estimated_cost_microusd
  );
end;
$$;

create or replace function public.finish_brain_decision_reconstruction_service_v1(
  p_actor_id uuid,
  p_run_id uuid,
  p_outcome text,
  p_output_ciphertext text,
  p_output_sha256 text,
  p_model_returned text,
  p_provider_response_id text,
  p_pricing_version text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_microusd bigint,
  p_error_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.brain_decision_set_verified_edge_actor(p_actor_id);
  return public.finish_brain_decision_reconstruction_v1(
    p_run_id, p_outcome, p_output_ciphertext, p_output_sha256,
    p_model_returned, p_provider_response_id, p_pricing_version,
    p_input_tokens, p_output_tokens, p_estimated_cost_microusd, p_error_code
  );
end;
$$;

revoke all on function private.brain_decision_set_verified_edge_actor(uuid)
  from public, anon, authenticated, service_role;

revoke all on function public.begin_brain_decision_reconstruction_v1(uuid, uuid, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.commit_brain_decision_reconstruction_candidate_v1(uuid, uuid, uuid, uuid, text, text, text, jsonb, text, text, text, text, text, text, integer, integer, bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.finish_brain_decision_reconstruction_v1(uuid, text, text, text, text, text, text, integer, integer, bigint, text)
  from public, anon, authenticated, service_role;

revoke all on function public.begin_brain_decision_reconstruction_service_v1(uuid, uuid, uuid, text, text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.commit_brain_decision_reconstruction_candidate_service_v1(uuid, uuid, uuid, uuid, uuid, text, text, text, jsonb, text, text, text, text, text, text, integer, integer, bigint)
  from public, anon, authenticated;
revoke all on function public.finish_brain_decision_reconstruction_service_v1(uuid, uuid, text, text, text, text, text, text, integer, integer, bigint, text)
  from public, anon, authenticated;

grant execute on function public.begin_brain_decision_reconstruction_service_v1(uuid, uuid, uuid, text, text, text, text, text)
  to service_role;
grant execute on function public.commit_brain_decision_reconstruction_candidate_service_v1(uuid, uuid, uuid, uuid, uuid, text, text, text, jsonb, text, text, text, text, text, text, integer, integer, bigint)
  to service_role;
grant execute on function public.finish_brain_decision_reconstruction_service_v1(uuid, uuid, text, text, text, text, text, text, integer, integer, bigint, text)
  to service_role;
