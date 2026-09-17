# G25 exact-purpose RLS canary, R8

Status: `postgresql_wasm_pass_supabase_local_parity_pending`

Machine record: [g25-exact-purpose-rls-canary-r8.json](g25-exact-purpose-rls-canary-r8.json)

Candidate SQL: [g25_prepared_receipt_purpose_canary.test.sql](../../supabase/tests/database/g25_prepared_receipt_purpose_canary.test.sql)

Verification: [G25 exact-purpose RLS R8 QA](g25-exact-purpose-rls-canary-r8-qa-record.md)

## What the canary proves when executed

The test creates a disposable receipt table inside one transaction, enables and forces RLS, grants authenticated users read-only access and installs one candidate policy. A row is visible only when all of the following match:

- the session is authenticated and non-anonymous;
- the user has an active role in the row's exact workspace;
- the user has an active, unexpired audience grant;
- the grant audience equals the row audience;
- the grant purpose equals the row purpose.

Two users receive the same workspace and audience but different purposes. Each must see only the matching row. A purpose grant without workspace membership, anonymous-auth access and authenticated writes must all fail closed.

The complete test is wrapped in `begin` and `rollback`. It is deliberately stored under database tests, not migrations.

## Runtime proof

The exact SQL now passes on PostgreSQL 18.3 through pinned `@electric-sql/pglite@0.5.8` under a non-owner `authenticated` role. The readback proves:

- each same-workspace, same-audience user sees only the row matching their granted purpose;
- grant without membership reads zero rows;
- anonymous-auth reads zero rows;
- authenticated writes fail;
- the test table and fixture users leave zero residue after rollback.

The durable harness also removes only the purpose predicate and reruns the same canary. That weakened policy fails at the expected cross-purpose assertion. This proves the test detects the boundary rather than merely completing.

No linked or production database was used. Full Supabase-local image and PostgREST parity remain pending because Docker and Podman are unavailable. R7 and R9 may proceed into a non-migration schema and transaction candidate; migration or runtime integration remains closed until that parity test passes.

Primary references: [Supabase row level security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api), [PGlite](https://pglite.dev/docs/) and [PGlite API](https://pglite.dev/docs/api).
