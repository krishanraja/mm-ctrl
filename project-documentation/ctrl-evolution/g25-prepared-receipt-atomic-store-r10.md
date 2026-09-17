# G25 prepared-receipt atomic store, R10

Status: `postgresql_wasm_atomic_store_pass_live_authority_adapters_pending`

Machine record: [g25-prepared-receipt-atomic-store-r10.json](g25-prepared-receipt-atomic-store-r10.json)

## What is now real

R10 joins the three preceding safety boundaries into one disposable PostgreSQL transaction:

- R7 scope and typed authority dependencies;
- R8 exact workspace, audience and purpose reads;
- R9 encrypted prepared-receipt custody.

The candidate stores one encrypted receipt, its typed authority dependencies and one payload-free acceptance event. A forced failure on the last insert leaves none of the three. Exact replay returns the original receipt without another row. The same identity with changed content or authority fails with a conflict.

The database independently rebuilds the R7 authority fingerprint from normalized dependencies. The harness proves that result is byte-identical to the TypeScript algorithm. It then weakens the fingerprint check and the current-authority check separately; the same test fails in both cases.

## Deliberately closed authority seam

The authority adapter returns false by default. Tests replace it only inside a rolled-back fixture transaction.

This is not ceremony. `brain_item_version` and external Brain sources have a plausible route to canonical currentness. Legacy `decision_cases` and `decision_claims` do not yet carry a Brain workspace or immutable snapshot fingerprint. Treating `user_id` as if it were a workspace would manufacture authority. R10 rejects those kinds until that gap is repaired.

The fixture table is test scaffolding, not a proposed authority registry and not a second Brain.

## Exact proof

On exact-pinned PGlite 0.5.8, PostgreSQL 18.3 proves:

- one receipt, one dependency and one event commit together;
- exact replay is idempotent;
- conflicting replay leaves the original untouched;
- the R7 fingerprint is recomputed, not trusted;
- stale, future-observed, cross-purpose and unmapped dependencies fail closed;
- a forced final-write failure rolls back the whole bundle;
- ordinary authenticated callers can neither invoke the function nor write directly;
- only a non-anonymous member with the exact audience and purpose grant can read;
- all three tables force RLS, the service role has no update or delete grant, and required scope and foreign-key indexes exist;
- rollback leaves zero fixture or row residue.

## Honest boundary

R10 is not a migration. It has no runtime caller and no live authority adapter. PGlite is single-connection, so it cannot prove concurrent replay convergence. Supabase-local image, extension and PostgREST parity remain pending while Docker and Podman are unavailable. Correction invalidation and erasure are still separate required transactions.

The next safe build step is the real current-authority adapter for canonical Brain item versions and external source receipts, with decision rows kept closed until their workspace-bound snapshot authority is designed.
