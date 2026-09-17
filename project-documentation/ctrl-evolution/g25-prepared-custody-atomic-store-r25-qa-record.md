# G25 prepared custody atomic store R25 QA record

Status: local PostgreSQL atomic-store pass. No migration or runtime claim.

## Positive evidence

- PostgreSQL 18.3 PGlite canary passes.
- R24 TypeScript and PostgreSQL authority fingerprints match.
- Exact create and replay pass.
- Ciphertext and encryption-version replay changes fail closed.
- Identity smuggling and stale authority fail closed.
- A forced accepted-event failure rolls back all three row families.
- A write after authorised operator transfer preserves the custody identity.
- Inactive custody blocks new writes.
- Both directions of legacy/custody receipt collision fail closed.
- The unchanged R10 writer remains operational for a non-conflicting legacy receipt.
- The seeded legacy receipt remains byte-equivalent.
- Wrong-purpose and revoked-role reads return zero rows.

## Negative controls

- Removing the authority-fingerprint check makes the canary fail.
- Removing the active-custody check makes the canary fail.

## Residuals

- The ciphertext is opaque to R25. A custody-native authenticated-encryption context is not yet proved.
- Only brain-item and external-source authority adapters are executable. Decision-case and decision-claim adapters remain closed.
- Correction, invalidation, erasure and unified reading do not yet cover the custody generation.
- Check-use concurrency across independent database connections is not proved.
- Supabase-local image, PostgREST, provider storage and production scale are untested.

No linked database, migration creation or execution, runtime producer, customer-facing UI, deployment, merge, release, external action or legacy retirement is authorised.
