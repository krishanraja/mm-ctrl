# G24 predicate authority R91 panel verdict

Status: `VETO`

Date: 2026-09-16

Frozen commit: `eddb4ea1ff870c3f87ccd3ea7f89775f92e0b5eb`

Frozen tree: `308989549cc5400541fd1654d836de62e577fdcc`

Parent: `e5f7172a8b0b2836443fe005c83c261655707d88`

Contract blob: `18c0c96da6d5d7355c50c13dd7b69e1c870cca3f`

Manifest blob: `a6121fa10f1093c075af3091aa26ff7ae26a7ae4`

Effective-contract blob: `6c2e6c71533dd62c6c15a263a32ee9384bfa5d9a`

Effective-contract SHA-256: `6e6df5e88effca4bf8acf35e4d5a407312859b01afe53517e8663da1f35cae4c`

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Seven-role verdict

| Role | Verdict | Decisive reason |
|---|---|---|
| Correctness and totality | VETO | R91 accepted a review completed before an intervening answer transition existed, and an exposed throwing listener could make an append report failure after state and correction effects committed. |
| Security and adversarial authority | VETO | Correctly signed review envelopes could pre-authorise a later answer transition because temporal validation ignored observation and current-head authority times. |
| Privacy and provenance | VETO | Durable provenance and current status claimed humans reviewed a transition two minutes before its recorded observation; distinct signable observation states also reused event references. |
| Human agency and accountability | VETO | In a valid mixed withdrawal-plus-correction state, the status could hide the missing-answer obligation and tell the leader only to review even though review requests were correctly unavailable. |
| Leader value and decision usefulness | VETO | Identical outstanding obligations produced different next-action guidance solely from append order. |
| Humane UX and language truth | VETO | “Review this change” was incomplete and non-executable while another open dependency still required a replacement answer. |
| Systems architecture and integration | VETO | `resolved_at` and baseline `created_at` depended on caller array order rather than the final required signature or a canonical server time. |

## R90 defects genuinely closed

The official R91 suite passed 13/13 paths, 212 executable vectors and 301 generated probes. Independent exact-commit tests confirmed that R91 genuinely repaired every named R90 defect:

- each reviewed baseline starts from the complete prior dependency set;
- unchanged dependencies remain watched and a later valid change re-blocks;
- humans, event references and event fingerprints are one-to-one within a review bundle;
- caller event IDs are derived and duplicate IDs reject before replay;
- canonical authority entries make exact reordered replay idempotent;
- changed duplicate retry bytes cannot alias an accepted resolution;
- multiple pre-review answer changes create append-only observations;
- the signed review binds the observation set;
- null, empty, unknown and reset-stale IDs return typed `not_found`; and
- the R89 withdrawal and repeated-cycle repairs remain intact.

Those repairs are retained. The veto concerns new causal, finality and human-guidance failures revealed after exercising the repaired paths more deeply.

## Defect one: review authority predates what it reviews

The exact signed multi-change fixture produced:

```json
{
  "first_transition_at": "2026-09-16T08:55:00Z",
  "observed_transition_at": "2026-09-16T09:12:00Z",
  "review_authorized_at": ["2026-09-16T09:10:00Z", "2026-09-16T09:10:00Z"],
  "revalidate_result": true,
  "status": "current"
}
```

R91 compared each authority time with the original challenge but never with every bound observation or the authoritative current-head transition. The exact signed bytes could therefore authorise a change that had not yet happened.

## Defect two: resolution time depends on caller order

Authority entries are canonically sorted, but `resolved_at` used `events[0].authorized_at`. If the leader signs at 09:10 and Krish at 09:14, forward and reversed input produce different durable resolution and baseline fingerprints. The earlier-first ordering can record completion before the final required signer granted authority.

## Defect three: event identity omits evolving review state

Within one open challenge, A to B and then B to C produced different signed payloads and different observation seals while retaining the same per-human event IDs. The stored tuple fingerprint disambiguates the selected payload inside one resolution, but the event reference itself is not immutable across signable versions.

## Defect four: mixed-state guidance is append-order dependent

Two valid signed sequences created the same outstanding obligations:

```text
withdraw one consumed answer
correct the other consumed answer
```

and the reverse order. Both correctly stayed blocked and emitted zero review requests until the withdrawn answer was replaced. The withdrawal-then-correction ordering nevertheless surfaced only “review this change with Krish,” while the reverse ordering correctly said to choose a new answer and review it. The singular human status used the last appended challenge instead of deriving the first executable next step from all open heads.

## Defect five: listener failure reports an ambiguous append

The modeled answer-authority service committed store and snapshot state before invoking exposed listeners. A throwing listener made the call throw after the new current head, challenge and block had already committed. The conformance hook must either be private, transactional or failure-isolated so the public result cannot contradict committed state.

## R92 repair rule

R92 must:

1. bind each signed review event to the complete canonical observation records and current-head transition times;
2. verify every observation fingerprint and uninterrupted prior-to-resulting chain before accepting review;
3. require every authority time to be at or after every challenged, observed and current-head transition it reviews;
4. derive event identity from accepted final, challenge seal, observation seal, current-head seal, named human and authority time, or enforce an equivalent immutable event-version mapping;
5. derive `resolved_at` deterministically as the maximum validated human authority time, or a later server commit time, never array position;
6. make baseline `created_at` equal that canonical resolution time;
7. execute correctly signed unequal-time forward and reversed bundles and require byte-identical resolution and baseline fingerprints;
8. execute a correctly signed event one millisecond before the latest observation and prove no resolution, baseline append, block release or current status;
9. derive mixed-state guidance from all open heads, with any missing or withdrawn answer taking precedence over review-only copy;
10. execute both withdrawal/correction permutations, require identical replacement-first status and zero review requests, then prove reanswer, signed review, reopen and later re-block;
11. isolate or transactionally contain listener failure and execute an exact throwing-listener test; and
12. retain every verified R91 repair without broadening runtime, database, UI, deployment, merge, release or external authority.

Only a unanimous seven-role pass on one exact frozen R92 commit may create a founder-ready machine-contract receipt.
