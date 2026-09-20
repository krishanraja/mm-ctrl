# G25 high-risk privileged callers R83 QA record

## Production evidence

- All 183 active deployed Edge Function bundles were retrieved and scanned transiently.
- Zero bundle retrieval errors remained after bounded retry.
- The first marker scan reported zero deployed references. R88 later corrected this to one literal RPC caller: `send-results-email` calls `sync_lead_to_sheets` with a service-role client.
- The ACL candidate retained `service_role`, so the corrected caller evidence does not invalidate the isolated permission result.
- No raw deployed source was written to Git.
- Database definition inspection found eleven internal callers of `sync_lead_to_sheets`.
- Cron inspection found two active owner-run jobs: the north-star snapshot at 06:00 daily and briefing feedback aggregation at 03:07 daily.
- `pg_stat_statements` had tracked top-level statements since 8 September 2026. It showed nine calls for each cron function and zero for the other seven targets.
- The statistics setting is `top`, so nested function calls are not expected to appear as separate counts.
- Production writes: zero.

## Candidate evidence

- The candidate names exactly nine existing signatures.
- It changes execution ACLs only.
- It revokes `PUBLIC`, `anon` and `authenticated` from every target.
- It retains explicit `service_role` execution.
- It does not create, replace, call, move or delete a function.
- The companion verification query checks privileges and definition digests without invoking a target.

## Open evidence

- The candidate has not yet been applied to the blank recovery project.
- Historical clients, third-party integrations and calls before the statement window remain outside the proof.
- No route has retirement approval.
- Production mutation remains blocked.

## Verdict

`CALLERS_RESOLVED_CANDIDATE_READY_FOR_ISOLATED_ACL_PROOF`
