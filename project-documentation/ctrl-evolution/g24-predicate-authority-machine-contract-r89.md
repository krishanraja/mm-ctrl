# G24 immutable accepted history and signed revalidation contract, R89

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `72449c9d53db9fbbe4bd7487493a206d0409bc6835e757dae6d7d47b5226a5d2`

Manifest bundle fingerprint: `9b84b4872638916b397bfb2374b8ccc26c6b88563360b4a995ba7ab427ebf808`

Effective-contract SHA-256: `ae5b594cc61a7ad628491d012acc30cf3948cc7c1bc164cde3b8665872e770da`

## Why R89 exists

R88 introduced pinned answer history and an accepted-final registry, but independent review found that a failed append could still mutate the live store, descendant blocking was merely descriptive, accepted records were rewritten after commitment, caller-controlled receipt IDs could alias durable history, withdrawal offered no executable return path, and the claimed answer-state vectors were not actually run.

R89 repairs those defects forward. R88 remains immutable vetoed evidence under the [R88 panel verdict](g24-predicate-authority-r88-panel-verdict.md); it is not effective authority.

## Effective contract

R89 retains every genuine R88 repair and adds six joined guarantees:

1. **Atomic answer-state append.** A transition is staged against cloned store and snapshot bytes. Signature, predecessor, membership, chain and snapshot validation complete before the live state changes or any listener fires.
2. **Immutable accepted results.** The accepted-final record never changes after commit. Later standing is expressed by separate append-only challenge, descendant-block, repair and revalidation records.
3. **Server-bound durable identity.** Accepted and history IDs derive from transition, subject, case and reserved transition version. Reusing a caller receipt ID cannot alias two accepted results.
4. **Executable descendant blocking.** A challenged accepted predecessor returns `predecessor_challenged` for real successor predicates. Exact accepted retry remains idempotent; changed bytes under its identity still collide.
5. **Signed self-healing.** Correction or withdrawal creates truthful human-review status and exact challenge, block and repair records. Reopening requires the original final-authority humans to sign the exact open challenge set and current answer heads. Byte-identical revalidation retry is idempotent; altered or cross-human authority fails.
6. **Withdrawal recovery.** Withdrawal safe-holds work. A signed reanswer creates a current head, but descendants remain blocked until the named humans review and sign revalidation.

Predicate validation remains pure apart from reading the explicit block registry. Failed shape, fingerprint, render, receipt, authority, binding, expiry, collision or answer-state append leaves route and answer authority unchanged.

## Human experience protected

The committed call is never silently rewritten. The person sees the smallest truthful consequence:

- correction: “Your earlier decision stays on record. Nothing else will move until you review this change with Krish.”
- withdrawal: “Your earlier decision stays on record. Nothing else will move until you choose a new answer and review it with Krish.”
- reopening: “You reviewed the change with Krish. Work can move again using your current answer.”

These are state explanations, not congratulatory or theatrical copy. The machinery remains backstage.

## Independent proof before freeze

The checker reconstructs the authority bundle from source bytes, verifies 142 signed answer-state transitions, four signed revalidation events and every signed final-authority event, executes all thirteen predicate and final-authority paths, executes all 212 pinned vectors including the six answer-state vectors, and runs 301 generated hostile-input probes. It adds explicit attacks for:

- invalid signed append with byte-identical rollback and zero listener effect;
- immutable accepted-record history after correction and withdrawal;
- actual successor blocking and signed reopening;
- current-head binding after withdrawal and signed reanswer;
- altered and cross-human revalidation;
- duplicate caller receipt IDs across distinct accepted transitions;
- exact accepted and revalidation replay; and
- the complete R78 through R88 attack history.

Run:

```text
npm run brain:g24:predicate-r89-check
```

## Bounded claim

R89 proves deterministic same-process contract semantics only. Its answer-state store, accepted registry, correction bridge, block registry and route compare-and-set are executable authority models, not production persistence. Cross-process concurrency, restart durability, database transactions and shared-consumer atomicity require a separately authorised adapter.

## Still not authorized

R89 is local contract data and deterministic conformance evidence only. It does not authorize or implement a production semantic evaluator, result-producing lifecycle runtime, live registry, shared transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R89 commit and submit that immutable identity to all seven durable judge roles. Every R88 escape route must be reproduced against the frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready receipt.
