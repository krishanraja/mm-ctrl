# G25 recovery schema fingerprint R78 QA record

## First execution

The initial read-only probe failed safely because `pg_get_functiondef` cannot render a PostgreSQL aggregate as a normal function. The correction separates aggregate routines and hashes their signature, return type and implementation symbol without returning a body. The corrected probe then executed successfully against production.

## Observable result

- Eleven fingerprint domains returned.
- Every row contained only `domain`, `object_count` and `digest`.
- Customer row access and production writes were zero.
- Routine, view, policy, default, constraint, index and trigger definitions were hashed inside PostgreSQL and were not returned.
- Table grants were read from catalog ACLs rather than `information_schema.role_table_grants`, which correctly returned zero for the temporary login's visibility.
- The SQL artifact is pinned by SHA-256 in the contract.

## Boundary

This is not a logical backup and cannot recreate the schema. It is a regression oracle for a separately captured baseline. Optional and external surfaces still require their own versioned manifests and smoke tests.

## Verdict

The public-schema comparison instrument is valid for the R77 recovery rehearsal. It does not open a production mutation, billed environment, migration, deployment or cutover gate.
