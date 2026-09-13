# G24 trusted canonical ingress R35

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R35 JSON contract

## What R35 repairs

R35 replaces the surviving R32 historical-response binding table with one complete normative authority. It binds operation, branch, exact response schema, result artifact reference, result byte hash, result fingerprint and response payload identity from one selected result and its content-addressed artifact. No second binding table may compete with it.

Identity issuance is now split into three exact branch classes: committed, ordinary held and session held. Each class has its own complete derivation rules, dependency graph and issuance DAG. No branch can depend on a receipt, hold or session-evidence identity that does not exist in that branch, and no filtered edge may hide an unavailable dependency.

Committed registry identity follows its final receipt and history. Held registry identity follows its final hold and history. Only session-held issuance requires session evidence before the hold-row reference. Replay selects the exact original branch DAG, resolves its registry and hold authorities, resolves the exact result artifact before history, then returns the already-materialized response through the exact payload and envelope.

## Boundary

R35 is invisible infrastructure. It adds no customer ceremony, administration, UI or intelligence claim. No adapter, database object, runtime connection, deployment or external action is authorised.
