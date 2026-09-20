# G24 trusted canonical ingress R21 QA record

**State:** fully materialized local candidate; deterministic checks passed; independent attack pending

## Verification scope

The R21 checker validates frozen R20 preservation, the unchanged twenty-operation public ABI, exact current `use_release` result inventory, closed and versioned held response history, closed fingerprinted server-session authority evidence, exact actor and revocation equalities in one serializable snapshot, compare-and-swap protection, typed domain-separated hold fingerprints, exact unavailable sentinel bytes, server correlation identifiers, total admission-row reason mapping and a branch-complete Release issuance graph.

Forty-five mutation probes attack stale or forged result inventories, arbitrary held response versions and types, detached durable response schemas, invented session authority, caller-supplied actors, weakened original-actor and current-operator equalities, changed fail-closed behavior, expanded standing values, open or unbound revocation evidence, missing revocation compare-and-swap, post-registry identity derivation, implementation-defined sentinels, caller-supplied correlation IDs, incomplete or remapped hold reasons, detached admission-row mappings, missing terminal failure outcomes, open or incomplete hold inputs, fingerprint domain collisions, dependency-order changes, issuance cycles, unconditional outbox creation, cross-branch edges, missing invalidation assertions, early branch rejoins, restored legacy receipts and lifecycle property-key suffix bypasses.

## Local verification

- Exact materialization and R21 checker: passed with 45 mutation probes.
- R21 machine SHA-256: `25f783047ba0272cca05ca742aa856df5d485e7392bcc2ce66da351378ebdb9f`.
- Founder architecture lock: passed.
- Locked headless Crossing kernel: 211 of 211 tests passed.
- Full documentation chain through R21: passed.
- Git whitespace check: passed.

These are producer-side deterministic checks. They do not replace frozen independent attack.

## Honest limits

No adapter, migration, database procedure, runtime connection, provider worker or external call implements R21. Passing these checks is not independent review, database proof, production proof, product intelligence, usability or customer value.

**Scope:** local contract only

**External actions:** none authorised or performed
