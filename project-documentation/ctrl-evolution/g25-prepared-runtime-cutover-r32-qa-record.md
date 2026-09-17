# G25 prepared runtime privilege cutover R32 QA record

Status: local PostgreSQL privilege-cutover pass. No migration or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite canary passes.
- Three legacy-only service function grants are absent and executable calls are denied.
- Four active service function grants are present and calls reach their own strict shape contracts.
- Four active entrypoints are security definers with fixed empty search paths.
- Eight raw prepared-table insert privileges are absent.
- Five direct lifecycle-update privileges are absent.
- Historical objects remain present for unified reading and both-generation lifecycle operations.
- Seven weakened SQL mutations fail the canary.
- Strict lint passes for changed scripts. Typecheck remains at the accepted 94-error baseline with no new failures, and the full 1,438-test unit suite passes.

## Residuals

- Valid create, correction, erasure and read operations through the final service boundary are not yet executed in one end-to-end canary.
- Application callers are not inventoried or switched by this candidate.
- Physical removal timing for historical functions remains unresolved.
- Multi-connection lifecycle races are untested.
- Supabase-local, PostgREST and production parity are untested.

No linked database, migration, runtime integration, physical retirement, deployment, merge, release or external action is authorised.
