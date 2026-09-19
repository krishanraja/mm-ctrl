# G25 provider deletion handle PostgreSQL R65 QA record

Status: local PostgreSQL proof passed. Runtime authority blocked.

## Positive evidence

- Seven integration tests pass against one PostgreSQL 18.3 PGlite database.
- The test path encrypts with R64, registers the JSON envelope, leases it, decrypts it and verifies the original handle.
- Registration requires an accepted exchange and exact provider match.
- Exact registration and lease replay converge; changed ciphertext and competing active leases reject.
- Lease duration is bounded to 300 seconds.
- Expired exchange handles are wiped without returning ciphertext.
- Operational and account-closure destruction require an active lease and matching R63 success fact.
- Direct service-role table insert is denied.
- Destroyed rows retain no ciphertext or lease-token HMAC.

## Residuals

- Database-side envelope authenticity is unproved and intentionally cannot be proved without a trusted writer or moving the key into the database.
- The broad service role can invoke the functions; a dedicated crypto writer and deletion worker are required.
- Independent-connection lease races remain unproved.
- Supabase-local migration, PostgREST and role parity remain unproved.
- Key custody, rotation operations and account-closure orchestration remain absent.
- The candidate is not a migration and no provider was called.

No provider call, linked database, live route edit, migration, deployment, merge or release is authorised.
