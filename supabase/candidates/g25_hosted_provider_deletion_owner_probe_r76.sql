-- G25 R76 hosted current-custodian recovery probe.
-- Apply only after the R76 outsider probe in the named disposable branch.

grant authenticated to postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f99bf02f-e42b-41f0-bcbc-70810eb44186', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f99bf02f-e42b-41f0-bcbc-70810eb44186","is_anonymous":false}',
  true
);

select private.brain_append_provider_deletion_dispatch_operator_event(jsonb_build_object(
  'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
  'event_id', '76000000-0000-4000-8900-000000000002'::uuid,
  'dispatch_id', '76000000-0000-4000-8600-000000000001'::uuid,
  'event_kind', 'operator_recovery_requested',
  'actor_cell', 'operator',
  'attempt', 1,
  'predecessor_event_id', '76000000-0000-4000-8800-000000000003'::uuid,
  'occurred_at', statement_timestamp() - interval '2 seconds',
  'result_receipt_sha256', null,
  'failure_code', null,
  'failure_evidence_sha256', null,
  'next_dispatch_id', null,
  'recovery_note_sha256', repeat('2', 64)
));

reset role;
revoke authenticated from postgres;

do $$
begin
  if not exists (
    select 1 from private.brain_provider_deletion_dispatches
    where id = '76000000-0000-4000-8600-000000000001'::uuid
      and current_state = 'operator_recovery_requested'
      and event_count = 4
      and automatic_terminal
      and operator_attention_required
      and not closed
  ) then raise exception 'r76_owner_recovery_projection_invalid'; end if;
end;
$$;
