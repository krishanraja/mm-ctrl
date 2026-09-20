# G25 prepared-receipt atomic store R10 QA record

Date: 17 September 2026

Verdict: `POSTGRESQL_WASM_PASS_LIVE_AUTHORITY_ADAPTERS_PENDING`

## Passed

- Candidate SQL remains outside `supabase/migrations`.
- PostgreSQL 18.3 creates the receipt, dependency and event schema and executes the store function.
- R7 TypeScript and SQL produce the same authority fingerprint.
- Exact replay converges and conflicting replay fails.
- Stale authority, future-observed authority, wrong purpose and an unmapped decision snapshot fail closed.
- Forced failure on the final event insert leaves no partial receipt or dependency.
- Exact member, audience and purpose read policy passes; authenticated write and function execution fail.
- Forced RLS, least-privilege grants and required scope and foreign-key indexes are read back from PostgreSQL.
- Two independent weakened-policy controls make the canary fail.
- The full fixture transaction rolls back with zero rows and no fixture table.
- No linked database, migration, runtime, deployment or customer data was used.

## Not proved

- Real currentness against canonical Brain item and external source rows.
- Workspace-bound authority for legacy decision cases and claims.
- Concurrent identical calls on a multi-connection PostgreSQL server.
- Supabase-local image, extension and PostgREST parity.
- Correction invalidation, erasure and delivery lifecycle transactions.
- A reviewed migration or any production readiness.

## Required next gate

Implement a fail-closed authority adapter against exact canonical Brain rows, prove its fingerprint and currentness behavior independently, and leave decision authority kinds disabled until their workspace and immutable-snapshot gaps are repaired.
