# G24 CTRL product-system blueprint

**Status:** Proposed governing architecture, ready for founder review

**Date:** 11 September 2026

**Authority:** Local architecture, contract and proof sequencing only. This document does not authorise a production write, customer-data action, new account, email, connector, database branch, deployment, merge, feature enablement or release.

**Product lock:** The immutable product source is the founder-approved G23 R2 artifact at tag `ctrl-product-spine-g23-approved-r2`. This blueprint implements that promise. It does not reinterpret it.

**State route:** `project-documentation/ctrl-evolution/README.md`

## The whole product in one minute

CTRL is a private AI Brain developed with one leader during a Mindmake thirty-day relationship.

The Brain arrives prepared, works on a real consequential decision immediately, learns only what earns permission, and brings relevant judgement back when a later decision would otherwise start cold. Krish sees the rich backstage picture and decides whether a question or interruption is worth the leader's attention. The leader sets purpose, judges the work, makes the call and owns what leaves the room.

The company pays because the leader becomes more capable of redesigning the business with AI without surrendering purpose, taste, standards or accountability. At the end, the leader can inspect and take away a readable and machine-usable Brain.

```text
authorised work and research
           |
           v
private source staging -> claims with provenance -> current Brain
           |                                      |
           v                                      v
one live consequential decision <- useful prior judgement
           |
           v
Brain prepares -> Krish challenges -> leader decides
           |
           v
one proposed learning -> accept, edit, hold or reject
           |
           v
later different decision -> correction-aware reuse -> portable release
```

This is not a dashboard, questionnaire, knowledge base, content feed, generic company brain or LLM wrapper. Those can be organs or substitutes. The product is the governed learning relationship.

## Why this blueprint exists

The programme lost clarity when isolated pages became the review unit. This document restores one build object that connects:

- the thirty-day relationship;
- all legitimate ways context can arrive;
- the hidden evidence and Brain machinery;
- the Brain, Krish and leader authority split;
- one human-owned decision loop;
- learning, correction, repair and later reuse;
- the radically simple customer experience and rich private operator experience;
- Claude, email and work-tool membranes;
- the Living Brain and portable release; and
- the transition from the current product without discarding proven capability.

Every later screen, model task, table and integration must be able to point to its place in this system. If it cannot, it is not part of the first product.

## Truth labels

Every implementation record must use one of these labels. Visual polish must never obscure the difference.

| Label | Meaning |
|---|---|
| **LOCKED** | Founder-approved product truth or an invariant inherited from an approved contract |
| **CONFIRMED** | Read from current source, a live system or deterministic verification |
| **PROPOSED** | The recommended target, still subject to a bounded founder or implementation gate |
| **UNPROVEN** | A value, quality, performance or efficacy claim that needs observed evidence |

### Current technical truth

- **LOCKED:** G23 R2 defines the thirty-day product spine and role authority.
- **CONFIRMED:** the product Supabase project has eleven new RLS-enabled Brain tables, all empty at the 11 September readback.
- **CONFIRMED:** current runtime code still reads and writes legacy `user_memory`, `user_decisions`, `decision_cases`, evidence and briefing stores.
- **CONFIRMED:** the approved operator Decision Table is a preview-gated, fixture-backed React slice. It does not use the new Brain tables.
- **CONFIRMED:** strict encryption and idempotency primitives exist locally under `supabase/functions/_shared`, but no runtime invokes them against the new Brain substrate.
- **CONFIRMED:** there is no Supabase development branch for this product today.
- **UNPROVEN:** no real user has yet completed the target decision-to-learning-to-later-reuse loop on the new substrate.

The immediate architectural problem is therefore not missing visual polish. It is joining an approved product model to a secure but disconnected data model without allowing the legacy product to remain the hidden authority.

## Non-negotiable product boundaries

1. CTRL serves willing leaders making consequential AI-transition calls about their category, organisation, work, roles, pace, initiatives or own leadership. It is not general business advice.
2. Personal capability is the mechanism. Useful organisational and commercial change is why the company pays.
3. AI can prepare, move, analyse, enrich, compare and audit information. A human owns purpose, consequential judgement, final quality and release.
4. The leader's provisional view comes before the system's recommendation.
5. One question is visible at a time. Depth is optional and earned by consequence, not by a completion target.
6. No named-person employment recommendation belongs in v1. Role and work design may be analysed without scoring people.
7. Time, repetition or model confidence cannot turn an inference into authorised personal truth.
8. A vector index, graph layout, transcript or chat history is never the memory authority.
9. Customer-private, operator-private, company and personal material do not collapse into one context.
10. Silence and abstention are successful states when no interruption or inference has earned standing.
11. Every consequential claim carries provenance, freshness, audience, uncertainty and correction history.
12. A correction repairs downstream uses. It is not merely added as another note.
13. The customer sees the smallest useful moment. Krish can inspect the deeper machinery.
14. The leader can leave with a useful Brain without knowing GitHub, schemas, embeddings or prompts.

## One product, three authorities

| Actor | May do | May not do |
|---|---|---|
| **Brain** | Research, qualify sources, expose gaps, prepare materially different routes, retrieve prior judgement, label standing, propose learning and show what a correction affects | Promote its own inference, silently widen audience, decide what a person believes, make the consequential call or release work |
| **Krish** | Select the customer and decision, add private context, challenge weak logic, inspect evidence, control whether and when the leader is asked, and prepare the session | Fabricate certainty, silently convert private operator judgement into the leader's view, or make the leader's call |
| **Leader** | Set purpose and success, state a provisional view, define the human boundary, answer or decline, accept or change a proposed transfer, make the call, polish what ships and own the release | None of the Brain's technical administration is required of them |

For high-consequence work, the Brain cannot bypass either human role. For low-consequence capture and preparation, it can do extensive hidden work while keeping the resulting standing provisional.

## The thirty-day operating model

These are relationship moments, not a progress course and not a user-facing timeline.

| Relationship moment | What the system does | What Krish does | What the leader experiences |
|---|---|---|---|
| **Before the first session** | Builds an ethical public-company and category dossier, ingests authorised supplied material, identifies conflicts and marks missing evidence | Checks identity, scope, audience and the first consequential decision | Arrives recognised without being presented with a profile to administer |
| **First real decision** | Captures the human prior, asks the smallest route-changing question, prepares contrasting routes and grounded evidence | Challenges the frame and weak assumptions | Sees something specific enough to improve a real call within five useful minutes |
| **Between sessions** | Processes authorised transcripts, voice, work and outcomes; stages possible learning; prepares what changed | Reviews high-consequence proposals and controls outreach | Receives nothing unless a question or return has earned attention |
| **Later different decision** | Retrieves only applicable accepted judgement, shows why it may travel and preserves counter-evidence | Challenges false transfer and chooses whether to interrupt | Accepts, changes or blocks the connection before making the new call |
| **Close and continuation** | Compiles a verified portrait, Living Brain projection, change history and portable release | Reviews unresolved risks and company or personal boundaries | Can see what became clearer, what remains open and what they own |

There is no requirement to reach one hundred percent completeness. A sparse but well-evidenced Brain is more valuable than a full profile made of guesses.

## Context circulation

### Legitimate doors

The system presents one simple capture action while supporting several routes underneath it:

- authorised meeting transcripts and engagement work;
- paste, share, upload, screenshot, URL or forwarded email;
- short voice or text reflection;
- an answer to one system or Krish-selected question;
- a correction, edit, rejected option or final release decision;
- decision outcomes and observed consequences;
- selected completed work and the feedback it received;
- ethical public research about the person, company, category and current events; and
- later, deliberately bounded streams from a folder, meeting series, inbox label or work system.

Blanket surveillance, ambient capture of every click, whole-inbox ingestion and automatic meeting recording are not default routes.

### Universal source envelope

No downstream process may use raw content without an envelope that establishes:

- immutable source ID and content hash;
- workspace, subject and originating actor;
- source type, original time and capture time;
- claimed speaker and whether that identity is verified;
- personal, company, project and third-party ownership;
- exact audience ceiling and purpose;
- consent and retention class;
- sensitivity and consequence class;
- public, supplied, observed, quoted, inferred or generated epistemic type;
- currentness and a recheck rule;
- processing state and failure reason;
- source spans for extracted claims; and
- full lineage to every derivative.

When identity or audience is uncertain, the source remains unassigned or at the narrowest private scope. Instructions inside supplied material remain inert evidence.

### Processing states

```text
received -> quarantined if unsafe -> privately staged -> claims extracted
         -> duplicate or irrelevant -> retained receipt, no Brain proposal
         -> ambiguous -> one route-changing clarification or hold
         -> supported -> optional learning proposal
         -> accepted, edited, held or rejected by the right authority
```

The original source remains recoverable when extraction, transcription, research or model processing fails.

## The Brain model

### Memory is layered, not one bucket

| Scope | Contents | Persistence |
|---|---|---|
| **Run** | active plan, tool results, approval state, retry key and checkpoints | Short-lived, replayable operational state |
| **Session or case** | current decision, human prior, questions, routes, evidence, reconciliation and call | Durable case history, not automatically reusable judgement |
| **Person** | authorised aims, standards, preferences, patterns, examples, tensions and applicable context | Versioned durable Brain items owned by the person |
| **Company or project** | authorised strategy, facts, constraints, decisions and outcomes that belong to that entity | Versioned, separately permissioned organisational context |
| **Product learning** | de-identified, explicitly shared patterns and evaluator lessons | Separate from every customer Brain and never fed by raw private material |

An agent or model instance has no personal memory authority. `agent_id` and `model_run_id` identify workers and traces, not ownership.

### Canonical kernel

The seven user-meaningful domain concepts remain:

1. **Source**: what was supplied, observed or found.
2. **Assertion**: one atomic claim with epistemic type and source span.
3. **Brain item**: reusable, versioned operating judgement.
4. **Decision**: a consequential case and its owned call.
5. **Learning proposal**: a requested change to the Brain.
6. **Correction and repair**: append-only change plus affected dependencies.
7. **Release**: a verified portable projection.

The person sees five projections of this kernel: what matters, how I judge, my calls, unresolved, and what changed. The Current Portrait and immersive Living Map are projections of the same accepted state. The map may be visually dramatic, but every displayed relation must be semantic, sourced and inspectable. Layout tethers are never presented as discovered meaning.

### Brain-item standing

Maturity, current standing, audience and consequence permission are independent axes. A high-confidence inference is still not an authorised personal standard. An accepted personal preference is still not company policy. A retired item remains in history but cannot steer a current intervention.

Every durable Brain item must state:

- what it means in the leader's own or explicitly accepted language;
- where it applies and known exceptions;
- supporting and contradicting assertions;
- who has authority to change it;
- its audience and consequence permission;
- version, valid time and recorded time;
- what would make it stale or wrong; and
- every decision, context capsule, output or release it later influenced.

## Runtime and storage

The approved hybrid architecture has four distinct jobs.

| Layer | Job | Authority |
|---|---|---|
| **Supabase Postgres** | tenancy, permissions, envelopes, claims, Brain versions, decisions, proposals, corrections, outcomes, events and receipts | Canonical live state |
| **Encrypted object storage** | original audio, documents, images and large source bodies | Canonical raw source bytes, addressed by immutable hash |
| **Derived retrieval projections** | full-text, dense, sparse and relationship indexes; reranking cache; prepared context | Disposable and rebuildable |
| **GitHub or ZIP release** | readable Markdown, machine manifest, evidence manifest, standards, decisions, evaluations, changelog and skills | Portable customer-owned release, not the hot database |

GitHub edits do not silently flow back into the live Brain. They return as proposed changes with provenance. The release must remain useful when imported into at least two supported agent environments without a CTRL database connection.

### Product and OS boundary

The product Brain remains in the product Supabase project. Mindmake OS may receive approved operating receipts and work queues through explicit adapters, but it is not a second customer-data authority. The OS pull-only rule for Krish remains intact: CTRL does not create an unsolicited notification channel to Krish. Customer outreach is a separate, operator-controlled delivery capability.

## Logical data domains

The physical schema is not locked by this document. The following contracts are.

| Domain | Required durable records | Existing position |
|---|---|---|
| **Identity and authority** | workspace, subject, membership, role, audience grant, consent, retention | New substrate exists and is empty |
| **Sources and claims** | source envelope, object pointer, assertion, source span, verification and freshness | New substrate partly exists; legacy evidence adapters are needed |
| **Living Brain** | item, item version, assertion links, relationship, relationship version and standing | New substrate exists and is empty |
| **Consequential work** | engagement, case, human prior, question plan, answer event, analysis plan, route, AI view, reconciliation, owned call and outcome | Legacy decision machinery exists; target contract is not implemented |
| **Learning and repair** | proposal, authority event, correction, dependency edge, repair plan and repair receipt | Target contract exists in docs; runtime path is not implemented |
| **Intervention and delivery** | intervention candidate, interruption decision, delivery intent, message receipt and response | Briefing and email organs exist; target control model is not implemented |
| **Context exchange** | purpose-bound capsule, selected versions, exclusions, expiry, revocation, read receipt and return provenance | Current MCP organ exists; target capsule flow is not implemented |
| **Evaluation and release** | model run, independent evaluation, council verdict, golden-set result, release manifest and import receipt | Partial local test assets exist; target operational records are not implemented |

Every state transition emits an append-only event with actor, authority, idempotency key, input version watermarks and before/after references. Current-state tables remain projections for fast reads. This gives the product replay, audit and repair without forcing the interface to expose event-sourcing language.

## AI harness

### Stable layers

1. **Execution runtime:** durable jobs, bounded retries, checkpoints before and after side effects, idempotency and explicit terminal states.
2. **Context system:** stable instruction prefix, task-specific compiled context, token budgets, compaction and artifact offloading.
3. **Capability surface:** a small fixed catalogue of typed tools. Models never receive raw database or unrestricted connector access.
4. **Governance:** audience checks, policy, approvals, provenance, redaction, consequence gates and audit.
5. **Adapters:** Supabase, object storage, research, transcription, Claude MCP, email and later work tools behind replaceable contracts.

Start with one orchestrator. Add parallel or specialised workers only when isolation, independent evaluation or a distinct source boundary justifies them. More agents are not a quality signal.

### Model task registry

| Task | Structured output | Authority and fallback |
|---|---|---|
| **Source qualifier** | identity, ownership, source type, spans, sensitivity, ambiguity and processing recommendation | Cannot promote memory; ambiguity holds or asks one plain question |
| **Public researcher** | dated atomic claims, direct sources, freshness and unresolved gaps | Public evidence only; no invented private inference; unsupported claims are excluded |
| **Decision framer** | actual decision, stakes, provisional routes, human boundary and missing conditions | Must preserve the leader's wording and prior; cannot recommend yet |
| **Question planner** | ranked route-changing questions with expected decision value and answer mode | Shows one question; Krish may edit, delay or suppress; abstain if none earns attention |
| **Route architect** | genuinely different routes, assumptions, numbers, failure modes and disconfirming evidence | Must pass anti-convergence checks; no cosmetic variants |
| **Evidence planner and retriever** | named evidence gaps, source queries, selected spans and sufficiency | Uses adaptive retrieval; every extra hop closes a named gap; bounded iteration |
| **Independent challenger** | strongest objection, hidden assumption, counter-case and risk to human agency | Separate run and context from the route generator |
| **Reconciler** | agreements, disagreements, remaining unknowns and decision implications | Never converts AI consensus into the leader's call |
| **Learning compiler** | at most one add, revise, narrow, merge, dispute or retire proposal with evidence and scope | No self-promotion; correct authority must accept or edit |
| **Repair planner** | affected dependencies, quarantine set, recomputation plan and required human review | Deterministic dependency traversal before model interpretation |
| **Context compiler** | purpose-bound Claude or tool package with exact included versions and exclusions | Read-only first; fails closed on stale or mixed-audience context |
| **Release compiler** | deterministic files, manifests, hashes, audience split and import contract | Code verifies bytes and completeness; a model may draft prose but cannot attest it |
| **Evaluator council** | separate rubric verdicts, citations, vetoes and change from prior verdict | Frozen inputs; no majority override of a valid safety or integrity veto |

Model/provider selection remains replaceable. Prompts are versioned code. Inputs and outputs use schemas. The model never writes canonical state directly.

### Retrieval policy

Retrieval is adaptive rather than agentic by default:

1. deterministic filters enforce workspace, subject, audience, standing, validity and consequence permission;
2. hybrid lexical and semantic retrieval produces candidates;
3. a reranker uses the named decision gap, not general similarity;
4. relationship traversal is used only when the relation carries semantic evidence;
5. iterative retrieval is reserved for genuinely multi-hop or conflicting questions;
6. each additional hop must close a named gap and the loop is capped;
7. every material output claim links to a source span or is labelled as new reasoning; and
8. insufficient evidence returns the gap and smallest useful experiment.

Indexes and caches can be deleted and rebuilt from canonical state. Corrections invalidate affected projections by version watermark.

## Human agency and the consequential-work loop

The founder's first-and-last-ten-percent principle becomes a consequence-sensitive responsibility gate, not a literal time quota.

### Opening gate

Before AI shapes a consequential decision, a named human supplies or confirms:

- the actual decision and why it matters now;
- purpose and desired change;
- what success and unacceptable failure mean;
- what remains a human responsibility; and
- the provisional view or explicit uncertainty.

### AI middle

The system may then perform the heavy work: move and clean data, research, compare, calculate, generate divergent routes, expose contradictions, simulate consequences and prepare a critique.

### Closing gate

Before consequential work ships, a named human:

- inspects sources and numbers proportionate to risk;
- judges the independent audit rather than blindly accepting it;
- applies taste, voice, exceptions and final polish;
- makes the call and accepts accountability; and
- states a stop, revisit or outcome condition.

This is how CTRL makes the leader more AI-fluent through real work without becoming e-learning or a generic automation course.

## Preserving taste without producing more sameness

CTRL captures judgement through contrast, not flattery.

- Retain chosen, rejected and edited examples, including why the distinction mattered.
- Separate content, structure, tone, evidence and consequence preferences instead of reducing taste to style mimicry.
- Use the leader's approved history to generate task-specific evaluation criteria, then keep the criteria inspectable and versioned.
- Require routes to differ in causal model, strategic commitment or operating mechanism, not just wording.
- Penalise blind optimism, missing or incorrect numbers, homogeneous routes, obvious default moves and history-only extrapolation.
- Preserve high-quality surprise. Matching the leader's previous answer is not the objective.
- Re-evaluate preferences against later outcomes and held-out work so a past preference does not become an immortal rule.
- Store negative examples and corrections as first-class evidence.

The generator and evaluator are separate. A third deterministic layer verifies facts, schemas, permissions, hashes and required fields. The leader then critically assesses both the work and the audit.

## Learning, correction and self-healing

CTRL does not self-improve by rewriting its own rules in production. It improves through governed proposals and independently verified releases.

### Learning loop

```text
capture -> distinguish -> contrast -> propose -> authorise -> apply
        -> observe later use and outcome -> correct if needed -> repair -> test
```

### Correction cascade

1. Record the correction as a new event. Preserve the source and prior interpretation.
2. Close or dispute the current version. Never overwrite history.
3. Traverse deterministic dependency edges to every affected Brain relation, decision view, context capsule, prepared output, evaluation and release.
4. Quarantine affected current projections before they can guide new consequential work.
5. Recompute deterministic projections first, then run only the model tasks whose meaning depends on the correction.
6. Route any changed high-consequence interpretation to the right human authority.
7. Publish a repair receipt stating what changed, what did not, what was blocked and what still needs judgement.
8. Re-run the relevant frozen and rolling evaluation cases before the corrected path is considered healthy.

Expired capsules fail rather than quietly resolving to new context. Published releases remain immutable; a correction produces a successor release and changelog.

### Permanent council

The seven existing judges remain separate truth owners:

1. Human Agency
2. Epistemic Integrity
3. Subject, Audience and Lifecycle Safety
4. Consequential Usefulness
5. Living Brain Integrity
6. Human Comprehension and Access
7. Behavioural and Implementation Reality

Each judge has a versioned rubric, its own verdict history, cited evidence, dissent and change log. A non-voting Standards Prosecutor attacks the frozen submission. Founder Calibration follows only after the independent gate. Valid vetoes are repaired or explicitly accepted by the founder; they are never averaged away.

Historical theory in `/docs/history` is dormant. The just-in-time router may supply only criterion-relevant cards after current truth, with the existing eight-card ceiling. Theory can sharpen a judge but cannot overrule current source or founder authority.

## Experiences and information architecture

These are capability surfaces, not a final navigation proposal. A later design phase must decide how few destinations the user actually sees.

| Surface | Primary actor and purpose | Entry | Successful exit | Data dependency | Verification signal |
|---|---|---|---|---|---|
| **Operator portfolio** | Krish sees which customer needs attention and why | Select engagement or earned intervention | Exact customer and work object opened | engagement state, unresolved risks, prepared interventions | no customer collision; priority explains itself in one sentence |
| **Operator customer room** | Krish prepares, challenges and controls outreach | One selected customer and live decision | session plan, hard question, source request or quiet decision | full authorised Brain projection, evidence and case history | no-scroll desktop core; every action changes a real state |
| **Leader companion** | Leader handles the single most valuable current moment | secure link, mobile, email or in-session handoff | answer, correction, deliberate deferral or owned call | customer-safe projection and one intervention | first view has one purpose and one primary action |
| **Decision room** | Brain, Krish and leader reconcile a consequential call | a framed case with the human prior | owned call, conditions and at most one learning proposal | routes, evidence, audit, reconciliation and authority | leader can state why the call is theirs |
| **Capture membrane** | Any authorised actor adds material with near-zero administration | paste, voice, share, upload or forward | source safe in staging and a useful receipt | envelope, object vault, identity, duplicate and safety checks | normal paste is one deliberate gesture; failure preserves source |
| **Living Brain** | Leader or Krish inspects current judgement, uncertainty and change | relevant item, current portrait or map | understanding, correction, scoped share or return to work | accepted versions, relations, evidence, repair and use history | map and portrait resolve to the same canonical references |
| **Claude and work-tool bridge** | Krish or leader uses bounded Brain context where work already happens | explicit task and selected customer | useful work returned or completed without creating a second Brain | purpose capsule, version watermark, exclusions and receipt | copied context is intelligible without nonexistent references |
| **Ownership and release** | Leader receives a comprehensible portable Brain | accepted release request | verified download, optional private repository and import proof | canonical accepted state, audience split and evidence manifest | deterministic bytes and successful clean-room imports |

### Customer simplicity contract

- One purpose, one principal question and one primary action are visible at a time.
- Tap is primary on mobile; voice is immediately available; typing and optional notes remain possible.
- A short answer can be enough. Deeper evidence, alternatives, history and the map disclose only when requested.
- The product explains the consequence of a question in plain language, not its internal framework.
- It never uses completion percentages, streaks, course language, fake urgency, repeated privacy reassurance or grand announcement copy.
- It does not make a user read generic advice about being a leader. It demonstrates knowledge of this person, company, category and live decision.
- If nothing has earned attention, the state is quiet and useful rather than artificially populated.

### Operator depth contract

Krish can inspect and control:

- the current consequential decision and alternatives;
- the exact public and internal evidence behind each material claim;
- what is known, inferred, disputed, stale or missing;
- applicable prior judgement and why it might not transfer;
- the proposed hardest question and what each answer changes;
- all private-versus-customer audience boundaries;
- council vetoes, repair state and model provenance;
- the next session plan and customer intervention queue; and
- capture, Claude handoff, export and correction receipts.

Depth lives one layer away. It is not scattered as labels and disclaimers around the primary work.

## Claude, email and work-tool membranes

### Claude

CTRL remains the Brain authority. Claude can be a preferred work surface.

- **Use in Claude** compiles a purpose-bound, customer-specific context package containing actual useful context, source summaries, current standards, unresolved tensions, explicit exclusions and the requested output contract.
- If a remote MCP resolver is connected, an opaque handle may retrieve that package. The clipboard fallback must still contain intelligible context rather than a reference that cannot resolve.
- The package is read-only, expiring, revocable and tied to exact version watermarks.
- Work returned from Claude becomes a new staged source with Claude provenance. It cannot write trusted memory.
- The system audits returned work against the applicable standards, but the human judges the audit.

### Email and customer prompting

- Each engagement may later receive a clearly identified Mindmake email route.
- Incoming mail is a source door, not a direct Brain write. Authentication, malware, quoted-chain, third-party and audience checks happen first.
- Outbound customer contact begins as a delivery intent with purpose, exact content, recipient, channel, timing, expiry and source case.
- Krish controls what a customer is asked and when. The Brain may prepare and prioritise; it cannot send consequential prompts by itself in v1.
- Replies return to the same case or source envelope and retain message-level provenance.
- Delivery failures, bounces, opt-outs and deferrals close the loop without repeated nagging.

### Later work tools

One-click or share-sheet capture and explicit send-to-work actions are preferred over a broad connector marketplace. Continuous streams are added only after a repeated value case is proven and the user can see, pause and revoke the exact scope.

## The meaningful progress measure

`Brain completeness` and `judgement percentage` remain internal diagnostic ideas, not the product's scoreboard. The recommended north-star hypothesis is **Qualified Judgement Transfer**:

> A previously authorised piece of judgement materially improves the preparation of a later, genuinely different decision, with its evidence, scope and correction history intact, and survives the leader's subsequent review.

The unit is a qualified transfer, not points. The customer expression can be natural language such as, “This standard has now helped in three different kinds of decision.” It should never imply that more transfers are always better.

A transfer qualifies only when:

1. source and target decisions are materially different;
2. applicability is supported rather than merely similar;
3. the prior item had the right standing and audience;
4. the transfer changed a route, question, evidence requirement, boundary or stop condition;
5. the leader accepted or meaningfully edited it; and
6. later correction or outcome review did not invalidate it.

This is **PROPOSED** and **UNPROVEN** as a product metric. G15 Judgement Resolution remains a subordinate internal construct. Neither becomes a marketing claim until held-out evaluation and real engagement evidence show incremental value.

Guardrail measures include false-transfer rate, unsupported-claim rate, correction survival, repair latency, interruption yield, five-minute value, customer return pull, human-ownership failures, held-out decision-quality lift and successful portable re-import.

## Range lab and evidence realism

The test population must cover the external-by-internal evidence range without attaching fabricated private life or company information to a real person.

| Namespace | External evidence | Internal evidence | Proper use |
|---|---|---|---|
| **real_public** | Real named person and company, directly sourced public material | None | tests research richness, freshness, identity and unsupported-inference restraint |
| **consented_real** | Real public context where permitted | Real supplied material from the subject or authorised engagement | eventual founder and pilot proofs |
| **synthetic_fixture** | Clearly fictional company/person or explicitly separated real category facts | Fully fictional test evidence | deterministic edge cases, adversarial states and UI stress |
| **anonymous_consented** | Public category or company context without exposing identity | consented and de-identified internal material | tests internal richness and sparse public footprints |

Each namespace spans no, low, medium and high evidence depth plus current, stale and contradictory lifecycle states. The 48-account lab remains a range oracle, not customer truth. Real-public profiles can never be padded with synthetic private material to make a more impressive demo.

## What survives the current product

### Retain as proven organs

- authentication, hosting, responsive shell, trust controls and production operating discipline;
- voice capture, transcription recovery, audio and email delivery primitives;
- evidence-source storage, retrieval, corroboration and source reliability primitives;
- decision decomposition, claims, counter-evidence, breakpoint, call and outcome concepts;
- memory correction, retention, deletion and data-export lessons;
- read-only MCP and export machinery as adapter foundations;
- the approved Decision Table interaction, Living Brain projection and range-test fixtures; and
- strict Brain encryption, idempotency and RLS canary work.

Retention means reuse behind a new contract after characterisation. It does not grant old schemas or flows continuing product authority.

### Rebuild around the approved spine

- home and navigation around consequential work, not a content feed;
- onboarding as useful adaptive recognition, not a generic questionnaire;
- the decision state machine around the human prior, route-changing questions and an owned call;
- the single governed Brain domain and its case/learning/repair event model;
- operator versus customer projections and intervention control;
- category intelligence as prepared evidence, not a hero feed;
- Claude capsules, return provenance and readable fallback context;
- email intake and delivery-intent control;
- evaluation, permanent council and held-out lift; and
- portable release and deterministic re-import.

### Retire from authority

- content or personalised audio as the product hero;
- `user_memory` as the long-term target Brain authority;
- fixed forces as the assumed shape of every decision;
- any answer-first route that recommends before eliciting the human prior;
- static questionnaires and compulsory ranking;
- graph theatre or generated imagery that carries no semantic data;
- opaque Claude references without a live resolver or readable context;
- repeated custody, privacy and staging copy around the work;
- micro-learning, completion scores and generic leadership horoscope language;
- duplicate canonical stores in GitHub, Claude Projects or Mindmake OS; and
- preview fixtures masquerading as implemented intelligence.

## Transition architecture

Use a strangler migration. The current app stays operable while the new Brain becomes authoritative for one bounded slice.

1. **Observe and freeze:** characterise current decision, evidence, memory, export, voice and email behaviours. Add no new product authority to legacy stores.
2. **Complete the Brain write boundary:** create an isolated, data-less test environment; prove atomic encrypted source, claim, item and event writes; prove RLS reads, correction propagation and rollback.
3. **Implement one Crossing:** two materially different decisions in one synthetic workspace, one accepted judgement, one operator-controlled question, one leader response, one correction case and one later reuse.
4. **Compile projections:** serve the operator room, minimal leader moment, Current Portrait and Living Map from the same canonical references.
5. **Prove membranes:** capture one source, compile one readable Claude package, return one result to staging and build one deterministic release.
6. **Run the range:** execute sparse, rich, stale, contradictory, hostile, multilingual and identity-collision fixtures plus real-public research-only cases.
7. **Founder account:** only after the local and isolated-environment gates pass, use consented founder material to test both high external and internal depth.
8. **Assisted customers:** migrate no legacy customer in bulk. Opt one engagement into the new path with reversible adapters and readback.
9. **Cut over by capability:** move decisions, Brain, briefings and exports only after each new path passes its comparator and rollback gates.
10. **Retire old backend:** inventory all readers, writers, cron jobs, functions, policies and exports; stop new writes; dual-read for verification; archive or delete only after retention, DSAR, billing, rollback and zero-reader proofs pass.

No big-bang database switch is permitted. No old table is removed merely because the new interface works.

## First complete vertical slice

**Name:** The Crossing, implemented as a working system rather than another alignment page.

**Fixture:** One clearly fictional leader and company, with sourced real category context kept explicitly separate from fictional internal evidence. It contains two materially different AI-transition decisions and enough contradictory evidence to justify one hard question.

### Journey

1. A meeting excerpt, short voice note and public-category fact enter private staging with source envelopes.
2. The operator opens the exact customer. CTRL shows one live decision, the leader's provisional view, three causally different routes, material evidence gaps and one proposed question.
3. Krish edits or approves whether that question reaches the leader.
4. The leader receives a radically minimal mobile moment: one plain question, answer choices that are complete or include a write-in, optional note/voice and a clear defer action.
5. The answer updates the case. The independent challenger and evidence verifier run. The leader makes an owned call.
6. CTRL proposes at most one Brain item. The leader accepts, edits, holds or rejects it with scope and audience visible only as needed.
7. A later materially different decision opens. CTRL proposes the prior judgement as a Crossing and states why it may and may not apply.
8. Krish challenges false transfer. The leader accepts, changes or blocks it.
9. A correction invalidates one supporting interpretation. The dependency graph quarantines the affected projection, repairs both decision views and creates a readable receipt.
10. The Current Portrait and Living Map show the same accepted state and source-backed relation.
11. **Use in Claude** produces a complete readable context package and simulated return source.
12. A deterministic ZIP release is generated and re-imported into two clean test harnesses.

### What the slice proves

- the G23 role split is executable;
- the customer can remain radically simple while operator depth is real;
- the new Brain schema can become runtime authority for one bounded path;
- prior judgement can help a different decision without silent transfer;
- correction changes downstream use rather than adding disclaimer text;
- Claude convenience does not create a second Brain; and
- the release is usable ownership rather than a database dump.

### What it does not prove

- diagnostic efficacy for real leaders;
- willingness to pay or retention;
- a customer-facing progress metric;
- safe bulk migration of legacy users;
- autonomous customer messaging;
- a finished navigation system or visual design; or
- readiness to merge or remove the old backend.

## Build gates

| Gate | Deliverable | Blocking evidence |
|---|---|---|
| **G24.A Product-system lock** | this blueprint and machine contract | founder can explain the whole system, boundaries and first slice without inferring missing pieces |
| **G24.B Data and service proof** | isolated environment, transactional adapter, event and correction path | multi-identity RLS, encryption, retry, rollback, no cross-audience read and deterministic repair |
| **G24.C Intelligence proof** | headless Crossing over the evidence range | grounded claims, truly different routes, abstention, independent council and held-out comparator |
| **G24.D Experience proof** | separately approved operator and customer renders from the same live contract | twelve-year-old comprehension, one-action mobile, operator depth, no theatre and direct HTTPS preview |
| **G24.E Complete slice** | stateful journey through capture, two decisions, learning, repair, Claude and release | browser, API, database, security, accessibility, performance and clean-room portability checks |
| **G24.F Founder account** | consented high-external/high-internal proof | explicit data authority, real value within five useful minutes and no trust breach |
| **G24.G Assisted pilot** | one reversible thirty-day engagement | repeated useful return, measured qualified transfer, correction survival and customer pull |
| **G24.H Cutover** | capability-by-capability migration and old-backend removal plan | zero legacy writers/readers for target capability, retention and DSAR proof, rollback window and founder release approval |

Later gates cannot be treated as passed because an earlier mock looked good. Every claim must name the exact medium and evidence.

## Acceptance criteria for this architecture

This blueprint passes its current gate only if:

- every part of the G23 product promise has a technical home;
- current live capability and target architecture are not conflated;
- all context doors share one trust model;
- the Brain, Krish and leader cannot silently take one another's authority;
- the customer and operator experiences can be radically different projections of the same state;
- the data model supports evidence, audience, version, correction, repair and later use;
- AI tasks are typed, bounded, independently evaluated and unable to write canonical truth;
- the first complete slice proves cross-decision compounding rather than another isolated screen;
- current useful organs have an adapter or retirement path;
- external and internal range tests preserve real-person integrity;
- Claude, email, GitHub and OS cannot become rival sources of truth;
- the metric rewards qualified useful transfer rather than activity or profile completion; and
- the canonical ledger leaves one bounded next action.

## Founder decision requested

Approve or challenge this system blueprint as the governing architecture for the first complete CTRL build slice.

Approval would lock the system boundaries, target data and AI roles, operator/customer split, strangler transition, first Crossing slice and proof sequence. It would not approve final schema names, visual design, production mutation, deployment, merge, release, marketing claim or old-backend deletion.

## Exact next action if approved

Freeze a machine-readable G24 contract from this document, then implement the headless Crossing locally against deterministic fixtures and the existing G16/G17 contracts. Stop before any external database branch, model spend, customer data, customer surface design or deployment. The next founder-visible object is a system receipt showing the complete causal loop and its verified states, not another decorative page.
