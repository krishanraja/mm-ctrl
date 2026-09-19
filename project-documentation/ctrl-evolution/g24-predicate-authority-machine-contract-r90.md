# G24 current-head recovery and repeatable self-healing contract, R90

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `2b1c99f35633ba0639d925fb4690a02d1bafcf56c5b51d3bbf166c51ff1fcbe5`

Manifest bundle fingerprint: `99b13dbcc6dbfc64e98563eef9cca5ba83598d2b1bbf293b8f8b7a6d05f8e7be`

Effective-contract SHA-256: `7f3ef3bfcd7693baa471c2bf4c1b6c62d4427d6be61542e47ccada2888b2c020`

## Why R90 exists

R89 made accepted history immutable and added signed revalidation, but all seven reviewers found that a withdrawn, resolver-missing answer could still produce a signable request claiming work would resume using the current answer. The architecture reviewer also showed that the watched dependency baseline never advanced after revalidation, so a second answer change could escape self-healing.

R90 repairs both failures forward. R89 remains immutable vetoed evidence under the [R89 panel verdict](g24-predicate-authority-r89-panel-verdict.md); it is not effective authority.

## Effective contract

R90 retains every genuine R89 repair and adds six exact guarantees:

1. **Canonical request identity.** Accepted identity is the hash of a canonical typed object containing transition, subject, case and reserved transition version. Delimiter ambiguity cannot alias tuples.
2. **Direct challenge binding.** Every challenge names its route, question and exact watched baseline rather than recovering them indirectly from mutable specimen lookup.
3. **Current-head proof.** Signed revalidation binds route, question, state ID, state version, issuer sequence, fingerprint and standing for every challenged dependency.
4. **Withdrawal gate at both boundaries.** The request builder emits nothing until a withdrawn dependency has a strictly post-withdraw head whose standing is `current`. Event validation and revalidation consumption independently recompute and require the same condition.
5. **Append-only dependency baselines.** Acceptance creates the first watched baseline. Each successful revalidation appends a new baseline linked to its predecessor; the accepted record remains immutable.
6. **Repeatable self-healing.** The change listener watches the latest baseline. After A to B is repaired, B to C creates a fresh challenge, descendant block and required signed review.

A single authoritative status projection derives from the same state: replacement required, replacement ready but review pending, or reviewed and reopened. It cannot say work uses a current answer while the answer resolver says `missing`.

## Independent proof before freeze

The checker reconstructs the authority bundle from source bytes, verifies 192 signed answer-state transitions, six valid signed revalidation events, two correctly signed hostile pre-reanswer events and every signed final-authority event, executes all thirteen predicate and final-authority paths, executes all 212 pinned vectors, and runs 301 generated hostile-input probes.

New decisive sequences are executable:

```text
accept A
→ withdraw A
→ ordinary revalidation request count is zero
→ correctly signed pre-reanswer review rejects
→ reanswer B
→ review request becomes available
→ signed review succeeds
```

and:

```text
accept A
→ correct B
→ signed review succeeds and appends baseline B
→ correct B to C
→ fresh challenge and block appear
→ successor rejects
→ second fresh signed review succeeds
```

Run:

```text
npm run brain:g24:predicate-r90-check
```

## Bounded claim

R90 proves deterministic same-process contract semantics only. Its answer-state store, accepted registry, correction bridge, baseline registry, block registry and route compare-and-set are executable authority models, not production persistence. Cross-process concurrency, restart durability, database transactions and shared-consumer atomicity require a separately authorised adapter.

## Still not authorized

R90 is local contract data and deterministic conformance evidence only. It does not authorize or implement a production semantic evaluator, result-producing lifecycle runtime, live registry, shared transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R90 commit and submit that immutable identity to all seven durable judge roles. Every R89 escape route must be reproduced against the frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready receipt.
