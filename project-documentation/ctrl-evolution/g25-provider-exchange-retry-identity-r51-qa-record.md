# G25 provider exchange retry identity R51 QA record

Status: R49 identity defect corrected in a dormant local overlay.

## Positive evidence

- The same payload under two operation identities produces two receipts.
- An exact exchange retry with a different proposed UUID returns the first receipt.
- Changed exchange evidence under the same operation identity fails closed.
- An exact lifecycle-event retry returns the first event.
- Changed event evidence under the same operation identity fails closed.
- PostgreSQL confirms request payload digest is no longer a uniqueness identity.

## Residuals

- The overlay requires empty R49 tables and is not a live-data migration.
- Independent-connection uniqueness races remain unproved in this environment.
- Supabase-local and PostgREST parity remain untested.
- No runtime caller supplies the new operation identity.

No linked database, migration, live provider route, external call, deployment, merge or release is authorised.
