# G24 trusted canonical ingress R62

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R62 JSON contract

## What R62 repairs

R62 removes the synthetic ordering-only evidence store from the effective contract. Lifecycle-precondition result validation now resolves only through the existing normative persistence-registry entry for `authoritative_row_schemas.lifecycle_precondition_evidence`.

The frozen proof snapshot contains two complete R13 lifecycle-precondition evidence rows. Each row carries the required workspace, subject, case, snapshot, transition, predecessor, canonical input, input-set, evaluator and validity lineage. The resolver validates the actual 24-field required schema, canonical row bytes and content address, selects the unique current row under the declared partition and current-selection rule, recomputes the R13 semantic evidence fingerprint, and separately recomputes the R13 row-envelope fingerprint. Result `evidence_refs[i]` remains a stable semantic evidence identifier rather than a content address; `evidence_fingerprints[i]` must equal the same row's recomputed semantic fingerprint.

The evaluator is a complete time-valid member of the frozen evaluator ABI registry. Both evidence rows equal the selected evaluator identity, semantic version, artifact and manifest, and match the exact `open_preparation` catalogue precondition. Canonical evidence bytes decode to the same evidence reference and their complete input set independently recomputes the shared seal. Missing, duplicate, ambiguous, expired, substituted or cross-lineage rows fail closed. Live transactional current-row enforcement remains honestly unproved outside this frozen snapshot.

All 21 R61 full containing-schema ordering fixtures and their exact negative reversals remain active. The focused checker independently validates the candidate and rejects 341 attacks. It covers 21 of 21 full ordering sites, two of two actual R13 lifecycle evidence rows, 1,228 native persisted identities, 374 selectors over 2,516 source-schema-valid contexts, 58,324 semantic-reference occurrences and 244 manifest rows.

## Product boundary

R62 is invisible infrastructure for the one canonical Brain and leader-owned authority. It adds no customer ceremony, approval step or visible product surface. It opens no adapter, database object, runtime connection, UI, deployment or external action.
