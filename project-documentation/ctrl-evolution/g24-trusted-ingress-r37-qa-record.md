# G24 trusted canonical ingress R37 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R37 materialization from frozen R36: passed
- Focused R37 contract checker: passed with 38 mutation probes
- R37 machine SHA-256: `94c3a1838a7331e7687b2f374fb64b7a03cf551ee597b93342e8f9882133eb92`
- Exact founder lock: passed
- Locked headless Crossing kernel: passed, 211 of 211 checks
- Full documentation chain: passed through R37
- Diff and frozen R36 immutability: passed

Mutation coverage includes forged parent identity; selector extra fields, caller override, fallback and source-semantic drift; verified and raw branch swaps; verified nonce omission and raw-source leakage; raw truth, read-set and nonce leakage; branch-effect drift; graph omission; missing or un-fingerprinted persisted selection fields; selector-version splicing; replay extra fields, current-table reinterpretation, durable-source drift, class splicing, wrong first authority, duplicate vocabulary and payload-envelope reversal; source-precedence and anti-splice removal; missing, circular, co-mutated, nested, unmarked and stale authority-manifest entries; same-version semantic drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
