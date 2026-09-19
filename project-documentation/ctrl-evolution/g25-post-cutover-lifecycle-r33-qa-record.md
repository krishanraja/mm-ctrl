# G25 post-cutover lifecycle R33 QA record

Status: local PostgreSQL lifecycle pass. No concurrency, migration or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite canary passes through the exact R32 service boundary.
- The first current read returns two items: one retained legacy receipt and one custody-native receipt.
- The valid correction reports one legacy and one custody invalidation.
- The post-correction read returns zero items.
- A receipt using replacement authority is accepted and becomes the only current item.
- The valid erasure reports one legacy and two custody receipts erased.
- All three retained receipt identities have null payload bytes, null encryption versions, no dependencies and one final erased event.
- The final unified read reports `erased` and zero items.
- Correction and erasure exact replays are idempotent.
- Legacy-only execution, raw insert and raw lifecycle revival remain denied.
- Service, authenticated and anonymous function capabilities are read back after the lifecycle.
- Six weakened cutover mutations fail the complete canary.

## Residuals

- The proof uses one PGlite connection and cannot establish multi-connection race behavior.
- Transaction retries and serialization failures are not exercised.
- Application callers have not been inventoried or switched.
- Supabase-local, PostgREST and production parity remain untested.
- No migration has been authored or applied.

No linked database, application integration, migration, production write, deployment, merge, release or external action is authorised.
