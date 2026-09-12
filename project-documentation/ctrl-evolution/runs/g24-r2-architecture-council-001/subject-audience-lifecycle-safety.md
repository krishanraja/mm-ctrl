# Subject, Audience and Lifecycle Safety review

**Run:** `g24-r2-architecture-council-001`  
**Verdict:** `VETO`  
**Authority:** Advisory review and this verdict file only. No implementation, external research, customer-data use, message, scheduling, release or deletion is authorised.  
**Independence:** Fresh specialist pass. I read the council brief, the four frozen submission artifacts, the frozen R1 blueprint and contract where needed, and this judge's durable history. I did not read another G24 R2 council verdict or builder conclusion.

## Frozen evidence

All four submission hashes reproduced the values in [`brief.md`](brief.md):

| Artifact | Verified SHA-256 |
|---|---|
| [`g24-product-system-blueprint-r2.md`](../../g24-product-system-blueprint-r2.md) | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` |
| [`g24-product-system-contract-r2.json`](../../g24-product-system-contract-r2.json) | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` |
| [`g24-product-system-r2-delta.json`](../../g24-product-system-r2-delta.json) | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` |
| [`question-and-enrichment-evidence-2026-09-12.md`](../../research/question-and-enrichment-evidence-2026-09-12.md) | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` |

The R1 blueprint and contract hashes also reproduce the baseline declared in the delta: `2d006b...24e0a` and `16b25e...064ba` respectively (`g24-product-system-r2-delta.json`, `$.baseline.artifacts[0:2]`, lines 6–16).

## Decision

R2 has the right safety intent and several boundaries worth preserving, but its central duration change is not yet safe to lock. It adds an unbounded `continuing` state while representing permission expiry only as prose and a Boolean. It does not define the authority record, use-time guard, transition guard or downstream invalidation that stops an expired or withdrawn source from continuing to drive Brain items, enrichment, questions, session briefs, queued delivery, context capsules or releases.

That is a direct conflict with the delta's own forbidden interpretation, `engagement_continues_without_explicit_state_or_permission` (`g24-product-system-r2-delta.json`, `$.forbidden_interpretations[1]`, lines 76–80). The durable judge standard is also explicit: identity, consent, audience, provenance, correction and retention boundaries must survive every state, and meaning must be bound to subject, source capability, audience, authority and lifecycle in one trusted receipt ([judge history](../../judge-history/subject-audience-lifecycle-safety.md), lines 3, 21–31 and 47–53).

## Findings

### SAL-R2-01 — Duration continuation outruns enforceable permission

**Disposition:** `breaks` — blocking.

**Evidence:**

- R2 declares `continuing` to have no assumed end, makes `ends_at` optional, and says a review is not shutdown ([R2 blueprint](../../g24-product-system-blueprint-r2.md), § “The relationship is longer than a timer”, lines 67–95).
- The same section says the engagement record needs source-specific permission and retention expiries, the latest audience boundary, a checkpoint, and pause/reopen/deletion receipts (lines 81–93).
- The machine overlay contains only a state list and `permissions_expire_independently: true`; it does not contain those record fields, an allowed-transition graph, transition authorities or expiry effects ([R2 contract](../../g24-product-system-contract-r2.json), `$.engagement_lifecycle`, lines 66–81).
- R1 requires deterministic filtering by subject, audience, standing, validity and consequence permission, while its source, correction and capsule contracts already create many downstream copies and projections ([R1 blueprint](../../g24-product-system-blueprint.md), § “Universal source envelope”, lines 141–159; § “Retrieval policy”, line 286; § “Correction cascade”, lines 353–364).

**Finding:** A named state plus an expiry assertion is not a lifecycle mechanism. The proposal does not say what `paused`, `closing`, `released` or reopened engagement state permits; who can enact each transition; whether a missed review freezes collection and delivery; or whether reopening requires fresh grants. The diagram also permits a return toward `continuing` while the only machine contract is a flat state array. Most importantly, no new object is required to carry the exact permission authority on which its use depends. An accepted derivative can therefore appear current after its source permission expires.

### SAL-R2-02 — Sensitive questions lack a mandatory informed-permission path

**Disposition:** `breaks` — blocking.

**Evidence:**

- The supporting evidence says a sensitive question needs a truthful reason, private mode, legitimate refusal path, careful timing and a privacy statement that describes the actual data path ([evidence note](../../research/question-and-enrichment-evidence-2026-09-12.md), § “Evidence-supported working principles”, line 29). The note is evidence, not authority, but R2 does not explain why it drops these safeguards.
- The customer anatomy makes the reason optional and a defer/decline path conditional “where needed” ([R2 blueprint](../../g24-product-system-blueprint-r2.md), § “Visible choreography”, lines 133–141).
- The question contract records `sensitivity`, `audience`, `retention`, `channel`, `expiry` and refusal behaviour, but not the purpose/data-path disclosure, private mode, consent or permission receipt, or no-reask/suppression consequence ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 253–270; [R2 contract](../../g24-product-system-contract-r2.json), `$.question_intelligence.contract_fields`, lines 204–223).
- Sessions are specifically proposed where identity, politics or sensitivity may distort a thin answer, then use a ladder ending at a “pressure point” ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 339–366).

**Finding:** Sensitivity is currently a score cost and metadata field, not a permission gate. `defer_unknown_refusal_behaviour` can describe almost any behaviour, including asking again. Nothing requires the subject to understand why the answer is sought, who will see it, how it will be retained, whether it may shape later decisions, or that refusal will not be converted into pressure in a live session. Moving a sensitive question from asynchronous delivery to Krish's prepared conversation changes the social pressure, not the underlying permission requirement.

### SAL-R2-03 — The real-public boundary is asserted but not bound to every live object

**Disposition:** `breaks` — blocking for real-identity fixtures.

**Evidence:**

- R2 says real public identities are limited to public-source research tests, internal depth uses matched fictional profiles, and consented real material waits for a later gate ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 398–411; [R2 contract](../../g24-product-system-contract-r2.json), `$.first_crossing_extension.real_public_identity_rule`, `.controlled_internal_depth_rule`, and `.consented_real_material_gate`, lines 308–331).
- The four Crossing cases are plain strings and are not individually bound to an evidence namespace, `real_named_identity`, source capability, authority identity, audience or lifecycle receipt ([R2 contract](../../g24-product-system-contract-r2.json), `$.first_crossing_extension.cases`, lines 308–315).
- The durable history rejects metadata promises that allow real-person meaning or simulated consent to borrow fictional/authorised metadata. It requires exact live shapes, positive authority and a shared trusted receipt ([judge history](../../judge-history/subject-audience-lifecycle-safety.md), lines 28–31, 39–42, 49–53 and 61–63).

**Finding:** “Trusted application code validates” ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 376–392) is not yet a declared validation contract. The strongest public-identity sentence can still be defeated by attaching real public identity to an internal-depth case, or by letting a generated inference inherit a public source's identity and audience metadata. Public availability also does not by itself authorise collection of sensitive third-party details, reuse across cases, or durable personal inference.

### SAL-R2-04 — Approval, edits and channel expiry are not joined at the last mile

**Disposition:** `breaks` — blocking before any delivery or scheduling implementation.

**Evidence:**

- R1 requires a delivery intent with purpose, exact content, recipient, channel, timing, expiry and source case; Krish controls consequential prompts; opt-outs and deferrals must close the loop ([R1 blueprint](../../g24-product-system-blueprint.md), § “Email and customer prompting”, lines 435–442).
- R2 makes wording, controls and route effects versioned together, allows Krish to change channel, timing, wording or agenda, and adds an `intervention_delivery` record ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 253–272, 376–392 and 448–456).
- The overlay does not bind delivery approval to an immutable question/agenda version, recipient, permission grant or suppression state, and it does not require a final recheck immediately before send or schedule (`$.question_intelligence.contract_fields`, lines 204–223; `$.session_opportunity.krish_controls`, lines 297–305).

**Finding:** A valid approval can become stale when content, audience, channel or timing changes, or when consent expires between approval and delivery. The current pull-only portfolio and `unsolicited_push_authorised: false` are good and must remain, but they only prevent the first push route. They do not prove safe email, secure-link, calendar or later-channel delivery.

### SAL-R2-05 — A session capture plan is not participant consent

**Disposition:** `breaks` — blocking before a real session is captured.

**Evidence:**

- R1 accepts authorised transcripts and says automatic meeting recording is not a default route ([R1 blueprint](../../g24-product-system-blueprint.md), lines 125–139). “Not default” is weaker than an explicit consent requirement.
- R2's prepared brief says what “should be captured afterwards and what must remain private”; the contract reduces this to `capture_and_privacy_plan` ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 354–366; [R2 contract](../../g24-product-system-contract-r2.json), `$.session_opportunity.brief_fields[7]`, lines 286–295).
- The Crossing also proposes an optional voice critical incident and permissioned learning proposal without defining the permission or raw-audio lifecycle ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 398–407).

**Finding:** The architecture does not require participant-visible, action-time permission by modality and purpose for audio, transcription, notes, uploaded artefacts or derived Brain learning. It does not handle multiple speakers, third-party disclosures, withdrawal during the session, or the boundary between Krish-private notes and subject-visible/customer-safe state. An operator-authored privacy plan cannot substitute for the subject's permission.

### SAL-R2-06 — Correction is strong, but correction is not expiry, revocation or erasure

**Disposition:** `breaks` — blocking.

**Evidence:**

- R1's correction cascade preserves the source and prior interpretation, traverses dependencies, quarantines current projections and issues a repair receipt. It also says published releases are immutable ([R1 blueprint](../../g24-product-system-blueprint.md), § “Correction cascade”, lines 353–364).
- R2 says the engagement needs deletion receipts and proves one correction across the coverage map and two decisions, but adds no deletion/erasure object, state, authority, dependency effect or proof case ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 81–93 and 394–407; [R2 contract](../../g24-product-system-contract-r2.json), `$.engagement_lifecycle` and `$.first_crossing_extension.required_dynamics`).
- `answer_receipt` is expressly meant to preserve the actual response, while no contract says how that receipt, the raw source, derived claims, caches, capsules, prepared interventions, session material or release projections behave after retention expiry or erasure ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 376–390).

**Finding:** A correction can legitimately retain history; erasure may require content to become unavailable or be destroyed. A deletion receipt without declared coverage can report an event while sensitive content remains in raw storage, dependency history, indexes, queued work or immutable exports. R2 also does not state the honest limit: customer-held or already delivered releases may be outside CTRL's power to recall.

### SAL-R2-07 — Closed external action and pull-only routing survive

**Disposition:** `holds`, within the frozen architecture scope only.

**Evidence:** R2 closes customer data, external research, model spend, email send, connectors, deployment and release in the machine authority (`$.authority.closed`, lines 27–48); keeps the first OS route pull-only and unsolicited push false (`$.session_opportunity.initial_os_route` and `.unsolicited_push_authorised`, lines 297–306); and forbids models from widening audience, sending or scheduling ([R2 blueprint](../../g24-product-system-blueprint-r2.md), lines 370–392).

**Finding:** Preserve this boundary. It prevents the current proposal from causing an external disclosure. It does not cure the missing contract needed before those actions are later opened.

## Strongest challenge

The strongest-looking mechanism is the combination of “Permissions expire independently of the commercial relationship” ([R2 blueprint](../../g24-product-system-blueprint-r2.md), line 93) and R1's deterministic correction cascade. It fails this adversarial trace:

1. A source is validly supplied, with permission ending at `T1`.
2. Before `T1`, it produces a claim, accepted Brain item, coverage result, prepared question, session brief and approved delivery intent.
3. The engagement enters unbounded `continuing`.
4. At `T1`, no fact is corrected, so the correction cascade has no declared trigger.
5. The R2 contract has no grant ID on those derivatives, no permission-expiry event effects, no quarantine rule and no mandatory send-time revalidation.
6. The derivative can still look current and the pre-approved intervention can still look deliverable.

The proposal therefore records the principle but does not yet make expiry survive every state. This is the veto-bearing failure.

## Required repairs to lift the veto

1. **Add one positive authority root.** Define an exact, total, fail-closed `authority_receipt`/`permission_grant` shape with subject identity, granting actor and authority, source or capture scope, permitted purposes and operations, audience ceiling, consequence class, valid-from/expiry, retention deadline, revocation state, provenance and version. Bind every new R2 object and every derivative it can use to that receipt; no inherited or free-text authority.
2. **Make engagement transitions executable.** Add the allowed transition graph, transition actor, preconditions and per-state capabilities. A missed review, pause, close, release or reopen must say exactly whether research, reads, new capture, questions, sessions, delivery, learning and export are allowed. Reopen and continuation require explicit current grants; neither may revive expired authority.
3. **Separate four lifecycle operations.** Specify distinct correction, permission expiry, revocation and erasure events. Each must traverse raw objects, claims, Brain versions, evidence maps, indexes/caches, questions, answers, session briefs, delivery queues, capsules and releases; block current use before repair; and emit a residue-aware receipt. Define what audit metadata can remain without retaining the erased content, plus the honest non-recall boundary for delivered/customer-held exports.
4. **Gate sensitive interactions.** For declared sensitive classes, require a subject-visible reason, exact purpose and data path, exact audience/retention/later-use statement, private mode where relevant, and a real decline path with no adverse inference. A refusal suppresses re-asking unless the subject explicitly reopens it; deferral gets a subject-chosen or bounded retry rule. Moving the question into a live session cannot relax this gate.
5. **Bind real-public test identity structurally.** Each fixture and record must carry an exact namespace, real-person flag, permitted source capabilities, audience and authority receipt. Reject unknown fields, mixed namespaces, simulated consent, internal evidence on real-public cases, and source-incompatible semantics on the live value used by the caller. Add public-data minimisation and third-party/sensitive-detail exclusions.
6. **Join approval to delivery and capture.** Approval must bind exact content/agenda version, verified subject and recipient, authorised channel, purpose, timing and expiry; any edit invalidates it. Recheck identity, grant, expiry, audience and suppression atomically at send/schedule time. For sessions, capture is off unless each relevant participant grants the exact modality, purpose, audience and retention; withdrawal stops capture and triggers the declared disposition.
7. **Extend the headless proof.** Add adversarial cases for permission expiring after derivation and after approval but before send; reopen after expiry; pause with queued work; refusal followed by attempted re-ask; sensitive question without private mode/disclosure; mid-session capture withdrawal; real-public identity attached to fictional internal depth; audience widening; correction versus erasure; erasure after capsule/export; and live malformed/sparse objects. Every case must fail closed without throwing and prove downstream quarantine or deletion, not merely a successful receipt.

## Non-blocking improvements after repair

- Replace vague “private” labels in the prepared agenda with exact named audience and purpose.
- Show the subject a compact “used for / seen by / kept until” receipt for sensitive answers and captured session material.
- Add refusal re-ask, stale-approval rejection, expiry-quarantine latency and erasure-residue counts to internal safety diagnostics. These must not become customer scores.

## What must stay unproven

Until the repairs and their later gates produce observed evidence, no founder-facing or implementation claim may say that:

- indefinite continuation is permission-safe, or that a review date renews any consent;
- a sensitivity score, audience label or refusal field amounts to informed permission;
- real-public identity use is isolated from fictional/private depth by a prose rule alone;
- any email, secure link, calendar action, push channel or session invitation is safe to deliver;
- a prepared privacy plan authorises recording, transcription, notes, artefact capture or durable learning;
- correction proves revocation, retention expiry, DSAR or erasure;
- an immutable or customer-held release can be recalled or fully erased by CTRL;
- Question Yield proves a question was acceptable to the subject;
- the interaction is intuitive, the private mode is understood, refusal is pressure-free, or consent is comprehended; or
- any real-customer session, customer-data path, external research run or delivery channel has been approved.

The R1 correction cascade, public/private namespace separation, closed external actions and R2 pull-only first route should remain protected. The veto is lifted only when the frozen overlay contains the missing authority and lifecycle contracts and a subsequent independent pass sees the adversarial proofs above.
