# G25 prepared-receipt correction invalidation R12 QA record

Date: 17 September 2026

Verdict: `POSTGRESQL_WASM_ATOMIC_CORRECTION_INVALIDATION_PASS_ERASURE_PENDING`

## Passed

- Candidate SQL remains outside `supabase/migrations`.
- Replacement authority must be current under the R11 adapter.
- Different old and replacement version-row IDs are supported.
- Only exact-scope receipts depending on the affected record are invalidated.
- An unrelated receipt remains current.
- Invalidation and its payload-free event commit atomically.
- Forced event failure rolls back both receipt mutation and correction receipt.
- Exact replay is idempotent; conflicting correction-ID replay fails.
- Forced RLS and narrow update-column privileges are verified from PostgreSQL.
- Authenticated function execution and direct update fail.
- Three weakened controls fail the same canary.
- The test transaction rolls back with zero receipt, dependency, event or correction residue.
- No linked database, migration, runtime, deployment or customer data was used.

## Not proved

- Withdrawal without a verified replacement authority.
- Automatic regeneration of invalidated output.
- Multi-connection store-versus-correction race behavior.
- Cryptographic erasure and protection against silent subject revival.
- Supabase-local image and PostgREST parity.
- A reviewed migration or production readiness.

## Required next gate

Make prepared-receipt payload and encryption-version columns erasable only through one exact-subject transaction, retain content-free lifecycle evidence, and prevent any new receipt for that subject until explicit new authority clears a durable tombstone.
