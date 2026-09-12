# G24 R2 Consequential Usefulness verdict

**Run:** `g24-r2-architecture-council-001`

**Verdict:** `VETO`

**Veto:** `USEFULNESS-G24-R2-01` — the frozen gate can prove disciplined intervention routing without proving that the routed work is a genuinely high-value decision.

## Review basis and independence

This was an output-only architecture review in a fresh specialist context. The Consequential Usefulness history was loaded before the submission. No other verdict from this council was read. The supporting evidence note was treated as non-normative evidence, as required by its own source boundary.

The frozen bytes were verified before substantive review:

| Artifact | Expected SHA-256 | Observed SHA-256 | Result |
|---|---|---|---|
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | Pass |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | Pass |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | Pass |
| `question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | Pass |

The R1 blueprint, machine contract and QA record also matched the three baseline hashes frozen in [`g24-product-system-r2-delta.json`, `baseline.artifacts`](../../g24-product-system-r2-delta.json) and [`g24-product-system-contract-r2.json`, `/extends`](../../g24-product-system-contract-r2.json). The R2 contract parsed as JSON. These checks establish artifact identity and syntax only; they do not establish usefulness.

## The call

R2 is a strong architecture for deciding whether to research, ask, convene or abstain. It is not yet an adequate architecture gate for proving that CTRL improves a consequential decision rather than administering an elegant, highly governed intake process around one.

That distinction is blocking at founder lock. The owned standard is that “the Brain sharpens a live high-value decision rather than producing generic advice, activity or AI-adoption theatre” ([Consequential Usefulness history, line 3](../../judge-history/consequential-usefulness.md#L3)). The current Crossing extension can pass while the underlying decision is trivial, wrongly framed or commercially immaterial. A later real pilot may expose that failure, but the proposed headless build can consume substantial effort before it is forced to confront it.

This veto does **not** reject the planner. It requires one missing through-line: decision value must be a first-class contract and a semantic gate, not an adjective attached to otherwise valid machinery.

## Strongest challenge to the apparently strongest part

The strongest part of R2 is the versioned question object. It requires the missing variable, alternatives already checked, exact answer grammar, complete options and “what each answer changes”; wording, controls and route effects must version together ([R2 blueprint, “Question contract,” lines 253–272](../../g24-product-system-blueprint-r2.md#L253-L272); [R2 contract, `/question_intelligence/contract_fields`](../../g24-product-system-contract-r2.json#L204-L223)). This directly repairs earlier failures where a neat question was disconnected from its downstream effect.

But `per_answer_effect` proves only that an answer moves a route. It does not prove that the route concerns a valuable decision, that the effect is causally sensible, or that the move improves the call. The contract has no required decision owner, deadline, live alternatives, present baseline, economic or operating exposure, irreversibility, decision-quality target, or outcome signal. Its priority rubric contains the label `decision_consequence`, but no evidence contract or rejection threshold for that label ([R2 blueprint, “Priority,” lines 274–290](../../g24-product-system-blueprint-r2.md#L274-L290); [R2 contract, `/question_intelligence/priority_positive_factors`](../../g24-product-system-contract-r2.json#L224-L238)).

The resulting counterexample is simple: a fixture about the preferred format of an internal AI meeting summary could carry a `decision_id`, name a variable, use a correctly typed forced choice, obsolete a later question, change a pre-registered route and produce a prepared session. It could satisfy the current R2 proof while changing no material commitment, revenue, margin, scarce capacity, risk or leadership boundary. Calling the decision “high consequence” is enough because the architecture never makes that classification answerable to evidence.

The internal metric compounds the weakness. Question Yield counts an answer as valuable when it closes a gap or changes a route, evidence requirement, boundary, stop condition, session need or learning proposal ([R2 blueprint, “Internal evaluation,” lines 413–431](../../g24-product-system-blueprint-r2.md#L413-L431); [R2 contract, `/evaluation/question_yield`](../../g24-product-system-contract-r2.json#L333-L345)). Those are useful process effects, but they are not decision value. A bad route changed efficiently still yields under this definition.

The durable history is explicit on this boundary:

- Answerability is not consequence; every allowed answer and unknown path must act on the exact named route ([G21-INTERNAL-RANGE-FREEZE-003, lines 39–42](../../judge-history/consequential-usefulness.md#L39-L42)).
- Route mapping plus large fictional stakes establishes consequential altitude, but still does not establish customer value ([G21-INTERNAL-RANGE-FREEZE-004, lines 49–51](../../judge-history/consequential-usefulness.md#L49-L51)).
- A permitted answer must contain or request the decision-bearing value its promised effect uses ([G21-INTERNAL-RANGE-FREEZE-005, lines 60–62](../../judge-history/consequential-usefulness.md#L60-L62)).

R2 supplies route mapping, but its frozen proof supplies neither the large-stakes decision nor a decision-bearing value test.

## Findings

### Holds: the planner is genuinely decision-backward in design

The evidence map admits only variables that could materially change the call and explicitly separates a useful gap from curiosity about the person ([R2 blueprint, “The decision evidence map,” lines 159–187](../../g24-product-system-blueprint-r2.md#L159-L187); [R2 contract, `/decision_evidence_map`](../../g24-product-system-contract-r2.json#L125-L151)). Question eligibility requires a pre-stated effect on framing, route, evidence, threshold, boundary, transfer, session or learning, while the machine overlay separately forbids profile-completion-only questions ([R2 blueprint, “Eligibility,” lines 237–251](../../g24-product-system-blueprint-r2.md#L237-L251); [R2 contract, `/question_intelligence/eligibility_effects`, lines 192–203](../../g24-product-system-contract-r2.json#L192-L203); [R2 contract, `/question_intelligence/forbidden`, lines 256–265](../../g24-product-system-contract-r2.json#L256-L265)). These are material safeguards against generic intake.

The acquisition ladder is also directionally useful: accepted context, supplied work and revealed behaviour precede public research and leader interruption; collection stops when the next unit cannot justify cost, sensitivity or delay ([R2 blueprint, “The enrichment planner,” lines 189–206](../../g24-product-system-blueprint-r2.md#L189-L206)). This should survive repair.

### Holds: the session route is prepared work, not generic rapport

A session must beat further research or asynchronous questioning; public facts, routine progress and machine-preparable work are excluded. The brief must contain the decision, material gaps, a concrete-to-trade-off-to-pressure ladder, real options or artefacts and a desired end state ([R2 blueprint, “When Krish should run a live session,” lines 337–368](../../g24-product-system-blueprint-r2.md#L337-L368); [R2 contract, `/session_opportunity`](../../g24-product-system-contract-r2.json#L267-L306)). This is a credible mechanism for spending Krish's scarce time where judgment matters.

### Breaks: the proof gate has no consequential-altitude contract

The R2 Crossing cases are evidence-density quadrants and intervention choices. They require research, supplied evidence, a typed question, a live session, abstention, obsolescence, correction and later transfer, but they do not freeze the actual decision, stakes, alternatives, baseline call or success condition ([R2 blueprint, “Extension to the first Crossing,” lines 394–411](../../g24-product-system-blueprint-r2.md#L394-L411); [R2 contract, `/first_crossing_extension`](../../g24-product-system-contract-r2.json#L308-L331)).

R1 does not close this gap. It requires two “materially different AI-transition decisions,” but supplies only a count and a Boolean rather than their contents or an altitude test ([R1 blueprint, “First complete vertical slice,” lines 541–560](../../g24-product-system-blueprint.md#L541-L560); [R1 contract, `/first_vertical_slice`](../../g24-product-system-contract.json#L201-L221)). The R1 intent is commercially serious — the company pays for organisational and commercial change ([R1 blueprint, lines 15–19](../../g24-product-system-blueprint.md#L15-L19)) — but that intent never becomes a required R2 fixture property.

Therefore the exact next action can be completed without confronting the product's core commercial claim. It asks for one research-not-question decision, one correctly typed question and one prepared session, but not one demonstrably high-value decision ([R2 blueprint, “Exact next action if approved,” lines 474–476](../../g24-product-system-blueprint-r2.md#L474-L476); [R2 contract, `/next_action`](../../g24-product-system-contract-r2.json#L365)).

### Watchpoint: least-burden can still become high-cost preparation

The prose says collection should stop when further work cannot justify cost, sensitivity or delay ([R2 blueprint, lines 191–193](../../g24-product-system-blueprint-r2.md#L191-L193)), and the logical `enrichment_plan` includes a budget ([R2 blueprint, lines 380–390](../../g24-product-system-blueprint-r2.md#L380-L390)). The machine overlay, however, does not require a budget, expected value-of-information or proportionality field in `/enrichment_planner` ([R2 contract, lines 153–190](../../g24-product-system-contract-r2.json#L153-L190)). Without the missing decision-value contract, quiet research can still consume more time and money than the call warrants.

### Watchpoint: continuation can reward relationship activity

R2 usefully records “the decision or value that justifies the next period” and a human checkpoint ([R2 blueprint, “The relationship is longer than a timer,” lines 67–95](../../g24-product-system-blueprint-r2.md#L67-L95)). But the machine lifecycle has no earned-continuation evidence or exit threshold beyond state flags ([R2 contract, `/engagement_lifecycle`](../../g24-product-system-contract-r2.json#L66-L81)). An indefinite `continuing` state must not become evidence that the relationship is useful.

## Required repairs

These are the minimum repairs needed to clear this veto. They should be additive and must preserve the evidence map, least-burden ladder, one-question rule, per-answer versioning, quiet state and prepared-session design.

1. **Add one shared `decision_value_contract`.** Every Crossing decision must freeze: the named decision; accountable human and decision date; live alternatives or commitments; current baseline route; the material exposure at stake (revenue, margin, capital, scarce capacity, time, trust, safety or an equivalent consequential loss); reversibility; the exact uncertainty CTRL may reduce; what a better call changes; and an observable success, kill or revisit condition. If a fixture claims million-dollar altitude, the seven-figure exposure must be shown as a sourced range or explicit scenario assumption, not asserted as a label.

2. **Make the Crossing semantically value-bearing.** Freeze at least one concrete high-consequence AI-transition decision across the full path: decision focus, unresolved uncertainty, evidence alternatives, exact question and answer grammar, every allowed answer plus unknown/refusal, per-branch route effect, human boundary and outcome signal. Add one low-value AI-adoption near-miss that the planner must reject or leave quiet. A schema-complete trivial decision must fail.

3. **Add a competent-baseline comparison.** Before a question, research task or live session can count as useful, the proof must show what a competent human would decide or prepare from the same starting evidence, then identify the decision-relevant delta CTRL creates. The semantic reviewer must be able to reject an effect that changes state but does not plausibly improve the call. Field presence and route mutation cannot pass this check.

4. **Demote route activity inside the metric.** Keep Question Yield as an internal routing diagnostic, but do not call a question valuable merely because state changed. Qualifying usefulness must require both a valid route effect and the decision-value contract. Record harmful, trivial or unjustified route changes as negative yield even when they match the pre-registered transition.

5. **Bind sessions and continuation to the same value contract.** A session opportunity must state why live work beats the next-best route, the commitment or threshold it is expected to move, and what post-session evidence would show that it was worth the time. Entry to `continuing` must name the next consequential decision or evidenced value, its human checkpoint and an exit condition; elapsed relationship activity is not sufficient.

A fresh Consequential Usefulness review should inspect the repaired frozen fixture and all literal known, unknown, refusal and abstention branches. No implementation or external research is required to make these architecture repairs.

## What remains unproven after those repairs

Even a repaired architecture would establish only a credible test of consequential altitude, not production value:

- Whether the system identifies the *right* uncertainty rather than merely a valid one.
- Whether research, a typed question or a live session improves decision quality against a competent baseline in a real engagement.
- Whether the visible consequence increases trust and return behaviour; whether prepared choices and voice reduce burden; and whether the operator session queue helps rather than distracts. The frozen evidence note explicitly leaves all of these as observed-test hypotheses ([evidence note, “Hypotheses that still require observed testing,” lines 39–48](../../research/question-and-enrichment-evidence-2026-09-12.md#L39-L48)).
- Whether Qualified Judgement Transfer survives correction and genuinely improves a later different decision. R1 correctly labels it `proposed_unproven` ([R1 contract, `/north_star_hypothesis`](../../g24-product-system-contract.json#L245-L252)).
- Diagnostic efficacy, willingness to pay and retention. R1 explicitly excludes those from the first slice's proof ([R1 blueprint, “What it does not prove,” lines 572–580](../../g24-product-system-blueprint.md#L572-L580)).
- Any claim that CTRL creates million-dollar value in the market. That requires consented founder/pilot evidence with observed decision and outcome deltas, not a synthetic route trace.

## Founder decision

Do not lock the current R2 overlay as sufficient proof architecture. Preserve its planner and make the bounded repairs above, then re-freeze and re-review. The sharper alternative is to implement the current selector unchanged and defer value testing to the founder account; I reject that route because it permits the team to perfect intake machinery before proving it is attached to a decision worth improving.

All external actions remain closed. This verdict authorises no implementation, research run, model spend, customer contact, merge, deployment or release.
