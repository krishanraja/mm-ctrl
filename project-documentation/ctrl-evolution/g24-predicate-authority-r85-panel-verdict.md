# G24 predicate authority R85 panel verdict

Status: `VETOED_REPAIR_REQUIRED`

Date: 2026-09-16

## Frozen submission

- Commit: `6166a59d0b8a9c8654262740f8d6f19b9b5fd11e`
- Tree: `fd270b8c42681075fe50613d7a74c897544b76d8`
- Parent: `571e6497c6b75f4a6a742f366b54517f9f1916cc`
- Effective-contract blob: `c7d20fb952d0b509ffc08c594f723fd7994c71a0`
- Manifest blob: `64e893025d58c4f8a3a81ce21ad51117f8e42683`
- Contract-document blob: `6244661d8678a94d9cc268ad5e83a40596a42a88`
- R84 verdict blob: `e0232bf890211ae440aca357c7aaedd11e0c4358`
- Authority bundle fingerprint: `d172bfb566c56c964da5296a04cd8bbbff5c2d779d8d7c75f22adfd73367e963`
- Manifest bundle fingerprint: `6859e3c244b7e09662c66e62e3290bf1baafe1856403b33d66c4cdf76462999c`
- Effective-contract SHA-256: `57e971240ba3f8d90034d1e628b239187f0adb17fe31913734f006fb761ddfb0`

The official materializer and checker pass all thirteen predicate and final-authority transition paths, 205 executable vectors and 300 generated totality probes. Those checks are genuine but insufficient for acceptance.

## Seven-role verdict

| Durable role | Verdict | Fresh blocking escape route |
|---|---|---|
| Human Agency | VETO | A person can sign “kept the current direction” while the actual transition pauses, begins closing or closes the work. |
| Human Comprehension and Access | VETO | The final surface omits the actual lifecycle consequence, so the signed words do not explain the action being authorised. |
| Consequential Usefulness | VETO | No-decision-delta transitions hide the material operational effect precisely when a clear stop, pause or close matters most. |
| Epistemic Integrity | VETO | Predicate validation reissues routes and resets proof bindings, so the same signed route can satisfy two incompatible decision proofs. |
| Living Brain Integrity | VETO | Route-bound answer currentness is absent; two signed answers for the same route and question can both remain apparently current. |
| Subject, Audience and Lifecycle Safety | VETO | The final signed representation can contradict the actual from-state, to-state, invalidation and receipt consequence. |
| Behavioural and Implementation Reality | VETO | An unknown primitive transition string reaches `humanGapSetForTransition` and throws instead of returning a typed rejection. |

## Genuine R85 repairs retained

R85 closes the R84 attacks for evidence closure, visible decision deltas, blocking free-expression meanings, signed authoritative routes, closed derivation dispatch, complete freshness boundaries, grant validity, typed predecessor joins, final predicate/evidence resolution and staged external consume state. Those gains carry forward unchanged.

## Root cause

R85 made routes authoritative but let validation recreate the authority it was meant to inspect. It also treated “no decision-field delta” as “no meaningful consequence,” even when the lifecycle itself changed. Finally, one transition helper assumed the lookup had already succeeded, leaving a primitive-string throw path.

## R86 repair rule

R86 must:

1. make predicate validation read-only with respect to route issuance and reset;
2. bind each authoritative route to one predicate fingerprint using compare-and-set semantics, with same-fingerprint idempotence and different-fingerprint rejection;
3. bind one current signed answer per route and question, and reject competing current answers;
4. prove competing valid decisions in both arrival orders using the same routes;
5. totalise transition lookup before any dereference and pin unknown-string regression tests;
6. derive an exact human-visible transition effect from the catalogue for all thirteen transitions, including from-state, to-state, authority, invalidation, receipt and a plain-language action; and
7. bind that effect into the final render and signature so pause, closing and close can never be described as an unchanged direction.

No R86 founder-ready receipt may exist until all seven roles pass one exact frozen commit. Runtime, database, UI, deployment, merge, release and external authority remain closed.
