# G25 provider closure PostgreSQL R63 QA record

Status: local PostgreSQL proof passed. External runtime absent.

## Positive evidence

- Seven integration tests pass against PostgreSQL 18.3 PGlite.
- The table is append-only through a security-definer function with forced RLS.
- Public, anonymous and authenticated roles have no function or table authority.
- Service role has select and function execution but no table insert authority.
- Parent exchange row locking serializes same-exchange fact validation in one database.
- Exact receipt and operation identities are separate and compared across every immutable field.
- Stripe and Resend compound histories round-trip through PostgreSQL.
- The pure R62 evaluator accepts the Stripe facts read back from the database.

## Residuals

- Independent-connection races remain unproved.
- Supabase-local migration, PostgREST and policy parity remain unproved.
- The candidate does not derive obligations or completion receipts in SQL.
- Deletion handles, provider calls and provider receipt verification remain absent.
- Legal retention policy and duration remain unbound.
- The candidate is not a migration and is not authorized for linked or production use.

No provider call, linked database, live route edit, migration, deployment, merge or release is authorised.
