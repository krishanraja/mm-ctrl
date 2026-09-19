# G25 provider deletion handle crypto R64 QA record

Status: local cryptographic proof passed. Persistence absent.

## Positive evidence

- Ten tests pass across round-trip, four context-substitution attacks, key rotation, custody duration, provider substitution and raw-handle validation.
- Ciphertext uses AES-256-GCM with a random 96-bit IV and 128-bit authentication tag.
- Canonical associated data includes all custody and routing identities.
- The envelope stores only version, algorithm, key ID, IV, ciphertext and associated-data digest.
- ElevenLabs exchange custody cannot exceed 35 days or expire before creation.
- Stripe account-lifetime custody rejects a calendar expiry.
- Missing, wrong-length and invalid key IDs reject through the existing Brain crypto error boundary.

## Residuals

- Environment key custody, rotation operations and key destruction remain unproved.
- No database persists, leases, consumes or destroys the encrypted handle.
- Account-lifetime destruction is a required future transition, not current behavior.
- The 35-day maximum is a conservative engineering ceiling and still requires exact provider-policy versioning per handle.
- No provider deletion API was called or simulated.

No provider call, database write, migration, live route edit, deployment, merge or release is authorised.
