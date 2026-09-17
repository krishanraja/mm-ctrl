# G25 exact-purpose RLS canary R8 QA

Date: 17 September 2026

Verdict: `STATIC_PASS_DATABASE_EXECUTION_BLOCKED`

## Passed

- The SQL is a database test, not a migration.
- The entire candidate is bounded by `begin` and `rollback`.
- The policy requires non-anonymous authentication, exact workspace membership, exact user, exact audience, exact purpose, active grant and unexpired grant.
- Fixtures isolate purpose from workspace and audience so a false pass cannot be explained by a different boundary.
- Grant-without-membership, anonymous-auth and authenticated-write denial are explicit.
- A deterministic checker pins these clauses and the no-external-action boundary.

## Not proved

`npx supabase status -o env` failed because no Docker or Podman executable is available. The candidate has therefore not run in PostgreSQL and cannot yet close `R6-BLOCK-PURPOSE-ENFORCEMENT`.

Required local command when a container runtime is available:

`npx supabase test db supabase/tests/database/g25_prepared_receipt_purpose_canary.test.sql --local`

No linked project, production database, migration or deployment was used.
