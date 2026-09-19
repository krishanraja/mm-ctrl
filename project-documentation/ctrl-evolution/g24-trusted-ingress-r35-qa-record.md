# G24 trusted canonical ingress R35 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R35 materialization from frozen R34: passed
- Focused R35 contract checker: passed with 24 mutation probes
- R35 machine SHA-256: `319ddcb2f180d0f1b93785df8ec2571c1a7a3bac6a8b1e9f08310049a4ea89a8`
- Exact founder lock: passed
- Locked headless Crossing kernel: 211 of 211 tests passed
- Full documentation chain: passed
- Diff and frozen R34 immutability: passed

Mutation coverage includes forged parent identity; restored or competing historical-response bindings; omitted or mis-sourced result byte identity; singular, missing, filtered, reversed and cyclic branch graphs; committed-to-hold and held-to-receipt cross-branch dependencies; ordinary-held session-evidence leakage; registry finalization drift; issuance DAG divergence; missing or reordered result-artifact replay resolution; ordinary replay session-evidence leakage; deleted source precedence and anti-splice rules; same-version semantic drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
