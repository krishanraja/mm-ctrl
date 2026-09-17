# G25 SECURITY DEFINER exposure R82 QA record

## Database evidence

- The read-only R82 probe inspected `pg_proc`, ACL metadata and boolean markers derived inside PostgreSQL.
- It returned no routine body and no application row.
- Production and the first blank replay both returned exposure digest `e2917473e664296685ec4975f658ca3b`.
- Both environments contain 45 ordinary-role executable `SECURITY DEFINER` functions: 41 anonymous, 45 authenticated and 39 inherited from `PUBLIC`.
- Fifteen return `trigger`; 30 are normal callable functions; 26 of those are anonymous.
- Twenty normal callable functions contain a write marker.
- Nine anonymous normal callable functions contain a write marker and no visible identity or role guard.
- Eight anonymous normal callable functions contain no write marker and no visible identity or role guard.

## Repository caller evidence

- Fourteen functions have current runtime references outside generated Supabase types.
- All thirteen functions with an `auth.uid()` marker have current runtime references.
- `get_pending_verifications(uuid)` is the additional current runtime function in the anonymous-read lane.
- None of the nine highest-risk anonymous writers has an actual current runtime reference.
- Six highest-risk names appear only in generated TypeScript definitions; three are absent from the current repository.

Repository absence does not cover old deployments, schedules, webhooks or live-only Edge Functions. No function is marked unused or safe from this scan.

## Security interpretation

`SECURITY DEFINER` runs with the function owner's privilege and can bypass normal row policy behavior. `EXECUTE` granted to `PUBLIC`, `anon` or `authenticated` can therefore turn a routine into a privileged API surface. A visible `auth.uid()` check is useful evidence but does not prove complete ownership or lifecycle enforcement.

## Verdict

`EXPOSURE_PROVED_DISPOSITION_AND_MUTATION_BLOCKED`

No routine was called. No grant, function, policy, schema or production row changed.
