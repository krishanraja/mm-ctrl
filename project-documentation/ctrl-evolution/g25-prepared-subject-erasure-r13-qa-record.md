# G25 prepared-subject erasure R13 QA record

Date: 17 September 2026

Verdict: `POSTGRESQL_WASM_CRYPTOGRAPHIC_ERASURE_PASS_RECONSENT_CLOSED`

## Passed

- Candidate SQL remains outside `supabase/migrations`.
- Prepared ciphertext and encryption version are destroyed together.
- Original ingest identity and request, authority and content fingerprints are replaced.
- Prepared authority dependencies and prior event hashes are deleted.
- One payload-free erased event and one workspace-subject tombstone remain.
- The durable tombstone prevents a new prepared receipt for the subject.
- Exact replay is idempotent and conflicting erasure-ID replay fails.
- Another workspace for the same subject remains untouched.
- Forced event failure restores payload, dependencies, events and absence of a tombstone.
- The erasure function is a private, empty-search-path security definer callable only by service role.
- Service role lacks direct payload update and dependency delete privilege.
- Authenticated function execution and direct mutation fail.
- Three weakened controls fail the same canary.
- The test transaction rolls back with zero receipt, dependency, event or tombstone residue.
- No linked database, migration, runtime, deployment or customer data was used.

## Not proved

- Canonical Brain source and item deletion.
- Export, cache, log, backup and third-party deletion coverage.
- Human-authorised re-consent or tombstone clearance.
- Multi-connection store-versus-erasure races.
- Supabase-local image and PostgREST parity.
- A reviewed migration or production readiness.

## Required next gate

Map every durable and external copy of Brain and derivative data, define exact erasure evidence for each, and keep re-consent closed until the founder approves a human-authority ceremony.
