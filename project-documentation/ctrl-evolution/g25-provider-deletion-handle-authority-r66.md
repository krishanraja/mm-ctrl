# G25 provider deletion-handle authority R66

**Status:** Operation-scoped authority is locally proved. Durable spend and database enforcement remain closed.

## What changed

R65 deliberately exposed an uncomfortable truth: its table lifecycle was sound, but a general service credential could still call every custody function. R66 replaces that implied power with two named capabilities:

- `provider_handle_crypto_writer` may register one exact R64 envelope digest. It cannot lease, decrypt or destroy.
- `provider_deletion_worker` may lease or destroy one exact handle for one exact job. It cannot register or list handles.

The caller cannot select its role. The requested operation determines the role before the canonical payload is signed.

## What the capability binds

Every authority binds one workspace, receipt, handle, provider, actor, job, operation, issue time and expiry. A registration also binds the ciphertext-envelope SHA-256. A lease binds a duration of no more than 300 seconds. A destruction binds either ElevenLabs exchange expiry or a referenced R63 success fact; Stripe account closure always requires a fact reference.

The authority expires within five minutes. It contains neither the raw provider handle nor the encrypted envelope. Unexpected payload fields are rejected, so a caller cannot smuggle either value into the signed object.

## Why this is not yet least privilege

The local HMAC proves integrity only to a runtime holding the authority key. R66 does not yet make PostgreSQL verify that signature, record one-time consumption or grant distinct database identities to the writer and worker. A general service credential that bypasses this verifier would still be too powerful.

The next gate must therefore persist a one-time authority spend and make R65 functions require it. Only after that database boundary exists is an independent-connection lease race meaningful.

## Bounded result

Fifteen local tests pass. They cover exact registration, content-free payloads, raw-handle injection, digest substitution, operation-derived roles, time bounds, cross-context movement, provider-specific destruction evidence, role tampering and missing keys. No database, provider, deployment or live route was changed.
