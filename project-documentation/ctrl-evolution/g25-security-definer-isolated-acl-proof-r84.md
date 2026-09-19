# G25 isolated privileged ACL proof R84

**Status:** The first least-privilege ACL candidate passed in the approved blank recovery project. Production is unchanged.

## Proven

The recovery project began with the exact R82 exposure state: 45 ordinary-role executable privileged functions and exposure digest `e2917473e664296685ec4975f658ca3b`.

After the narrow R83 migration:

- all nine target functions deny `anon`;
- all nine deny `authenticated`;
- all nine retain `service_role` execution;
- all nine retain owner execution;
- all nine routine definitions retain their production digest;
- all eleven database-definition callers of `sync_lead_to_sheets` remain present.

The Supabase security advisor changed by exactly the candidate scope: anonymous privileged-function findings fell from 41 to 32 and authenticated findings fell from 45 to 36. The unrelated RLS and extension findings did not move.

## Verification correction

The first read-only verification query failed because its internal-caller scan asked `pg_get_functiondef` to inspect an aggregate. The migration itself had already succeeded. The verifier was corrected to limit that scan to ordinary functions, then passed. The failed query changed nothing.

This matters because a clean result is not enough. The proof must also show how it recovered when its own test machinery was wrong.

## Production boundary

A post-test production readback still shows all nine original anonymous and authenticated grants, all nine service grants and all nine original definition digests. Production writes remain zero.

## What remains

This proves the ACL mechanism, not the whole privileged surface. Thirty-two anonymous and 36 authenticated privileged functions remain in the isolated project. The next safe lane is direct execution on trigger-returning functions, followed by the anonymous-read routes and behavioral ownership tests for the current authenticated product routes.
