# G25 provider deletion-handle authority spend R67

**Status:** Atomic authority spend and database role separation are locally proved. Production identity mapping remains closed.

## What changed

R67 removes the broad `service_role` from the deletion-handle table and all three raw R65 functions. It introduces two NOLOGIN database roles:

- `provider_handle_crypto_writer` can execute only authorised registration.
- `provider_deletion_worker` can execute only authorised lease and destruction.

Each authorised wrapper checks the R66 authority against live database state, records a content-free spend, and performs the R65 operation in the same transaction. If the underlying operation fails, PostgreSQL rolls back the spend. An exact retry can then proceed. After success, an exact retry converges through the existing R65 idempotency behavior; a changed token or binding is rejected.

The spend table stores identity, role, operation, timing and non-content operation bindings. It stores no provider handle, ciphertext or envelope.

## What remains deliberately unresolved

PostgreSQL does not hold the R66 HMAC key and cannot verify the signature. The trusted runtime must verify R66 before calling these wrappers. For registration, that runtime must also calculate the envelope SHA-256 honestly because this PGlite build has no SHA-256 database extension.

The roles are NOLOGIN deployment blueprints, not a completed Supabase identity integration. No membership is granted to `service_role`. A future runtime design must show how two isolated workers assume only their own role without giving either worker a credential that can become the other.

## Bounded result

Nine single-process PostgreSQL tests pass. They cover role denial, exact replay, conflict, atomic rollback, expiry, Stripe closure evidence, content-free spends and removal of old service-role entry points. Independent database connections, Supabase-local behavior, signature-key operations and providers remain unproved.
