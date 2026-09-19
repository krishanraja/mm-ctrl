# G25 unified current prepared reader R31 QA record

Status: local PostgreSQL current-reader pass. No migration or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite canary passes.
- One service-only function reads current protected material across R10 legacy and R25 custody-native generations.
- Exact current material from both generations remains visible.
- Invalidated, expired, future-produced, authority-superseded and dependencyless material is absent.
- Erased standing is explicit and returns no protected material.
- Same-content receipts are not silently collapsed when their receipt identities differ.
- Reversing generation branches produces the same ordered receipt projection.
- Cross-workspace custody, inactive custody and extra legacy identity fail closed.
- Ordinary authenticated execution and all six raw prepared-table reads are revoked.
- Seven weakened SQL mutations fail the canary.
- Strict lint passes for changed scripts. Typecheck remains at the accepted 94-error baseline with no new failures, and the full 1,438-test unit suite passes.

## Residuals

- Existing service-role writer privileges can still bypass the reader through trusted internal code.
- R10 and R25 remain competing result-producing writers until an exact cutover retires the legacy path.
- The anti-revival tombstone retention, expiry and re-consent policy remains unresolved.
- Multi-connection read, correction and erasure races are untested.
- Authenticated API route behavior is outside this database function.
- Supabase-local, PostgREST and production parity are untested.

No linked database, migration, runtime integration, legacy retirement, deployment, merge, release or external action is authorised.
