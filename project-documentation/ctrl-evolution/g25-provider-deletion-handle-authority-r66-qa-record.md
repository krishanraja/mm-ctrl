# G25 provider deletion-handle authority R66 QA record

## Automated evidence

- Vitest: 15 tests passed.
- ESLint: authority, tests and isolated config passed.
- Authority payload carries no raw handle or ciphertext.
- The role is derived from the operation, never accepted from the request.
- Workspace, receipt, handle, provider, job and operation are exact-match constraints.
- Both authority lifetime and lease length stop at 300 seconds.
- Registration envelope substitution and role tampering invalidate the signature.
- Extra payload members, including an injected raw provider handle, are refused before signing.
- ElevenLabs expiry destruction cannot carry a success fact; Stripe account closure cannot proceed without one.

## Residual risks

- HMAC key custody, rotation and emergency revocation are not operationally proved.
- An application verifier is not a database privilege boundary.
- Authority consumption is not durable or one-time yet.
- A broad service-role credential could bypass the application verifier.
- Independent-connection lease races remain unproved.
- Supabase-local, PostgREST, migration and provider parity remain unproved.

## Decision

Accept R66 only as the local capability-envelope contract. Do not call the custody corridor least privilege until PostgreSQL requires and consumes the authority under distinct writer and worker grants.
