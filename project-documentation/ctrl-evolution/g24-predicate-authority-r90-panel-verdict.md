# G24 predicate authority R90 panel verdict

Status: `VETO`

Date: 2026-09-16

Frozen commit: `ecd4e9f634824dd2c0c18d6b8bbb06914165ce66`

Frozen tree: `9f4503f0a8e776d75c664547e403d06c7a6f6f07`

Parent: `828b9fe5042ebd580ddc66ee0dbd3b495c152c44`

Effective-contract blob: `c9530121964bc134f4092925b2749d18b8e9cd85`

Manifest blob: `c94a4f5672f066bfa3554080593db8ab6f9a5b70`

Contract blob: `5355e6cc2d347f94a0c2da765a3e8b58bfbc0931`

Effective-contract SHA-256: `7f3ef3bfcd7693baa471c2bf4c1b6c62d4427d6be61542e47ccada2888b2c020`

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

## Seven-role verdict

| Role | Verdict | Decisive reason |
|---|---|---|
| Correctness and totality | VETO | A successful partial review replaced the complete watched baseline with only the challenged heads, silently dropping unchanged dependencies. |
| Security and adversarial authority | VETO | A later valid change to a dropped dependency could escape the correction bridge without a fresh challenge or human review. |
| Privacy and provenance | VETO | A partial dependency set was labelled current, so provenance coverage could be lost without an authorised dependency-set change. |
| Human agency and accountability | VETO | The human status surface reported nonexistent, empty and null decision identities as current. |
| Leader value and decision usefulness | VETO | A stale or mistyped identity could produce affirmative reassurance instead of a safe unavailable state. |
| Humane UX and language truth | VETO | `This decision is current.` was emitted when no accepted decision existed. |
| Systems architecture and integration | VETO | Revalidation event IDs were not unique, allowing two human authority events to alias into one durable fingerprint and making changed retry bytes invisible. |

## R89 defects genuinely closed

The official R90 suite passed 13/13 paths, 212 executable vectors and 301 generated probes. Independent exact-commit tests also confirmed that R90 genuinely repaired the named R89 failures:

- ordinary revalidation emits nothing after withdrawal until a replacement answer exists;
- a correctly signed hostile pre-reanswer revalidation is rejected independently;
- A to B review followed by B to C creates a fresh challenge and fresh signed review;
- replaying the old first-cycle review does not release a later block;
- canonical structured accepted-request identity closes delimiter aliasing;
- direct route/question bindings and complete head descriptors are signed;
- accepted results remain immutable while watched baselines advance append-only; and
- the same-process authority boundary remains explicit.

Those repairs are retained. The veto concerns new failures revealed after exercising the repaired paths more deeply.

## Defect one: partial baseline shrinkage

An accepted proof began with watched heads A and X. After changing and reviewing A, the baseline still contained both dependencies. After a later change and review affecting only one head, R90 built the next baseline from `currentState.heads`, which contains only open-challenge heads. The new current baseline therefore contained one head and silently lost the unchanged accepted dependency.

The exact probe produced:

```json
{
  "initial_heads": 2,
  "after_review1_heads": 2,
  "open_second": 1,
  "review2": true,
  "after_review2_heads": 1
}
```

Because the change listener watches only members of the latest baseline, a later signed correction or withdrawal of the lost dependency creates no challenge. The predecessor pointer remains correct while the dependency membership becomes false.

## Defect two: revalidation event-ID aliasing

R90 requires distinct humans but does not require distinct `event_id` values. It sorts event references and then fingerprints each reference by calling `find` on the input array. Two correctly signed authority events from different required humans may therefore share one caller-provided event ID. Both signatures validate, but the durable resolution stores the first event reference and fingerprint twice, losing the second human's distinct evidence.

The same alias makes a changed second event invisible on retry: the retry calculation again finds and fingerprints the first event twice, and the prior-resolution path returns before validating the changed second event.

## Defect three: false current-state reassurance

The new singular status projection checks open challenges and prior revalidations, then defaults to `This decision is current.` without first resolving an accepted record. Exact frozen-byte probes returned that affirmative message for:

```text
accepted-does-not-exist
the empty string
null
```

The steering gates remain fail-closed, but the authoritative human-facing status is untruthful. A missing, stale or mistyped identity must never be described as current.

## Secondary audit issue

Multiple answer changes before one review remain blocked and the eventual signed revalidation binds the latest heads. However, R90 coalesces those changes into one challenge whose `resulting_head_fingerprint` records only the first intermediate result. The safety gate holds, but the intervening transition chain is not explicit. R91 must make the coalescing policy and durable audit lineage exact.

## R91 repair rule

R91 must:

1. build each new current baseline from the complete prior baseline;
2. replace exactly the route/question members represented by resolved challenges and preserve every unaffected member;
3. require unique route/question membership, canonical ordering and exact set preservation unless a separately authorised dependency-set evolution exists;
4. reject duplicate revalidation event IDs before replay lookup or signature validation;
5. derive each authority-event identity from the accepted final, challenge-set seal and named human, rather than trusting an arbitrary caller alias;
6. store a one-to-one structured authority entry containing named human, event reference and event fingerprint for each required human;
7. compute idempotent replay from the canonical full event bundle and validate the full bundle before returning a prior resolution;
8. return a typed safe failure and plain unavailable copy for null, empty, unknown or reset-stale accepted IDs;
9. preserve every intervening answer transition through append-only challenge observations, or bind an exact sealed transition-chain set into the final review;
10. execute correctly signed hostile duplicate-ID and changed-retry cases, reordered exact replay, missing/duplicate-human cases, and a multi-head partial-review sequence whose unchanged dependency later changes and re-blocks; and
11. retain every verified R90 repair without broadening runtime, database, UI, deployment, merge, release or external authority.

Only a unanimous seven-role pass on one exact frozen R91 commit may create a founder-ready machine-contract receipt.
