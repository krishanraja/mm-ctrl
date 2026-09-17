# G25 atomic reconsented scope creation R38 QA record

Status: local transactional candidate verified on PostgreSQL-compatible PGlite 18.3. No multi-connection, migration, Supabase-local or production claim.

## Evidence

- One accepted reservation created one active personal workspace.
- The stable subject remained the same and the historical owner became a fresh workspace-scoped principal.
- The old erasure tombstone remained present.
- Subject owner access, operator access, private audience grant, custody principal and consent-backed custody assignment were created.
- Exact retry was idempotent and alternate consumption of the same consent failed.
- Missing erasure, inactive subject access, retired operator and reserved-identity collision failed closed.
- Authenticated execution and raw service insertion failed.
- Forced RLS, service-only execution and four mutation controls passed.

## Residuals

- PGlite cannot prove two real database connections racing for one reservation.
- The legacy personal-workspace constraint change requires full migration discovery and Supabase-local rehearsal.
- No Edge Function or application adapter composes R37, R36 and R38.
- Rate limiting, telemetry, rollback, PostgREST behavior and production monitoring remain unspecified.

No application caller, migration, linked database use, deployment, release, merge or external action is authorised.
