# G24 R5 dependent Release watermark repair

**Status:** Proposed single-seam repair, pending deterministic proof, fresh council clearance and founder lock

**Date:** 12 September 2026

**Purpose:** Repair only the one root defect sustained by `g24-r4-architecture-council-003`: a pending Release projection containing selector-influenced content must retain and react to the complete controlling watermark set that gave the content standing.

**R4 frozen submission:**

- blueprint `d4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a`
- machine contract `58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c`
- delta `4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85`
- adjudication `c0e37605b5257beb08775c0c088cd13e1cc3cc9282ae47bcba281f0f8524630b`

**R4 council result:** `BLOCKED_PENDING_REPAIR`.

**Authority:** Local architecture repair, deterministic validation, fresh council review and durable state records only. Every external action remains closed.

## Normative precedence

R5 is an exact amendment to R4. It replaces only the dependent watermark binding and invalidation semantics for a pending R1 Release projection. Every other R4 rule, every unaffected R3 rule and the complete R1 and R2 product direction remain unchanged.

R5 creates no new Brain, evidence, policy, challenger, permission, engagement, answer or Release root. It does not define a physical schema, provider, numeric threshold, delivery mechanism or customer surface.

## The one repair

When content included in a pending Release projection depends on a selector result or trusted epistemic evaluation, the projection must bind before use to:

1. the exact included selector result version;
2. that result's complete controlling watermark set; and
3. the existing R4 Release projection version, purpose, audience and included canonical source and Brain versions.

The complete controlling watermark set includes every current reference whose change can invalidate the included selector result. It therefore includes the dependent epistemic policy version and independent-challenger result version, together with the inherited identity, subject, workspace, authority, audience, purpose, lifecycle, accepted decision frame, evidence coverage, trusted cutoff and controlling canonical versions applicable to that result.

Any change to an included controlling watermark invalidates the dependent pending Release projection before use and emits an append-only invalidation receipt. This rule applies even when the included canonical source and Brain versions do not otherwise change.

The invalidation is lineage-scoped. A challenger, policy or other watermark change outside the projection's recorded dependency lineage does not invalidate the projection merely because it belongs to the same customer or workspace.

Rebuilding after invalidation does not restore eligibility by itself. A new pending projection may become eligible only when trusted current evaluation under the new complete watermark set supports the included content and the separate current named-leader Release authority still applies to that exact projection, purpose, audience and canonical version set.

The R1 Release object remains the only Release authority. This repair changes validity propagation, not who can authorise a Release.

## Identical resolving test

Freeze one pending Release projection containing content influenced by selector result `S1`. Keep fixed the separate named-leader Release action, identity, subject, workspace, authority, purpose, audience, permission, lifecycle, accepted frame, policy, source, assertion, Brain, decision, evidence-coverage and trusted-cutoff versions.

First use challenger result `C1 = none_found_within_declared_boundary`. Only the exact current pending projection may be eligible.

Run the identical case again while changing only the dependent current challenger-result version to `C2 = countercase_found`. The unchanged pending projection must:

- become ineligible before use;
- emit or require one append-only invalidation receipt; and
- create no approval, delivery or external side effect.

A rebuilt projection under `C2` may regain eligibility only if trusted current policy resolves the countercase and the separate named-leader Release authority applies to the new exact projection.

Run one control projection with no recorded lineage to `C1`. It must remain unaffected by the unrelated challenger change.

At G24.A, deterministic inspection proves that blueprint and machine contract state this identical dependent-watermark rule. At the later first Release-capable gate, the same frozen case must prove atomic traversal and use-time enforcement in working code.

## Protected strengths

R5 preserves without qualification:

- one canonical Brain and all nine R2 objects mapped to existing R1 owners;
- human-owned purpose, standards, exceptions, judgement, final call, final quality and Release authority;
- thirty days as an intensive proof window rather than a hard expiry;
- explicit continuation without commercial state renewing permission;
- the exact six-state, thirteen-edge engagement graph and its separation from Release;
- current policy and independent-challenger binding at selector eligibility;
- exactly five selector outputs and fail-closed `abstain_hold` for invalid control;
- guarded resolution of valid evidence gaps, ambiguity and contradiction;
- provisional detail as non-authoritative hold metadata only;
- decision-specific material effect rather than activity or profile completion;
- one versioned human-facing intervention atom with natural controls and honest exits;
- one visible customer question or action, deeper evidence one layer away and all technical machinery backstage;
- Krish's rich operator control and pull-only session opportunities;
- immutable history, corrections, audience limits, portability and self-healing;
- Qualified Judgement Transfer and Question Yield as unproven internal hypotheses;
- headless intelligence proof before material interface polish; and
- every currently closed external action.

## Exact next action

Freeze the R5 blueprint, machine contract and delta after deterministic checks pass. Give those exact bytes to seven fresh isolated specialists, then run history-aware prosecution, defense, founder calibration and final adjudication. Do not begin the headless Crossing or any customer-facing implementation unless no valid G24.A veto remains and Krish locks the exact dependency-closed architecture.

