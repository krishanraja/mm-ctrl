# G25 prepared-authority adapter R11 QA record

Date: 17 September 2026

Verdict: `POSTGRESQL_WASM_REAL_BRAIN_AUTHORITY_PASS_DECISION_AUTHORITY_CLOSED`

## Passed

- Candidate SQL remains outside `supabase/migrations`.
- PostgreSQL 18.3 reads production-shaped canonical Brain item-version and source rows.
- Returned authority receipts contain no plaintext or ciphertext content.
- The digest covers the semantic authority row, and a semantic change moves it.
- Exact version, digest, scope, purpose and recorded-before-observed time are required.
- Superseded, prohibited, expired, wrong-purpose and unverifiable authority fails closed.
- One R10 atomic receipt stores both real authority dependencies.
- Decision cases and claims remain disabled.
- Three weakened-policy controls make the same canary fail.
- The test transaction rolls back with zero residue.
- Shared PostgreSQL scaffolding now prevents R8, R10 and R11 harnesses from drifting independently.
- No linked database, migration, runtime, deployment or customer data was used.

## Not proved

- Full migration-graph compatibility in Supabase local.
- PostgREST and real JWT parity.
- Immutable workspace-bound decision-case and decision-claim snapshots.
- Concurrent replay on a multi-connection PostgreSQL server.
- Correction invalidation, erasure and delivery lifecycle transactions.
- A reviewed migration or production readiness.

## Required next gate

Implement one atomic correction-invalidation transaction that finds exact affected dependencies, closes their prepared receipts and appends payload-free lifecycle events without altering unrelated receipts.
