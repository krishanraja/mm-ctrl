# G24 trusted canonical ingress R22 QA record

**State:** fully materialized local candidate; deterministic checks passed; independent attack pending

## Verification scope

The R22 checker validates frozen R21 preservation, the unchanged twenty-operation ABI, closed server-presented principal projection, exact human-session and workspace joins, scoped session-instance lookup, root-anchored sole-writer authority stores, direct-DML closure, exact issuance and transition operations, serializable revocation handling, receipt-persisted authority read sets, commit-time rehydration, typed hold dependency projections, exact committed and held replay, canonical result-schema digests and digest propagation through success, response, Release consumption and outbox lineage.

Forty-two mutation probes attack caller-controlled principals, detached identity joins, cross-workspace confused-deputy substitution, unscoped session hashes, caller actor sources, broadened writers, direct DML, self-appointment, missing root anchors and trusted joins, invented or omitted authority operations, transition bypass of compare-and-swap, weakened revocation handling, incomplete or unfingerprinted receipt read sets, best-effort rehydration, alternate dependency types and encodings, detached replay schemas and fields, same-version result-schema semantic changes, missing schema digests and any opened visible surface.

## Local verification

- Exact materialization and R22 checker: passed with 42 mutation probes.
- R22 machine SHA-256: `d7a4907da81bdb1a042bbba8f480e6fc70f13b7b317ab90ed8d784912ad6f8d7`.
- Founder architecture lock: passed.
- Locked headless Crossing kernel: 211 of 211 tests passed.
- Full documentation chain through R22: passed.
- Git whitespace check: passed.

These are producer-side deterministic checks. They do not replace frozen independent attack.

## Honest limits

No adapter, migration, database procedure, runtime connection, provider worker or external call implements R22. Passing these checks is not independent review, database proof, production proof, product intelligence, usability or customer value.

**Scope:** local contract only

**External actions:** none authorised or performed
