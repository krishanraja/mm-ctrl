# G24 predicate authority R96  -  seven-role panel verdict

**Overall verdict:** VETO

**Frozen commit:** `b7a348bd1a5ed91f42edd5c180b15a6bc2b74741`

**Frozen tree:** `5c232f4ef932e909d447df41ca868dc829d63165`

**Parent:** `5c306889923143bddb4b888e1944068d9ee25baa`

**Authority bundle:** `095909e0c27ccac553c457895917b978e2847c90c2015d6b48ce4b63f00de6e0`

**Manifest bundle:** `df30b59877a2d8a0e7c427ac19c289dec7690719659de5541893400a4e393b45`

The full historical regression and focused R96 checker passed: thirteen of thirteen predicate and final-authority paths, 212 executable vectors and 301 generated totality probes. The panel reviewed only the frozen bytes above. No reviewer edited the candidate.

## Role verdicts

| Role | Verdict | Finding |
|---|---|---|
| Human Agency | VETO | A corrupted challenge can still solicit and accept human review, laundering invalid causal provenance into permission to continue. |
| Human Comprehension and Access | VETO | The same state can say “This decision is unavailable,” expose two review actions, then claim work is current. |
| Consequential Leader Value | VETO | Provenance-invalid work can reopen downstream activity, defeating the promised consequential hold. |
| Epistemic Integrity | VETO | `current` can be asserted from a causal chain the system simultaneously rejects as unavailable. |
| Lifecycle / Security / Privacy | VETO | Ordinary review signatures can resolve blocks whose trigger signature no longer verifies. |
| Implementation Correctness | VETO | The provenance verifier governs status only; review generation and revalidation bypass it. |
| Architecture / Integration Reality | PASS | The bounded status path genuinely separates authority from display and fails closed; the remaining defect is a cross-path integration omission, not a false runtime claim. |

## Decisive reproduced escape

Both the correctness and human-value panels independently reproduced this path against the exact Git bytes:

1. Accept `accept_intensive_proof`.
2. Withdraw and replace its two accepted answer heads.
3. Corrupt one authoritative withdrawal transition signature to `AA==`.
4. `currentStatus` returns `{ "status": "not_found", "message": "This decision is unavailable." }`.
5. `unsignedRevalidationEvents` still returns two review requests.
6. The existing signed review events are accepted by `revalidate`.
7. Status becomes current and the lifecycle block resolves.

The exact correctness probe reported:

```text
R96_TRIGGER_TAMPER_ESCAPE={"status":{"status":"not_found","message":"This decision is unavailable."},"unsigned":2,"revalidated":true}
```

`verifyOpenChallengeProvenance` correctly checks the accepted record, challenge fingerprint and context, trigger fingerprint/signature/owner/edge, and later observation edges. `currentStatus` calls it. Review-event generation, review validation and durable revalidation do not.

## Retained gains

R96 does close R95's circular status authority defect. Replacement obligations come from internally resolved missing heads and immutable challenges, visible status is compared with a separate sealed authority snapshot, permitted owners derive from the accepted decision, unsafe arithmetic fails, and six trigger mutations make status fail closed. Repeated-owner and split-owner recovery copy and timing remain truthful.

## Mandatory R97 repair

One authoritative provenance gate must govern status, review generation, review validation and the final durable mutation. On any trigger or observation mismatch it must produce the typed unavailable status, zero review requests, a rejected revalidation, byte-identical revalidation/baseline stores, and a continuing descendant block.

The repair must test owner, action, route, question, signature and time mutation across all three paths. It must also test observation-chain corruption and a self-resealed contextual observation mutation. Review authority should bind validated challenge fingerprints and trigger-transition fingerprints rather than challenge IDs alone.

R75 and the active R77 founder lock remain unchanged. R96 grants no runtime, database, UI, deployment, merge, release or external-action authority.
