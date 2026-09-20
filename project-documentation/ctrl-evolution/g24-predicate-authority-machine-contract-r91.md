# G24 complete-baseline and one-to-one review authority contract, R91

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `a1db61d5dbd9967966c925429e968eea4eb5602fb9bb0ceef25a70c807a851c3`

Manifest bundle fingerprint: `37224973e4557d30b906daced1099c4f82341989d9ff9af9d09d59d034717e2c`

Effective-contract SHA-256: `6e6df5e88effca4bf8acf35e4d5a407312859b01afe53517e8663da1f35cae4c`

## Why R91 exists

R90 genuinely closed R89's pre-reanswer escape and proved a second correction cycle. Exact frozen-byte review then found three deeper failures: a partial review could shrink the current baseline and stop watching unchanged dependencies; two signed humans could share one caller event ID and collapse into one durable authority fingerprint; and the human status projection called null, empty and unknown decision identities current. Multiple changes before one review also remained safely blocked but incompletely represented in the durable audit chain.

R91 repairs those failures forward. R90 remains immutable vetoed evidence under the [R90 panel verdict](g24-predicate-authority-r90-panel-verdict.md); it is not effective authority.

## Effective contract

R91 retains every verified R90 repair and adds six exact guarantees:

1. **Complete baseline replacement.** A review starts from the full prior baseline, replaces only challenged route/question members and preserves every unaffected member. Exact key-set equality is required unless a separately authorised dependency-set evolution exists.
2. **One-to-one human authority.** Humans, event references and event fingerprints must each be unique. Every durable authority entry is a structured `{ named_human_id, event_ref, event_fingerprint }` tuple in canonical human order.
3. **Derived review-event identity.** The accepted final, challenge-set seal and named human determine the only valid revalidation event ID. An arbitrary caller alias is rejected.
4. **Full-bundle replay.** Idempotent retry compares the canonical structured event bundle directly. It never maps duplicate references through `find`, and changed second-event bytes cannot hide behind the first event.
5. **Append-only intervening history.** A second answer change while one challenge is open appends a typed challenge observation binding the transition, prior head and resulting head. The successful review names and seals the complete observation set.
6. **Typed human status.** Status resolves a real accepted record before reporting `current`. Null, empty, unknown and reset-stale IDs return `{ status: "not_found", message: "This decision is unavailable." }`.

The accepted decision record remains immutable. Challenges, observations, blocks, repairs, revalidations and baselines remain append-only.

## Independent proof before freeze

The checker reconstructs the authority bundle from source bytes, verifies 192 signed answer-state transitions, all signed final-authority events, six ordinary signed revalidation events, two signed pre-reanswer attack events, two correctly signed duplicate-ID authority events and two signed multi-change review events. It executes all thirteen predicate and final-authority paths, all 212 pinned vectors and 301 generated hostile-input probes.

New decisive sequences are executable:

```text
accept watched heads A and X
→ review A to B
→ current baseline contains B and unchanged X
→ review B to C
→ current baseline still contains C and unchanged X
→ change X
→ fresh challenge and descendant block appear
```

```text
two correctly signed humans submit the same event ID
→ duplicate identity rejects
→ no durable resolution is written
→ changed second-event retry also rejects
```

```text
accept A
→ change A to B
→ change B to C before review
→ one challenge remains open
→ an immutable B-to-C observation is appended
→ signed review binds current C and seals the observation chain
```

```text
query null, empty, unknown or reset-stale accepted ID
→ typed not_found
→ plain unavailable copy
→ never current
```

Run:

```text
npm run brain:g24:predicate-r91-check
```

## Bounded claim

R91 proves deterministic same-process contract semantics only. Its answer-state store, accepted registry, correction bridge, observation registry, baseline registry, block registry and route compare-and-set are executable authority models, not production persistence. Cross-process concurrency, restart durability, database transactions and shared-consumer atomicity require a separately authorised adapter.

## Still not authorized

R91 is local contract data and deterministic conformance evidence only. It does not authorize or implement a production semantic evaluator, result-producing lifecycle runtime, live registry, shared transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R91 commit and submit that immutable identity to all seven durable judge roles. Every R90 counterexample must be reproduced against the frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready machine-contract receipt.
