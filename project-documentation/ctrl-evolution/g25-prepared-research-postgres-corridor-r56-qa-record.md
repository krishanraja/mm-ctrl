# G25 prepared research PostgreSQL corridor R56 QA record

Status: local composed-corridor pass. No provider or live-database claim.

## Positive evidence

- Four PGlite integration tests pass in a Node-only Vitest environment.
- Event-before-receipt ordering fails closed.
- Exact R54 receipt and R55 accepted event commands persist.
- Receipt and event replay are idempotent.
- Changed outcome evidence under the same event identity conflicts.
- Stored rows exclude the raw provider request ID and outbound query.
- Rejected and outcome-unknown events persist with null provider identity.

## Residuals

- Provider dispatch, response parsing and public fetch are synthetic.
- Independent-connection races remain unproved.
- Supabase-local, PostgREST, linked database and production transport are untested.
- Expiry and provider-deletion operations are not composed.

No external request, linked database, migration, live route, deployment, merge or release is authorised.
