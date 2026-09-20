# G24 predicate authority R97  -  seven-role panel verdict

**Status:** `PASS_ALL_SEVEN_ROLES`

**Date:** 2026-09-17

**Frozen commit:** `2ec11845b5dde7c19009119dd41213d3e54326e2`

**Frozen tree:** `2f9f15849d1c577eee2dab9d4cb3aa62654664f7`

**Parent:** `b5a1310805df423025da14da7658a86343b7f55b`

**Authority bundle:** `48d491a6b025d6a33985da6e9c27f22da5237557c93d528a32339bc3bae1035a`

**Manifest bundle:** `f65d8afa7c5cd54b740b330a6ae0e7615237a7e231976a5b02bd9237b68f7a3e`

**Manifest blob:** `292dda664e632d5e0db6bd514b7f4e8e5a94e85d`

**Effective-contract blob:** `3cbe8e837514dd385744556707bc91c629d184ed`

**Checker blob:** `012078787b2cbc59f6f842167e7c4f39657ad93d`

**Materializer blob:** `79ff7fd8ce7727700ff916422bff8a4a51266628`

The seven durable roles independently reviewed the exact frozen bytes above. The full historical regression and focused R97 checker passed: thirteen of thirteen predicate and final-authority paths, 212 executable vectors and 301 generated totality probes. Verdicts were delivered through reviewer messages, not cryptographic signatures. No reviewer edited the candidate.

## Verdicts

| Role | Verdict | Finding |
|---|---|---|
| Human Agency | PASS | Corrupt provenance cannot solicit or accept review, reopen work or create redundant consent after exact restoration. |
| Human Comprehension and Access | PASS | Status and available actions no longer contradict; normal owner-specific guidance remains concise and non-technical. |
| Consequential Leader Value | PASS | Downstream work remains blocked throughout corruption and reopens only on exact provenance restoration. |
| Epistemic Integrity | PASS | No status, review or current standing is earned from a challenge whose causal authority cannot be re-established. |
| Lifecycle / Security / Privacy | PASS | Identity, context and signed history remain bound through display, review, durable reopening and later use. |
| Implementation Correctness | PASS | One shared gate controls every consumer and failure leaves all durable stores byte-identical. |
| Architecture / Integration Reality | PASS | The executable contract is coherent and honest about its same-process, no-runtime and no-database boundary. |

## Exact R96 exploit replay

The correctness panel replayed the previous exploit against exact frozen R97 bytes:

```text
R97_TRIGGER_TAMPER_REPLAY={"status":{"status":"not_found","message":"This decision is unavailable."},"unsigned":0,"revalidated":false,"before":{"revalidations":0,"baselines":1,"blocks":2},"after":{"revalidations":0,"baselines":1,"blocks":2},"blocked":true}
```

The human-value panel independently reproduced the same closure and then restored the exact trigger. The truthful review state and two requests returned; normal signed review succeeded. Corrupting the same history after resolution returned unavailable, rejected replay and reblocked the successor. Exact restoration returned current standing without a second durable review.

The architecture panel additionally corrupted a post-resolution observation transition. Status became unavailable, unsigned requests remained zero, replay rejected, the descendant remained blocked, the successor predicate returned `predecessor_challenged`, and its final transition returned `predicate_invalid`.

## Why it holds

The shared provenance gate verifies the accepted record, accepted-decision authority roles and context, challenge fingerprint, baseline membership, trigger reference/fingerprint/owner/route/question/signature/time, and every observation's identity, context and signed answer edge. It governs status, review generation, review validation, first and repeated revalidation, descendant blocking and resolved-history reads.

Review events and resolution records bind canonical challenge-authority fingerprints and a seal. Each member commits to the challenge fingerprint, trigger reference and fingerprint, responsible human, and changed/resulting answer heads. Review identity also binds observations and current heads.

## Mandatory carry-forward

1. Persisted storage must preserve append-only challenge, observation, resolution and baseline history and run the same shared provenance gate on reads.
2. Observation cursor continuity should move fully into the shared verifier before database integration, even though private append-only observations close the present scope.
3. Structural display validation must never become an authority endpoint; authority remains internally resolved.
4. `accepted_replay` is historical idempotent acknowledgement, never current steering permission. Current standing must come from status and blocking authority.
5. Conformance-only unsafe review generation and direct commit helpers must remain test-only and unreachable in production.
6. The customer recovery experience for the deliberately generic unavailable hold remains a future UI decision; no technical detail or false blame may leak.

R75 and the active R77 founder lock remain unchanged. R97 proves only a bounded local machine contract. Runtime integration, live registries, immutable database storage, customer UI, deployment, merge, release, legacy deletion and external action remain unproved and unauthorized.
