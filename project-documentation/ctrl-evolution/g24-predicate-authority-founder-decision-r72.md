# G24 predicate authority founder decision, R72

Status: `proposed_founder_choice_not_implementation_authority`

Date: 2026-09-15

## The decision in plain English

R70 proved that CTRL can load only the exact evaluator artifact it expects and fail safely when anything is wrong. It did not prove that the evaluator knows when a real-world condition is true.

R72 answers the next question: **what is CTRL allowed to treat as proof that an engagement can safely move to its next state?**

The recommendation is:

> CTRL should assemble exact facts from current, source-backed records and apply small deterministic rules. An LLM may find, explain or challenge evidence, but it may never turn prose into permission by itself.

This is the strongest fit with the product. The AI does the invisible collection work. The human keeps purpose, judgement and consequential authority. The system asks only for the one missing fact that matters.

## Founder choice requested

Approve one authority model for the next local contract:

### A. Closed structured read-set, recommended

The server assembles one closed, typed fact bundle for the exact transition. Every fact names its source row, version, fingerprint, validity and revocation state. A pure evaluator returns `satisfied`, `unsatisfied` or `indeterminate` from explicit rules.

### B. Signed satisfaction assertions

An approved upstream issuer signs a claim that the precondition is satisfied. This makes the evaluator smaller but moves truth authority into issuer policy, key governance and upstream behavior.

### C. Hybrid with one final authority, recommended treatment of B

Verified signed assertions may enter as provenance-bearing source records when direct server records are unavailable. They do not carry a final `satisfied` boolean. The same closed fact assembler and deterministic evaluator remain the only final predicate authority.

**Recommendation:** approve A with C as the controlled import boundary. Reject B as a parallel truth system.

## Why this is the right product decision

1. It preserves a single Brain and a single truth path.
2. It keeps language models as workers, not memory or permission authorities.
3. It can explain exactly what is known, missing, stale or contradicted.
4. It enables the magical experience: prefill everything the system already knows, then ask one plain question only when the answer can change the next move.
5. It makes correction and self-healing tractable because every result depends on named source versions.
6. It avoids a second signed-claim bureaucracy that can drift from the underlying case.

## The common envelope

Every variant must carry the same non-negotiable envelope:

- exact `fact_kind`, `transition_id` and `precondition_id`;
- case, engagement and predecessor lifecycle version references;
- server evaluation time and explicit validity boundary;
- exact source row identity, schema version, row version and content fingerprint for every input;
- source authority class and revocation state;
- canonical bundle bytes and a domain-separated SHA-256 fingerprint;
- no additional properties and no caller-selectable predicate;
- no opaque prose field that can independently satisfy the predicate.

The server reads and seals the bundle at dispatch. The evaluator never performs its own database query and never receives mutable application objects.

## Thirteen exact fact variants

Shared primitives may be reused, but each transition keeps a separate discriminated variant so similar-looking rules cannot silently become interchangeable.

| Transition | What must be true | Structured facts required |
|---|---|---|
| `open_preparation` | A real person, bounded purpose, permitted source types and review date are named. | subject reference; purpose reference and status; non-empty eligible source-class set; valid review timestamp |
| `accept_intensive_proof` | The decision frame is accepted, permissions are current and the first checkpoint exists. | accepted frame version; active grant set; checkpoint reference; exact current preparation version |
| `close_preparation` | The current preparation is being closed for a named valid reason. | current preparation version; reason enum `cancelled`, `declined` or `withdrawn`; source receipt reference |
| `continue_after_intensive_proof` | There is a next consequential decision or evidenced value checkpoint, plus a clear exit or revisit condition. | next-decision reference or evidenced-value reference; exit/revisit condition reference; current proof-period version |
| `renew_continuing_period` | The next period has a concrete value target and a boundary for stopping or revisiting. | next-decision reference or evidenced-value reference; exit/revisit condition reference; current continuing-period version |
| `pause_intensive_proof` | The exact intensive-proof period being paused is still current. | current period reference, version, state and validity |
| `pause_continuing` | The exact continuing period being paused is still current. | current period reference, version, state and validity |
| `resume_continuing` | Purpose, identity, permissions, audience, freshness, next value and checkpoint have all been revalidated. | purpose version; actor identity bindings; active grants; audience standing; freshness checkpoint; next-value reference; checkpoint reference; each revalidated at |
| `close_intensive_proof` | The exact intensive-proof period being closed is still current. | current period reference, version, state and validity |
| `close_continuing` | The exact continuing period being closed is still current. | current period reference, version, state and validity |
| `close_paused` | The exact paused period being closed is still current. | current period reference, version, state and validity |
| `complete_close` | Access, correction, separate-release and closure obligations are complete or explicitly recorded as outstanding. | exact close-request reference; four typed obligation records; each status `fulfilled` or `recorded_outstanding`; responsible owner and revisit date for every outstanding item |
| `open_new_preparation_after_close` | This is genuinely new work and cannot revive old permissions. | closed predecessor version; new purpose reference; new review timestamp; prior-grant set; proof every prior grant remains revoked or requires fresh issuance |

## Three outcomes, never a guessed boolean

- `satisfied`: every required current fact exists and the deterministic rule passes.
- `unsatisfied`: an authoritative current fact contradicts the rule, such as an expired grant or wrong period state.
- `indeterminate`: a required fact is absent, ambiguous, stale, unreadable or cannot be proven current.

Only `satisfied` may produce a precondition proof. Both other outcomes hold without write. Missing information is not the same as a negative answer.

## Freshness and correction

The result must bind to server time, the predecessor lifecycle version and every source version in one dispatch snapshot. Before transition commit, compare-and-set must confirm that none changed. If a dependency is corrected, revoked, superseded or expires before commit, discard the result and re-evaluate from a fresh bundle.

After commit, later correction must preserve the historical receipt and invalidate every still-pending downstream projection that depended on the superseded fact. History remains visible; stale authority cannot steer new work.

## What signed assertions may do

A signed assertion is useful only when it proves who made a bounded claim about named source material. It must include issuer, verifier policy, claim type, scope, subject, source identities and versions, issue time, expiry, nonce and signature.

After verification it becomes one typed source record. It cannot:

- assert the final precondition boolean;
- override a current contradictory server record;
- omit source identities or freshness;
- survive issuer revocation or expiry;
- authorize a transition by itself.

Leader and operator agreement receipts remain human authority artifacts. They are checked separately from whether the factual precondition is satisfied.

## The invisible product experience

This machinery should not become a form, dashboard or lesson. The operator and customer experience is:

1. CTRL quietly gathers what is already known.
2. It detects the smallest consequential gap.
3. It asks one concrete question in ordinary language, or prompts Krish to gather it in the next live session.
4. It explains what that answer would change only when the person asks for depth.
5. It never asks the customer to confirm information the system can verify itself.

Examples:

- Not: “Provide the lifecycle precondition evidence.”
- Customer: “What would make you stop or rethink this after the first month?”
- Operator: “Her permissions are current. The missing piece is a result that would justify continuing. Ask for that in Thursday's session.”
- Hold: “The access agreement expired yesterday. Nothing will move until it is renewed.”

## Modular conveyor-belt ownership

This must not become one giant prompt or one giant evaluator.

| Module | Single responsibility |
|---|---|
| fact adapters | translate one approved canonical store into typed source facts |
| transition assemblers | build exactly one of the thirteen closed bundles |
| provenance verifier | verify versions, fingerprints, revocation and validity |
| deterministic predicates | evaluate one transition variant with no I/O or LLM |
| authority verifier | validate the separate human or workload authority receipt |
| gap explainer | translate `indeterminate` reasons into one useful next question |
| correction invalidator | find and demote pending descendants of changed facts |
| receipt writer | persist only after predicate, authority and compare-and-set all pass |

Each module needs its own narrow contract, fixtures and independent review. The orchestrator may route work but may not reinterpret a specialist result.

## Judge theory routing

At the next review, the panel should load only the relevant theory at the relevant moment:

- Human Agency: human authority separation and first/last gate doctrine.
- Epistemic Integrity: source, freshness, uncertainty and model-worker boundaries from `current-to-target-transition-architecture.md` and `context-circulation-architecture.md`.
- Living Brain Integrity: append-only versions, proposals and correction cascades from `g13-living-brain-physical-contract.md`.
- Subject/Audience/Lifecycle Safety: exact grants, audience standing, retention and revocation rules.
- Human Comprehension: gap prompts must pass the twelve-year-old comprehension test and reveal depth progressively.
- Implementation Reality: read-set atomicity, compare-and-set, replay cost and adapter isolation.
- Consequential Usefulness: every requested fact must change a real transition or be deleted.

`docs/history` remains advisory and dormant. A judge may load a named history card when its trigger matches, but historical labels never become current authority.

## Rejected shortcuts

- “Evidence exists” as proof.
- An LLM saying the prose sounds sufficient.
- A confidence score standing in for authority or completeness.
- One generic fact bag shared by all transitions.
- Caller-supplied predicate names, schemas or source paths.
- A signed `true` claim with no inspectable source lineage.
- Re-asking the leader for facts already held in authoritative records.

## Locked-revision boundary

Immutable baseline: R71 commit `702bc226ab36a870a51c3bbb9ef98009b9be128e`, tree `69f11d66eb7334619b41eebff08a8609fe480ea3`.

Declared delta: add this provisional founder-decision brief, route the two canonical state pointers plus the review ledger to it, and update only the verification scripts needed to keep the frozen R71 receipt and current next action testable across later commits. R70, R71 receipt files, all executable evaluator files, schemas, migrations, product UI and deployment state remain unchanged.

## Authority and next gate

This document is a recommendation and decision surface only. It authorizes no schema, evaluator semantics, result or evidence production, runtime connection, database write, UI change, deployment or external action.

If the founder approves the recommendation, the next gate is a versioned machine contract for the thirteen variants and shared primitives, followed by independent semantic and adversarial review before any evaluator implementation.
