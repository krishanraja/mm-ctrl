# G24 trusted canonical ingress R5 QA record

**State:** R5 contract repair candidate; deterministic semantic and mutation checks pending independent review

## Exact repair surface

- `use_release` now has an explicit invalidated-before-use branch that appends one receipt and cannot create a Release-use receipt, approval, delivery receipt or outbox effect.
- Every operation snapshots and compare-and-swaps thirteen set seals and three scalar versions under one fully framed fingerprint. Operator and workload grant changes are in both the seals and case-scope version.
- Every set kind has an ordered member-identity projection, so duplicate identity rejection has executable bytes.
- The registry has one workspace-scoped operation key. Serialization exhaustion has one noncommitting service-unavailable result. Every committed hold fingerprints thirteen fixed dependency slots and three scalar slots.
- Proof families have exact genesis and append hashes, an exact bundle digest and byte-level plus semantic equality to the current authoritative rows.
- Fresh execution authority and historical replay disclosure authority are separate. Two-party lifecycle actions and their joint receipt are fully typed, independently authenticated and atomically consumed.
- Edited approval creates a fresh visibility receipt and approval receipt bound to the exact post-edit atom version and content fingerprint.
- All request-owned size limits finish before admission and therefore have one rejection outcome. R3 field maxima are consumed only by that admission engine.
- Every provider call follows a committed fenced attempt reservation. Crashes consume the attempt, lease changes cannot reset the count and immutable typed evidence is required for confirmation.

## Deterministic checks

The checker validates every R5 replacement and continues to pin the exact rejected R2, R3 and R4 evidence. Twenty-seven R5 mutation probes attack Release invalidation and its evaluator export, race precedence, the workload universe, grant seals, snapshot bytes, identity projections, registry scope, exhaustion, hold dependencies, proof lineage, decoded proof identity, authoritative field binding, replay authority, lifecycle receipt keysets and issuance, edited visibility, limit phase and closed outcomes, retry identity, durable attempt reservation and provider-success evidence.

## Honest limits

No code, endpoint, database function, schema, role, proof bridge, outbox, provider call, customer data path or runtime connection implements R5. Passing deterministic checks is not independent review or production proof.
