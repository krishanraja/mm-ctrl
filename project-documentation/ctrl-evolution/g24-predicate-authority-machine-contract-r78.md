# G24 predicate authority modular machine contract, R78

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

## What this is

R78 turns the founder-approved R75 authority architecture into a closed, inspectable set of small machine contracts. Each module owns one job. No module can quietly become the whole system, reinterpret another module's result or write lifecycle state.

This is contract data and deterministic verification only. It is not an evaluator, runtime integration, database change or customer interface.

## Governing authority

- R75 commit: `e6494cda6fba4ce8209f99f1611ba3803de34370`
- R75 tree: `3e53f7ca69a0f01192f3e255471a17b81f05f313`
- R75 decision-document blob: `ee48e4b29d787ef3bbb17c9bf2e558cf7c2aebc6`
- R75 decision-document SHA-256: `83d2bc6fd6c1042e1fff83f29904abcc7d74bc130f388aa36933e19e40293410`
- R77 founder-lock commit: `4ab418d7815c914eef155fd017ef362f1983b9a7`
- R77 tree: `06733dcc7292583cad3463030e076a03a7a1bfb1`
- Exact founder call: `approve r75`

The generated [R78 manifest](g24-predicate-authority-r78/00-manifest.json) closes the exact module bytes and bundle fingerprint. It contains no timestamp, environment value or generated prose.

## The conveyor belt

| Module | Owns | Cannot do |
|---|---|---|
| Common envelope | Exact scope, versions, fingerprints and global prohibitions | Accept opaque prose as truth |
| Source adapters | Canonical source facts and their earned meaning | Select a transition result |
| Set completeness | Exact authoritative heads, members, seals and absence proofs | Omit inconvenient or contrary members |
| Semantic authority | Meaning, scope, standing and non-widening derivation | Promote proposals or let issuers claim CTRL's local meaning |
| Transition assemblers | One discriminated bundle for each of thirteen moves | Borrow another move's evidence or authority |
| Deterministic predicates | Typed dependency dispositions and tri-state factual result | Read, write, call a model or grant authority |
| Human authority | Named-human judgement and separate final transition authority | Infer agreement or let a model or workload stand in for a person |
| Gap prioritizer | One eligible human gap, a safe hold or a Krish-led session | Create a question queue or send administration to the leader |
| Gap explainer | One complete plain-language question atom | Invent meaning, route effects or generic business advice |
| External coordination | Lease or conditional-consume proof and recovery states | Pretend a local transaction locks another system |
| Correction invalidation | Complete dependency repair and exact G13 terminal receipts | Rewrite history or leave superseded authority steering |
| Transaction coordinator | The only joined lifecycle write boundary | Reinterpret specialist results or activate a pending state |
| Fact-kind registry | One owner and one resolution class per required dependency | Choose authority dynamically at runtime |
| Fixture registry | Positive specimens and one-dimensional attacks | Act as production input |
| Contract closure | Exact module IDs and closed top-level schemas | Accept silent extension |

## Human experience protected by the contract

The machinery stays backstage.

- CTRL resolves mechanical and administrative gaps itself or routes them to Krish.
- Exactly one unresolved human-owned gap may produce one direct question.
- More than one unresolved human gap produces a safe hold or one decision-specific Krish-led session agenda, never a queue.
- A question must change the real accepted decision by selecting, stopping, bounding or materially reshaping it.
- `Unknown` remains unknown. Free expression remains verbatim and non-authoritative until the named human confirms a structured interpretation and sees the consequence.
- Technical provenance is available one layer deeper, not sprayed across the default surface.
- A completed close cannot erase access, correction, release or close obligations that remain outstanding.

## Authority and consistency protected by the contract

- Mechanical facts, normative human attestations and deterministic derived facts remain distinct.
- Every required dependency has exactly one canonical owner and one resolution class.
- Every external fact kind has one fixed protocol, exact TTL and exact maximum clock skew.
- Withdrawable consent and permission cannot use an immutable lease.
- `transaction_time + maximum_clock_skew < valid_until` is strict. Equality fails.
- Only `finalized` external coordination may steer or project current lifecycle state.
- Human judgement and final transition authority use separate domain-separated receipts even if one explicit gesture intentionally creates both.
- Corrections seal content, permission and scope dependencies and use the exact G13 outcomes: `rebuilt`, `quarantined`, `review_required`, `unaffected_with_reason` or `erased`.

## Deterministic proof

Run:

```text
npm run brain:g24:predicate-r78-check
```

The current candidate proves:

- exact R75 and R77 lineage;
- fifteen closed semantic modules plus one generated manifest;
- exactly thirteen lifecycle variants;
- total owner coverage for every server and human dependency;
- closed external coordination states and edges;
- one-question and real-decision-delta rules;
- fifty-eight mandatory adversarial fixtures; and
- twenty-two in-checker semantic mutations that must be rejected.

The manifest is also rebuilt from reversed source order and must remain byte-identical.

## Authority still closed

R78 does not authorize semantic evaluator implementation, a result-producing success path, runtime or registry wiring, database or schema change, production data, customer UI, external research or mutation, merge, deployment, release, legacy-backend deletion or cross-venture Supabase decision-ledger writes.

## Next gate

Freeze the exact candidate commit and submit that immutable identity to all seven durable judge roles. Any valid veto repairs R78 forward without widening its authority. Only a unanimous seven-role pass may create a founder-ready R79 receipt. Runtime implementation remains a separate founder choice after that.
