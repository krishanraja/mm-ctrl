# G25 exact-purpose RLS canary, R8

Status: `candidate_static_pass_execution_blocked`

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

## Current verification boundary

The contract and SQL structure pass static checks. PostgreSQL execution is not claimed. The local Supabase CLI cannot inspect or start its database because neither Docker nor Podman is available on this machine's path.

No linked or production database was used as a substitute. That would turn a local proof into an external schema risk.

The encryption-context extension remains closed until this canary executes successfully against a disposable local database.
