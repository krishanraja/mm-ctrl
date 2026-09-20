# G25 recovery schema fingerprint R78

**Status:** A read-only production fingerprint is captured. It is a comparison instrument, not a backup or migration.

R77 established that neither the Git migration folder nor production migration history is trustworthy enough to become the baseline by itself. R78 adds a narrow way to tell whether a clean rehearsal actually recreates the current public schema.

The probe returns only a domain, object count and digest. It hashes column defaults, constraint definitions, index definitions, policy predicates, routine bodies, views, triggers, RLS posture and grants inside PostgreSQL. It never returns those definitions and never reads customer table rows.

The current fingerprint covers 2,047 columns, 710 constraints, 571 indexes, 304 policies, 171 RLS table postures, 204 routines, 48 triggers, six views and the public-schema table, routine and schema grants. The exact digests are pinned in the machine-readable contract.

## How it is used

Run the exact pinned SQL against each blank recovery rehearsal. A matching digest means that domain is structurally identical under this probe. A mismatch blocks recovery until it is explained as an intended change or repaired. Two successive clean builds must pass.

Digest equality is necessary, not sufficient. R78 does not capture Auth configuration, Auth users, Storage objects, Edge Functions, scheduled command text, Vault values, Realtime settings, database roles, data, provider state or external services. Those remain explicit R77 manifest lanes and cannot be waved through because the public-schema hash matches.

No production row, raw function body, predicate, default, secret or customer value was returned by the hosted read. Production writes remained zero.
