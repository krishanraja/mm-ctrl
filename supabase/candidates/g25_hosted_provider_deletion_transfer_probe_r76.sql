-- G25 R76 hosted custody-transfer recovery probe.
-- Apply only after the R76 owner probe in the named disposable branch.

insert into private.brain_provider_deletion_dispatches (
  id, schema_version, topology_sha256, target_cell, attempt,
  predecessor_dispatch_id, authority_token_sha256, envelope_sha256,
  workspace_id, receipt_id, handle_id, provider, job_id, operation,
  issued_at, expires_at, current_state, latest_event_id, event_count,
  automatic_terminal, operator_attention_required, closed
) values (
  '76000000-0000-4000-8600-000000000002'::uuid,
  'ctrl.provider-deletion-dispatch-record.r73',
  repeat('3', 64), 'deletion_worker', 1,
  null, repeat('4', 64), repeat('5', 64),
  '76000000-0000-4000-8000-000000000001'::uuid,
  '76000000-0000-4000-8100-000000000002'::uuid,
  '76000000-0000-4000-8200-000000000003'::uuid,
  'elevenlabs',
  '76000000-0000-4000-8700-000000000002'::uuid,
  'destroy',
  statement_timestamp() - interval '10 seconds',
  statement_timestamp() + interval '4 minutes',
  'dead_lettered',
  '76000000-0000-4000-8800-000000000006'::uuid,
  3, true, true, false
);

insert into private.brain_provider_deletion_dispatch_events (
  id, schema_version, dispatch_id, event_kind, actor_cell, attempt,
  predecessor_event_id, occurred_at, result_receipt_sha256, failure_code,
  failure_evidence_sha256, next_dispatch_id, recovery_note_sha256
) values
  (
    '76000000-0000-4000-8800-000000000004'::uuid,
    'ctrl.provider-deletion-dispatch-event.r71',
    '76000000-0000-4000-8600-000000000002'::uuid,
    'dispatched', 'authority_issuer', 1, null,
    statement_timestamp() - interval '8 seconds',
    null, null, null, null, null
  ),
  (
    '76000000-0000-4000-8800-000000000005'::uuid,
    'ctrl.provider-deletion-dispatch-event.r71',
    '76000000-0000-4000-8600-000000000002'::uuid,
    'failed_terminal', 'deletion_worker', 1,
    '76000000-0000-4000-8800-000000000004'::uuid,
    statement_timestamp() - interval '7 seconds',
    null, 'provider_timeout', repeat('6', 64), null, null
  ),
  (
    '76000000-0000-4000-8800-000000000006'::uuid,
    'ctrl.provider-deletion-dispatch-event.r71',
    '76000000-0000-4000-8600-000000000002'::uuid,
    'dead_lettered', 'authority_issuer', 1,
    '76000000-0000-4000-8800-000000000005'::uuid,
    statement_timestamp() - interval '6 seconds',
    null, null, null, null, null
  );

grant service_role to postgres;
set local role service_role;
select private.brain_transfer_workspace_custody(
  '76000000-0000-4000-8000-000000000001'::uuid,
  (
    select operator_principal_id
    from private.brain_operator_auth_links
    where user_id = 'f99bf02f-e42b-41f0-bcbc-70810eb44186'::uuid
      and revoked_at is null
  ),
  (
    select operator_principal_id
    from private.brain_operator_auth_links
    where user_id = '2129faf1-76bf-4476-8c30-3793a3265bbd'::uuid
      and revoked_at is null
  ),
  repeat('7', 64),
  statement_timestamp() - interval '1 second'
);
reset role;
revoke service_role from postgres;

grant authenticated to postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f99bf02f-e42b-41f0-bcbc-70810eb44186', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"f99bf02f-e42b-41f0-bcbc-70810eb44186","is_anonymous":false}',
  true
);

do $$
declare
  denied boolean := false;
begin
  begin
    perform private.brain_append_provider_deletion_dispatch_operator_event(jsonb_build_object(
      'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
      'event_id', '76000000-0000-4000-8900-000000000003'::uuid,
      'dispatch_id', '76000000-0000-4000-8600-000000000002'::uuid,
      'event_kind', 'operator_recovery_requested',
      'actor_cell', 'operator',
      'attempt', 1,
      'predecessor_event_id', '76000000-0000-4000-8800-000000000006'::uuid,
      'occurred_at', statement_timestamp(),
      'result_receipt_sha256', null,
      'failure_code', null,
      'failure_evidence_sha256', null,
      'next_dispatch_id', null,
      'recovery_note_sha256', repeat('8', 64)
    ));
  exception when others then
    denied := sqlerrm = 'provider_deletion_dispatch_operator_custody_denied';
  end;
  if not denied then raise exception 'r76_previous_custodian_not_denied'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '2129faf1-76bf-4476-8c30-3793a3265bbd', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"2129faf1-76bf-4476-8c30-3793a3265bbd","is_anonymous":false}',
  true
);
select private.brain_append_provider_deletion_dispatch_operator_event(jsonb_build_object(
  'schema_version', 'ctrl.provider-deletion-dispatch-event.r71',
  'event_id', '76000000-0000-4000-8900-000000000004'::uuid,
  'dispatch_id', '76000000-0000-4000-8600-000000000002'::uuid,
  'event_kind', 'operator_recovery_requested',
  'actor_cell', 'operator',
  'attempt', 1,
  'predecessor_event_id', '76000000-0000-4000-8800-000000000006'::uuid,
  'occurred_at', statement_timestamp(),
  'result_receipt_sha256', null,
  'failure_code', null,
  'failure_evidence_sha256', null,
  'next_dispatch_id', null,
  'recovery_note_sha256', repeat('9', 64)
));
reset role;
revoke authenticated from postgres;

do $$
begin
  if not exists (
    select 1
    from private.brain_custody_principals custody
    join private.brain_custody_assignments assignment
      on assignment.custody_principal_id = custody.id
      and assignment.ended_at is null
    join private.brain_operator_auth_links auth_link
      on auth_link.operator_principal_id = assignment.operator_principal_id
      and auth_link.revoked_at is null
    where custody.workspace_id = '76000000-0000-4000-8000-000000000001'::uuid
      and auth_link.user_id = '2129faf1-76bf-4476-8c30-3793a3265bbd'::uuid
  ) then raise exception 'r76_replacement_custody_missing'; end if;
  if not exists (
    select 1 from private.brain_provider_deletion_dispatches
    where id = '76000000-0000-4000-8600-000000000002'::uuid
      and current_state = 'operator_recovery_requested'
      and event_count = 4
  ) then raise exception 'r76_replacement_recovery_missing'; end if;
end;
$$;
