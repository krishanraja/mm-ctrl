# G24 trusted canonical ingress R36 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R36 materialization from frozen R35: passed
- Focused R36 contract checker: passed with 29 mutation probes
- R36 machine SHA-256: `dda6415555de50b7cb960f2cc2b809f50e9a55b91eb0e14c62d3920e4a6c2c4f`
- Exact founder lock: passed
- Locked headless Crossing kernel: 211 of 211 tests passed
- Full documentation chain: passed
- Diff and frozen R35 immutability: passed

Mutation coverage includes forged parent identity; missing, duplicate, always-committed and swapped branch selection; wrong session class, proof family, result schema and hold schema; restored shared roots; receipt, hold and session-evidence source leakage; hidden graph edges; replay classifier swaps, hold-schema drift, session-evidence triple drift and class drift; missing result resolution; envelope-before-payload order; reopened replay defaults; evasively named competing authority; missing and stale authority-registry rows; same-version semantic drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
