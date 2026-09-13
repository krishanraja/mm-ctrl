# G24 trusted canonical ingress R36

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R36 JSON contract

## What R36 repairs

R36 adds one exhaustive fresh branch-class selector. Its ninety rows cover every operation and result branch, with fifteen committed, sixty ordinary-held and fifteen session-held outcomes. Each row binds the exact proof family, result schema, hold schema or unavailable literal, session-evidence rule and issuance DAG. The serializable transaction and identity derivation must bind the same selected row before any branch identity or write.

Each branch now starts from its own exact available-source root. Committed issuance can use only its receipt precommit, validated target, proof, read set and head. Ordinary-held issuance can use only its ordinary hold precommit sources. Session-held issuance builds session evidence first and then the session hold. Every branch explicitly forbids the unavailable receipt, hold or session-evidence sources from the other classes.

Replay has an exhaustive classifier parallel to the fresh selector. It binds operation family, result branch, hold schema, exact session-evidence availability and triple, original issuance DAG and replay path. Every replay resolves result before history and payload before envelope.

One top-level registry lists every normative authority by exact key, authority version, local schema ref and local schema version. Any unregistered, duplicate, stale or evasively named authority fails materialization and holds runtime.

## Boundary

R36 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
