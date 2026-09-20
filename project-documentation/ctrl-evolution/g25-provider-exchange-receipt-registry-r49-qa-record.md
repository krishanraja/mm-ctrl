# G25 provider exchange receipt registry R49 QA record

Status: local PostgreSQL registry pass. No migration or runtime claim.

## Positive evidence

- PostgreSQL 18.3 PGlite canary passes 12 checks.
- Private model input with contractual ZDR records successfully.
- The same private input under public-policy-only retention fails closed.
- Research with a private class fails; minimised public research records.
- Resend-style delivery retention records and reaches the expired terminal state.
- Exact replay is idempotent and terminal-state reopening fails.
- Forced RLS, function-only service writes and authenticated denial are read back from PostgreSQL.
- Schema inspection finds no raw payload or raw provider-request identifier columns.

## Residuals

- Single-process PGlite cannot prove independent-connection event ordering races.
- Supabase-local image, PostgREST, provider account controls and production scale are untested.
- No current provider caller creates these receipts yet.
- Query minimisation is represented by a digest but the typed constructor is the next gate.
- External-provider deletion and expiry still require provider-specific operations and verification evidence.

No live provider route, linked database, migration, production data, external send, deployment, merge, release or legacy retirement is authorised.
