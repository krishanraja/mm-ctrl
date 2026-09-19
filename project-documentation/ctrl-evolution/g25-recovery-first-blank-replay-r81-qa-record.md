# G25 recovery first blank replay R81 QA record

## Capture and integrity

- PostgreSQL 17.11 `pg_dump` captured only the application schemas `public`, `private` and `ctrl_discovery`.
- Baseline: `supabase/baselines/g25_production_application_schema_r81.sql`.
- Baseline size: 569,628 bytes.
- Baseline SHA-256: `7bb1a96145efa2b47227f7ed425ff4804dea8ee7b355bddc4dc716af33e3c80d`.
- The dump contains no top-level `COPY` or `INSERT` statement. SQL inside stored routine bodies is schema, not exported row data.
- A credential-pattern scan found no high-confidence credential literal.

## Hosted replay

- Source: healthy production project, read only, PostgreSQL 17.4.1.064.
- Target: the already approved isolated recovery project, PostgreSQL 17.6.1.166.
- Target application inventory: 176 tables, two sequences and an estimated zero rows.
- The baseline replay completed atomically after required extensions were present.
- Fresh-project default grants produced a real ACL mismatch. Narrow normalization and captured ACL replay reduced the difference to zero.
- Final R81 application probe: eleven of eleven domains exact, with no unexplained policy or grant difference.

## Extension drift

| Extension | Production | Blank replay | Standing |
|---|---:|---:|---|
| `pg_cron` | 1.6 | 1.6.4 | Runtime compatibility not proved |
| `pg_net` | 0.14.0 | 0.20.4 | Runtime compatibility not proved |
| `vector` | 0.8.0 | 0.8.2 | Runtime compatibility not proved |

Current Supabase behavior ignores explicit extension version pinning and installs the platform default. Exact application-schema fingerprints do not replace extension smoke tests.

## Advisor readback

The security advisor reports 41 anonymously executable and 45 authenticated-user executable `SECURITY DEFINER` functions, two extensions in `public` and 24 RLS-enabled tables without policies. The performance advisor reports 43 auth RLS init-plan findings, 228 multiple-permissive-policy findings, 13 unindexed foreign keys, 320 unused indexes, one table without a primary key and one Auth connection-setting finding.

These are inherited production-baseline findings. They are preserved as blockers or disposition work, not silently accepted because the replay is exact.

## Verdict

`FIRST_BLANK_REPLAY_EXACT_SECOND_REPLAY_AND_RUNTIME_PROOF_OPEN`

Production was not mutated. Customer data was not copied. The second clean blank replay, extension behavior, non-schema recovery, critical application smoke, production recovery choice and cutover remain unverified.
