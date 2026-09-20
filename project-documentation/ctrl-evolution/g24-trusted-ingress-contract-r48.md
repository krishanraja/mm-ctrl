# G24 trusted canonical ingress R48

**Status:** fully materialized repair candidate under independent review

**Authority:** the exact generated R48 JSON contract

## What R48 repairs

R48 makes fixture issuance happen before lineage proof. Every committed target, receipt, result, history, registry and replay artifact is finalized first. The selected-reference traversal, self-reference allowlist, non-artifact allowlist, exact-one resolution rows and correlation rows are then regenerated from those final role stores. A later artifact change cannot retain an earlier lineage table.

The receipt identity authority now covers every active committed receipt variant. The ordinary single-proof receipt uses its exact 24-field preimage and the session dual-proof receipt uses its exact 43-field preimage. A fully materialized 17-role session-committed identity fixture proves the dual-proof receipt, two nonce receipts, authority read set, receipt evidence, committed target, result, registry, history and replay lineage without claiming a connected runtime route.

Persisted identity kinds are derived from finalized store schemas and active receipt variants rather than a hand-maintained list. The resulting 102 schema-qualified kinds each resolve to one authority. Only after those authorities are final does R48 capture the semantic source snapshot, regenerate 7,104 exact reference occurrences and seal the 221-row authority manifest.

## Boundary

R48 is invisible infrastructure. It changes no customer-facing language, interaction or product promise. It opens no adapter, database object, runtime connection, UI, deployment or external action.
