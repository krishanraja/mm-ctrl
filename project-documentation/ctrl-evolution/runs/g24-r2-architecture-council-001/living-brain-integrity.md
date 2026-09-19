# Living Brain Integrity review

**Verdict:** PASS_WITH_WATCHPOINTS

**Gate assessed:** G24 R2 proposed founder lock

**Review authority:** Advisory architecture verdict and this file only. No implementation, external research, model spend, customer data use, message, connector, database branch, deployment, merge, release or deletion is authorised.

## Frozen-input verification

All declared inputs matched before semantic review.

| Artifact | Declared SHA-256 | Recomputed SHA-256 | Result |
|---|---|---|---|
| R2 blueprint | 52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980 | 52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980 | Match |
| R2 machine contract | 1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2 | 1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2 | Match |
| R2 delta | d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2 | d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2 | Match |
| Supporting evidence note | c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb | c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb | Match |
| R1 blueprint | 2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a | 2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a | Match |
| R1 machine contract | 16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba | 16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba | Match |
| R1 QA record | e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731 | e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731 | Match |

The declared R1 commit 5e485aa458675df10cdb12d063404f1ebeb34e53 resolves as a commit and is the current repository HEAD. Both JSON contracts and the delta parse successfully. Hash declarations are in the [council brief, “Frozen submission”](./brief.md#frozen-submission), [R2 delta, baseline.artifacts](../../g24-product-system-r2-delta.json), and [R2 contract, extends](../../g24-product-system-contract-r2.json).

Independence boundary: I read the frozen R2 submission, only the R1 sections needed to resolve inherited Brain rules and proof standing, and the durable [Living Brain Integrity judge history](../../judge-history/living-brain-integrity.md). I did not open another verdict from this council. The R1 QA record was used only to establish the baseline's recorded proof boundary, not as an R2 conclusion.

## The call

R2 does not weaken the approved Living Brain architecture at the normative level. It is a hash-bound additive overlay, explicitly preserves source and audience integrity, correction and repair, the canonical Brain target, the authority split and qualified transfer, and keeps every external action closed. Evidence: [R2 blueprint, “What remains unchanged”, lines 49-65](../../g24-product-system-blueprint-r2.md#what-remains-unchanged); [R2 contract, preserved_r1_invariants and authority](../../g24-product-system-contract-r2.json); [R2 delta, preserved and forbidden_interpretations](../../g24-product-system-r2-delta.json).

The pass is not a finding that the new pathways are Brain-safe in operation. Enrichment plans, question plans, answer receipts and session opportunities are new decision-shaping projections. R1 supplies the rules that keep them from becoming a shadow memory, but R2 has not yet proved that every one of those artifacts carries and obeys the required subject, version, standing, applicability, audience and correction bindings. That is an implementation-gate watchpoint, not an architecture-lock veto, because R2 expressly inherits rather than replaces the stronger R1 contract.

## Findings by integrity dimension

### Memory standing: holds at architecture level

R2 requires each decision requirement to carry current standing, freshness, a capable knower, sensitivity, audience ceiling, future-decision scope and a stop rule. It permits reuse first only from a “current accepted” Brain item with compatible audience, scope and freshness. Evidence: [R2 blueprint, “The decision evidence map”, lines 159-187](../../g24-product-system-blueprint-r2.md#the-decision-evidence-map); [R2 blueprint, “Acquisition order”, lines 195-206](../../g24-product-system-blueprint-r2.md#acquisition-order); R2 contract fields decision_evidence_map.requirement_fields and enrichment_planner.acquisition_order[0].

Those additions sit under R1's stronger standing rule: maturity, current standing, audience and consequence permission are independent axes; a case answer is durable case history, not automatically reusable judgement; and deterministic retrieval filters workspace, subject, audience, standing, validity and consequence permission. Evidence: [R1 blueprint, “Memory is layered, not one bucket”, lines 175-185](../../g24-product-system-blueprint.md#memory-is-layered-not-one-bucket); [R1 blueprint, “Brain-item standing”, lines 201-214](../../g24-product-system-blueprint.md#brain-item-standing); [R1 blueprint, “Retrieval policy”, lines 282-295](../../g24-product-system-blueprint.md#retrieval-policy).

Watchpoint: “persist it immediately” must mean an immutable response or case receipt first, not immediate promotion into person memory. Future-decision usefulness may rank a question, but it cannot change the answer's standing.

### Correction and repair: holds in the inherited contract, incomplete in proof

R2 versions question wording, controls and route effects together, recomputes later questions after every answer, and requires a Crossing correction that changes coverage, retires a question and repairs both decisions. Evidence: [R2 blueprint, “Question contract”, lines 253-272](../../g24-product-system-blueprint-r2.md#question-contract); [R2 blueprint, “Timing and delivery”, lines 322-335](../../g24-product-system-blueprint-r2.md#timing-and-delivery); [R2 blueprint, “Extension to the first Crossing”, lines 394-411](../../g24-product-system-blueprint-r2.md#extension-to-the-first-crossing); R2 contract fields question_intelligence.prepared_questions_recomputed_after_each_answer and first_crossing_extension.required_dynamics.

R1 remains explicit that a correction is append-only, preserves the source and prior interpretation, targets current versions, traverses deterministic dependencies, quarantines affected projections, repairs downstream uses and emits a receipt. Evidence: [R1 blueprint, “Correction cascade”, lines 353-364](../../g24-product-system-blueprint.md#correction-cascade).

Watchpoint: R2's answer-grammar sentence that a correction “must replace the relevant value” at line 296 can only mean replacing the derived current value. It cannot authorise overwriting the answer receipt, source, prior interpretation or an entire compound answer. Multi-select, open-text and voice answers must be decomposed into atomic assertions so a correction can retire the false assertion while preserving unaffected claims, exactly as the durable judge history requires.

### Applicability and transfer: holds

R2 records whether evidence may travel to later decision types, permits questions about whether prior judgement applies, triggers a question before reuse when applicability is uncertain, and includes a materially different later decision where transfer is proposed, challenged and either accepted or blocked. Evidence: [R2 blueprint, lines 163-174](../../g24-product-system-blueprint-r2.md#the-decision-evidence-map); [R2 blueprint, lines 239-249](../../g24-product-system-blueprint-r2.md#eligibility); [R2 blueprint, lines 324-333](../../g24-product-system-blueprint-r2.md#timing-and-delivery); [R2 blueprint, lines 400-407](../../g24-product-system-blueprint-r2.md#extension-to-the-first-crossing).

This preserves R1's qualified-transfer rule that similarity is insufficient, standing and audience must be right, the leader must accept or edit the transfer, and later correction must not invalidate it. Evidence: [R1 blueprint, “The meaningful progress measure”, lines 448-465](../../g24-product-system-blueprint.md#the-meaningful-progress-measure).

Watchpoint: an answer or session observation remains session-or-case material until an authorised learning proposal promotes a versioned Brain item. Preparation for a named future decision is not itself promotion authority.

### Identity: holds

R2 distinguishes public company claims, public leader statements, private judgement, observed behaviour and remembered generality. It requires company and person identity resolution before research and fails closed on ambiguity. Real public identities are limited to public-source tests with no fabricated private material or simulated consent. Evidence: [R2 blueprint, lines 176-187](../../g24-product-system-blueprint-r2.md#the-decision-evidence-map); [R2 blueprint, “Efficient enrichment”, lines 223-231](../../g24-product-system-blueprint-r2.md#efficient-enrichment); [R2 blueprint, lines 398-409](../../g24-product-system-blueprint-r2.md#extension-to-the-first-crossing); R2 contract fields enrichment_planner.efficiency_rules[0], enrichment_planner.public_specificity_never_authorises_private_personhood and first_crossing_extension.real_public_identity_rule.

R1's universal source envelope remains controlling: workspace, subject, originating actor, claimed speaker and verification state are required before downstream use, and uncertainty leaves the source unassigned. Evidence: [R1 blueprint, “Universal source envelope”, lines 141-159](../../g24-product-system-blueprint.md#universal-source-envelope).

Watchpoint: session transcripts, optional voice and quoted third parties need span-level speaker attribution. Resolving the customer identity does not establish the identity or authority of every speaker inside a source.

### Audience and privacy: holds

R2 puts sensitivity and audience ceiling on each decision requirement, restricts Brain reuse to compatible audience, forbids copying one customer's private reasoning into another Brain, binds audience and retention to every question, requires the session brief to show standing and audience, and requires a capture and privacy plan. It also says no model may widen an audience. Evidence: [R2 blueprint, lines 163-174](../../g24-product-system-blueprint-r2.md#the-decision-evidence-map); [R2 blueprint, lines 195-206](../../g24-product-system-blueprint-r2.md#acquisition-order); [R2 blueprint, lines 223-231](../../g24-product-system-blueprint-r2.md#efficient-enrichment); [R2 blueprint, lines 253-272](../../g24-product-system-blueprint-r2.md#question-contract); [R2 blueprint, lines 354-366](../../g24-product-system-blueprint-r2.md#the-prepared-brief); [R2 blueprint, lines 376-392](../../g24-product-system-blueprint-r2.md#logical-objects-added-by-this-extension).

R1 additionally requires the exact audience ceiling and purpose on every source, deterministic audience filtering, and fail-closed handling of mixed-audience context. Evidence: [R1 blueprint, lines 141-159](../../g24-product-system-blueprint.md#universal-source-envelope); [R1 blueprint, lines 282-295](../../g24-product-system-blueprint.md#retrieval-policy); [R1 blueprint, “Model task registry”, lines 274-277](../../g24-product-system-blueprint.md#model-task-registry).

Watchpoint: the audience of a derived question or session brief must be the intersection of its inputs and purpose, never merely the audience label selected for the output. A private contradiction cannot leak through wording, options, agenda structure or the fact that a session was proposed.

### Duration and currentness: holds directionally, transition semantics remain unproven

R2 correctly separates commercial continuation from source permission and retention. The engagement does not purge or pretend completion at day thirty; permissions expire independently; and records include the latest audience boundary plus pause, reopen, release and deletion receipts. Evidence: [R2 blueprint, “The relationship is longer than a timer”, lines 67-95](../../g24-product-system-blueprint-r2.md#the-relationship-is-longer-than-a-timer); R2 contract fields engagement_lifecycle.permissions_expire_independently, hard_product_limit and states.

Watchpoint: continuing must not become a proxy for “still current.” Paused, closing, released and reopened states need explicit effects on retrieval, enrichment, intervention, session preparation and release. Reopening must revalidate identity, permissions, freshness, standing and audience before an old accepted item can steer new work.

## Strongest challenge

The strongest-looking feature is also the highest-integrity risk: least-burden quiet enrichment. The proposal says CTRL should use accepted current memory or enrich quietly rather than ask, and that it should arrive prepared. Evidence: [R2 blueprint, “The amendment in one minute”, lines 21-47](../../g24-product-system-blueprint-r2.md#the-amendment-in-one-minute) and [R2 blueprint, “Acquisition order”, lines 195-206](../../g24-product-system-blueprint-r2.md#acquisition-order).

Quietness removes a natural correction opportunity. A stale Brain item, wrong identity match, private-source clue, or public claim interpreted beyond its standing can silently determine which option appears, which question is suppressed and which live-session agenda Krish receives. A planner output can therefore act like memory even if it is not stored as a Brain item.

R1 contains the answer: these artifacts must remain rebuildable, purpose-bound projections over exact canonical versions, with deterministic workspace, subject, audience, standing, validity and consequence checks, and correction-driven quarantine. R2 does not contradict that answer. The implementation risk is that builders implement the attractive R2 field lists but omit those inherited bindings. Passing a fixture because the final recommendation looks reasonable would not close this risk.

## Required repairs and gate conditions

There is no blocking defect for the proposed G24.A architecture lock. The following are mandatory before G24.C or any later gate may claim Living Brain integrity:

1. Bind every evidence coverage map, enrichment plan and receipt, question plan and answer receipt, session opportunity and intervention delivery to the exact workspace, subject, decision, canonical input version watermarks, source or assertion references, purpose, effective audience ceiling, validity or expiry and applicability rationale. Field names may vary; the semantics may not.
2. Make the answer path explicit in the machine proof: immutable source envelope, case-scoped atomic assertions, optional claim-addressed learning proposal, correct human authority, then and only then an accepted Brain-item version. A route change is not a memory promotion.
3. Specify that “replace the relevant value” updates only the current projection. Preserve the original answer and prior interpretation. Corrections to compound multi-select, text or voice responses must target atomic assertion identifiers and retain unaffected assertions.
4. On correction, audience narrowing or revocation, retention expiry, freshness failure, identity remap or engagement-state restriction, deterministically quarantine or invalidate every affected unsent question, coverage view, enrichment result, session agenda, delivery intent and later-decision preparation before it can steer work. Recompute from canonical state and emit a repair receipt.
5. Reuse public material across cases only through immutable public source and atomic assertion references. Keep customer-specific interpretation, contradiction, standing, audience and correction edges inside the authorised workspace. No shared mutable derived claim may couple two customer Brains.
6. Add a lifecycle capability matrix for preparing, intensive proof, continuing, paused, closing, released and reopened. It must state which reads, research, questions, sessions, captures, exports and repairs remain legal in each state and what must be revalidated on reopen.
7. Extend the deterministic Crossing so the new paths are tested independently: wrong-person public match fails closed; mixed-audience inputs cannot produce a wider question or agenda; a corrected atomic answer preserves unaffected claims; a stale or corrected input retires an unsent question and session opportunity; a case answer cannot transfer without authorised learning; and a released or paused engagement cannot continue intervention merely because the Brain item once had accepted standing.

The cleanest contract improvement is one explicit derived-artifact integrity block in the R2 machine overlay that applies these invariants to all six decision-shaping object classes. That would reduce the risk of inherited R1 rules being lost at implementation boundaries.

## What remains unproven

- No runtime reader or writer uses the eleven-table Brain substrate, and no real user has completed the target loop. This is explicitly recorded in [R1 blueprint, “Current technical truth”, lines 70-78](../../g24-product-system-blueprint.md#current-technical-truth) and R1 contract current_brain_substrate.
- The proposed headless extension has not yet demonstrated research rather than question, a typed answer changing route, a prepared session, abstention, or correction propagation through the new artifacts. Those are future proof requirements in [R2 blueprint, lines 394-411](../../g24-product-system-blueprint-r2.md#extension-to-the-first-crossing) and its [exact next action, lines 474-476](../../g24-product-system-blueprint-r2.md#exact-next-action-if-approved).
- No evidence yet shows that mixed-audience derivation computes the narrowest effective audience, that public references cannot couple customer-specific interpretation, or that identity remapping invalidates all affected preparation.
- No longitudinal evidence yet shows that accepted memory remains correctly current through continuation, pause, closing, release and reopen.
- No observed session proves that what is captured remains speaker-attributed, case-scoped and correction-ready, or that a session agenda does not turn an operator inference into leader truth.
- No observed interface proves intuitive comprehension, correction visibility, failed-save recovery or consequence comprehension. R2 itself keeps those claims open in [“Experience proof requirements”, lines 433-458](../../g24-product-system-blueprint-r2.md#experience-proof-requirements).
- The supporting research synthesis is not normative and its citations and universal defaults were not independently reverified. Evidence: [supporting note, “Source boundary”, lines 7-18](../../research/question-and-enrichment-evidence-2026-09-12.md#source-boundary) and [“Hypotheses that still require observed testing”, lines 39-48](../../research/question-and-enrichment-evidence-2026-09-12.md#hypotheses-that-still-require-observed-testing).

## Veto trigger for the next gate

Veto if any new pathway can: promote an answer, enrichment inference or session observation without the authorised learning transition; reuse a case answer as person judgement on usefulness alone; persist a derived artifact without exact subject, audience and version bindings; continue using an artifact after a relevant correction, permission change, freshness failure or identity change; overwrite a source or compound answer during correction; or let a public reference carry one customer's private interpretation into another Brain.

Subject to those explicit downstream gates, R2 is safe to present as a proposed additive architecture. It is not yet evidence of a Brain-safe implementation.
