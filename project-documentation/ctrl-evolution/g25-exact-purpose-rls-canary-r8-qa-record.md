# G25 exact-purpose RLS canary R8 QA

Date: 17 September 2026

Verdict: `POSTGRESQL_WASM_PASS_SUPABASE_LOCAL_PARITY_PENDING`

## Passed

- The SQL is a database test, not a migration.
- The entire candidate is bounded by `begin` and `rollback`.
- The policy requires non-anonymous authentication, exact workspace membership, exact user, exact audience, exact purpose, active grant and unexpired grant.
- Fixtures isolate purpose from workspace and audience so a false pass cannot be explained by a different boundary.
- Grant-without-membership, anonymous-auth and authenticated-write denial are explicit.
- A deterministic checker pins these clauses and the no-external-action boundary.

## Runtime evidence

- Exact candidate SQL passed on PGlite 0.5.8, PostgreSQL 18.3.
- Execution used a non-owner `authenticated` role with Supabase-compatible `auth.uid()` and `auth.jwt()` test functions.
- Exact purpose, workspace membership, audience, anonymous-auth and write denial all passed.
- Transaction rollback left no test table and no fixture users.
- A negative control removing only the purpose equality failed at the expected cross-purpose assertion.
- The dependency is exact-pinned and `npm audit` reports no vulnerability against PGlite itself.

## Not proved

The local Supabase CLI still cannot start because no Docker or Podman executable is available. Full Supabase image, extension and PostgREST parity remain pending.

Required local command when a container runtime is available:

`npx supabase test db supabase/tests/database/g25_prepared_receipt_purpose_canary.test.sql --local`

No linked project, production database, migration or deployment was used. The repository's existing dependency audit findings remain separate and were not auto-fixed.
