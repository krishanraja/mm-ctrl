# G25 provider deletion-handle authority spend R67 QA record

## Automated evidence

- PostgreSQL integration suite: 9 tests passed in PGlite PostgreSQL 18.3.
- The crypto writer can register but cannot lease or destroy.
- The deletion worker can lease and destroy but cannot register.
- The broad service role cannot read custody tables or invoke raw or authorised custody operations.
- Spend plus operation are atomic; an R65 validation failure leaves no spend row.
- Exact completed replays converge; changed token digests conflict.
- Invalid operation-field swaps and provider-invalid destruction evidence fail closed.
- Spend persistence contains no ciphertext or raw provider handle.

## Residual risks

- R66 signature verification still occurs outside PostgreSQL.
- The database cannot recalculate the declared full-envelope SHA-256 in this PGlite environment.
- NOLOGIN role assumption and credentials are not designed or tested for Supabase runtime.
- Independent-connection spend and lease races remain unproved.
- Migration, PostgREST, linked database and provider parity remain unproved.

## Decision

Accept only the local transaction and grant-separation proof. Do not expose these wrappers to runtime until isolated identity mapping and independent-connection behavior are proved.
