# CTRL Phase 2 decision-to-Brain vertical-slice contract

**Status:** Provisional architecture and experience contract for founder review. Not a schema migration, visual lock, implementation authorization or release plan.

**Date:** 2026-09-07

**Current source:** `08d36aada6ca7da27e7e6b74fa8e582ac4ac70bf`

**Governing decisions:** `D-008`, `D-009`, `D-010`, `D-012`, `D-015`, `D-018`, `D-019`, `D-022`–`D-040`, `D-042`–`D-051`

**Open architecture dependency:** `H-024`—the live Brain and the customer-owned portable Brain package have separate roles. This contract remains useful if that hypothesis changes, but its store-placement and export sections must be revised before implementation.

## Executive contract

The smallest slice that can prove the new CTRL is:

> A leader speaks or types one live AI-transition decision. CTRL first understands their actual decision and provisional view; asks at most one useful question at a time; reveals one evidence-bearing contrast and an independent view; helps them reconcile rather than comply; records their owned call; proposes no more than one durable Brain learning; later recalls it at a genuinely useful moment; and exports the accepted Brain version in a portable, inspectable form.

The user experiences one thoughtful companion. Internally, the system preserves strict boundaries between source evidence, the human's words, model interpretation, external claims, authority, durable memory and generated output.

The slice fails if it becomes any of the following:

- a polished answer-vending chatbot;
- a technical memory-management interface;
- a static questionnaire;
- a news feed with a decision form attached;
- an AI-generated memo whose recommendation precedes the leader's view;
- a demo that cannot survive interruption, correction, sparse evidence or later recall;
- a Git export that is merely a database dump;
- a beautiful mock that depends on data or intelligence the implementation cannot honestly produce.

## Strategy brief

### OUTCOME

A designated test user can complete one real decision-to-Brain-to-recall loop, receive a useful first insight within the promised five-minute envelope, remain the owner of the call, inspect and correct the proposed learning, and produce a portable Brain release whose provenance and version can be verified.

### WHY THIS ROUTE

This slice joins the three things that distinguish CTRL: consequential human–AI thinking, durable judgement learning and later continuity. Building onboarding, a Brain dashboard or connectors first would create surface area without proving the causal value loop. Reusing the current decision engine wholesale would preserve evidence machinery but also preserve answer-first framing and disconnected memory. A complete thin loop is therefore more informative than a broad partial rebuild.

### CHAIN

`krish-principles → locked CTRL corpus → strategy-brief → build-apps-with-krish → krish-design for concept divergence and rendered approval → krish-build for implementation → verification-loop → ux-testing-agent → founder release gate`

### ASSUMPTIONS / RISKS

- One real decision can generate immediate value and one justified reusable learning without an invasive intake.
- A human-first contrast is more useful than an immediate recommendation.
- The retained retrieval and evidence primitives can be wrapped without leaking the current fixed ontology into the new experience.
- A plain-language memory receipt can preserve authority without becoming administrative.
- The proposed live-store/package split can remain invisible to the user.
- Five useful minutes is an experience promise, not permission to compress a consequential decision into false certainty.

### AUTHORITY

This artifact authorizes only continued provisional concept and test planning. It does not authorize production or staging schema changes, customer-data migration, GitHub App creation, customer repository creation, material visual implementation, main-branch merge, feature enablement or release. A rendered material surface requires a separate explicit founder lock; production actions require exact action-time approval.

### VERIFICATION

The contract passes its current phase only if it is internally complete, traces every user-visible state to data and authority, distinguishes retained from replaced behavior, names negative tests and fallbacks, and leaves exactly one material founder gate before concept divergence. Product validity remains unproved until representative users complete the implemented slice and held-out comparison shows useful decision-quality lift without increased trust failures.

## Preflight record

**STATE_ROUTE:** `project-documentation/ctrl-evolution/README.md`

**SOURCE_LAYERS:** Locked product decisions and research; exact production source at `8174677125bc2799929e3196282e75cba215b443`; current transition architecture; qualified external storage evidence; historical UI and schemas as implementation evidence rather than product authority.

**PRODUCT_TRUTH:** CTRL is a relationship-embedded AI-transition decision and category-design companion for willing leaders. It builds a portable model of their judgement by creating immediate value through consequential work.

**NON_GOALS:** Generic business advice, persuasion of sceptics, exhaustive upfront intake, named-person employment evaluation, silent memory mutation, compulsory ranking, graph-as-product, maximum automation, provider-owned memory or Git-as-hot-database.

**SURFACE_DEPENDENCIES:** Trust and identity → decision entry → human prior → adaptive contrast → evidence and independent view → reconciliation → owned call → one Brain proposal → later recall → portable version.

**VERTICAL_SLICE:** Live AI-transition decision → human-first thinking loop → accepted or resisted call → one inspectable Brain proposal → later useful recall → deterministic portable Brain release.

**FIRST_SURFACE:** `Decide / first useful contrast`, shown at the mobile viewport as the primary state. Desktop and adviser views must use the same product contract, but they are later material surfaces.

## Users and roles

### Primary early operator: Krish inside a Mindmake engagement

Krish selects a customer, starts or resumes one live decision, captures context through voice or one-tap sources, uses CTRL to prepare or facilitate the conversation, and sees what deserves follow-up. He must never become a database administrator or spend the meeting tagging memory.

### Primary subject: the decision-owning leader

The leader can speak, tap, rank or type; see the current decision become sharper; resist the system; own the final call; approve or correct one learning; and later return to a useful continuation. The product does not require them to understand AI architecture, GitHub, embeddings, provenance schemas or model selection.

### Later self-service user

The leader can enter directly, continue a prior thread, review one meaningful change, prepare for a meeting, run a quick decision loop and keep their own Brain copy. Adviser-only working hypotheses remain hidden unless explicitly shared.

### System actors

- **Subject:** person whose judgement or context a record describes.
- **Contributor:** person or authorised source that supplies evidence.
- **Adviser:** time-bounded collaborator who can prepare, ask and propose.
- **Approver:** human with authority to make a Brain item durable or shared.
- **Company custodian:** controls company-owned assets and audiences.
- **Model worker:** performs one bounded task and has no persistence authority.
- **Verifier:** independently tests claims, output or system behavior.

No role inherits another role's authority merely because one person currently holds both.

## Non-negotiable invariants

1. **Human before AI:** The leader's provisional view, uncertainty and change condition are captured before CTRL's recommendation is revealed.
2. **One decision:** A session has one primary consequential decision. Related questions may be parked, not silently merged.
3. **One ask:** The visible interface presents one meaningful ask at a time and never exposes an interview backlog.
4. **One durable proposal:** The first slice proposes at most one Brain learning after value has been delivered.
5. **Authority is explicit:** Model inference, adviser interpretation and source evidence cannot become accepted human truth without the applicable authority event.
6. **Claims are traceable:** Every factual claim shown as decision-bearing resolves to source identity, retrieval time, scope and relevant excerpt or structured datum.
7. **Disagreement survives:** The synthesizer cannot erase model disagreement, contradictory evidence or the user's resistance.
8. **Correction propagates:** A correction closes or supersedes affected current claims, rebuilds eligible projections and returns a visible repair receipt.
9. **Off-record is real:** Off-record input creates no durable source, embedding, trace content or export residue beyond the minimum security event required to prove deletion, if any.
10. **Portability is testable:** An exported version is human-readable, machine-readable, hashable, re-importable and usable outside CTRL.
11. **The chassis is deterministic:** Models return validated data and bounded choices; they never author arbitrary layout or executable interface code.
12. **Abstention is a successful state:** When evidence cannot support a useful view, CTRL states the exact gap and offers the smallest uncertainty-reducing move.

## The five-useful-minute experience

The sequence is adaptive. It is not a fixed number of screens.

### 0. Arrive recognised, not surveilled

CTRL opens in the selected customer's current context. It may quietly surface one continuation if there is strong, current evidence: “The operating-model choice from Tuesday is still waiting on one assumption.” Otherwise it offers a clean entry: “What are we deciding?”

The first interaction is voice-first and tap-friendly. Typing remains available. There is no mandatory integration setup, profile completion or Brain tour.

### 1. Capture the real pressure

The leader or adviser states the decision in ordinary language. CTRL reflects the smallest faithful frame, preserving the original words:

> “It sounds as if the decision is not whether marketing should use more AI. It is how the function must change when AI alters what good marketing work is. Is that the decision?”

The user can confirm, change it or say “not quite.” A reframe is always a proposal, never a rewrite of the original.

### 2. Earn the human prior

CTRL captures three distinct things with the least friction the case allows:

- what the leader currently thinks;
- how settled they are;
- what evidence or consequence would genuinely change their mind.

This may be one spoken answer, a two-option tap or an optional ranked interaction. It is not displayed as a psychological assessment.

### 3. Ask the one question with highest decision value

The question planner estimates which unknown could most change the frame, route or confidence. It asks one question only when the expected information value exceeds the burden.

Examples:

- “Which matters more here: changing what the team produces, or changing who is capable of judging it?”
- “If the current people adopted the new standard within six weeks, would replacement still be your preferred route?”
- “Which recent output best shows the gap?”

The user can answer, skip, say “show me options,” or move directly to CTRL's view.

### 4. Reveal one useful contrast

The first reveal is not a memo. It is the smallest evidence-bearing distinction that changes the decision:

> “Your evidence supports a capability and operating-model gap. It does not yet distinguish unwilling people from people working under an uncommitted strategy and unchanged incentives.”

The user can expand the evidence, hear the independent view, correct the premise or keep going. CTRL states what is observed, inferred and unknown in plain language.

### 5. Reconcile, do not persuade

CTRL shows its independent view only after the human prior. The leader responds through natural actions:

- “That changes my mind.”
- “I agree with the diagnosis, not the recommendation.”
- “You have this fact wrong.”
- “Keep my original view.”
- “I need evidence before deciding.”

The system records accepted, resisted, corrected and unresolved points separately. It does not compress them into a fake consensus score.

### 6. Make the owned call

The user states the current call, decision status and smallest next move. “Not ready to decide” is valid when paired with the specific missing evidence or experiment. CTRL may help articulate the call but cannot issue it on the user's behalf.

### 7. Offer one Brain learning

Only after the decision value is visible, CTRL offers one reusable learning:

> “One thing seems worth remembering: you judge AI fluency by whether someone notices and redesigns the work, not whether they use the tool frequently. Keep that in your Brain?”

The user can keep, edit, narrow, leave provisional or discard it. They can ask “why this?” and see source, scope and expected future use.

### 8. Return a human receipt

The close contains only what matters:

- the current call or evidence gap;
- the next move;
- what CTRL learned, if anything;
- when it may be useful again;
- whether the accepted Brain version changed.

No technical metadata is required to leave. Detail remains inspectable on demand.

## Interaction modes

CTRL infers a starting mode from urgency, consequence, ambiguity and the user's prior behavior, but the user can switch in one tap or by voice.

| Mode | User experience | Internal ceiling | Exit |
|---|---|---|---|
| Quick | One statement, one reflection, one useful contrast | No more than one clarifying question before value; shallow targeted retrieval | Save the thread, state a call, or leave with an evidence gap |
| Guided | Default conversational loop, one question at a time | Adaptive questions continue only while expected decision value exceeds burden | Reconcile and make the owned call |
| Deep | Optional rich comparison, stack ranking, examples and counterfactuals | Explicitly user-chosen or strongly offered with a clear reason; never sprung on the user | Produce a richer call and potentially stronger learning proposal |

Stack-ranked interactive questions are a high-yield instrument for users who enjoy them. They are not the universal interface. CTRL can say: “I can sharpen this with a quick comparison” and show the estimated effort. The user never sees a hidden battery or a wall of fields.

## User-visible state machine

| State | What the user sees | Allowed user actions | Durable effect |
|---|---|---|---|
| `ready` | recognised context or clean “What are we deciding?” entry | speak, type, resume, choose off-record | none |
| `capturing` | live transcription or text with immediate local acknowledgement | pause, edit, cancel, mark off-record | session draft only unless confirmed |
| `reflecting` | one proposed faithful frame | confirm, correct, “not quite,” abandon | original input retained; frame remains proposed |
| `human_prior` | one low-burden prompt for current view/change condition | answer, rank, skip, go deeper | explicit human statement linked to decision |
| `question` | one adaptive question and why it matters on request | answer, skip, show options, stop questions | answer linked to question and plan version |
| `working` | calm, specific progress: checking numbers, comparing evidence, testing countercase | continue elsewhere, cancel research, inspect sources | resumable job state; no hidden accepted memory |
| `contrast` | one concise distinction with observed/inferred/unknown boundary | expand, correct, hear independent view, dismiss | exposure event only |
| `ai_view` | bounded recommendation, countercase, breakpoint and uncertainty | accept part, resist, correct, ask for evidence | explicit reaction events |
| `reconciling` | differences between human and AI views | resolve each material difference or leave open | reconciliation record; disagreement preserved |
| `owned_call` | editable statement of the user's current decision and next move | decide, defer with gap, abandon | call authored/approved by user |
| `brain_proposal` | one plain-language reusable learning and why it matters | keep, edit, narrow, provisional, discard | only acceptance creates a durable current Brain item |
| `receipt` | call, next move, learning and future return condition | close, share allowed artifact, keep own copy | session completion and version receipt |
| `recall` | a later, situation-specific reminder or contrast | use, snooze, correct, “not useful,” mute this kind | intervention/outcome feedback; no automatic truth rewrite |
| `export_ready` | “Your Brain version is ready” and human-readable change summary | download, connect private repo, inspect package | destination receipt after successful generation |

### Exceptional states

| State | Contract |
|---|---|
| `off_record` | Process in bounded ephemeral context; do not persist raw content, derived embeddings or Brain proposals. Make the state unmistakable before capture. |
| `insufficient_evidence` | Name what cannot be known and the smallest useful evidence move; never pad with generic advice. |
| `conflicting_sources` | Preserve both claims, scope and dates; explain what remains decision-robust. |
| `model_disagreement` | Show the material disagreement and what evidence could resolve it; model majority is not authority. |
| `interrupted` | Resume from the last committed session event without replaying external retrieval or duplicating writes. |
| `stale_context` | Warn that the relevant Brain item may no longer apply and invite a one-tap update. |
| `permission_needed` | Explain the value unlocked and exact source requested; allow a useful path without granting it. |
| `error_recoverable` | Preserve the user's words and offer retry, continue without that source or return later. |
| `error_blocking` | State what is safe, what is not saved and what remains available; never fabricate a result. |
| `abandoned` | Retain only what the user explicitly chose to save; unfinished inference does not become memory. |

## Cognitive-load and delight contract

“Magic” is earned through recognition, timing and consequence. It is not animated waiting, anthropomorphic claims or concealed automation.

### The interface must

- give an immediate visible response to every tap, utterance and correction;
- preserve the user's words even if research or generation fails;
- show one calm focal action and one optional escape at a time;
- use voice as a first-class input, not an accessibility afterthought;
- expose evidence and technical detail progressively, never by default;
- make “not quite,” “skip,” “off record,” “show me why” and “change this” easy;
- use customer and decision language, never memory ontology or agent jargon;
- acknowledge meaningful progress during long work without exposing a chain-of-thought theatre;
- allow the user to leave and return without losing the work or triggering it twice;
- make the one Brain proposal feel like a useful consequence, not homework;
- make corrections feel powerful through a visible repair receipt, not apologetic prose.

### The interface must not

- ask the user to tag, classify, scope or version ordinary input;
- show a multi-question form when a conversation can ask the next useful thing;
- force a confidence percentage the person cannot meaningfully estimate;
- display technical stages such as embedding, reranking, model calls or database writes;
- celebrate data capture before it has created value;
- use streaks, feeds, notifications or completion rings to manufacture return behavior;
- imply sentience, omniscience or emotional understanding it cannot support;
- interrupt because content is merely interesting;
- hide uncertainty behind visual polish.

### Perceived-performance contract

Exact service-level thresholds must be benchmarked against the chosen runtime and target devices before implementation. The observable rules are already fixed:

1. Local input acknowledgement occurs in the same perceived interaction beat.
2. Voice capture and draft preservation do not wait for a remote model.
3. If useful synthesis cannot appear quickly, CTRL exposes a specific, cancellable work state before silence becomes ambiguous.
4. Independent retrieval work is resumable and idempotent.
5. The user can continue elsewhere while bounded work completes.
6. No latency optimisation may skip provenance, human-prior capture or durable-write approval.

## Logical domain contracts

These are logical boundaries, not approved physical table names.

### `subject_workspace`

- `workspace_id`, `subject_id`, optional `organisation_id` and `engagement_id`;
- explicit personal, company, adviser-working and shared partitions;
- role grants, start/end times and allowed actions;
- no inferred subject matching from display names.

### `source_envelope`

- immutable source identity and content hash or external pointer;
- source kind, author/speaker, subject, capture time and system time;
- verbatim text or bounded segment references;
- sensitivity, third-party content, retention and deletion state;
- allowed purpose, audience, derived-use and export policy;
- freshness, revocation and supersession links.

### `decision_case`

- original pressure in the user's words;
- current proposed frame and frame version;
- decision owner, participants, scope and status;
- consequence and urgency without a universal score;
- start, pause, abandonment, completion and review events.

### `human_prior`

- exact user statement or selected option;
- current leaning, uncertainty expression and change condition;
- authored-by and captured-at;
- question and context seen before the answer;
- never backfilled from the later call.

### `question_plan` and `answer_event`

- candidate unknowns and expected decision effect;
- selected question, reason, burden class and plan version;
- answer, skip or refusal event;
- whether the answer changed frame, retrieval or analysis;
- no hidden personality score.

### `analysis_plan`

- decision-specific lenses and why each was selected;
- named factual, causal, forecast and value claims;
- required sources, tools, hop ceiling and stopping rule;
- primary analyst, challenger and verifier task versions;
- cost, latency and consequence policy.

### `claim` and `evidence_link`

- atomic claim text, type, scope and valid time;
- observed, supported, contested, unverified or unverifiable status;
- evidence and counterevidence links with excerpt, date and authority;
- model confidence separate from evidence strength and user authority;
- citation validation result and deterministic number/date checks.

### `ai_view`

- recommendation or abstention;
- strongest countercase;
- breakpoint assumption or change condition;
- explicit observed/inferred/unknown partition;
- input context manifest, task and model-policy version;
- no human authority field.

### `reconciliation`

- material human/AI differences;
- per-point reaction: accepted, resisted, corrected or unresolved;
- correction source and affected claim IDs;
- user-authored synthesis where provided;
- no blended consensus score.

### `owned_call`

- exact call or deliberate deferral;
- decision owner and explicit authority event;
- rationale, next move, missing evidence and review trigger;
- linked human prior, AI view and reconciliation;
- immutable original version plus append-only revisions.

### `brain_proposal` and `brain_item_version`

- proposed reusable learning type: objective, constraint, criterion, preference, standard, example, anti-example, tension, belief, forecast, pattern or operating hypothesis;
- source and derivation links;
- precise applicability, audience, exceptions and expiry/review rule;
- expected future use and consequence if wrong;
- proposal status and explicit approver event;
- accepted current version derived from append-only history;
- affected projection and export dependencies.

### `correction_event` and `repair_receipt`

- original item and corrected/superseding version;
- human correction, evidence and authority;
- deterministic dependency set;
- attempted, repaired, quarantined and failed downstream effects;
- current-view, retrieval-index, prepared-output and export results;
- user-visible concise receipt.

### `intervention_event` and `outcome_event`

- trigger, context used, expected value and interruption policy;
- what was shown and user response;
- downstream decision, artifact or behavior evidence where available;
- usefulness and harm signal;
- no automatic conversion of engagement into decision quality.

### `brain_release`

- Brain identity, audience, semantic version and schema version;
- allowlisted record IDs and content hashes;
- generated files and full package hash;
- source/current Brain version and compiler version;
- exclusion and redaction summary;
- validation and re-import result;
- destination receipt for download or Git sync.

## Store placement under `H-024`

| Object | Canonical live store | Other representation |
|---|---|---|
| Workspace, authority, decision and Brain events | tenant-isolated PostgreSQL domain | redacted audit/export projection |
| Raw transcript, audio or large source document | encrypted object storage plus immutable database pointer | absent from Git by default |
| Current Brain view | deterministic database projection from accepted events | compiled human-readable files |
| Full-text and vector retrieval | reconstructable indexes | never exported as canonical truth |
| Session draft and streaming state | checkpointed ephemeral/runtime state with bounded persistence | not part of Brain release |
| Portable accepted Brain | `brain_release` manifest linked to canonical version | download package or optional customer-owned private Git repository |

The first slice needs only a local deterministic package. Private repository creation is not required to prove the Brain contract. That keeps the GitHub product decision reversible while testing the harder requirement: usable portability.

## Event sequence

```text
decision.opened
  → source.captured | source.referenced
  → frame.proposed
  → frame.confirmed | frame.corrected
  → human_prior.recorded
  → question.planned? → answer.recorded | question.skipped
  → analysis.started
  → claim.proposed* → evidence.linked* → claim.adjudicated*
  → ai_view.completed | ai_view.abstained
  → contrast.presented
  → reconciliation.recorded
  → owned_call.recorded | decision.deferred | decision.abandoned
  → brain_proposal.created?
  → brain_proposal.accepted | edited | provisional | rejected
  → brain_projection.rebuilt?
  → decision.receipt.created
  → intervention.considered → intervention.presented? → outcome.recorded?
  → brain_release.compiled? → brain_release.verified → destination.receipted?
```

Every event carries `event_id`, idempotency key, workspace/subject, actor type and actor identity, occurred/system time, schema version, source or causation IDs, audience, sensitivity and integrity hash. Events never carry a secret. External effects checkpoint before and after execution.

## LLM task registry

Models are replaceable workers. Each task has a versioned input contract, validated output, authority ceiling, budget and fallback.

| Task | Input | Output | Authority ceiling | Failure fallback |
|---|---|---|---|---|
| Intent and frame extractor | original words, minimal active context | proposed decision frame; ambiguities; prohibited overreach | propose only; cannot replace source or set decision status | show original words and ask one plain clarification |
| Question planner | frame, human prior, known unknowns, burden policy | ranked candidate question with expected decision effect | choose one visible question; no personality inference | skip questioning and state current evidence boundary |
| Lens selector | decision, claims, context, consequence | dynamic analysis lenses and rationale | analytical plan only; current six forces are candidates | minimal factual/causal/value split |
| Claim decomposer | confirmed frame and inputs | atomic typed claims and dependency links | propose claims only | preserve user frame; mark analysis incomplete |
| Retrieval planner | claims, source permissions, freshness | bounded queries, sources, stopping rules | read within granted sources only | use available sources or abstain |
| Evidence adjudicator | claims and retrieved evidence | support status, limitations, counterevidence | cannot create evidence or human truth | contested/unverified with exact gap |
| Challenger | human prior, primary analysis, evidence manifest | strongest independent countercase and breakpoint | challenge only; no final call | disclose unavailable independent view |
| Synthesizer | human prior, claims, views, disagreement | smallest useful contrast and bounded recommendation | present inference; preserve disagreements | structured evidence boundary without recommendation |
| Memory candidate compiler | reconciliation, owned call, source links | zero or one scoped Brain proposal | proposal only; cannot persist accepted item | no proposal; decision receipt remains valid |
| Intervention selector | current work state, candidate recall, interruption rules | show, prepare quietly, defer or suppress | no message send or external action authority | suppress |
| Export compiler assistant | accepted item projection and schema | bounded file content fields | cannot select private records or destination | deterministic template or fail closed |
| Evaluator | frozen fixture, rubric, outputs and provenance | criterion-level verdict and failure evidence | evaluate only; cannot rewrite rubric or candidate | inconclusive; require independent review |

### Independence rules

- The human prior is hidden from any task intended to establish an independent baseline, except where the task explicitly tests the user's reasoning.
- The challenger does not receive the primary model's private reasoning; it receives claims, evidence and visible conclusion.
- The evidence verifier uses deterministic checks and an independently framed model task where judgement is unavoidable.
- The generator never grades its own output as the release gate.
- Model agreement raises no human authority and cannot conceal correlated provider or context failure.

## Legacy capability adapter map

| Current capability | Target role | Adapter contract | Rejected legacy authority |
|---|---|---|---|
| `decision-engine/retrievers.ts`, `reliability.ts`, `verify.ts` | source retrieval and evidence qualification | Wrap behind claim-typed retrieval and evidence manifests; retain citations, corroboration and freshness outputs | retriever choice cannot define the user journey or claim truth |
| `decision_cases`, `decision_claims`, `decision_evidence`, `decision_tensions` | legacy decision read model and characterization source | Read through a versioned adapter; map only unambiguous fields; new slice writes new domain events | current fixed stages and decision kinds do not become target ontology |
| `decision_user_calls` | proof that human-before-AI interaction exists | Characterize and adapt historic calls where sequence is provable | accept/reject/unsure alone is not full human prior or reconciliation |
| `user_decisions` | historical orphaned decision store | Do not use as target source of truth; quarantine and audit before any migration | empty or inconsistent legacy table cannot drive Brain recall |
| `user_memory` and lifecycle functions | trusted legacy fact source | Read only owner-, source- and meaning-qualified current rows; preserve encryption, expiry, supersession and correction mechanics | broad fact categories and one confidence field do not define Brain items |
| `memory_events` | lineage pattern | Generalise into domain correction and repair events after characterization | current empty production state is no proof of working propagation |
| `_shared/brain-profile.ts` and `user-context.ts` | temporary shadow projection | Compare its selected context with the new context planner; no new feature depends directly on it | read-time merge is not canonical Brain truth |
| Blind Spot signed-candidate pattern | propose-before-commit template | Reuse evidence anchor, expiry, rejection suppression and candidate acceptance semantics | no automatic promotion from detection to durable memory |
| harness `evidence_sources`, `evidence`, `constructs`, `criteria`, `proposals` | promising judgement/taste substrate | Integrate through explicit adapters after end-to-end proof; preserve exact evidence offsets and promotion gates | unfinished or empty tables do not earn product authority |
| voice capture and transcription | primary input primitive | Preserve local draft, review and retry; attach source envelope after consent | raw transcript is not automatically durable Brain content |
| memory/skill/custom exports | export implementation evidence | Retain packaging, provenance and quality-gate techniques; replace content contract with `brain_release` | existing exports do not prove complete portability or re-import |
| loaders, error boundaries, resilient polling | recovery floor | Reuse where behavior matches the new state machine | visual component reuse cannot constrain surface design |
| authentication, RLS and field encryption | trust floor | Characterize and carry forward behind new workspace/subject grants | current `user_id` equality alone is insufficient for adviser/company audiences |

### Characterization before reuse

Every retained primitive receives tests that freeze the valuable property—not the current implementation shape. If a replacement passes the property more simply, replace it. If an adapter forces semantic ambiguity, duplicate authority or visible technical burden, kill the adapter.

## First material mock contract

No mock is produced by this document. The next design stage, after the founder locks the governing storage and slice rules, must run concept divergence before rendering.

The first rendered primary state is the **first useful contrast on mobile**. It must show, without explanatory narration:

- the user's decision in their own terms;
- one distilled contrast that could genuinely change the call;
- a plain distinction between what CTRL knows, infers and still needs;
- one obvious next action and one safe escape;
- immediate voice availability;
- no dashboard, feed, graph, technical metadata, chat transcript wall or multi-card report;
- visual and interaction craft exceeding the current production UI while feeling calmer and simpler.

Three concept spines must differ in governing interaction metaphor, sequencing and state model—not merely layout or styling. Two fresh-context judges test conceptual distance, feasibility, trust, cognitive load and ability to support the full state range. One synthesized render is then shown cold to the founder.

## Evaluation programme

### Comparator arms

1. Same strong model with ordinary conversation context.
2. Same model with a well-crafted static Markdown/Skill package.
3. Current CTRL decision flow at production revision `8174677` using safe fixtures.
4. New vertical slice without accepted Brain context.
5. New vertical slice with the relevant accepted Brain version.

The comparison isolates whether CTRL's captured judgement and orchestration add value beyond model quality and a technically competent DIY alternative.

### Fixture classes

- the founder's marketing operating-model case;
- a category-design decision with uncertain external evidence;
- a work-allocation decision where correct non-delegation matters;
- a preference/taste decision with accepted and rejected examples;
- a sparse-evidence case requiring abstention;
- a case containing stale Brain context;
- a case with contradictory sources;
- a case where the user's prior is wrong and should change;
- a case where the AI recommendation is polished but generic;
- a case where the human correctly resists the AI;
- a correction that must repair recall and export;
- cross-user and personal/company isolation negatives.

### Held-out quality rubric

Each output is graded blind against accepted criteria:

- decision framing accuracy;
- causal and strategic sharpness;
- evidential faithfulness and numerical integrity;
- quality and independence of the countercase;
- meaningful option diversity without novelty theatre;
- correct use of personal standards and exceptions;
- appropriate uncertainty and abstention;
- preservation of human agency and final accountability;
- practical next move;
- voice sovereignty and absence of generic model mannerisms.

The north-star product evidence remains held-out decision-quality lift attributable to relevant CTRL context. Return desire, time to first value, correction burden and proposal acceptance are operating signals, not substitutes.

### Deterministic tests

- event schemas reject missing subject, audience, source, authority and idempotency fields;
- human prior predates AI-view exposure;
- no accepted Brain item exists without an applicable authority event;
- factual claims resolve to allowed evidence and validated citations;
- quotations, numbers, dates and source identity round-trip exactly;
- retries cannot duplicate events, external retrieval, proposals or exports;
- off-record content is absent from durable stores, indexes, traces and releases;
- one correction closes the affected current projection and repairs every eligible downstream dependency;
- cross-user and cross-audience reads and writes fail;
- stale or revoked context is not selected as current truth;
- export contains only allowlisted accepted records;
- identical Brain versions produce byte-identical packages with no volatile field;
- re-import detects drift and creates proposals rather than silent overwrite;
- interrupted mobile sessions resume at the last committed event;
- empty, long, adversarial, error and slow-source states render honestly.

### Human and UX evidence

- Can the leader explain the sharpened decision in their own words?
- Did CTRL surface something materially non-obvious or correctly abstain?
- Did the leader feel helped, judged, interrogated or managed?
- Did they understand what would be remembered and who owns it?
- Could they correct it without learning the system?
- Did they want to return because continuity was useful, not because of a notification mechanic?
- Could Krish use it fluidly during real customer work without dividing his attention?

## Acceptance criteria for the implemented slice

The slice cannot move to a broader cohort until all blocking criteria pass.

### Product and agency

- A leader reaches a useful contrast within the stated five-minute experience envelope on representative cases.
- The human prior and change condition exist before CTRL's view is revealed.
- The user can accept, resist, correct or leave unresolved without friction.
- The final call is explicitly user-owned or honestly deferred.
- The system proposes zero or one reusable Brain learning; rejection does not reduce the value already received.

### Evidence and intelligence

- Every decision-bearing factual claim has inspectable provenance.
- Observed, inferred, disputed and unknown are distinguishable in data and plain-language presentation.
- The independent view is contextually independent enough to expose correlated framing risk.
- Unsupported numbers, fabricated citations and generic recommendation filler fail closed.
- Appropriate abstention is treated as a pass when evidence is insufficient.

### Memory and repair

- An accepted proposal creates one versioned Brain item without rewriting its sources.
- A correction produces an inspectable repair receipt and updates every eligible current projection.
- A later recall is tied to the decision situation and can be dismissed, corrected or muted.
- No durable learning occurs from exposure, model inference or recurrence alone.

### Portability

- A deterministic package contains manifest, human-readable context, decisions/standards as applicable, provenance references, tests and changelog.
- Identical accepted state produces identical bytes.
- The package can be re-imported without losing authority or history.
- The package is successfully used in at least two materially different agent environments before “model agnostic” is claimed.
- No private repository creation is required for the first proof; if Git sync is later enabled, the destination receipt and permissions are independently verified.

### Experience and resilience

- The mobile primary path is voice-ready, one-ask-at-a-time and contains no technical administration.
- Input survives model, network and retrieval failure.
- Pause, leave, return and retry do not duplicate work.
- Sparse, stale, conflicting and error states feel intentional and honest.
- The rendered implementation matches the founder-approved artifact and exceeds the current UI floor in cold review and task evidence.

## Observability without surveillance

Record only what is necessary to evaluate the product and repair failures:

- state-transition latency and failure class;
- question shown, skip and burden signal;
- source/retrieval path and deterministic validation outcome;
- user correction, resistance and proposal disposition;
- interruption presentation and usefulness response;
- export/re-import integrity;
- model/task/prompt-policy version and cost envelope.

Do not record cursor movement, keystroke content beyond submitted input, covert productivity traces or inferred employee performance. Raw prompts and model traces containing customer material require the same purpose, retention and audience controls as source evidence.

## Rollout sequence

### Gate 0: contract and mock

- Founder locks or corrects `H-024` and this contract.
- `krish-design` performs valid three-spine divergence and adversarial judging.
- One mobile first-contrast render is shown cold and explicitly locked.

### Gate 1: local proof fixtures

- Build logical domain contracts and deterministic package compiler against synthetic fixtures.
- Characterize retained retrieval, evidence, voice, auth and recovery properties.
- Run all negative trust, correction and idempotency tests.

### Gate 2: designated founder account

- Feature-flag the slice to a designated safe account and workspace.
- Shadow-read trusted legacy context; write only to the new domain.
- Exercise real decisions without broad customer migration.
- Compare current and new context plans and record divergences.

### Gate 3: Mindmake-assisted engagements

- Invite a very small, named cohort through Krish-led work.
- Keep adviser and subject permissions explicit.
- Observe five-minute value, return pull, correction burden and held-out quality.
- Do not activate GitHub sync unless the local Brain package has passed portability proof and the exact customer ownership path is approved.

### Gate 4: bounded customer self-service

- Expose only proven basic actions: continue a decision, review one proposal, correct meaning, prepare for the next moment and keep a copy.
- Preserve an adviser-visible path without leaking private or off-record material.
- Expand only after representative users succeed without Krish translating the product.

### Gate 5: cutover and retirement

- Promote the new projection only after stored-state, user-task, quality and trust evidence passes.
- Retire old routes one by one after dependency and telemetry review.
- Never keep two current sources of truth after a capability's cutover.

## Kill rules and pre-mortem

| Failure | Early signal | Required response |
|---|---|---|
| Beautiful answer vendor | recommendation appears before human prior; users comply without reconciliation | stop surface work; restore human-first sequence and retest |
| Interview fatigue | question count rises without changed frame or decision; skips cluster | tighten information-gain gate; default to quick mode |
| Memory administration | users are asked to classify, tag or clean records | move structure back into the system; reduce proposal frequency |
| False intimacy | copy implies emotions, certainty or understanding unsupported by evidence | remove claim; expose precise context basis |
| Legacy capture | adapters determine ontology or keep two authorities alive | replace the implicated primitive or narrow the slice |
| Context contamination | another user, audience or stale item influences output | disable affected path; investigate isolation before further use |
| Self-confirming Brain | context improves stylistic agreement but reduces challenge or held-out quality | narrow or roll back the Brain version; re-audit rubric and retrieval |
| Novelty theatre | options differ cosmetically but share one causal frame | fail diversity gate and regenerate from independent spines |
| Git becomes the product | users face repo setup, merge conflict or technical vocabulary before value | return Git to optional export; keep the Brain package invisible by default |
| Export dishonesty | package cannot re-import, omits authority/provenance or includes forbidden content | prohibit portability claim and fail release |
| Correction without repair | UI changes but recall, caches or package remain stale | fail the slice; repair dependency propagation before cohort use |
| Adviser surveillance | customer feels evaluated or Mindmake receives broader visibility than intended | stop the engagement path; correct role and audience contract |

## Explicit reuse and discard register

### Reuse as capability, behind new contracts

- authentication and existing ownership defenses;
- field encryption and memory lifecycle mechanics;
- voice capture and transcription review;
- decision claim decomposition, retrieval, corroboration and evidence scoring;
- independent challenge, counterevidence and verification primitives;
- Blind Spot candidate-before-commit semantics;
- export packaging, provenance and quality-gate techniques;
- resilient loaders, polling and recovery behavior;
- billing and entitlement mechanics outside this first slice.

### Replace or quarantine as governing product behavior

- content/news as the authenticated home and primary return loop;
- current navigation and feature siloing;
- fixed six-question onboarding;
- compulsory six-force decision ontology;
- model-authored reframe as authoritative decision statement;
- recommendation before the leader's provisional view;
- `user_decisions` as Brain decision source;
- `brain-profile` as a sufficient canonical Brain;
- graph visualization as the primary Brain metaphor;
- direct browser and Edge writes with inconsistent lifecycle guarantees;
- provider-specific prompts and fallback logic scattered across functions;
- generic engagement mechanics as evidence of value.

## Founder approval gate

One material decision now gates concept divergence:

> **Approve or correct this combined product rule:** CTRL's live Brain is a versioned, permissioned runtime; its GitHub/ZIP form is a customer-owned portable release. The first surface proves that system through one devastatingly simple five-minute decision loop whose first reveal is a useful contrast—not an AI recommendation—and whose only durable learning is one optional, inspectable proposal.

If approved, the next owner is `krish-design`. It receives a sanitized divergence brief for three conceptually distinct mobile interaction spines. No later surface, implementation or production change begins before one rendered first-contrast synthesis is shown cold and explicitly locked.

## Resumable handoff

**OUTCOME:** Provisional end-to-end contract for the first decision-to-Brain-to-recall-and-export slice.

**PHASE:** Phase 4 surface map and vertical-slice gate; awaiting founder product-rule approval before Phase 5 concept divergence.

**CURRENT TRUTH:** Transition posture and visual floor are locked through `D-050` and `D-051`; production remains at the separately audited main revision; no product schema, GitHub integration or visual mock has been created.

**LOCKED:** Brain-first hierarchy, human-before-AI, user-owned call, adaptive depth, one-ask interaction, context circulation, trust boundaries, new-nervous-system transition and current-polish quality floor.

**AUTHORITY:** Documentation, ledger maintenance and provisional concept planning only. Mock lock, implementation, external integration, production mutation and release remain separately gated.

**RISKS:** Unapproved storage boundary; adapter leakage; interview burden; false portability; polished surface masking weak data or intelligence.

**VERIFICATION:** Contract structure, repository evidence mapping, state coverage, ledger readback, deterministic snapshot and documentation checks must pass before delivery.

**NEXT OWNER:** Krish Raja for the single governing rule above; then `krish-design`.

**NEXT ACTION:** On approval, create the sanitized first-surface divergence brief and run three independent interaction spines before rendering one synthesis.
