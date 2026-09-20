# G24 authoritative answer-state and atomic finality contract, R87

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `53026094327ac3d9707f360df680eea7cb05a6b965381436a3a9fdd35658e49b`

Manifest bundle fingerprint: `35b4f8f42b63176f2a7c79328e9180bf4920dc261e2254e8177118b2e7502dd1`

Effective-contract SHA-256: `06828b506242228f7fe83805b662810232d4b461a71e0f2307e1f773e8f4452d`

## Why R87 exists

R86 made every final lifecycle consequence visible and totalised the public route and normative validators. Independent review then found that current human truth was still selected by validation order and that a rejected final request could claim route authority before the full human-authority transaction succeeded.

R87 repairs those failures forward. R86 remains immutable, useful vetoed evidence under the [R86 panel verdict](g24-predicate-authority-r86-panel-verdict.md); it is not effective authority.

## Effective contract

R87 retains the complete R86 authority path and adds a sealed answer-state authority layer:

- Every route and question resolves through an ordered answer-state history with an issuer sequence, current signed event, event fingerprint, superseded event, standing, complete admitted-event member set, set seal and authoritative head fingerprint.
- The admitted-event journal is distinct from the executable specimen catalogue: specimens are possible signed inputs used for conformance tests, while only events admitted by the authority service enter the ordered history. Within that journal, sequences are gapless and unique, state identifiers and versions are unique, every record names its immediate predecessor, and each canonical member set is exactly the cumulative history through that record.
- Exactly one current head may steer. None is missing, more than one is ambiguous, and superseded, withdrawn, delayed or unsealed answers are non-steering.
- The predicate proof binds every current answer-state head. Presenting option B before option A cannot make B current; only a newer authoritative head can change currentness.
- Predicate validation is pure. It validates evidence, routes, answer heads and reconciled decision without issuing, resetting or committing authority.
- The final coordinator validates predicate, human-visible transition effect, final receipt, final human authority, binding and expiry before one compare-and-set commits route-to-proof authority. Failed render or authority validation writes nothing. Exact accepted retry is idempotent; a successful final blocks a competing proof.
- Every transition-taking public builder and validator rejects an unknown primitive transition without throwing.

## Human experience protected

R86’s human-facing PASS is preserved. The person sees and signs the actual action - start, continue, pause, resume, begin closing or close - plus every material decision change. R87 strengthens the invisible foundation: the system cannot decide which of their signed answers is current merely because one request arrived first.

## Independent proof before freeze

The independent checker reconstructs the contract from frozen source bytes, verifies all signed specimen classes and executes all thirteen predicate and final-authority transitions. It runs 212 pinned vectors and 301 generated hostile-input probes.

New attacks cover:

- current versus superseded answer;
- explicit withdrawal;
- equal-sequence conflicting heads;
- incomplete member-set seal;
- delayed stale answer;
- skipped, duplicated or conflicting issuer sequence;
- broken immediate-predecessor link;
- incomplete or non-canonical cumulative membership even when an attacker recomputes the member seal;
- current answer resolution in both validation orders;
- authoritative head advancement independent of validation order;
- rejected final render leaving no route claim;
- rejected final authority leaving no route claim;
- successful final idempotence and competitor rejection; and
- unknown transition across route, normative and transition-building entry points.

Run:

```text
npm run brain:g24:predicate-r87-check
```

## Bounded claim

R87 proves deterministic same-process contract semantics only. The answer-state and route compare-and-set stores are executable authority models, not production persistence. Cross-process concurrency, restart durability and shared-consumer transactions require a separately authorised database adapter and remain outside this claim.

## Still not authorized

R87 is local contract data and deterministic conformance evidence only. It does not authorize or implement a semantic evaluator, result-producing lifecycle success branch, runtime integration, live registry, shared cross-process transaction adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R87 commit and submit that immutable identity to all seven durable judge roles. Every R86 escape route must be reproduced against the frozen bytes, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready receipt.
