# G25 stable-principal login removal R28 QA record

Status: local PostgreSQL and pure-planner pass. No deletion, transfer, migration or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite relationship canary passes.
- Thirteen deterministic planner cases pass.
- Stable subjects, stable operators, custody assignments, roles and grants are represented separately.
- A last custody route blocks auth deletion; an alternate login for the same operator does not change custody.
- A mixed personal-subject and customer-operator case preserves the personal Brain and requires customer custody action.
- The readback inventory is SHA-256 bound and closed to a versioned schema.
- PostgreSQL supplies the observation time; the caller cannot revive expired access by backdating the inventory.
- Revoked access is excluded and ordinary authenticated execution is denied.
- Strict lint and typecheck introduce no new errors.

## Residuals

- The proof plans removal but does not execute it.
- Readback and action must eventually share one transaction and revalidate the evidence hash.
- Multi-connection deletion and transfer races are untested.
- Supabase-local, Auth API, PostgREST and production parity are untested.
- Auth-link audit retention after external auth deletion is not yet specified.
- Both-generation correction, erasure and unified reading remain incomplete.

No linked database, authentication deletion, customer closure, transfer, subject erasure, migration, runtime integration, deployment, merge, release or external action is authorised.
