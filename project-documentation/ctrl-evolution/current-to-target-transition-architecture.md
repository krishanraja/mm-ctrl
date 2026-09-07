# CTRL current-to-target transition architecture

Status: Proposed for founder review  
Owner: Mindmaker / CTRL  
Prepared: 2026-09-07  
Current source baseline: `8174677125bc2799929e3196282e75cba215b443`  
Production deployment checked: `makeyourmindup.ai`, exact source match to the baseline above

## Executive verdict

Do **not** throw the whole product away. Do **not** preserve the present product structure.

The right move is a **new product built with proven organs**:

- rebuild the product contract, home, user journey, brain domain model and AI orchestration around the new vision;
- preserve operationally valuable primitives such as authentication, ownership controls, memory encryption and correction mechanics, source retrieval, evidence scoring, decision decomposition, delivery, export, billing, resilient loading and existing negative tests;
- place the retained primitives behind new contracts and adapters so their historical schemas and interface assumptions do not define the new product;
- run the new experience beside the old one, prove one complete vertical loop, migrate deliberately and retire old routes only when replacement evidence exists.

This is neither a facelift nor a ground-up rewrite. It is a **strangler rebuild of the nervous system**. The current application has a large amount of useful infrastructure and craft, but its organising logic is still a personalised AI-news product with adjacent decision and memory tools. The target is a living judgement system whose useful work grows an inspectable, portable brain. Feed and audio become downstream expressions of that brain, not the reason the product exists.

## What was inspected

This judgement separates three evidence layers:

1. **Deployed experience.** The public landing, six-step intake and authentication boundary were inspected on the production domain without submitting synthetic personal data.
2. **Exact production source.** The Vercel production deployment was matched to Git commit `8174677`; routes, components, hooks, tests, migrations and Edge Functions at that commit were inspected from a clean detached worktree.
3. **Live stored shape.** The production Supabase schema and aggregate table counts were read without reading personal content or making product-data changes.

The source contains 115 CTRL Edge Function directories, 51 frontend hooks, 167 SQL migrations and 71 source or end-to-end test files. Those figures establish implementation depth, not product-market proof. Live aggregate counts show real use of memory, decisions, evidence, exports and briefings, but the volumes are too small and the feedback loops too sparse to call the present experience behaviourally validated at scale.

The Mindmake OS architecture router referenced by the current local skill was unavailable at both documented locations during this audit. No cross-system OS claim in this document depends on inventing that missing source.

## The current product, in one sentence

`broad public intake → AI-news home and audio briefing → separate decision instrument → graph/fact memory centre → export and supporting tools`

The product documentation describes one shared brain accessor and one curation pool. That is directionally sensible, but the implementation's “one brain” is primarily a read-time composition of several historical stores. It is not yet a single durable, provenance-complete model of judgement, decisions, corrections and outcomes.

## The target product, in one sentence

`natural consequential work → useful human-AI thinking loop → explicit owned call → proposed durable learning → later well-timed help → portable, inspectable brain`

The brain is the organising intelligence. Decide, prepare, reflect, brief and export are ways that intelligence creates value. The leader should experience continuity, recognition and useful challenge; the system should carry the technical complexity invisibly.

## The central mismatch

### Experience hierarchy

The present authenticated home says “Worth a look” and leads with a swipe or rail of AI-industry headlines. Mobile source comments explicitly describe “browsable industry headlines” plus briefing, weigh and build doors. Desktop primary navigation is `Today / Decide / Blind spot / Memory`.

This makes content the product and the brain a destination. In the target architecture:

- the home begins with what deserves the leader's attention or judgement now;
- the fastest path is a real decision, preparation need, tension, correction or useful return;
- the brain is always present as continuity and explainability, but rarely demands administration;
- content appears only when it changes a decision, exposes a category shift, prepares a conversation or earns a place in a briefing;
- audio is a presentation mode for prepared intelligence, not a separate value proposition.

### Public intake

The current public journey is warm and polished, but it asks a generic sequence about the leader's week, an extra self, company AI capacity, a three-year company shape and a delayed decision. It postpones the consequential issue until the sixth step and then promises a briefing, sharper decisions and memory at once.

The target should earn depth through adaptive usefulness:

- begin with the live pressure, artifact or moment the person already cares about;
- reflect something specific back quickly;
- ask a comparative, ranked or voice follow-up only when the answer changes the analysis;
- allow “show me first” and “go deeper” modes so Krish-level richness does not become a compulsory burden for every user;
- stage all inferred learning privately and make the first durable update legible.

### Decision support

The existing decision engine contains unusually valuable primitives: AI-native reframing, typed decomposition, source retrieval, reliability tiers, corroboration, counter-evidence, a breakpoint, validation steps, a user call, resolution and outcome views. The source also shows substantial interaction work around loading, mobile fit, evidence depth and recovery.

The weakness is not an absence of machinery. It is the thinking contract:

- one submitted sentence launches the pipeline before CTRL understands the leader's provisional view, desired decision, alternatives, non-negotiables or evidential bar;
- a hard-coded AI-native classifier can rewrite a general decision into one of five lifecycle stages, which may distort the decision rather than discover what matters;
- six fixed forces are useful scaffolding, but they are treated too readily as the shape of every decision;
- model-generated claims, evidence and recommendation arrive before a human-versus-AI contrast has been established;
- the result can feel like a sophisticated answer vending machine rather than a thoughtful partner helping the leader own a better call;
- the decision record does not reliably become the memory substrate used elsewhere.

The correct upgrade keeps the evidence machinery and replaces the front and back of the loop: adaptive framing before analysis; explicit reconciliation, memory proposal and later outcome learning after it.

### Brain and memory

The existing Memory Centre already provides facts, verification, correction, graph relationships, privacy controls, imports and portable context files. These are useful primitives. But the current user model is fact-centric and administratively visible:

- `user_memory` mixes identity, business context, objectives, blockers and preferences in a broad fact shape;
- graph edges are useful for inspection but are not a sufficient reasoning model;
- criteria, exceptions, negative examples, tensions, decisions and outcomes live in separate schemas or are absent from the active loop;
- `memory_events` exists for lineage but currently has no live rows;
- direct browser writes and Edge-mediated writes coexist in the memory hooks, creating inconsistent lifecycle guarantees;
- a confidence score often represents model certainty, not the user's authority, evidence strength, freshness or applicability.

Most importantly, the shared user-context loader reads recent decisions from `user_decisions`, while the active decision engine writes `decision_cases`. Production currently contains decision cases but no `user_decisions`. The decision product and the brain can therefore evolve independently even though the interface implies continuity.

### Feed and briefing

The curation system has real value: multi-source gathering, clustering, AI-native filtering, corroboration, role and interest ranking, honest fallbacks, feedback hooks, audio delivery and grounded talk-back. Keep it.

What changes is its authority and placement:

- no infinite or default feed as the product's hero;
- no content merely because it is recent or adjacent to declared interests;
- every prepared item must state the live reason it matters: a decision, objective, tension, category shift, customer signal or explicit curiosity;
- content feedback must update the relevant interest or decision context, not masquerade as whole-person learning;
- the briefing becomes a compiled “prepared for you” output from the same context plan used by decisions and meetings;
- listening, reading, asking and acting are modes of the same prepared object.

## Retain, repair, retire or rebuild

| Layer | Current asset | Call | Target treatment |
|---|---|---|---|
| Hosting | Vercel SPA delivery, redirects, recoverable lazy loading | Retain | Keep while the first vertical slice remains a web app; avoid framework migration without a named need. |
| Identity | Supabase Auth and authenticated route boundaries | Retain and harden | Reuse; preserve exact owner and resource checks behind every new service contract. |
| Trust substrate | RLS, field encryption, retention, off-record, deletion and containment evidence | Retain and extend | Make these invariants part of the new domain, not settings-page claims. Add purpose, subject, audience and derivation lineage. |
| UI primitives | responsive shells, sheets, voice capture, audio player, loaders, recovery, accessibility work | Retain selectively | Recompose into the new experience; do not keep old navigation merely because components are polished. |
| Home | headline swipe feed and “Worth a look” rail | Rebuild | Replace with a calm work-and-continuity home. Prepared intelligence may appear as one earned module. |
| Navigation | Today / Decide / Blind spot / Memory | Rebuild | Organise around user jobs and continuity, not historical features. Final labels require concept divergence and user testing. |
| Public onboarding | fixed six-question funnel and future-memory result | Rebuild | Adaptive value-first entry with a fast mode, optional deep ranked interview and explicit first brain receipt. Reuse visual craft where it survives testing. |
| Decision engine | reframe, decompose, verify, counter-evidence, advise | Repair deeply | Preserve typed claims, retrieval and evidence scoring; add human-first elicitation, dynamic lenses, challenge policy, reconciliation, call authority and memory residue. |
| Decision UI | spider, evidence drawers, save, watch, outcome history | Recompose | Keep effective evidence and progress primitives; redesign the journey around the user’s call, uncertainty and next move. |
| Memory store | `user_memory`, verification states, expiry, encryption and supersession | Retain as legacy source; evolve | Do not force the target ontology into the existing table. Build a versioned brain domain beside it and adapt trusted facts across. |
| Brain projection | `brain-profile.ts` and `user-context.ts` | Replace behind contract | Keep as a temporary adapter. The target context planner must read one canonical current projection derived from event history. |
| Memory graph | `memory_edges` and Brain canvas | Retain as optional view | Relationships are useful when evidence-backed. The graph must never be the brain's primary metaphor or architecture. |
| Briefing/news | retrieval, clustering, corroboration, ranking, audio and delivery | Retain as capability | Make it a downstream prepared-output service driven by live work context and intervention policy. |
| Blind Spot | source qualification, signed candidate, rejection suppression, experiment | Retain and generalise | Its candidate-before-commit and evidence-anchor pattern is a strong template for all durable learning proposals. |
| Intake/evidence harness | `evidence_sources`, evidence, constructs, criteria, grading and proposals | Promote carefully | This newer substrate is closer to the target judgement model; integrate it into the new domain after end-to-end proof, not by exposing its technical workflow. |
| Exports | Markdown, model-specific files, skills, MCP access | Retain and rebuild output contract | Export one versioned package with human-readable brain, machine-readable provenance, examples, tests and deletion/withdrawal semantics. |
| Billing | Stripe subscription and entitlement machinery | Retain | Reprice and repackage only after the new value loop is proven. |
| Historical routes | goals, enrich, map, track record, sort, review, proposals, agents, settings fragments | Quarantine | Map each capability to the target journey. Delete or archive orphaned surfaces after telemetry and dependency review. |
| Provider routing | function-specific model calls and fallbacks | Replace with policy | Centralise task contracts, model capability policy, budgets, traces and eval versions; keep providers replaceable. |
| Shared Supabase project | one project hosting CTRL and other Mindmake products | Contain, then decide | Preserve strict ownership boundaries now. Evaluate a dedicated CTRL project before broad personal-memory expansion or enterprise tenancy. |

## Target experience architecture

### 1. Home is a living work surface, not a feed

The home should answer three questions without asking the user to understand the architecture:

1. **What deserves me now?** One live decision, preparation need, tension or promised follow-up.
2. **What has CTRL prepared?** Only material that is ready to help, with a plain-language reason.
3. **What has CTRL learned or become unsure about?** A small transparent receipt, never a maintenance backlog.

A user can speak, type, share or continue the live item. The home predicts lightly and explains itself. If there is no earned intervention, it stays calm.

### 2. Work begins through natural moments

The governing arrival modes remain those in the locked context-circulation architecture:

- authorised meeting or work residue;
- deliberate voice, text, share, upload or forward;
- one just-in-time request for a missing source;
- a bounded ongoing stream only after repeated value and explicit scope.

The first implementation supports only the few modes needed for the initial proof. The domain contract must still preserve source, speaker, subject, scope, audience, permission, purpose and freshness so later adapters do not create a second brain.

### 3. Consequential work uses one human-owned loop

For a decision, prepared meeting or strategic artifact, the experience follows the same conceptual sequence:

`what you currently see → what would change your mind → independent analysis → meaningful contrast → reconcile → own the call → act → learn from outcome`

The visible interaction is adaptive. A light decision may need two taps and one spoken sentence. A consequential ambiguous decision may earn a richer ranked interview. The system asks the smallest question whose answer changes the result.

### 4. The Brain is visible continuity

The Brain is no longer “a graph in settings.” It is a calm, inspectable account of:

- what is known, believed, contested or stale;
- the evidence and person behind it;
- the leader's active objectives, tensions, decision criteria and non-negotiables;
- admired and rejected examples, including why;
- decisions, calls, experiments and outcomes;
- corrections and what they repaired;
- which parts are personal, company-owned, shared or off-record;
- what will be exported.

The user should almost never add metadata manually. They correct meaning in ordinary language; CTRL performs the structured repair and shows a receipt.

### 5. Prepared intelligence replaces the hero feed

The curation capability becomes a set of bounded outputs:

- **For this decision:** evidence, counter-signals and category shifts that could change the call.
- **For this meeting:** stakeholder context, unresolved promises, genuine options and the judgement boundary.
- **For today:** a short read or listen only when several items earn the user's attention.
- **For your category:** exposure, narrative and future-state intelligence with provenance and uncertainty.

No output earns a place because an engagement algorithm predicts a click.

## Target data architecture

### Governing principle

Use append-only evidence and events to derive replaceable current views. Never let a model overwrite durable user truth silently. Store the user's own statement, the model's interpretation and the user's authority as different things.

### Bounded domains

The exact table names are an implementation decision, but the following contracts are required.

#### Identity, tenancy and authority

- person/subject identity;
- organisation and engagement scope;
- personal versus company ownership;
- contributor, viewer, approver and recipient roles;
- consent, purpose, audience, retention and withdrawal receipts.

#### Source and context envelope

- immutable source record or external pointer;
- source type, author/speaker and captured time;
- verbatim segment offsets or hashes where possible;
- sensitivity and third-party subject detection;
- authorised purpose and allowed downstream uses;
- freshness and revocation state.

#### Brain item and version

A brain item is not merely a fact. It can be an objective, constraint, criterion, preference, standard, example, anti-example, tension, belief, forecast, pattern or operating hypothesis. Every version needs:

- epistemic type: observed, user-stated, inferred, challenged, verified, corrected, superseded or expired;
- authority: who said, inferred, accepted or corrected it;
- applicability: situation, surface, audience and exceptions;
- evidence links and counterevidence;
- valid time and system time;
- confidence components, not one blended percentage;
- derivation version and affected downstream artifacts.

#### Decision and consequential work

- original pressure or question;
- provisional human view and confidence;
- alternatives, constraints and “what changes my mind” test;
- analysis plan and dynamic lenses;
- claims, evidence, disagreements and uncertainty;
- independent AI view;
- reconciliation: accepted, resisted, corrected and unresolved points;
- explicit user-owned call;
- next experiment, commitment or artifact;
- outcome, learning and later review.

#### Intervention and outcome

- why CTRL chose to interrupt or prepare something;
- which current context was used;
- what was shown, ignored, corrected or acted on;
- whether it changed a decision, saved attention or improved accepted work;
- whether the interruption was worth it.

#### Evaluation and export

- frozen test cases and rubrics;
- brain version evaluated;
- model and prompt policy version;
- baseline and treatment outputs;
- user or independent grader outcome;
- exported package manifest, provenance, tests and destination receipts.

### Runtime and portability are separate roles

The founder's customer-Brain storage question has been pressure-tested in [the current-source storage architecture brief](research/customer-brain-storage-architecture-brief-2026-09-07.md). The leading, still-provisional contract is:

- a versioned, tenant-isolated PostgreSQL domain is the canonical live Brain;
- encrypted object storage holds raw transcripts, audio and source documents;
- full-text, vector and cache structures are disposable retrieval projections;
- an allowlisted compiler creates deterministic human-readable and machine-readable Brain releases;
- a customer may download a release or synchronise it to a private repository they own;
- GitHub edits return as proposed changes and never silently overwrite the live Brain;
- export boundaries follow one Brain and audience contract, not merely one CRM customer.

GitHub is therefore a first-class ownership, inspection, iteration and handoff surface, not the sole transactional database. The non-technical user should encounter “keep your own copy” and a plain-language change receipt; commits, branches, schemas and sync conflicts stay beneath the product. No production store, GitHub App or customer repository is authorised by this provisional call.

### What happens to existing data

Do not bulk-copy every legacy row into the new brain.

1. Keep legacy tables live and immutable except for existing supported behaviour.
2. Create adapters that present trusted legacy facts, decisions, patterns and preferences through the new read contract.
3. Backfill only rows whose subject, owner, source and meaning are unambiguous.
4. Stage ambiguous inferred content as a private proposal, not accepted memory.
5. Join active `decision_cases` into the new decision projection immediately; stop treating `user_decisions` as the decision source of truth.
6. Generate a migration receipt for every accepted, rejected or quarantined item.
7. Run old and new projections in shadow and compare their context plans before any cutover.

## Target AI and LLM architecture

### Models are workers, not the memory authority

Durable intelligence lives in versioned data, policies, evaluation fixtures and user-owned decisions. Models perform bounded tasks against schemas. No provider's conversational memory becomes CTRL's source of truth.

### The pipeline

1. **Capture and qualify.** Classify source, speaker, subject, permission, purpose and risk. Preserve verbatim evidence before summarising.
2. **Plan the context.** Decide which objective, decision, criterion, contradiction, recent outcome or external source could materially change this task. Retrieve narrowly and record why each item was selected.
3. **Elicit the human view.** Capture the leader's provisional judgement and uncertainty with adaptive contrast. Rich stack-ranked questions are an optional high-yield mode, not a default interrogation.
4. **Construct the analysis.** Select dynamic lenses from the decision and context. The current six AI-native forces can be candidates, not a compulsory ontology.
5. **Run independent reasoning.** Separate the primary analyst, challenger/counter-case and evidence verifier. Independence is a prompt, context and preferably model-policy property, not merely a second completion from the same frame.
6. **Verify deterministically where possible.** Check quotations, source identity, dates, numbers, contradictions, freshness and schema invariants outside the LLM.
7. **Synthesize without collapsing disagreement.** Present the smallest useful contrast, the evidence boundary, the point that breaks the call and what only the human can decide.
8. **Reconcile.** Let the leader accept, resist, edit or leave unresolved. Their call remains a distinct record from CTRL's recommendation.
9. **Propose learning.** Compile only reusable criteria, exceptions, examples, tensions or updated beliefs. Show why each deserves to persist and what it will affect.
10. **Approve proportionately.** Low-risk temporary context may be held provisionally. Durable standards, sensitive personal claims, shared patterns and execution authority require stronger explicit approval.
11. **Propagate and repair.** Rebuild affected current views, cached outputs and exports. Never silently edit history.
12. **Evaluate.** Test the new brain version on held-back work and real outcomes. Roll back or narrow learning that worsens quality, distinctiveness, calibration or appropriate abstention.

### Required orchestration services

- a context planner with traceable selection decisions;
- a task registry defining schema, risk, allowed tools, model policy, latency and cost budget;
- an event and lineage service for all durable proposals and corrections;
- an evaluation service capable of paired baseline-versus-brain runs;
- an intervention policy that optimises usefulness and attention, not engagement;
- a model gateway or equivalent policy layer so capability routing and fallbacks are central rather than duplicated across functions;
- an observability trace that records task and model versions without logging unrestricted personal content.

### What to keep from the current pipeline

- typed claim decomposition;
- source-specific retrievers and source qualification;
- reliability tiers, corroboration and evidence scores;
- visible pipeline progress and honest partial failure;
- counter-evidence and strongest counter-case requirements;
- deterministic output normalisation;
- signed pre-commit Blind Spot candidates and rejection fingerprints;
- field-level memory encryption and owner-bound writes;
- correction guardrails and downstream reliance signals;
- human-readable and model-specific export adapters.

### What to remove from its authority

- automatic reframing of every decision into a fixed AI lifecycle before understanding the user;
- one hard-coded lens set for all decisions;
- a single blended confidence number as the main truth signal;
- generation, judging and memory-writing inside one undifferentiated agent turn;
- context selection by static importance alone;
- model agreement as evidence or release authority;
- direct UI writes that bypass the governed memory lifecycle;
- cached personal outputs whose purpose, subject or correction dependencies are unclear.

## Migration sequence

### Phase 0: protect and observe

Goal: prevent the rebuild from destroying functioning behaviour.

- freeze the old route and schema contracts as characterization tests;
- inventory every live Edge Function caller, cron, webhook and shared-project dependency;
- add production traces for route use, pipeline completion and repair-safe aggregate outcomes;
- define a designated test tenant and synthetic fixtures;
- keep current production unchanged behind its existing domain.

Exit gate: every retained capability has an owner, caller, test, data contract and retirement condition.

### Phase 1: build the new domain spine

Goal: make one trustworthy loop possible without changing the public home.

- add subject/tenancy, source envelope, brain-item version, decision reconciliation, intervention and evaluation contracts;
- build adapters over `user_memory`, `decision_cases`, criteria/evidence and existing permissions;
- implement append-only proposal, approval, correction and propagation receipts;
- create the canonical context-planning service;
- shadow-run new context plans against the old `brain-profile` projection.

Exit gate: a seeded correction changes every eligible current projection and export, leaves history intact and crosses no user boundary.

### Phase 2: ship one end-to-end decision slice

Goal: prove the product thesis through a real useful moment.

The initial vertical slice is:

`voice/type a live AI-transition decision → capture provisional view → one adaptive contrast → targeted evidence and independent view → reconcile → own the call → approve one brain residue → receive one later recall → export the updated brain`

Reuse the current decision retrieval and evidence engine through adapters. Replace its intake, fixed reframe authority, result hierarchy and disconnected memory endpoint.

Exit gate: target leaders complete the loop without technical help; they can explain what CTRL used, correct it, see the repair and prefer the result to the same model with ordinary context.

### Phase 3: rebuild home and onboarding around the proven loop

Goal: flip the experience without turning the Brain into an intake tax.

- replace the content-first home with the living work surface;
- make the public entry begin from a live pressure, artifact or prepared example;
- offer fast, guided and deep-interview paths dynamically;
- show the first useful brain receipt only after value;
- retain a temporary link to the old home for controlled comparison and recovery.

Exit gate: first-use comprehension, time-to-value, completion, felt empathy and return pull beat the old journey without increasing correction burden.

### Phase 4: move briefing and category intelligence downstream

Goal: retain the best feed technology at the correct altitude.

- compile prepared items from live decisions, objectives and category questions;
- add reason-for-inclusion and evidence boundaries;
- make audio a mode of the prepared object;
- measure decision or preparation usefulness, not content consumption alone;
- test the cultural-exposure intelligence exemplar as a bounded research module, not a generic feed.

Exit gate: prepared intelligence changes or strengthens real work more often than it merely earns attention.

### Phase 5: portability, shared patterns and old-product retirement

Goal: make the brain durable beyond CTRL without leaking personal judgement.

- ship versioned Git export with provenance, examples and evaluation fixtures;
- verify use in at least two materially different agent environments;
- add item-level shared-pattern contribution only after withdrawal and de-identification tests;
- migrate high-confidence legacy records and provide quarantine receipts for the rest;
- retire old routes and functions only when replacements meet their acceptance gates and live callers are absent.

Exit gate: a user can leave with a useful, comprehensible brain; deletion and withdrawal work; retained users no longer depend on an old route.

## Architectural proof programme

| Claim | Mechanism | Minimum test before claiming it |
|---|---|---|
| CTRL knows how you judge | criteria, examples, anti-examples, exceptions, calls and outcomes linked to source | held-out new work where the correct criterion is retrieved and applied, with user inspection |
| CTRL gets better | versioned brain plus paired evaluation | prospective improvement over ordinary context and a strong handcrafted skill, including failure and abstention rates |
| The brain self-heals | dependency graph, append-only correction and replayable projections | seeded correction repairs or retires every affected projection, cached output and export |
| CTRL is thoughtful | adaptive elicitation, independent contrast and explicit unresolved state | target users report feeling accurately understood; experts score challenge and calibration above answer-only baseline |
| CTRL preserves taste | negative examples, voice evidence, exceptions and human final authority | blind grading for distinctiveness and voice fit without novelty theatre or factual regression |
| CTRL saves attention | intervention policy and prepared work | reclaimed time is reinvested in customers, judgement, strategy or shipping with quality held or improved |
| CTRL is portable | open package plus provenance and eval manifest | successful export, Git iteration, re-import and use across two different agent surfaces |
| Company value follows | personal capability linked to transition decisions and outcomes | traced improvements in operating decisions, reinvested capacity, transition-map quality and accountable execution |

## Non-negotiable experience standards

- Never make the user curate a database to receive value.
- Never expose a backlog as “your brain needs work.”
- Ask one question at a time unless comparison itself creates the insight.
- Let the user choose fast, guided or deep implicitly through behaviour and explicit control.
- Use voice and one-click capture where it reduces cognitive load, but always show what was understood.
- Explain relevance in human language, not retrieval jargon.
- Preserve uncertainty, disagreement and “I do not know” without making the system feel helpless.
- Make corrections feel powerful: one natural-language edit, a clear receipt and visible downstream repair.
- Never imitate sentience, dependency or human exclusivity. Warmth comes from attention and earned continuity.
- Keep consequential release authority human. Another model can audit; it cannot assume accountability.

## Risks and flip rules

### Legacy complexity overwhelms the new product

Flip rule: if an old primitive requires the new domain to inherit ambiguous ownership, incompatible semantics or repeated special cases, replace that primitive behind its contract.

### A rebuild creates a beautiful demo but loses production resilience

Flip rule: no new surface replaces an old one until characterization, negative-boundary, mobile, recovery and data-replay tests pass.

### “Brain-first” becomes a graph-first settings product

Flip rule: if users spend more time maintaining memory than making or improving consequential work, reduce visible administration and return to value-first residue.

### Adaptive interviewing becomes exhausting

Flip rule: stop when expected information gain no longer changes the decision; offer a fast answer and an optional deeper pass. Test ranked interaction preference across target users rather than generalising from the founder.

### Existing data contaminates the new brain

Flip rule: no legacy item enters accepted memory without an owner, subject, source, state and applicability. Ambiguity is quarantined or proposed, never normalised away.

### Provider sprawl makes behaviour irreproducible

Flip rule: no model or search provider enters a consequential path without a task contract, trace, timeout, fallback, evaluation version and honest degraded state.

### The team mistakes build volume for progress

Flip rule: phase completion requires user and system evidence, not route count, model calls, memory count or generated artifacts.

## The practical middle ground

The product should keep the things that are hard-won and mostly invisible:

- secure identity and ownership;
- reliable source gathering and qualification;
- robust AI and network failure handling;
- evidence provenance and counter-evidence;
- memory encryption, expiry, correction and export mechanics;
- audio, voice, email and responsive interaction primitives;
- billing, delivery and deployment operations;
- useful tests and release discipline.

It should rebuild the things the user experiences as the product and the things that determine what the product learns:

- first-run value exchange;
- home and navigation hierarchy;
- decision conversation and human-AI reconciliation;
- canonical judgement and memory model;
- context planning and intervention policy;
- correction propagation and evaluation;
- feed/briefing authority;
- portable brain package and shared-pattern governance.

That is how six months of engineering survives without six months of assumptions becoming permanent.

## Founder approval gate

The recommended next move is **not** a broad implementation sprint. It is to approve or correct this transition verdict, then specify and prototype Phase 2 as the first proof-bearing vertical slice.

The single decision for founder review is:

> Build a new CTRL product nervous system beside the current app, retain proven capabilities through explicit adapters, and let the first complete decision-to-brain-to-recall loop earn the right to replace the existing home.

If approved, the next artifact should be an implementation-ready vertical-slice contract covering the user story, states, data events, LLM task contracts, legacy adapters, proof fixtures, trust gates and rollout flag. Interaction divergence and a rendered experience should follow from that contract before production code changes.
