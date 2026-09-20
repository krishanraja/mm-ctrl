# G24 R4 terminal trust-seam candidate

**Status:** Proposed repaired architecture, pending fresh council clearance and founder lock

**Date:** 12 September 2026

**Purpose:** Apply only the three root repairs ordered by `g24-r3-architecture-council-002` while preserving the G24 R1 product architecture, the G24 R2 experience direction and every R3 strength.

**R3 frozen submission:**

- blueprint `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5`
- machine contract `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09`
- delta `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb`
- adjudication `abe26c55559950c749d1f203444fe0cac452812182646478e546b82ed841829a`

**R3 council result:** `BLOCKED_PENDING_REPAIR`.

**Authority:** Local architecture repair, deterministic validation, fresh council review and durable state records only. Every external action remains closed.

## Normative precedence

R4 is an exact amendment to R3. It replaces only:

1. the production and version binding for selector-eligible epistemic outcomes;
2. the engagement state set, transition graph and its relationship to the separate R1 Release object; and
3. the selector treatment of invalid controlling state, valid unresolved evidence conflict and provisional diagnostics.

Where R4 and R3 conflict in those three areas, R4 governs. Every other R3 rule remains unchanged. R4 creates no new canonical root and grants no external capability.

## Repair 1: bind epistemic eligibility to existing R1 authority

R1 already owns governance policy, source qualification, the independent challenger, evidence evaluation and canonical evidence. R4 does not create another evidence system. It makes the current version of that existing authority an input to R3's selector.

Every selector run must resolve two current references:

1. **`epistemic_policy_version_ref`**: the accepted version of the R1 governance policy that determines source-class capability, trusted-cutoff derivation, independence requirements, use-specific sufficiency and applicability, causal-promotion requirements and contradiction treatment.
2. **`independent_challenger_result_version_ref`**: the current R1 independent-challenger result for the exact decision requirement, evidence-coverage version, trusted cutoff and policy version. It records either a located countercase, `none_found_within_declared_boundary` plus the exact search boundary, or `indeterminate`.

Only trusted evaluation under those references may produce selector-eligible values for:

- source capability;
- provenance-root independence requirement and result;
- use-specific sufficiency;
- applicability;
- causal standing;
- contradiction treatment; and
- countercase status.

A model may propose evidence, labels, a countercase or a route. Its proposal has no selector standing until the trusted evaluation applies the current policy and challenger result to current canonical references.

Both reference versions travel in the selector input, output watermarks and invalidation set. A missing, unknown, stale, invalid, inapplicable or indeterminate policy or challenger result returns `abstain_hold`. A policy or challenger version change invalidates the prior selector result before use.

The exact physical field name, exhaustive source matrix, numeric threshold and provider remain G24.B/C decisions. The ownership and fail-closed semantics do not.

## Repair 2: one exact engagement graph, separate from Release

The engagement state set is exactly:

- `preparing`;
- `intensive_proof`;
- `continuing`;
- `paused`;
- `closing`; and
- `closed`.

`released` is not an engagement state. Release remains the separate R1 canonical object.

### Universal transition envelope

Every edge below consumes an exact current `from` version and records:

- named human actor or actors;
- authority and precondition;
- idempotency key;
- before and after references;
- exact invalidation effects; and
- an append-only receipt.

A stale version, absent authority, invalid edge or duplicate with different content fails closed. The table is exhaustive; grouped pseudo-states and implied edges are forbidden.

### Exact transition graph

| Edge | Named human authority | Precondition | Invalidation and receipt |
|---|---|---|---|
| `none -> preparing` | Krish | a new bounded operator-private preparation decision names subject, purpose, eligible source classes and review date | opens a new period version; records no-contact state |
| `preparing -> intensive_proof` | named leader and Krish as Mindmake authority | both accept the engagement purpose, accepted decision frame and exact current permissions | records active grants and checkpoint |
| `preparing -> closed` | Krish cancelling, or Krish recording the named leader's decline or withdrawal | current preparation version and reason | invalidates every prepared and unsent derivative; records preparation close |
| `intensive_proof -> continuing` | named leader and Krish | explicit agreement on the next consequential decision or evidenced value, checkpoint and exit or revisit condition | creates a continuing period version |
| `continuing -> continuing` | named leader and Krish | fresh agreement at the current checkpoint on the next decision or evidenced value and exit or revisit condition | creates a new continuing period version |
| `intensive_proof -> paused` | named leader or Krish | current period and pause decision | invalidates unsent interventions; records pause |
| `continuing -> paused` | named leader or Krish | current period and pause decision | invalidates unsent interventions; records pause |
| `paused -> continuing` | named leader and Krish | purpose, identity, grants, audience, standing, freshness, next value and checkpoint are revalidated | creates a new period; old grants remain expired |
| `intensive_proof -> closing` | named leader or Krish | current period and close request | blocks new decision-shaping work; records close request |
| `continuing -> closing` | named leader or Krish | current period and close request | blocks new decision-shaping work; records close request |
| `paused -> closing` | named leader or Krish | current period and close request | blocks new decision-shaping work; records close request |
| `closing -> closed` | Krish recording completion under the named human close request | access, correction, separately requested release and close obligations are fulfilled or explicitly recorded as outstanding | invalidates prepared and unsent derivatives; records close completion |
| `closed -> preparing` | Krish | a new bounded preparation decision with a new purpose and review date | opens a new period version; never revives an old grant |

The graph does not create silent continuation. Absence of a required receipt leaves the prior state unchanged.

### Closed-state capability

`closed` permits no operational or decision-shaping use. Only required access, correction, retention, deletion and separately authorised R1 Release obligations may be fulfilled. Opening new work requires `closed -> preparing` and all new authority checks.

### Release non-inference

No engagement state, close receipt, elapsed period, payment or commercial event grants, proves or completes Release or export authority.

The existing R1 `Release` object remains the sole owner. Release eligibility requires the current named leader's accepted release request or acceptance, as applicable to the release mode, bound before use to one exact projection version, purpose, audience and included canonical source and Brain versions. A close may finish with no Release. Release does not close an engagement.

A controlling identity, permission, audience, validity, policy or included-source version change invalidates a pending Release projection before use and emits a receipt. Exact delivery, revocation traversal, residue and non-recall behaviour remain at the named later gate.

## Repair 3: partition selector invalidity from resolvable evidence conflict

The selector still returns exactly one of `reuse`, `enrich`, `ask`, `session` or `abstain_hold`.

### Invalid controlling state

Unknown, missing, mismatched, future-dated, expired, invalid or indeterminate controlling identity, subject, workspace, authority, audience, purpose, lifecycle, accepted frame, policy, challenger result or version reference returns exactly `abstain_hold`.

That result:

- creates no actionable intervention or decision-shaping derivative;
- cannot enter approval or delivery;
- names the invalid control and repair or expiry trigger; and
- remains invalidated by any controlling watermark change.

### Valid unresolved evidence

Current valid controlling state may still contain an evidence gap, ambiguity or contradiction. The selector may return `enrich`, `ask` or `session` only when the proposed resolving route passes every earlier identity, authority, audience, sensitivity, source-capability, freshness, deadline, policy, countercase, sufficiency and budget guard. The output must carry the unresolved evidence and its canonical references forward. If no resolving route is eligible, the result is `abstain_hold`.

First arrival, model confidence and the number of same-root sources never resolve the conflict.

### Provisional diagnostics

`provisional` is not a route, standing or authority. Optional provisional detail may exist only as non-authoritative diagnostic metadata on an `abstain_hold` receipt. It cannot create an intervention, enter approval, change the Brain or bypass invalidation.

## Preserved recheck tests

### Epistemic authority and countercase

One source, two same-root syndications, one scope-mismatched similar Brain item, one live contradiction and model-authored capable, sufficient, causal and applicable labels must remain held when the current policy or challenger result is absent. A current policy and challenger rejection must also hold. Model label or confidence changes alone cannot move the route. A policy or challenger version change invalidates the prior result.

### Lifecycle totality

Every transition endpoint except `none` must be an exact declared state. No `_or_` token or undefined grouping is allowed. Matching and stale versions are exercised for every edge. A cancelled or declined preparation reaches `closed`, emits its receipt, invalidates prepared and unsent work and permits no decision-shaping operation.

### Close and Release separation

A close-only receipt reaches `closed` but creates no Release authority or eligible projection. A separate current leader release action can make only its exact projection eligible. Audience narrowing or permission withdrawal before use invalidates it. No lifecycle state alone satisfies the Release predicate.

### Selector partition

Missing subject, mismatched workspace, future source, expired permission, stale frame, invalid lifecycle, missing or stale epistemic authority and precedence-violating model routes all return `abstain_hold`. Valid conflict may use an eligible resolving route and must preserve the conflict. Valid conflict without an eligible route holds. Provisional metadata creates no side effect.

## Protected strengths

R4 preserves:

- the exact R1 and R2 frozen bytes and the rejected R3 bytes as history;
- one canonical Brain and no new evidence, permission, engagement, answer, policy or Release root;
- thirty days as the current intensive proof window rather than a hard expiry;
- explicit human continuation without permission renewal;
- human-owned purpose, standards, exceptions, judgement, call and final quality;
- decision-specific evidence and material effect rather than profile completion or activity;
- accepted context and capable evidence before burden or interruption;
- common-root collapse, causal restraint, contradiction and countercase;
- one visible question, natural controls, optional notes, premise rejection and non-punitive honest exits;
- visible consequence without self-congratulation or product language;
- quiet and abstention as successful states;
- a prepared live session only when it beats research or asynchronous input;
- Krish's pull-only control over that session opportunity;
- public-only real identities and fictional internal depth in tests;
- Qualified Judgement Transfer and Question Yield as unproven internal hypotheses;
- headless intelligence proof before material interface polish; and
- all currently closed external actions.

The customer sees none of these policy identifiers, lifecycle labels or receipts. Their purpose is to make one precise, calm, human interaction safe without explanatory clutter.

## Exact next action

Freeze the R4 blueprint, machine contract and delta. Run deterministic checks against the four preserved test families. Then obtain seven fresh isolated specialist verdicts, history-aware prosecution and defense, and final adjudication. Do not begin the headless Crossing or any customer-facing design until no valid G24.A veto remains and Krish locks the exact architecture.

