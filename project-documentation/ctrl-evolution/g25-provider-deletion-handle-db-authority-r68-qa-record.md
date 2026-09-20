# G25 provider deletion-handle database authority R68 QA record

## Executed evidence

- Vitest: 12 tests passed.
- ESLint: compact authority, tests and isolated config passed.
- Token carries no ciphertext or raw provider handle.
- Header, payload and signature tampering fail closed.
- Non-canonical base64url encodings fail closed even when they decode to identical signature bytes.
- R66 workspace, receipt, handle, provider, job, operation and expiry checks survive the new format.
- Key rotation succeeds; relabeling a token to another key fails.
- The envelope fingerprint has a fixed cross-language field order and domain separator.
- Reordered JSON fields preserve the fingerprint; changed ciphertext changes it.
- Unexpected envelope members are refused.

## Static-only evidence

- The SQL candidate requires pgcrypto under `extensions` and Vault's `decrypted_secrets` view.
- It bounds token length, header shape, signature length and key identifier.
- It reads one named Vault key, verifies HMAC, calculates token SHA-256 and recalculates the envelope fingerprint.
- It removes the R67 unverified wrappers from custom roles before granting R68 verified wrappers.

## Residual risks

- The SQL candidate has not run against Supabase PostgreSQL.
- Extension schema and Vault grants require catalog verification.
- Byte comparison timing behavior has not been measured.
- Custom login provisioning and password rotation remain operationally undefined.
- Secret-domain isolation between issuer, writer and worker is not yet proved.
- Independent-connection spend and lease races remain unproved.

## Decision

Accept the local token format and static Supabase design. Do not create a migration or provision secrets until a disposable Supabase proof confirms the platform-specific assumptions.
