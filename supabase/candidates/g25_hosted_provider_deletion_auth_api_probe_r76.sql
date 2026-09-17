-- G25 R76 hosted Auth and Data API probe fixture.
-- Apply only inside the named disposable Supabase branch, then remove the branch.
-- The public wrapper exists only to prove a real JWT reaches the private R75 gate.

insert into private.brain_provider_deletion_dispatches (
  id, schema_version, topology_sha256, target_cell, attempt,
  predecessor_dispatch_id, authority_token_sha256, envelope_sha256,
  workspace_id, receipt_id, handle_id, provider, job_id, operation,
  issued_at, expires_at, current_state, latest_event_id, event_count,
  automatic_terminal, operator_attention_required, closed
) values (
  '76000000-0000-4000-8600-000000000003'::uuid,
  'ctrl.provider-deletion-dispatch-record.r73',
  repeat('a', 64), 'deletion_worker', 1,
  null, repeat('b', 64), repeat('c', 64),
  '76000000-0000-4000-8000-000000000001'::uuid,
  '76000000-0000-4000-8100-000000000002'::uuid,
  '76000000-0000-4000-8200-000000000004'::uuid,
  'elevenlabs',
  '76000000-0000-4000-8700-000000000003'::uuid,
  'destroy',
  statement_timestamp() - interval '10 seconds',
  statement_timestamp() + interval '4 minutes',
  'dead_lettered',
  '76000000-0000-4000-8800-000000000009'::uuid,
  3, true, true, false
);

insert into private.brain_provider_deletion_dispatch_events (
  id, schema_version, dispatch_id, event_kind, actor_cell, attempt,
  predecessor_event_id, occurred_at, result_receipt_sha256, failure_code,
  failure_evidence_sha256, next_dispatch_id, recovery_note_sha256
) values
  (
    '76000000-0000-4000-8800-000000000007'::uuid,
    'ctrl.provider-deletion-dispatch-event.r71',
    '76000000-0000-4000-8600-000000000003'::uuid,
    'dispatched', 'authority_issuer', 1, null,
    statement_timestamp() - interval '8 seconds',
    null, null, null, null, null
  ),
  (
    '76000000-0000-4000-8800-000000000008'::uuid,
    'ctrl.provider-deletion-dispatch-event.r71',
    '76000000-0000-4000-8600-000000000003'::uuid,
    'failed_terminal', 'deletion_worker', 1,
    '76000000-0000-4000-8800-000000000007'::uuid,
    statement_timestamp() - interval '7 seconds',
    null, 'provider_timeout', repeat('d', 64), null, null
  ),
  (
    '76000000-0000-4000-8800-000000000009'::uuid,
    'ctrl.provider-deletion-dispatch-event.r71',
    '76000000-0000-4000-8600-000000000003'::uuid,
    'dead_lettered', 'authority_issuer', 1,
    '76000000-0000-4000-8800-000000000008'::uuid,
    statement_timestamp() - interval '6 seconds',
    null, null, null, null, null
  );

create or replace function public.r76_append_provider_deletion_operator_event(p_event jsonb)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.brain_append_provider_deletion_dispatch_operator_event(p_event)
$$;

revoke all on function public.r76_append_provider_deletion_operator_event(jsonb)
  from public, anon, service_role;
grant execute on function public.r76_append_provider_deletion_operator_event(jsonb)
  to authenticated;

notify pgrst, 'reload schema';
