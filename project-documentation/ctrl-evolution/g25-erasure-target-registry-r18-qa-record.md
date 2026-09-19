# G25 erasure-target registry R18 QA record

Date: 17 September 2026

## Runtime result

- `node scripts/run-ctrl-g25-erasure-target-registry-r18.mjs`
  - PASS in `@electric-sql/pglite@0.5.8`.
  - Eleven discovered relations.
  - Twenty-eight discovered constraints.
  - Twenty-eight matching registry entries.
  - Six entries correctly block execution.

## Negative controls

- one registry entry removed: failed as required;
- one stale registry entry added: failed as required;
- registered constrained columns changed: failed as required;
- unresolved registry marked ready: failed as required.

## Still unproved

- complete legacy-schema coverage;
- non-FK personal-data discovery;
- owner transfer, closure and orphan behavior;
- tombstone retention, expiry and re-consent behavior;
- runtime registry persistence and immutable review receipts;
- linked Supabase, PostgREST and concurrency parity;
- any deletion, migration, deployment, merge or customer-facing behavior.
