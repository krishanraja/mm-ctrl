-- G25 R76 hosted authenticated-outsider denial probe.
-- Apply only after the R76 dispatch probe in the named disposable branch.

grant authenticated to postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', '91bc3860-6f57-4a19-83f0-3062cefefa44', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"91bc3860-6f57-4a19-83f0-3062cefefa44","is_anonymous":false}',
  true
);

do $$
declare
  denied boolean := false;
begin
  begin
    perform private.brain_append_provider_deletion_dispatch_operator_event(jsonb_build_object(
      'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
      'event_id', '76000000-0000-4000-8900-000000000001'::uuid,
      'dispatch_id', '76000000-0000-4000-8600-000000000001'::uuid,
      'event_kind', 'operator_recovery_requested',
      'actor_cell', 'operator',
      'attempt', 1,
      'predecessor_event_id', '76000000-0000-4000-8800-000000000003'::uuid,
      'occurred_at', statement_timestamp() - interval '3 seconds',
      'result_receipt_sha256', null,
      'failure_code', null,
      'failure_evidence_sha256', null,
      'next_dispatch_id', null,
      'recovery_note_sha256', repeat('1', 64)
    ));
  exception when others then
    denied := sqlerrm = 'provider_deletion_dispatch_operator_custody_denied';
  end;
  if not denied then raise exception 'r76_outsider_not_denied'; end if;
end;
$$;

reset role;
revoke authenticated from postgres;

do $$
begin
  if exists (
    select 1 from private.brain_provider_deletion_dispatch_events
    where id = '76000000-0000-4000-8900-000000000001'::uuid
  ) then raise exception 'r76_outsider_event_was_written'; end if;
  if not exists (
    select 1 from private.brain_provider_deletion_dispatches
    where id = '76000000-0000-4000-8600-000000000001'::uuid
      and current_state = 'dead_lettered'
      and event_count = 3
  ) then raise exception 'r76_outsider_changed_dispatch'; end if;
end;
$$;
