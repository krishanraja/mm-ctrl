# G25 prepared-subject erasure, R13

Status: `postgresql_wasm_cryptographic_erasure_pass_reconsent_closed`

Machine record: [g25-prepared-subject-erasure-r13.json](g25-prepared-subject-erasure-r13.json)

## What is now real

R13 makes erasure materially different from hiding a row.

For one exact workspace and subject, a single transaction destroys prepared payload ciphertext and its encryption version, replaces original ingest and fingerprint values with receipt-specific tombstone material, deletes authority dependency links, deletes prior lifecycle hashes and leaves one payload-free erased event. A minimal workspace-subject tombstone records that erasure happened and how many prepared receipts were affected.

The store checks that tombstone before any replay or insert. The system therefore cannot quietly regenerate prepared intelligence for the erased subject.

## Why this uses a sealed privilege boundary

Ordinary prepared-receipt functions remain security invoker. Erasure is the narrow exception: it must update protected columns and delete dependency and event rows, but the service role should not receive those direct table powers.

The erasure function is therefore security definer, lives in the private schema, uses an empty search path, contains no dynamic SQL and is executable only by the service role. The harness verifies that the service role cannot directly update payload ciphertext or delete dependencies. Authenticated users cannot call the function.

## Failure restores everything

The proof forces the final erased-event insert to fail. PostgreSQL then restores the original ciphertext, encryption version, dependencies, accepted event and absence of a tombstone. There is no partial privacy claim.

Exact replay returns the original count. Conflicting reuse of the erasure identity fails. A second workspace for the same person remains untouched.

## Deliberately closed

R13 has no tombstone-clear operation. Re-consent is not a boolean toggle; it needs a separately designed human-authority ceremony before prepared intelligence can be rebuilt.

This proof also covers prepared-intelligence derivatives only. Canonical Brain sources, item versions, exports, logs, backups and third-party copies need their own complete deletion graph. R13 does not claim whole-Brain or provider-level erasure.

## Exact proof

On exact-pinned PGlite 0.5.8, PostgreSQL 18.3 proves:

- ciphertext and encryption version are destroyed;
- original ingest identity and content-linked fingerprints are replaced;
- authority dependencies and prior event hashes are deleted;
- one payload-free erasure event remains;
- a durable workspace-subject tombstone blocks silent recreation;
- the same subject in another workspace remains untouched;
- exact replay is idempotent and conflicting replay fails;
- a forced event failure rolls the full operation back;
- authenticated execution and direct mutation fail;
- the sealed definer boundary, forced RLS and absence of direct service mutation privileges are read back;
- three weakened controls make the canary fail;
- rollback leaves zero fixture residue.

## Honest boundary

PGlite cannot prove concurrent store-versus-erasure behavior across real connections. Supabase-local and PostgREST parity remain pending. R13 is not a migration and has no runtime caller.

The next safe build step is a complete deletion-coverage map for the canonical Brain and every export, cache, log and external destination. Re-consent remains closed until that map and its human-authority ceremony are designed.
