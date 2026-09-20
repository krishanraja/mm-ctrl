# G25 auth-reachable schema discovery R17 QA record

Date: 17 September 2026

## Runtime result

- `node scripts/run-ctrl-g25-auth-reachable-discovery-r17.mjs`
  - PASS in `@electric-sql/pglite@0.5.8`.
  - Eleven expected public relations discovered.
  - Transitive depth proved through `brain_prepared_receipt_dependencies`.
  - Security invoker, stable volatility, empty search path and narrow execution privileges read back from `pg_proc`.
  - Private-schema canary excluded.

## Negative controls

- public-schema filter removed: failed as required;
- recursive discovery disabled: failed as required;
- authenticated execution opened: failed as required.

## Current platform check

The current Supabase changelog shows the hosted and self-hosted platform on PostgreSQL 17, with no catalog change that invalidates this standard `pg_catalog` approach. Linked Supabase parity remains separately unproved.

## Still unproved

- the complete live repository migration history applied as one database;
- non-FK personal-data discovery;
- reviewed classification of each relation;
- drift comparison against an approved registry;
- live Supabase, PostgREST and concurrency parity;
- any deletion, deployment, merge or customer-facing behavior.
