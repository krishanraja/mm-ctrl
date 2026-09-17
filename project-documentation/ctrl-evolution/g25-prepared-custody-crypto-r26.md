# G25 prepared custody crypto, R26

R26 gives the custody-native R25 receipt its own authenticated-encryption context.

The payload is bound to the stable workspace custody principal, customer Brain subject, receipt, audience, purpose and exact R24 authority fingerprint. It does not bind to the current operator, login or legacy owner. An authorised operator transfer can therefore leave the ciphertext and its meaning untouched, while moving the ciphertext to another Brain or authority state fails authentication.

## Verified locally

- AES-256-GCM round-trips UTF-8 payloads under an exact 32-byte key.
- Version 2 associated-data bytes are deterministic and include an explicit R26 context schema.
- Workspace, custody principal, subject, receipt, audience and authority changes each make decryption fail.
- Operator, login and legacy-owner fields are absent and unknown context fields fail closed.
- Every encryption uses a fresh 96-bit IV.
- Ciphertext tampering fails authentication.
- Explicit key rotation retains decryption of older version 2 envelopes.
- Malformed envelopes, missing keys, short keys and invalid identity fail closed.
- A legacy version 1 envelope cannot be misread as custody-native ciphertext.
- All unchanged legacy Brain crypto and R24 custody-envelope tests pass beside R26.

## Compatibility boundary

R26 is separate from the version 1 Brain cipher. It does not change legacy canonical context bytes, envelopes, key IDs or decryption. It also does not pretend the two formats are interchangeable.

## Boundary

This is a pure local cryptographic contract. R25 still treats ciphertext as opaque, and no producer or database function verifies that a supplied payload is an R26 envelope. Key custody, KMS integration, runtime routing, re-encryption, correction, erasure, Supabase parity and migration remain closed.

The next gate is an atomic R25 write adapter that only accepts payloads produced under the exact R26 context, followed by principal-removal and both-generation lifecycle coverage.
