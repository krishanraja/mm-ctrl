# G24 trusted canonical ingress R65

**Status:** fully materialized local architecture repair; independent attack remains blocking

**Authority:** the exact generated R65 JSON contract

## What R65 repairs

R65 closes the executable-authority overclaim in frozen R64 without inventing evaluator code. Repository discovery found no source module, bundle or binary implementing `evaluate_lifecycle_preconditions`. The TypeScript Decision Bench fixture adapter is unrelated and explicitly forbidden as an evaluator authority.

The prior 2,406-byte object was a compatibility metadata descriptor, not executable behavior. R65 removes the claim that its SHA-256 authenticates loaded evaluator code. The descriptor remains separately content addressed and continues to bind the evaluator identity, ABI, policy lineage, manifest and result/proof export maps. It cannot authorize kernel dispatch.

The executable boundary is fail closed. A real executable content reference, exact bytes and byte length, bytes SHA-256, module format, entrypoint, export ABI, and founder-locked or separately reviewed executable authority must all exist and agree before kernel execution, evidence writes or result generation. None exists in this frozen repository, so executable behavior and live result generation remain explicitly unproved. Missing, fake, truncated, alternate, caller-asserted or metadata-only executable evidence deterministically holds before kernel execution.

R65 also replaces the asserted selected-member array with a complete frozen evaluator-registry snapshot. The registry member schema is versioned and closed. Its row version and registry fingerprint are derived under distinct domain-separated authorities; its canonical bytes are content addressed. The full member set is encoded with the existing R6 evaluator-registry identity projection and set-seal authority. Selection evaluates every member at the pinned instant and requires exactly one policy-compatible, time-current member with exact result and proof export maps.

Frozen snapshot completeness is proved only for this exact materialized archive. Complete live-registry readback and serializable selection are unproved because no runtime store is connected. Compatibility selection does not confer execution authority.

The descriptor SHA change is recomputed through the lifecycle evidence row, semantic and row-envelope fingerprints, row content address, proof member, frozen result fixture and planned transition-stage set seal. The result fixture remains schema and lineage evidence, not a claim that an evaluator executed. All twenty operation exports still agree across seven compatibility surfaces, and all twenty-one exact ordering bindings remain intact.

The focused checker rejects 44 attacks. The final semantic snapshot contains 58,350 reference occurrences sealed across 249 manifest rows.

## Product boundary

R65 changes only invisible evaluator authority and registry evidence. It adds no evaluator implementation, customer ceremony, visible product surface, adapter, database object, runtime connection, deployment or external action. R63's human-owned seal boundary, exact evidence semantics, catalogue cardinality and singleton honesty remain intact.
