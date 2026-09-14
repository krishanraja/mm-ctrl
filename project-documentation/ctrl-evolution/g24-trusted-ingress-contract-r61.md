# G24 trusted canonical ingress R61

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R61 JSON contract

## What R61 repairs

R61 removes caller-authored evidence resolution from lifecycle-precondition validation. The ordering validator receives a non-serializable trusted context created internally from the same frozen snapshot. Every evidence reference must resolve exactly once in the authoritative R61 evidence store. The validator decodes canonical bytes, checks the content address, target store, schema reference and version, and independently recomputes the row fingerprint before comparing it with the same-position claimed fingerprint.

Missing, duplicated, ambiguous, substituted, wrong-store, wrong-schema, wrong-version, wrong-bytes, wrong-hash, wrong-reference and wrong-fingerprint evidence fail closed. A caller cannot add resolution pairs to the closed operation payload, and a coherent swap of both output and store fingerprints fails recomputation.

All 21 frozen `ordered_by` declarations now execute through a complete payload for their actual containing schema. Each fixture binds the exact source path, schema version and selected-spec hash. The positive payload passes full recursive validation. The negative payload reverses only the ordered field, reseals declared dependent fingerprints or branch fields, and must fail specifically at ordering. Handler fragments do not count as site coverage.

R61 preserves R60's atom-kind schema-version binding, exact question-display semantics and recursive selected-schema exclusion inventory. It continues to report 25 closed local predicates, zero detached contexts and 78 explicitly unproved semantic or live rules.

The focused checker independently validates the candidate and rejects 299 attacks. It covers 21 of 21 full ordering sites, two of two authoritative evidence rows, 1,228 native persisted identities, 374 selectors over 2,516 source-schema-valid contexts, 58,307 semantic-reference occurrences and 245 manifest rows.

## Product boundary

R61 is invisible infrastructure for the one canonical Brain and leader-owned authority. It adds no customer ceremony, approval step or visible product surface. It opens no adapter, database object, runtime connection, UI, deployment or external action.
