# G21 evidence range, responsibility and council contract

Status: local contract implemented; four-profile public row passed after one preserved veto and targeted repair; database event storage, internal-depth population and product UI pending

Date: 9 September 2026

## Outcome

CTRL needs a test population that can answer a harder question than whether a polished synthetic screen renders: does the Brain remain specific, useful and honest as the quantity and type of evidence change over time?

G21 adds that missing instrument without discarding G18. G18 remains the adversarial ingest, security, language and layout corpus. G21 is the evidence-depth and lifecycle range used to expose generic advice, invented personhood, weak questions, unsafe agency and false claims of learning.

## Evidence range

The base population is a complete 4 by 4 matrix:

| External evidence | Internal evidence |
|---|---|
| None or unusable | None |
| Sparse | Basic intake |
| Useful | Work evidence |
| Rich and longitudinal | Longitudinal corrections |

Every external depth is paired once with every internal depth. This creates 16 base subjects. Each subject is then exercised in three deterministic lifecycle states:

1. `initial`: the best defensible current projection from the available evidence.
2. `contradicted`: a material new source disagrees with an active assertion or changes its support.
3. `corrected`: an authorised correction supersedes the prior projection and repairs its downstream uses.

This produces 48 cases. They are a range harness, not 48 independent users and not an efficacy sample.

Each case must define what a strong Brain should notice and what it must not claim. Passing means the diagnostic becomes more specific when evidence supports it, becomes more cautious when evidence conflicts and never fills a sparse profile with business-horoscope prose.

## Four hard namespaces

The range harness keeps four structurally separate namespaces:

| Namespace | Permitted content | Prohibited shortcut |
|---|---|---|
| `real_public` | Attributable public facts, statements, actions and current company evidence | Invented beliefs, private quotes, motives, preferences, weaknesses, corrections or decision history |
| `consented_private` | Evidence supplied under an exact, retrievable consent record | Implied consent or audience widening |
| `consented_anonymised` | Consented evidence whose test identity is deliberately anonymised | Re-identification or attaching the material to a public name |
| `synthetic_fixture` | Wholly fictional identities and authored private depth, visibly disclosed as fictional | Borrowing a real person's identity to make fictional material feel convincing |

Real named people are permitted only in `real_public`, and those manifests must have `internalDepth: none`. A real public profile can demonstrate external research quality. It cannot be made to look personally known.

The cells that need internal depth use consented evidence or wholly fictional identities. Real company and category research may inform a fictional scenario only when the fictional identity remains obvious and every attributable external claim keeps its source.

## Population construction

The next population build is research-gated, not a manual collection of famous names.

For every candidate subject:

1. Establish the intended matrix coordinate before collection.
2. Record public source locators, retrieval time, source type and allowed use.
3. Separate company facts from claims about the person.
4. Refuse any source that exposes private or sensitive material outside the agreed boundary.
5. Run the manifest validator before any diagnostic sees the evidence.
6. Freeze the source envelope and expected/forbidden oracle before running the diagnostic.

The selected set should vary business size, category, public-data density, geography, role and rate of visible change. Selection diversity is coverage, not permission to infer protected traits or assess named employees.

## Human responsibility gate

The founder's first-and-last-ten-percent language is retained only as useful shorthand for human ownership at the opening and closing of consequential work. It is not a literal workload quota and must not become a progress score.

The durable rule is:

> Humans own purpose, boundaries, exceptions, standards and the final consequential call. AI may perform bounded work and should interrupt when evidence, scope, authority or consequence changes.

Every proposed AI action is assigned the highest risk found across five dimensions:

1. harm;
2. irreversibility;
3. external reach;
4. evidence uncertainty;
5. change to money, rights, employment, reputation, access or durable truth.

The highest dimension wins. Scores are never averaged down.

| Gate | Meaning |
|---:|---|
| R0 Observe | Read, classify or prepare without changing a consequential state |
| R1 Explore | Generate private options, questions or reversible tests |
| R2 Influence | Shape a recommendation or output another person may rely on |
| R3 Commit | Publish, send, approve, spend, alter access or change durable truth |
| R4 Restricted | Decline or require a separately authorised specialist path |

The exact action contract for each gate remains a later implementation artifact. The G21 code establishes only the highest-risk rule and labels so a later pipeline cannot substitute averaging or model confidence.

## Permanent council

Seven judges own different truths:

1. **Human Agency**: purpose, control, reliance, accountability and the human's ability to understand and override the system.
2. **Epistemic Integrity**: claim typing, evidence standing, uncertainty, countercases and abstention.
3. **Subject, Audience and Lifecycle Safety**: identity, consent, audience, provenance, correction, retention and supersession.
4. **Consequential Usefulness**: whether the intervention sharpens a real high-value decision rather than producing generic advice or activity.
5. **Living Brain Integrity**: whether memory remains versioned, inspectable, portable, correctable and resistant to poisoning or silent self-rewrite.
6. **Human Comprehension and Access**: whether a busy non-technical leader can understand the state, action and consequence without product vocabulary or clutter.
7. **Behavioural and Implementation Reality**: whether the proposed behaviour, system and workflow can work outside a polished demo, including sparse, failure and adversarial conditions.

Two roles do not vote:

- **Standards Prosecutor** enters only after the seven sealed rulings freeze. It cross-examines inconsistencies, tests failure injection and asks whether a valid veto was ignored.
- **Founder Calibration**, including a possible What Would Krish Do view, enters only after first-pass rulings freeze. It can reveal a mismatch with founder taste or product intent but cannot fabricate approval or replace Krish's cold gate.

## Adjudication sequence

1. Freeze the artifact, evidence envelope, criterion versions and hashes.
2. Build a separate theory pack for each judge.
3. Collect seven independent sealed rulings. Judges do not see builder rationale, other verdicts, prior council outcomes or founder prediction.
4. Freeze the first-pass rulings.
5. Add historical calibration that is relevant to the located failure, not the whole founder history.
6. Let the Standards Prosecutor cross-examine material claims, vetoes, evidence locators and resolving tests.
7. Adjudicate deterministically against owned criteria and hard vetoes.

There is no average score and no majority override. A valid veto cannot be outvoted. Disagreement ends in a resolving test, a bounded unknown or a founder-owned product/taste question.

## Durable record families

The future append-only store needs six separate event families:

- `council_contract_events`
- `council_run_events`
- `judge_ruling_events`
- `profile_manifest_events`
- `range_case_events`
- `responsibility_gate_events`

The current TypeScript contract validates the portable payload shape. It does not claim these database objects exist. Any migration remains additive, exact-target reviewed and separately gated.

## Just-in-time theory router

`docs/history` is a dormant advisory library. Historical labels such as `LIVE`, `LOCKED` or `SHIPPED` have no authority. History never overrides current product, code, database or deployment truth.

Every judge receives four current cards:

- human agency;
- evidence standing;
- subject and audience boundary;
- behavioural reality.

Optional historical theory is routed only when a trigger fires. A judge pass receives at most eight optional cards. If more than eight are material, the review splits into stable criterion passes over the same artifact and evidence hashes.

### Frozen packs

| Pack | When | Contains | Excludes |
|---|---|---|---|
| A: blind truth | Before sealed review | Current contract, frozen proof, authority and data boundaries, current invariants, judge-owned criteria and triggered theory cards | Builder rationale, prior verdicts, founder prediction |
| B: historical calibration | After first-pass freeze | Relevant dated founder reactions and observed failures | Generic preference summaries and unconnected history |
| C: adversarial challenge | After first-pass freeze | Other judges' material claims, vetoes, evidence locators, minority reports and resolving tests | Popularity signals and averaged scores |

### Triggered theory

The implemented router covers:

- claim decomposition, load-bearing assumptions and disconfirming evidence;
- strongest countercase;
- reversibility, premortem, opportunity cost and decision quality apart from outcome quality;
- critical incidents, timeline sweeps and contrast for tacit judgement;
- bi-temporal truth, provenance, contradiction and supersession;
- external feedback, correction propagation and regression cases;
- memory-poisoning isolation;
- recognition-first, route-changing questions.

`docs/history/2026-09-07-md (2).md` is quarantined as doctrine. Its expert-judgement and taste section contains broken or mismatched claim-to-source citations. It may provide hypotheses or search terms only until rebuilt from primary evidence.

## Rejected shortcuts

- Multi-model voting as proof of independence.
- Model self-reported confidence.
- Private chain-of-thought as a product or audit surface.
- Fixed percentages, decorative completeness scores or progress theatre.
- A Master Prompt or raw conversation replay as durable memory.
- Prompt-only privacy.
- Automatic promotion of one-off corrections.
- Stale vendor, model, price, legal or benchmark claims.
- Real names used as costumes for synthetic private depth.

## Implemented proof

- `src/features/operator-brain/rangeCouncilContract.ts` owns the matrix, namespace safety, council, responsibility and theory-routing contracts.
- `src/features/operator-brain/rangeCouncilContract.test.ts` proves the 16 coordinates, 48 lifecycle cases, namespace exclusions, seven independent rulings, veto consistency, highest-risk gate and routed theory quarantine.
- `src/features/operator-brain/g21PublicRowCanary.ts` freezes the first four source envelopes, coverage capabilities, allowed notices, unresolved facts, route-changing questions, expected behaviour and forbidden claims.
- `src/features/operator-brain/g21PublicRowCanary.test.ts` proves public-only personhood, external-depth coverage, source-envelope integrity, evidence-backed notices and honest cold-start and sparse behaviour.
- `project-documentation/ctrl-evolution/g21-public-row-canary.md` records the source and claim-evidence matrix, limitations, countercase and verification state.
- `src/features/operator-brain/g21DiagnosticCanary.ts` owns the versioned oracle-free input, bounded output and plain-language surface contracts.
- `src/features/operator-brain/g21CouncilCriteria.ts` assigns one versioned owned truth, pass boundary and hard-veto set to every judge.
- `runs/g21-public-row-run-001/` preserves the first diagnostic, six passes, the comprehension veto, blocked adjudication, standards prosecution and founder calibration.
- `runs/g21-public-row-run-002/` preserves the targeted repair, seven fresh passes, passed adjudication and confirming standards prosecution.
- `npm run brain:g21:check` is the focused deterministic gate.

## What this does not prove

- The public-row diagnostic canary passed its current contract only after one blocked run and a targeted repair. This does not prove diagnostic efficacy outside the four frozen envelopes.
- No private or anonymised evidence has been collected.
- No diagnostic model has run against the 48 cases.
- No council event has been written to Supabase.
- No customer-facing or operator-facing G21 UI has been designed.
- No claim about diagnostic efficacy, judgement improvement or customer value is earned by this contract.

## Next action

Freeze the first matched internal-depth profiles for the remaining matrix. Use only consented or wholly fictional private evidence, control for company scale where possible and freeze expected and forbidden claims before diagnosis.
