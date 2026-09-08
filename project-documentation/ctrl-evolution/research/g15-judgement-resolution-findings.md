# G15 Judgement Resolution findings

Date: 8 September 2026

## Executive call

Keep `Judgement Resolution` as the provisional measurable construct and use `Brain Resolution` as the human-facing expression. Do not ship a visible percentage or call the Brain complete.

The defensible object is not how much the system knows about a person. It is the bounded territory in which the Brain can apply that person's evidenced judgement to unfamiliar work, explain the discriminating reason, calibrate uncertainty, survive correction and improve transfer without impersonating them.

This is a proposed CTRL measurement design, not an established psychometric instrument. It must earn validity through an ongoing evidence programme before supporting public efficacy claims.

## Decision-bearing principles

1. **Validity belongs to the interpretation and use, not to the number itself.** Messick's unified validity model treats content, substantive structure, generalisation, external relationships and consequences as connected. NIST similarly warns that proxy indicators for latent concepts require construct validation and documented limits. CTRL therefore cannot call a file count, memory count or model confidence “judgement.”
2. **The test must use genuinely unseen work.** P-CHECK separates the examples used to infer criteria from the chosen and rejected pairs used to test preference selection. CTRL should freeze holdouts before a Brain version is built and include rolling future cases after release.
3. **Contrast is evidence-efficient.** AMPLe models implicit, multidimensional preferences through comparisons and actively chooses informative queries. This supports paired contrasts and adaptive intake, but does not prove that its particular learning method is right for CTRL.
4. **Accuracy without calibrated refusal is unsafe.** Calibration research distinguishes confidence from correctness likelihood. Selective prediction explicitly treats coverage and error as a trade-off. A Brain that is correct only because it speaks rarely is not broadly resolved; a Brain that speaks everywhere despite uncertainty is not trustworthy.
5. **Personalisation needs more than preference accuracy.** Current ACL evidence finds material heterogeneity between people and warns that personalisation can degrade other capabilities or safety. Resolution must therefore retain general quality, safety and human authority as blocking checks rather than reward perfect imitation.
6. **Continual memory needs transfer, repair and forgetting tests.** AgentMemoryBench evaluates memory through offline, online, replay, transfer and repair modes and reports contamination risks when memory types are blurred. CTRL's existing separation of sources, proposed meaning, current judgement and correction history is therefore load-bearing.
7. **The displayed metric must not become the optimisation target.** Goodhart failure modes show how a proxy can degrade under optimisation pressure. User activity, source volume and visible completion are especially gameable. They can diagnose evidence sufficiency but cannot award progress.

## Construct definition

`Judgement Resolution` is the weakest-link quality of the Brain's evidence-grounded performance within a named, important judgement territory.

A territory is numerically eligible only when it has:

- a person-approved scope and importance;
- at least one chosen and one rejected example with reasons;
- evidence from at least two independent moments or sources;
- a frozen held-out set that did not generate the criteria;
- no unresolved audience, provenance or correction-integrity failure.

Eligible territories are assessed on five dimensions:

| Dimension | Observable question | Example signal |
|---|---|---|
| Grounding | Is the current interpretation traceable to real, contrastive evidence? | source diversity, example and anti-example, exact correction lineage |
| Discrimination | Can the Brain anticipate what the person will prefer and the reason on unseen work? | held-out pair choice plus criterion match |
| Calibration | Does confidence correspond to correctness, and does the Brain defer in the right places? | calibration error plus risk at stated coverage |
| Transfer | Does the Brain improve unfamiliar work relative to the same model or person without Brain context? | blinded paired lift against no-Brain and handcrafted-context baselines |
| Adaptation | Can new evidence narrow, weaken or retire an interpretation without losing valid prior learning? | repair completeness, replay retention and post-correction holdouts |

The territory score is the minimum of the five dimensions. This deliberately prevents a large evidence archive or excellent preference prediction from compensating for poor calibration, failed correction or no transfer.

The overall internal measure should report the importance-weighted lower quartile of eligible territory scores, plus the number and importance of territories that remain ineligible. A mean is too forgiving. A missing territory is shown as untested or intentionally out of scope, not as personal deficiency.

## Surface contract

The product may say:

- `Your judgement is coming into focus.`
- `High resolution in creative direction. Forming around delegation.`
- `This now holds on unfamiliar examples.`
- `The last correction made this interpretation narrower and more reliable.`
- `Your Brain knew not to answer here.`

The product must not say:

- `Your Brain is 73% complete.`
- `You are 82% self-aware.`
- `Upload five more files to improve your score.`
- `CTRL can make decisions exactly like you.`
- `Your judgement is better than another person's.`

The underlying continuous values exist for evaluation, longitudinal comparison and experiment analysis. The ordinary surface uses a resolution state, named territory, direction of change and one evidence-bearing sentence. Numbers are inspectable in a private proof view, not the motivational hero.

## Claim-evidence matrix

| Claim | Type | Evidence | Contrary or limitation | Decision effect |
|---|---|---|---|---|
| A composite needs an explicit validity argument and consequence analysis | Measurement principle | [Messick, ETS Research Report](https://www.ets.org/research/policy_research_reports/publications/report/1994/hxpp.html); [NIST AI RMF Playbook, Measure 2.5](https://airc.nist.gov/docs/AI_RMF_Playbook.pdf) | Neither source validates CTRL's construct | Treat the measure as provisional and publish only supported interpretations |
| Held-out chosen and rejected pairs can test whether inferred criteria generalise rather than memorise | Empirical method | [P-CHECK, ACL 2026](https://aclanthology.org/2026.acl-long.2011.pdf) | Preference selection is narrower than leadership judgement | Freeze disjoint holdouts and require reason-level evidence |
| Comparative questions can efficiently elicit implicit multidimensional preference | Empirical method | [AMPLe, ACL 2025](https://aclanthology.org/2025.acl-long.1590/) | The paper's tasks and Bayesian method may not transfer directly | Use adaptive contrasts as evidence collection, then validate in CTRL's domain |
| Confidence needs calibration against observed correctness | Empirical principle | [Guo et al., ICML 2017](https://proceedings.mlr.press/v70/guo17a.html) | Classification calibration does not directly solve open-ended judgement | Measure confidence empirically and avoid model self-confidence as proof |
| Abstention creates a measurable error versus coverage trade-off | Empirical method | [SelectiveNet, ICML 2019](https://proceedings.mlr.press/v97/geifman19a) | Selective prediction can hide poor breadth and may create uneven performance | Report both covered territory and risk; reward appropriate refusal, not silence alone |
| Personalisation must be evaluated for adaptation and unintended degradation, not accuracy alone | Empirical warning | [Dong et al., EMNLP 2025](https://aclanthology.org/2025.findings-emnlp.916/) | Results are dataset- and method-specific | Keep safety, general quality and human authority as blocking invariants |
| Continual memory requires transfer, repair, retention and forgetting evaluation | Early benchmark evidence | [AgentMemoryBench, ICLR 2026 workshop](https://openreview.net/pdf/2cd400b6dec127be21f88da3528c021c699c914f.pdf) | Workshop evidence is early and not a product benchmark | Retain separate evaluation modes; do not collapse memory health into recall |
| Optimising a proxy can destroy its relationship to the intended goal | Theoretical warning | [Manheim and Garrabrant, Goodhart taxonomy](https://arxiv.org/abs/1803.04585) | Taxonomy is not a quantitative scoring prescription | Exclude activity and volume from the progress construct |

## Strongest countercase

Even a carefully defined composite may create false authority. Judgement is contextual, socially situated and capable of legitimate contradiction. A polished resolution label could make weak model agreement feel scientific. The safer alternative is to show only concrete receipts such as “this interpretation survived three unfamiliar examples” and never aggregate them.

That alternative remains live. The concept round must include a no-score experience and test whether it communicates longitudinal value as powerfully as the named construct.

## Falsification and revisit

Drop the public `Judgement Resolution` construct if any of the following persist after the first representative-user proof:

- users interpret it as intelligence, worth, self-awareness or personal completeness;
- displayed progress increases file uploading or answer conformity without held-out lift;
- different reasonable test sets create unstable state labels;
- the Brain improves preference imitation while reducing productive challenge or output quality;
- the aggregate hides a blocking failure visible in one consequential territory;
- the concrete receipt-only experience creates equal return desire and comprehension with lower credibility risk.

## Krish-owned choice

None yet. The concept round can reduce the remaining surface question before asking for taste approval.
