# G25 subject reconsent reservation R36 QA record

Status: local candidate verified on PostgreSQL-compatible PGlite 18.3. No authenticated-endpoint, new-scope, concurrency, migration or runtime claim.

## Evidence

- An erased workspace produced one accepted restart reservation.
- The prior erasure tombstone remained present.
- Neither the reserved workspace nor its custody principal was created.
- Exact replay returned idempotent standing.
- A transport retry with new receipt and scope IDs and a later timestamp converged on the first reservation.
- Conflicting replay, non-erased scope, wrong subject link, existing identity collision and old-scope reuse failed closed.
- Anonymous and authenticated execution remained closed.
- The service role could execute the definer but could not insert a raw reservation row.
- Forced RLS and four executable mutation controls passed.

## Residuals

- A real authenticated subject action is not captured or proved.
- Atomic creation of the new workspace, stable subject relation and custody scope is not specified.
- Production owner identity and personal-workspace constraints need explicit resolution before the creator can be designed honestly.
- Multi-connection races, Supabase-local behavior, PostgREST exposure and migration ordering remain unproved.
- Consent wording, controller policy and legal sufficiency remain outside this technical proof.

No tombstone clearing, scope creation, migration, linked database use, runtime integration, deployment, merge, release or external action is authorised.
