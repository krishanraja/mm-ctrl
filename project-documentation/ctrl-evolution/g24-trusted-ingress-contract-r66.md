# G24 trusted canonical ingress R66

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R66 JSON contract

## What R66 repairs

R66 closes the operation-class gap in frozen R65 without changing its honest executable boundary. The locked evaluator selection key remains exactly `operation_class`, `policy_lineage_ref`, and `evaluated_at`. R65 supplied `trusted_ingress` as the operation class even though that alias was not one of the twenty closed operation names, and its match derivation ignored the operation-class component.

R66 removes that alias from the registry snapshot. The operation-class vocabulary is the exact codepoint-sorted set of twenty `operation_specs` keys; family aliases are forbidden. Registry-member applicability is derived from the exact keys and values of its existing per-operation result-export map. A member supports an operation only when the operation is in the closed vocabulary, the export key exists, and its value equals both the operation result schema and the evaluator ABI export for that operation.

Twenty closed selection query and proof records are materialized, one per exact operation. Every query binds all three locked selection-key fields. Every proof independently filters every member in the same complete frozen registry snapshot by operation class, policy lineage, half-open active interval, exact result export and exact proof export compatibility. Each unique match is bound to the snapshot content reference and SHA-256, existing R6 registry set seal, selected member content reference, row-version reference, fingerprint, and exact selected result schema version.

All twenty queries resolve the one compatible member in the frozen snapshot. Unknown, missing, duplicate or family-alias operation classes; cross-operation exports; wrong policy or time; stale, future, omitted or overlapping members; selection-key omissions; and member claims without an exact export all hold. The `evaluate_lifecycle_preconditions` selection proof is bound into the frozen evidence-ordering and lifecycle proof lineage.

R65's descriptor and executable split is unchanged. Compatibility metadata selection still does not confer execution authority. No executable implementation exists, all eight dispatch preconditions remain unsatisfied, and kernel execution, evidence writes and result generation remain closed. Frozen snapshot completeness is proved only for the materialized archive; live registry completeness and serializable selection remain unproved.

The focused checker rejects 49 attacks. All twenty seven-surface metadata exports and all twenty-one ordering bindings remain exact. The final semantic snapshot contains 58,385 reference occurrences sealed across 250 manifest rows.

## Product boundary

R66 changes only invisible evaluator selection authority and its frozen lineage. It adds no executable evaluator, customer ceremony, visible product surface, adapter, database object, runtime connection, deployment or external action.
