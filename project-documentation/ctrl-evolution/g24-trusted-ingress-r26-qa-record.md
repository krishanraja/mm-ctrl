# G24 trusted canonical ingress R26 QA record

**Candidate:** R26 fully materialized effective contract

**Parent:** frozen R25 commit `d1033ec3feba099a50defa2c4f9b2db53e7f32bc`

**Scope:** documentation architecture and deterministic verification only

## Producer-side verification

- Exact R26 materializer: passed
- R26 adversarial checker: 42 mutation families passed
- R26 machine SHA-256: `05a40077658eb1a6e6cf655e2325712fbef6b93f078e46db1cc069d665d73988`
- Founder lock: passed
- Locked kernel: 211 of 211 tests passed
- Full documentation, inventory and link chain: passed
- Diff and frozen R25 immutability checks: passed

## Mutation coverage

The R26 checker attacks stale selector coexistence, missing partition schema or database uniqueness, broken head absence and maximum-row equality, rewound heads, active-prefilter resurrection, flattened registry branches, nullable committed authority, committed fields on invalid targets, replay as durable state, dynamic replay time, held receipt leakage, incomplete raw hold evidence, bootstrap signer or key aliasing, generic nonce subjects, nonce poisoning by invalid proofs, nonce checks before replay, unrestricted principal artifact schema refs, missing parsed-content fingerprints, weak canonical verification, split writer names, open direct DML, missing issuer or evaluator session proofs and stale recursive versions.

## Honest boundary

Passing producer checks does not establish independent acceptance. This record makes no PASS claim and authorises no adapter, database, runtime, UI, deployment or external action.
