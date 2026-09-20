# G24 trusted canonical ingress R9 QA record

**State:** fully materialized local contract candidate; deterministic and mutation checks pending independent attack

## Repair summary

- Watermark identity now includes current lineage and version for base and applicable-control members.
- Closed schemas validate every operation and proof export map; operation specs, result payloads and evaluator exports are equal.
- Visibility retry identity has an exact projection, fingerprint, collision order and receipt binding while preserving the narrow human-attestation claim.
- Nineteen content-bearing authoritative rows separate semantic digests from full row-envelope digests.
- Selector candidates, answer chains, dependency edges and lifecycle preconditions use typed complete member schemas.
- Proof dependencies must equal extension, owner join and dependency row in one scope; set seals must equal the owner and a recomputed complete set.
- Outbox creation has a unique genesis event. Every transition binds an exact payload and predecessor.
- Provider invocation requires a committed invocation-start event and an unrepeatable in-process capability. A pre-invocation crash is distinguishable from post-invocation ambiguity.

## Verification

The R9 checker traverses references with own-property semantics and verifies exact preservation of the rejected R8 bytes, closed evaluator parity, watermark lineage and version identity, visibility secondary-idempotency order, content-bearing proof reconstruction, dual fingerprint preimages, proof member ordering, owner/dependency/set binding, outbox genesis, exact payload dispatch, predecessor admission, invocation capability semantics, crash classification, no-send authorities and the three-attempt ceiling.

Thirty-three mutation probes cover inherited references, missing and stale evaluator exports, operation-result drift, lost watermark identity, reordered visibility phases, empty proof shells, weakened answer content, incomplete candidates, aliased or incomplete fingerprints, missing proof ordering and joins, absent genesis or invocation events, terminal evidence detached from invocation, arbitrary event kinds and transitions, unbound payloads or predecessors, reconstructible or reusable provider capabilities, reaper sends, duplicate claims and fourth attempts.

## Honest limits

No adapter, schema, database procedure, runtime connection, proof resolver, outbox worker or external call implements R9. Passing these checks is not independent review, database proof, production proof, product intelligence, usability or customer value.

**Scope:** local contract only

**External actions:** none authorised or performed
