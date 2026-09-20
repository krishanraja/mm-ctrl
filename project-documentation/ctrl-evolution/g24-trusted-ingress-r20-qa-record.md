# G24 trusted canonical ingress R20 QA record

**State:** fully materialized local candidate; deterministic checks passed; independent attack pending

## Verification scope

The R20 checker validates frozen R19 preservation, the unchanged twenty-operation public ABI, the acyclic terminal issuance order, result-independent precommit identity, universal result lineage, sole terminal-consumption receipt, complete removal of active legacy branch receipts, closed atomic hold rows and blobs, exhaustive held replay, server-session case actor derivation, revocation, total case-control results, domain-separated hold fingerprints and byte-exact lifecycle property keys.

Thirty-four mutation probes attack dependency cycles, result-fingerprint recursion, legacy receipt restoration, branch-specific outbox authority, hold corruption and replay substitution, caller-supplied actor identity, post-lookup actor derivation, revocation omission, incomplete pre-admission, missing failure outcomes, hold-domain collision and property-key suffix bypasses.

## Local verification

- Exact materialization and R20 checker: passed with 34 mutation probes.
- R20 machine SHA-256: `1d8f062eee31f7b29ac9383ac7f06525f7b4e256091103ef7093ce29c1434a5c`.
- Founder architecture lock: passed.
- Locked headless Crossing kernel: 211 of 211 tests passed.
- Full documentation chain through R20: passed.
- Git whitespace check: passed.

These are producer-side deterministic checks. They do not replace frozen independent attack.

## Honest limits

No adapter, migration, database procedure, runtime connection, provider worker or external call implements R20. Passing these checks is not independent review, database proof, production proof, product intelligence, usability or customer value.

**Scope:** local contract only

**External actions:** none authorised or performed
