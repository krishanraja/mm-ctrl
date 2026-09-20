# G25 both-generation correction R29 QA record

Status: local PostgreSQL cross-generation correction pass. No migration or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite canary passes.
- One legacy and one custody-native derivative are invalidated from one correction.
- One unrelated derivative in each generation remains current.
- Correction scope survives operator transfer because it binds stable custody.
- Deterministic payload-free events exist in both generations.
- Exact replay is idempotent and conflicting replay is denied.
- A custody-event failure rolls back the preceding legacy mutation and correction receipt.
- Superseded replacement authority, legacy owner smuggling and browser execution are denied.
- Three weakened SQL mutations fail the canary.
- The unchanged R12 and R25 gates pass beside R29.
- Strict lint and typecheck introduce no new errors.

## Residuals

- R12 remains callable as a legacy-only operation until an exact runtime cutover retires it.
- Invalidated derivatives are not regenerated automatically.
- Already delivered external copies are outside this database operation.
- Multi-connection correction races are untested.
- Supabase-local, PostgREST and production parity are untested.
- Both-generation subject erasure and unified reading remain incomplete.

No linked database, migration, runtime integration, legacy retirement, subject erasure, deployment, merge, release or external action is authorised.
