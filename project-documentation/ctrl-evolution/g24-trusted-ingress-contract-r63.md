# G24 trusted canonical ingress R63

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R63 JSON contract

## What R63 repairs

R63 separates the evidence-input intent seal from the lifecycle proof-set seal. `evaluate_lifecycle_preconditions` continues to accept and persist `evidence_input_set_seal`, but its versioned R63 result no longer carries `precondition_set_seal`. The R63 `apply_lifecycle_transition` intent also no longer accepts a caller-provided seal or transition-receipt row version.

The transition operation reserves a unique transition-receipt `row_version_ref` inside its serializable transaction after committed-replay resolution and before proof-set sealing. It then recomputes each lifecycle proof member under the existing member schema and fingerprint authority, computes the owner-bound seal under `CTRL-G24-SET-SEAL-R6`, assembles the receipt with that exact row version and seal, and commits the receipt, snapshot and consumptions atomically. A failed commit rolls all of those values back. The machine contract proves the deterministic derivation and schema boundary. Live serializable execution remains explicitly unproved.

R63 also corrects the evidence snapshot to one satisfied evidence row for the one exact `open_preparation` catalogue precondition. Every frozen lifecycle transition has exactly one catalogue precondition, so the two lifecycle result ordering sites have an honest singleton witness and duplicate-member rejection rather than a fabricated reversible order witness. The other nineteen ordering sites retain full reversible containing-schema proofs.

Canonical evidence now has a closed decoded schema. Its `evidence_schema_version` must equal that schema version, its decoded bytes must be canonical JSON and recursively valid, and `canonical_evidence_byte_length` must equal the exact decoded byte length. Semantic evidence and row-envelope fingerprints remain distinct and are both recomputed.

The focused checker rejects 75 attacks. It covers the legacy caller seal and row-version fields, input/output seal aliasing, member and set-seal encoding changes, reservation replay, rollback, dependency cycles, byte-length and schema splices, catalogue duplicate, omission, extra and unsatisfied rows, and singleton ordering claims. The final semantic snapshot contains 58,337 reference occurrences sealed across 246 manifest rows.

## Product boundary

R63 is invisible infrastructure for the one canonical Brain and leader-owned authority. It adds no customer ceremony, approval step or visible product surface. It opens no adapter, database object, runtime connection, UI, deployment or external action.
