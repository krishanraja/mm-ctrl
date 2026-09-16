# G24 causally ordered review and humane recovery contract, R92

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `96632df91cb1555cef6e5e00a14bed6b66c6c83b3663e30362799a71893ed955`

Manifest bundle fingerprint: `cf46160957721f2ba806511a3466fd1755e4196f5e51cbc498b6713c8f9c5847`

Effective-contract SHA-256: `6e83e543354ba665955e30b8acd1c558f9af0762293edf8e00cd7c773be18f43`

## Why R92 exists

R91 genuinely closed R90's incomplete-baseline, duplicate-identity and unavailable-status failures. Exact frozen-byte review then found five deeper faults: review authority could predate an answer observation it claimed to cover; resolution time depended on caller event order; evolving review payloads could reuse event identity; mixed correction and withdrawal guidance depended on append order and could obscure the replacement-first obligation; and a throwing exposed listener could make a successful committed transition look failed.

R92 repairs those failures forward. R91 remains immutable vetoed evidence under the [R91 panel verdict](g24-predicate-authority-r91-panel-verdict.md); it is not effective authority. R75 remains the governing founder decision.

## Effective contract

R92 retains every verified R91 repair and adds six exact guarantees:

1. **Causal review authority.** Every signed review event must be at or after the latest challenged transition, intervening observation and current reviewed answer head. A correctly signed event one millisecond too early is rejected.
2. **State-bound review identity.** Review-event identity derives from the accepted final, challenge-set seal, observation-set seal, complete current-head seal, named human and review time. A new observation, current head or authority time necessarily creates a new event reference.
3. **Order-independent durable time.** Resolution and successor-baseline time are the canonical maximum of all valid human authority times. Reversing two unequal-time signed events produces byte-identical durable records.
4. **Mixed-state recovery.** If any withdrawal still lacks a current replacement, the only status is `replacement_required` and no normal review request is emitted. Once replacement exists, one `review_required` status covers every open change. Correction/withdrawal append order cannot change that guidance.
5. **Listener-failure isolation.** A committed answer transition and the correction bridge are not reported as failed because a later observer throws. Listener failure is isolated, and explicit unsubscribe is idempotent.
6. **Complete observation-chain proof.** Each observation is schema-checked, fingerprint-checked, time-bound to its signed source transition and chained from the challenged head to the exact current head before review can resolve.

The accepted decision record remains immutable. Challenges, observations, blocks, repairs, revalidations and baselines remain append-only. The complete-baseline and one-to-one authority guarantees introduced in R91 remain mandatory.

## Independent proof before freeze

The checker reconstructs the authority bundle from seven source modules, verifies the signed answer-state and final-authority fixtures plus sixteen valid or hostile signed revalidation specimens, executes all thirteen predicate and final-authority paths, all 212 pinned vectors and 301 generated hostile-input probes.

New decisive sequences are executable:

```text
change A to B
→ change B to C at 09:12
→ correctly signed review claims 09:11:59.999
→ review rejects
→ challenge, baseline and descendant block remain unchanged
```

```text
leader signs at T+1 minute; Krish signs at T+2 minutes
→ forward event order resolves at T+2
→ reverse event order resolves at T+2
→ resolution and complete successor baseline are byte-identical
```

```text
withdraw A; correct X
→ replacement_required; zero review requests
correct X; withdraw A
→ the identical replacement_required status; zero review requests
replace A
→ one review_required status covers both changes
→ exact signed review reopens work
→ a later change creates a fresh block
```

```text
commit a valid answer transition
→ correction challenge and block append
→ an unrelated exposed listener throws
→ caller still receives success
→ authoritative answer, challenge and block remain consistent
```

Run:

```text
npm run brain:g24:predicate-r92-check
```

## Bounded claim

R92 proves deterministic same-process contract semantics only. Its authority services and append-only registries are executable models, not production persistence. Cross-process concurrency, restart durability, database transactions, delivery semantics and shared-consumer atomicity require a separately authorised adapter.

## Still not authorized

R92 is local contract data and deterministic conformance evidence only. It does not authorize or implement a production semantic evaluator, lifecycle runtime, live registry, shared transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R92 commit and submit that immutable commit and tree to all seven durable judge roles. Every R91 counterexample must be reproduced against those frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready machine-contract receipt.
