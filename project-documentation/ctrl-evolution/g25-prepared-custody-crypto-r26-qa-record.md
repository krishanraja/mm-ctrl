# G25 prepared custody crypto R26 QA record

Status: pure custody-native crypto pass. No key, database or runtime claim.

## Evidence

- Thirteen R26 tests pass.
- Twelve unchanged legacy Brain crypto tests pass.
- Nine unchanged R24 custody-envelope tests pass.
- Exact canonical associated-data bytes are pinned.
- Every consequential identity mutation fails decryption.
- Unknown identity context fails before encryption.
- Legacy version 1 envelopes are rejected by the version 2 reader.
- Fresh-IV, tamper, rotation, malformed-envelope and invalid-key controls pass.
- Strict lint and typecheck introduce no new errors.

## Residuals

- R25 does not yet attest that stored ciphertext is an R26 envelope.
- No KMS, environment key, runtime producer or rotation operation is exercised.
- Re-encryption and destructive lifecycle behavior remain unproved.
- Supabase-local image, PostgREST and production observability remain untested.

No linked database, migration, key access, runtime integration, deployment, merge, release or external action is authorised.
