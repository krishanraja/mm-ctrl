# G25 prepared custody cipher admission, R27

R27 closes the seam between R25 storage and R26 encryption.

Before a custody-native row can enter the database, PostgreSQL now checks that the payload is a strict version 2 AES-GCM envelope and that its declared associated-data hash equals the exact R26 context implied by the row. The database can perform this identity check without seeing the plaintext or possessing the encryption key.

## Verified locally

- PostgreSQL and R26 JavaScript independently derive the same associated-data SHA-256.
- A valid R26 envelope is stored through the R25 atomic function and decrypts to the original plaintext afterward.
- A wrong context hash, legacy version 1 envelope, extra identity field, wrong storage encryption version and malformed JSON each fail before insert.
- The envelope is closed to exactly version, algorithm, key ID, IV, ciphertext and context hash.
- Removing either context-hash validation or storage-version validation makes the negative-control run fail.

## What this does and does not prove

R27 proves that the database only admits a payload claiming the exact custody, subject, receipt, audience, purpose and authority context stored beside it. AES-GCM still provides the cryptographic proof when the payload is decrypted. The database does not receive a key and cannot independently prove plaintext or ciphertext authenticity.

This separation is deliberate. Database admission protects identity and format. R26 encryption and decryption protect confidentiality and authenticity. Neither layer impersonates the other.

## Boundary

R27 is a non-migration PGlite/PostgreSQL overlay. It does not validate rows written before its trigger exists, use a KMS, integrate a runtime producer, cover multi-connection races or extend correction, erasure and unified reading to the custody generation. Supabase-local and PostgREST parity remain unproved.

The next gate is binding the principal-removal planner to live R23 custody state, followed by both-generation correction, erasure and unified reading.
