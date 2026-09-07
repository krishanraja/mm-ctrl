# CTRL living Brain domain and user model

**Status:** Founder-approved governing direction for G13 contract and proof work

**Authority:** `D-055` authorises the Living Map hybrid as the governing Brain direction and closes G12. It authorises corpus, traceability, physical-contract and proof-fixture work only. It does not authorise a production schema change, migration, customer repository creation, implementation or release.

**Purpose:** Define the smallest coherent model that lets CTRL learn how a person judges, return that intelligence during consequential work, repair itself when understanding changes and compile a useful brain the person can own.

## The product answer

The Brain should feel like a concise, living account of:

1. what matters to me;
2. how I judge;
3. what I have decided;
4. what remains unresolved; and
5. what CTRL has learned or changed.

It should not feel like a database, filing cabinet, graph, chat history, settings page or personality test.

The primary everyday experience is a current portrait of the person's operating judgement. Active decisions and unresolved tensions form the working surface. The retained Living Map is the immersive spatial expression of the same accepted Brain state, not a second truth system. History, provenance and the changelog remain inspectable when they matter, but they are not the home screen.

The simplest truthful promise is:

> CTRL learns what matters in the way you judge, then brings it back when it can improve the work.

This is stronger than remembering facts and narrower than claiming to understand the whole person.

## One model, two layers

The fatal design error would be making the customer's mental model mirror the system's data model. CTRL needs two deliberately different layers.

### The Brain the person sees

| Human section | What belongs there | The useful question it answers |
|---|---|---|
| **What matters** | aims, priorities, non-negotiables, responsibilities and material current context | What is this person trying to protect or create? |
| **How I judge** | criteria, standards, admired examples, rejected examples, trade-offs, exceptions and quality thresholds | What does good mean here, and where does the rule break? |
| **My calls** | consequential decisions, rationale, confidence, commitments, reopen conditions and later outcomes | What did I decide, why, and what happened? |
| **Unresolved** | live tensions, open questions, competing hypotheses, missing evidence and uncertainties | Where is judgement still forming? |
| **What changed** | approved learning, corrections, superseded views and release history | How has the Brain evolved, and what did that affect? |

These are views, not storage buckets. One item may appear in more than one view without being duplicated. The language can become warmer in the interface, but the five meanings must remain stable.

### The machinery CTRL hides

The user should not administer:

- raw source envelopes and object storage;
- atomic claims and evidence links;
- provenance, confidence decomposition or temporal validity fields;
- retrieval indexes or embeddings;
- permission joins and audience projections;
- dependency graphs and repair queues;
- task traces, model calls or evaluator runs;
- version compilation or Git operations.

This hidden layer is not optional. It is what makes the visible simplicity honest.

## The canonical domain kernel

The existing architecture contains useful logical objects, but fourteen separate nouns are too many to become the governing ontology. The target kernel should contain seven first-class concepts.

| Concept | Job | Important boundary |
|---|---|---|
| **Source** | The authorised thing that happened or was supplied: a meeting excerpt, answer, document, correction, observed action or external fact | A source is evidence, not memory and not truth by itself |
| **Assertion** | One atomic statement extracted, stated or inferred from sources, with speaker, epistemic type, scope and evidence links | Normally invisible; cannot silently become durable personal judgement |
| **Brain item** | A reusable, versioned piece of the person's operating judgement | Must state when it applies, what could contradict it and whose authority it carries |
| **Decision** | A consequential case joining the human prior, useful contrast, evidence, owned call, commitments, reopen conditions and outcome | Not merely another memory item; it is both work now and evidence for later learning |
| **Learning proposal** | A candidate addition, revision, narrowing, merge, dispute or retirement of a Brain item | A transition request, not durable truth |
| **Correction and repair** | An append-only event that changes current understanding and enumerates every affected dependency | Never rewrites source history or hides what previously happened |
| **Release** | A verified, portable projection of accepted Brain state at a named version | Not the live runtime and never the only copy |

The existing `human_prior`, `question_plan`, `answer_event`, `analysis_plan`, `ai_view`, `reconciliation`, `owned_call`, `intervention_event`, `outcome_event` and `repair_receipt` remain valid workflow records. They sit inside or connect these seven concepts. They do not need to become things a customer learns to navigate.

## Brain item types

Brain items should use a small semantic type set. Types describe meaning, not UI location.

| Type | Meaning | Example shape |
|---|---|---|
| **Aim** | an outcome, direction or responsibility that currently matters | “Create leaders who can redesign their category for an AI-native future.” |
| **Standard** | a criterion or threshold used to judge work | “Before consequential work ships, the human owns the final judgement and finish.” |
| **Preference** | a genuine personal inclination that improves fit but is not a universal quality rule | “Prefer plain language and complete thoughts over clipped AI cadence.” |
| **Pattern** | a recurring relationship supported by several episodes | “Meetings that begin without divergent options converge on the first plausible frame.” |
| **Example** | a positive or negative reference with the reason it matters | an admired campaign, rejected draft or corrected decision with annotated rationale |
| **Tension** | two values or demands that cannot be honestly collapsed into one rule | private leader candour versus company-paid value |
| **Context** | a time-bounded fact that materially changes applicability | role, category, customer, current constraint or strategic phase |

A decision is not reduced to a Brain item. CTRL may derive proposed aims, standards, patterns, examples or tensions from a decision, but the complete decision case remains intact.

## Four independent axes, not one confused status

The current memory vocabulary mixes maturity, truth status and sharing. These must be separated.

### 1. Maturity

- **Staged:** private, short-lived interpretation bound to its source.
- **Proposed:** worth considering as reusable learning.
- **Held:** a provisional working assumption allowed to assist within a narrow, low-consequence scope.
- **Trusted:** explicitly accepted or otherwise promoted under a declared high-confidence policy.

### 2. Current standing

- **Current:** eligible for use within its scope.
- **Disputed:** contradicted or challenged; excluded from confident guidance.
- **Superseded:** replaced by a named later version.
- **Retired:** no longer current, retained for lawful lineage.
- **Expired:** its time boundary passed without renewal.

### 3. Audience

- private to the person;
- private delivery team;
- named company or project;
- approved de-identified pattern commons;
- public release.

Audience is never inferred from maturity. Making something trusted does not make it shared. Sharing does not make it true.

### 4. Consequence permission

- may personalise presentation;
- may suggest or retrieve;
- may shape reversible work;
- requires visible confirmation before shaping consequential work;
- prohibited from use in the named context.

This lets CTRL be helpful without pretending that all memories deserve equal authority.

## What every durable item must know

A durable Brain item version requires:

- its plain-language meaning;
- semantic type;
- subject and owner;
- provenance and linked source assertions;
- whether it was said, observed, inferred or outcome-tested;
- applicability: domain, role, audience, task and conditions;
- exceptions and counterexamples;
- supporting and contrary evidence;
- maturity, standing, audience and consequence permission;
- confidence components rather than one opaque score;
- valid time and recorded time;
- predecessor and supersession lineage;
- dependencies and known downstream uses;
- freshness rule and next review trigger.

The person normally sees the meaning, why CTRL thinks it matters, where it came from, where it applies and the available correction. The rest appears only when inspecting.

## How the Brain earns learning

The learning loop is:

`capture → distinguish → contrast → propose → authorise → apply → observe → repair → test`

### Capture

Accept deliberate voice, text, upload, share or bounded authorised work residue. Preserve the original source and its context. Do not collect ambient exhaust because it might someday be useful.

### Distinguish

Separate what the person explicitly said from what CTRL observed, what another person said, what an external source claims and what a model inferred. This boundary must survive summarisation and export.

### Contrast

Taste and judgement emerge most reliably from comparative evidence: chosen against rejected, before against edited, expected against actual and rule against exception. CTRL should ask the smallest question that reveals the discriminating criterion, not request a general self-description.

### Propose

A proposal must show one reusable learning in natural language, why it may matter later, its evidence, intended scope and the effect of keeping it. Batch or defer proposals when interruption would cost more than the learning is worth.

### Authorise proportionately

The default routes are:

| Situation | Allowed route |
|---|---|
| presentation preference with repeated low-risk evidence | hold narrowly; offer unobtrusive correction |
| new criterion, standard, belief or consequential inference | explicit keep, edit, narrow, keep provisionally or discard |
| audience expansion or pattern-commons contribution | explicit item-level approval |
| correction to the person's own stated view | explicit confirmation unless the person directly issued the correction |
| company fact from an authoritative system | may become current company context under source policy; never personal judgement by implication |

Silence is not approval. Repetition is evidence, not authority.

### Apply

Retrieve the smallest useful set by purpose, scope, consequence, freshness and decision value. Semantic similarity is only one candidate-generation signal. The context planner must be able to explain why each item was selected and exclude high-similarity items with the wrong audience or applicability.

### Observe

Record whether the person accepted, resisted, corrected, ignored or later reversed the result, and whether the real-world outcome supported the underlying judgement. Absence of correction is weak evidence, not endorsement.

### Repair

When understanding changes, create a new version and a repair event. Preserve the old version and source. Traverse dependencies to identify affected current views, decisions, prepared outputs, skills, evaluation fixtures, indexes and releases.

CTRL may automatically:

- mark stale or contradicted projections;
- stop disputed material from steering future work;
- rebuild disposable indexes and current views;
- draft replacements and a repair plan;
- flag previously generated work that may need review; and
- produce a receipt of what was checked, changed, quarantined or left for the person.

CTRL must require human authority before it:

- changes the meaning of a human-authored standard or call;
- resolves an honest contradiction between human positions;
- expands audience or publishes a shared pattern;
- rewrites an already delivered consequential output;
- changes another person's Brain; or
- performs erasure that affects contractual or legal retention.

### Test

Every promoted criterion or standard should improve performance on genuinely new work. Evaluate with frozen holdouts plus rolling failure cases. The generating model cannot be the sole evaluator. Where possible, use deterministic checks and an independent evaluator, followed by human judgement for taste and consequence.

## Preserving taste without freezing the person

A profile full of adjectives will produce cosplay. A useful taste model requires contrastive evidence.

For each material standard or preference, preserve:

- an admired example and why it works;
- a rejected or corrected example and the exact failure;
- the smallest discriminating criteria;
- applicable contexts;
- exceptions and edge cases;
- confidence and recency;
- evidence of transfer to new work.

Model-generated output cannot become evidence of the person's taste until the person has graded, edited, chosen or rejected it. A generated summary may help form a proposal, never authenticate itself.

The evaluator must guard against both generic convergence and novelty theatre. It should test for blind optimism, missing or false numbers, homogeneous causal models, box-standard moves, historical recombination presented as divergence, empty affirmation and imported AI cadence. It must also allow a simple or familiar answer when the evidence makes it best.

This product implication is supported by current personalised-preference research: explicit, query-relevant criteria derived from contrastive choices are more actionable than a descriptive persona. The research remains an input to CTRL's method, not proof that CTRL works. See [P-Check](https://aclanthology.org/2026.acl-long.2011/) and [Capturing Individual Human Preferences with Reward Features](https://arxiv.org/abs/2503.17338).

## Remembering and forgetting are both product behaviours

CTRL needs five distinct operations:

- **revise:** create a new current version while preserving lineage;
- **narrow:** reduce where an item may apply;
- **demote:** lower maturity or consequence permission;
- **retire or expire:** remove from current use while keeping lawful history;
- **erase:** remove eligible data and every derived projection under a verified deletion workflow.

Forgetting must not mean losing the audit trail by accident. Retention must not mean continuing to use stale material. The live current view and the historical record are separate projections.

Continual memory is still an open technical problem, especially when personal and procedural memory co-evolve. CTRL therefore needs explicit tests for learning, transfer, interference and forgetting rather than a single recall score. [AgentMemoryBench](https://openreview.net/pdf/2cd400b6dec127be21f88da3528c021c699c914f.pdf) is a useful research reference, not a sufficient product benchmark.

## The first user experience

### Home

Home should answer three questions in seconds:

1. What deserves my attention now?
2. What does CTRL already understand that can help?
3. What useful thing changed since I last looked?

The dominant object is current consequential work, not the Brain inventory. The Brain is felt through recognition, prepared contrast and continuity. Its visible portrait is one step away when the user wants to inspect or shape it.

### My Brain

My Brain combines two complementary lenses over one hidden kernel:

- a short current portrait using the five human meanings for fast comprehension and action; and
- a retained Living Map for immersive exploration, connection and visible growth.

The portrait leads with high-leverage, specific material, not counts. Each item can reveal source, applicability, exceptions, change history and where it has been used.

The Living Map is a signature product and marketing surface, but it must be semantically truthful. It may be spatially impressionistic and visually expressive; it may not imply a relationship, strength, certainty, causality or authority that the underlying model cannot support. Nodes and links are projections of versioned typed entities and relationships. Visual encoding must distinguish material concepts such as scope, standing, maturity, tension, evidence and change without asking the user to learn the ontology. Semantic zoom should move naturally from orientation, to meaningful neighbourhood, to inspectable item and evidence.

The five human meanings are lenses rather than five mandatory tabs, and the map is another lens rather than the canonical store. Moving between portrait and map must preserve selection, context and meaning. A correction accepted in either lens must produce the same governed version and repair path. The user should experience one living Brain, not a dashboard beside a decorative graph.

The section should support a few natural actions:

- “That is right.”
- “Not quite.”
- “Only for…”
- “Not anymore.”
- “Where did this come from?”
- “Use this in…”

The labels may be refined, but the actions cannot become technical verbs such as promote, invalidate, re-embed or merge nodes.

### Learning moments

The normal experience is one optional proposal at the end of useful work. CTRL may occasionally collect several low-urgency proposals into a short review. It should never turn every interaction into memory administration.

### Progress

Do not use memory quantity as the hero measure. Progress should indicate capability coverage and evidence quality, for example:

- which important decision areas CTRL can currently support;
- where it has strong standards plus examples and exceptions;
- where its understanding is provisional, stale or contradicted;
- whether prior learning transferred successfully to new work; and
- what the user can now take with them in the current release.

This can feel like a map becoming clearer, not a profile reaching 87 percent completion.

## Portable representation

PostgreSQL remains the canonical live runtime, encrypted object storage retains authorised source artefacts and retrieval indexes remain disposable. A release compiles accepted state into a deterministic human-readable package:

```text
README.md
brain.manifest.json
profile/
  what-matters.md
  how-i-judge.md
decisions/
  active/
  archive/
unresolved/
  tensions.md
  open-questions.md
evidence/
  manifest.jsonl
  examples/
evals/
  rubrics/
  fixtures/
skills/
  <portable generated skills>
CHANGELOG.md
```

The Markdown is for people and broad tool compatibility. The manifest preserves stable IDs, versions, scope, provenance, hashes and relationships. Skills are compiled projections for execution surfaces, not the canonical Brain. The package must round-trip without quietly promoting or losing meaning.

Customer-owned private GitHub repositories are an optional destination and excellent for technical customers, advisers and durable handoff. They are not the live database and should never be required for the ordinary experience. ZIP download remains a complete exit. The product should make both feel like “take my Brain with me,” not a developer workflow.

## Technical consequences

1. Store append-only events and immutable versions; derive replaceable current views.
2. Model audience, maturity, standing and consequence permission independently.
3. Make source assertions and human authority queryable, not buried in prose.
4. Maintain an explicit dependency graph for repair. Do not infer downstream impact only through vector similarity.
5. Use retrieval routing: fast current judgement first, deeper evidence only when novelty, uncertainty or consequence requires it.
6. Keep model providers outside the memory authority boundary. Models propose and reason; deterministic services enforce permissions, versions, idempotency, release hashes and repair completeness.
7. Preserve generator and evaluator separation for quality claims.
8. Introduce no specialised memory database until named evaluation failures show PostgreSQL, object storage and replaceable indexes are insufficient.
9. Make every durable write replay-safe and every external side effect receipted.
10. Build observability around correctness, latency, correction burden and intervention value, never broad employee surveillance.

These consequences align with current agent-engineering guidance that context is finite and must be deliberately curated rather than accumulated indiscriminately. See Anthropic's [context-engineering guidance](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). They also retain the hybrid storage decision already approved in `D-052`.

## V1 boundary

V1 should prove one compounding loop for one leader:

1. capture one consequential decision or work artefact;
2. elicit one discriminating judgement signal;
3. produce one useful contrast and owned call;
4. offer no more than one Brain learning;
5. return that learning during materially different later work;
6. accept a correction and prove every eligible downstream use was repaired;
7. compile and verify a portable release; and
8. show held-out lift against the same model without CTRL context.

V1 should not attempt:

- ambient capture of every workplace interaction;
- a general company knowledge replacement;
- autonomous changes to trusted personal standards;
- organisation-wide shared memory;
- a customer-facing knowledge graph;
- broad connector coverage;
- collective-intelligence claims;
- a reward-model training programme; or
- production claims of improved decisions, self-healing or ownership before their tests pass.

## Acceptance tests

The model is ready for physical design only when fixtures prove:

- a source cannot silently become trusted judgement;
- another person's statement cannot become the subject's view;
- a trusted item stays private unless separately shared;
- a high-similarity item with the wrong scope is excluded;
- an explicit correction creates a new version and blocks the old current projection;
- all known dependencies receive a repair outcome or visible unresolved status;
- negative examples and exceptions alter evaluation of new work;
- stale context is demoted or surfaced rather than confidently reused;
- the same release input produces byte-identical output;
- export and re-import preserve IDs, authority, scope and standing;
- deletion removes every eligible derived projection and provides a receipt;
- the person can understand and correct the visible Brain without learning the ontology; and
- the system asks fewer questions when it has enough evidence, not merely more personalised questions.

## Approved governing direction

`D-055` adopts this model as the governing direction and closes G12:

- **The user sees five human views:** what matters, how I judge, my calls, unresolved and what changed.
- **The current portrait and Living Map are complementary projections of the same accepted Brain state.**
- **The Living Map remains immersive and expressive while every visible semantic claim stays supported by typed, versioned data.**
- **The system runs seven canonical concepts:** source, assertion, Brain item, decision, learning proposal, correction and repair, and release.
- **Maturity, standing, audience and consequence permission are orthogonal.**
- **The Brain learns through contrastive evidence and proportionate authority, not transcript volume or silent inference.**
- **Self-healing means append-only correction plus complete, receipted downstream repair.**
- **The live runtime and the portable owned release remain separate but round-trippable.**

This is a narrowing architecture, not a request to add seven new top-level product areas. Its purpose is to make the product simpler to use and harder to corrupt.

## Next proof gate

G13 must translate the approved direction into a physical domain contract, projection rules, semantic visual grammar and representative-volume fixtures before product implementation. The proof must show that the concise portrait and Living Map remain consistent through learning, correction, authority changes and repair; that the map stays understandable at realistic scale; and that no unsupported visual relationship can masquerade as Brain truth.
