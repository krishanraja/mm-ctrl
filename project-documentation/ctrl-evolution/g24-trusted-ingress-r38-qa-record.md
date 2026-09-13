# G24 trusted canonical ingress R38 QA record

**Status:** producer checks passed; independent review remains blocking

## Producer evidence

- Exact R38 materialization from frozen R37: passed
- Focused R38 contract checker: passed with 40 mutation probes
- Exhaustive runtime-semantic authority manifest: passed with 194 independently pinned rows
- R38 machine SHA-256: `442ff0188b00110bee9e79feb889f5c728b18d31815e7bb8bb0d6b46e0cffb01`
- Exact founder lock: passed
- Locked headless Crossing kernel: passed, 211 of 211 checks
- Full documentation chain: passed through R38
- Diff and frozen R6 through R37 immutability: passed

Mutation coverage includes forged parent identity; caller-supplied proof, caller-selected Release and provider-callback outbox authority; raw-session nonce consumption; missing and swapped evidence references; nested unmarked caller precedence; caller-selected replay registry and binding authorities; weakened recursive scanning; missing, forged and co-mutated manifest paths, rows, content hashes, dependency closure and counts; new unmanifested top-level semantics; non-canonical insertion-order hashing; changed hash domains; missing durable registry, hold and classifier selection fields; source-precedence and anti-splice drift; open branch write sets; replay ordering drift; R37 row-count and durable-lineage regression; same-version semantic drift; visible-surface expansion and external action.

## Closure

No reviewer verdict is recorded here. No adapter, database, runtime, UI, deployment or external action was opened.
