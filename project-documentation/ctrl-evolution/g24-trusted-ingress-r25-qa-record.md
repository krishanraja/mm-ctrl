# G24 trusted canonical ingress R25 QA record

**Candidate:** R25 fully materialized effective contract

**Parent:** frozen R24 commit `bcb77069cf1506ba0ad1d3a34de58567e219d5c8`

**Scope:** documentation architecture and deterministic verification only

## Producer-side verification

- Exact R25 materializer: passed
- R25 adversarial checker: 48 mutation families passed
- R25 machine SHA-256: `8def0d4f99db236425f0b69a98f2987176d3dc5e6fad46594103b87579d716f5`
- Founder lock: passed
- Locked kernel: 211 of 211 tests passed
- Full documentation, inventory and link chain: passed
- Diff and frozen R24 immutability checks: passed

## Mutation coverage

The R25 checker attacks caller-owned backdating and row order, missing partition heads and compare-and-swap, proof validation before replay, repeated nonce consumption on exact replay, duplicate idempotency under a new operation ID, bootstrap proof reuse for administration, missing or duplicate bootstrap signers, signature self-inclusion, unpinned verification, missing nonce authority, missing or weak artifact families, non-const schema references, absent byte limits and canonical checks, missing result fingerprints, non-total results, unpersisted holds, receipt leakage into hold branches, and stale recursive schema versions.

## Honest boundary

Passing producer checks does not establish independent acceptance. This record makes no PASS claim and authorises no adapter, database, runtime, UI, deployment or external action.
