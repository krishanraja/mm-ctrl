# G24 immutable route and visible consequence contract, R86

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `ef57412b1b5e135fb530762b085040d84f919b2b28ba4e2622ba00afc15a8fcc`

Manifest bundle fingerprint: `a50bd77e491a192018544247fd6d60b9751cc8dd1618c74b1280307bfc85e8bf`

Effective-contract SHA-256: `20a1c07c5d2c414bbf6036ec5f62e22458dace7823a221cb9ac3f2909e660062`

## Why R86 exists

R85 made the decision path substantially stronger, but independent review found three remaining failures. Validation could reset route-to-proof bindings and authorize two incompatible decisions from the same signed routes. Unknown primitive transition strings could still throw. Most importantly, a person could sign words saying the direction was unchanged while the actual lifecycle paused or closed the work.

R86 repairs those failures forward. R85 remains immutable, useful vetoed evidence under the [R85 panel verdict](g24-predicate-authority-r85-panel-verdict.md); it is not effective authority.

## Effective contract

R86 retains the closed R85 authority path and adds three exact guarantees:

- Route validation is read-only. It resolves issued authority without issuing, resetting or silently rebinding it. One atomic route-and-answer claim binds the route to one predicate fingerprint; the same fingerprint is idempotent and a different fingerprint is rejected.
- Answer currentness is scoped to the authoritative route and exact question. A competing signed answer cannot become simultaneously current under a second proof.
- Every final human render contains an exact transition effect derived from the frozen catalogue: transition, from-state, to-state, authority, invalidation, receipt and one plain-language action. That complete object and the decision delta are inside the final render fingerprint and final authority signature.

All transition lookup is total before dereference. Unknown primitives return typed failure rather than throwing.

## Human experience protected

The person sees the action they are actually authorising. “Pause the intensive proof,” “begin closing the continuing work” and “close this work” cannot be replaced by a vague sentence saying the direction was kept. The technical transition record remains backstage, but its real consequence is visible in ordinary language.

The rest of the R85 experience guarantee remains intact: one consequential call, complete material delta, visible evidence and review boundaries, blocking refusal preserved as refusal, and no unseen evidence steering the decision.

## Independent proof before freeze

The independent checker reconstructs the contract from the frozen R83 semantic base, verifies all signed specimen classes and executes all thirteen predicate and final-authority transitions. It now runs 206 pinned vectors and 300 generated totality probes.

Targeted checks include:

- unknown primitive transition rejection without throw;
- validation-source inspection proving no route issue or reset call;
- same-route competing decisions in both arrival orders;
- one current answer per route and question;
- exact catalogue-derived transition effects on all thirteen final renders; and
- a misleading pause render that says the direction is unchanged, which must fail.

Run:

```text
npm run brain:g24:predicate-r86-check
```

## Bounded claim

R86 proves deterministic same-process contract semantics only. Cross-process compare-and-set, restart durability and shared-consumer races require a separately authorised transactional adapter and remain outside this claim.

## Still not authorized

R86 is local contract data and deterministic conformance evidence only. It does not authorize or implement a semantic evaluator, result-producing lifecycle success branch, runtime integration, live registry, shared cross-process transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R86 commit and submit that immutable identity to all seven durable judge roles. Every R85 escape route must be reproduced against the frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready receipt.
