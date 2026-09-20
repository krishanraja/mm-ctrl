-- G25 R76 hosted custom-role and lifecycle probe.
-- Apply only after R73 in the named disposable Supabase branch.
-- This fixture writes synthetic rows and is not a product migration.

grant service_role to postgres;
grant provider_dispatch_issuer to postgres;
grant provider_deletion_worker to postgres;

set local role service_role;
select private.brain_record_provider_exchange(jsonb_build_object(
  'schema_version', 'ctrl.provider-exchange-receipt.r51',
  'receipt_id', '76000000-0000-4000-8100-000000000002'::uuid,
  'workspace_id', '76000000-0000-4000-8000-000000000001'::uuid,
  'provider', 'elevenlabs',
  'processor_kind', 'audio',
  'callsite', 'supabase/functions/generate-tts/index.ts',
  'purpose_family', 'briefing_and_coaching',
  'data_classes', jsonb_build_array('public_web_content'),
  'request_sha256', repeat('9', 64),
  'idempotency_key_sha256', repeat('a', 64),
  'query_minimization_sha256', null,
  'control_mode', 'public_policy_default',
  'control_evidence_sha256', repeat('b', 64),
  'occurred_at', statement_timestamp() - interval '20 seconds'
));
reset role;

set local role provider_dispatch_issuer;
select private.brain_record_provider_deletion_dispatch(jsonb_build_object(
  'schema_version', 'ctrl.provider-deletion-dispatch-record.r73',
  'dispatch_id', '76000000-0000-4000-8600-000000000001'::uuid,
  'topology_sha256', repeat('c', 64),
  'target_cell', 'deletion_worker',
  'attempt', 1,
  'predecessor_dispatch_id', null,
  'authority_token_sha256', repeat('d', 64),
  'envelope_sha256', repeat('e', 64),
  'workspace_id', '76000000-0000-4000-8000-000000000001'::uuid,
  'receipt_id', '76000000-0000-4000-8100-000000000002'::uuid,
  'handle_id', '76000000-0000-4000-8200-000000000002'::uuid,
  'provider', 'elevenlabs',
  'job_id', '76000000-0000-4000-8700-000000000001'::uuid,
  'operation', 'destroy',
  'issued_at', statement_timestamp() - interval '10 seconds',
  'expires_at', statement_timestamp() + interval '4 minutes'
));
select private.brain_append_provider_deletion_dispatch_issuer_event(jsonb_build_object(
  'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
  'event_id', '76000000-0000-4000-8800-000000000001'::uuid,
  'dispatch_id', '76000000-0000-4000-8600-000000000001'::uuid,
  'event_kind', 'dispatched',
  'actor_cell', 'authority_issuer',
  'attempt', 1,
  'predecessor_event_id', null,
  'occurred_at', statement_timestamp() - interval '8 seconds',
  'result_receipt_sha256', null,
  'failure_code', null,
  'failure_evidence_sha256', null,
  'next_dispatch_id', null,
  'recovery_note_sha256', null
));
reset role;

set local role provider_deletion_worker;
select private.brain_append_provider_deletion_dispatch_worker_event(jsonb_build_object(
  'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
  'event_id', '76000000-0000-4000-8800-000000000002'::uuid,
  'dispatch_id', '76000000-0000-4000-8600-000000000001'::uuid,
  'event_kind', 'failed_terminal',
  'actor_cell', 'deletion_worker',
  'attempt', 1,
  'predecessor_event_id', '76000000-0000-4000-8800-000000000001'::uuid,
  'occurred_at', statement_timestamp() - interval '7 seconds',
  'result_receipt_sha256', null,
  'failure_code', 'provider_timeout',
  'failure_evidence_sha256', repeat('f', 64),
  'next_dispatch_id', null,
  'recovery_note_sha256', null
));
reset role;

set local role provider_dispatch_issuer;
select private.brain_append_provider_deletion_dispatch_issuer_event(jsonb_build_object(
  'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
  'event_id', '76000000-0000-4000-8800-000000000003'::uuid,
  'dispatch_id', '76000000-0000-4000-8600-000000000001'::uuid,
  'event_kind', 'dead_lettered',
  'actor_cell', 'authority_issuer',
  'attempt', 1,
  'predecessor_event_id', '76000000-0000-4000-8800-000000000002'::uuid,
  'occurred_at', statement_timestamp() - interval '6 seconds',
  'result_receipt_sha256', null,
  'failure_code', null,
  'failure_evidence_sha256', null,
  'next_dispatch_id', null,
  'recovery_note_sha256', null
));
reset role;

do $$
declare
  dispatch private.brain_provider_deletion_dispatches%rowtype;
begin
  select * into dispatch
  from private.brain_provider_deletion_dispatches
  where id = '76000000-0000-4000-8600-000000000001'::uuid;
  if dispatch.current_state <> 'dead_lettered'
    or dispatch.event_count <> 3
    or dispatch.closed
    or not dispatch.automatic_terminal
    or not dispatch.operator_attention_required
  then raise exception 'r76_dispatch_projection_invalid'; end if;
end;
$$;

revoke service_role from postgres;
revoke provider_dispatch_issuer from postgres;
revoke provider_deletion_worker from postgres;
