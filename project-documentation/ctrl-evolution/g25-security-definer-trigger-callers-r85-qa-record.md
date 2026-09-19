# G25 trigger-only privileged callers R85 QA record

## Caller proof

- Current repository runtime references: 0.
- Active deployed Edge Functions inspected: 183.
- Retrieval errors after bounded retry: 0.
- Deployed source references: 0.
- Raw deployed source committed: no.
- Enabled production trigger attachments: 23.
- Enabled recovery preflight attachments: 22.
- Missing recovery attachment: `auth.users:on_auth_user_created`.
- Functions with attachments: 11 of 15.
- Additional internal function callers: 1.
- Unattached and unreferenced retirement candidates: 3.

## Candidate proof

- Exact functions: 15.
- Ordinary-role revokes: 15.
- Service-role grants: 15.
- Function definition changes: 0.
- Trigger object changes: 0.
- Function invocations: 0.
- Production writes: zero.

## Open proof

- The missing Auth signup hook must be restored and runtime-tested first.
- Isolated ACL verification has not yet run.
- Trigger runtime smoke has not yet run.
- Historical external dependency absence is not proved.
- Retirement is not authorised.

## Verdict

`TRIGGER_CALLERS_RESOLVED_CANDIDATE_READY_FOR_ISOLATED_TEST`
