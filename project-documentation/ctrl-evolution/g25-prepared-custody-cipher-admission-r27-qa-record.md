# G25 prepared custody cipher admission R27 QA record

Status: local PostgreSQL cipher-admission pass. No migration, key or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite canary passes.
- JavaScript and PostgreSQL R26 associated-data hashes match.
- A valid envelope stores atomically and decrypts after readback.
- Wrong context hash, version 1, extra field, wrong encryption version and malformed envelope are rejected.
- Context-hash and storage-version negative controls fail when their checks are removed.
- The unchanged R25 atomic-store gate passes beside R27.
- Strict lint introduces no new errors.

## Residuals

- The database cannot and should not decrypt the payload.
- Existing custody rows would need migration-time preflight before enabling the trigger.
- KMS, runtime production, rotation operations, multi-connection races and production observability are untested.
- Correction, erasure, unified reading, storage providers and principal-removal execution remain incomplete.

No linked database, migration, key access, runtime integration, deployment, merge, release or external action is authorised.
