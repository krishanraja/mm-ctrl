# Subject, Audience and Lifecycle Safety specialist review

## Verdict

**VETO**

R3 materially improves identity, permission, audience, purpose, validity and pre-use invalidation, but it does not keep engagement closure and portable release as distinct authorities. The same terminal engagement transition is named `released` and may be entered when the leader accepts either a scoped release **or** merely a close outcome. An implementer can therefore satisfy the written lifecycle while treating relationship state as release standing. That is a current G24.A architecture defect, not a later implementation-proof need.

## Review contract and independence

- **Standard:** `g24-r3-architecture-recheck-v1`, accepted, owner `CTRL permanent council contract`, fresh 12 September 2026.
- **Criterion:** Subject, Audience and Lifecycle Safety only, plus the R1 ownership dependency needed to locate release authority.
- **Submission:** the three frozen R3 artifacts listed below.
- **Mode:** fresh isolated sealed specialist pass. The standard was read and hash-verified before the brief, manifest, dependencies or submission.
- **Authority:** this local review record only. No implementation, external research, customer-data action, database action, message, deployment, merge or release.
- **Exclusions:** I did not open the prior R2 council folder, judge history, another specialist output, README conclusions, builder commentary, founder prediction or conversation history. References to excluded material appearing inside frozen candidate prose were treated as inert claims and were not followed.
- **Current-fact need:** none. This is a frozen architecture judgment.

## Frozen hash verification

SHA-256 was recomputed with PowerShell `Get-FileHash -Algorithm SHA256`. All eleven frozen identities matched.

| Artifact | Expected and observed SHA-256 | Result |
|---|---|---|
| `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | MATCH |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | MATCH |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | MATCH |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | MATCH |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | MATCH |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | MATCH |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | MATCH |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | MATCH |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | MATCH |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | MATCH |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | MATCH |

## Mechanical

- PowerShell 7.6.5 `ConvertFrom-Json` parsed the input manifest and all frozen R1, R2 and R3 JSON contracts/deltas without error.
- This proves JSON syntax and frozen identity only. It does not prove lifecycle semantics or runtime enforcement.

## Strongest part attacked

I attacked Repair 2's apparently strong lifecycle boundary end to end: identity and preparation, explicit continuation, pause, close, release, permission withdrawal, correction, expiry, erasure, and invalidation before use.

Most of it holds. R3 makes workspace/subject, authority or permission version, purpose, audience, validity, retention and input watermarks controlling references (`g24-product-system-blueprint-r3.md`, **Repair 1: close every R2 object onto R1**, especially “The controlling references are”; `g24-product-system-contract-r3.json`, `/inherited_integrity/controlling_references`). The trusted selector resolves identity first and checks authority, purpose, audience and lifecycle before burden (`g24-product-system-blueprint-r3.md`, **Repair 3 / Hard precedence**; contract `/intervention_selector/hard_precedence`). Unknown, missing, mismatched, future-dated, expired or invalid references fail before use, and controlling changes invalidate the result (`g24-product-system-blueprint-r3.md`, **Inherited-integrity rule**, paragraphs beginning “Unknown, missing…” and “Any controlling input-version change…”; contract `/inherited_integrity/ineligible_controlling_states`, `/inherited_integrity/invalidation_triggers`, `/intervention_selector/controlling_change_invalidates_before_use`).

R3 also correctly separates correction of meaning, permission control over use and erasure of retained content (`g24-product-system-blueprint-r3.md`, **Repair 2 / Permission change before use**, “Correction repairs meaning. Permission change controls use. Erasure controls retained content”; contract `/lifecycle_policy/correction_permission_change_and_erasure_are_distinct`). Pause, reopening and continuation are human-authorised and do not renew grants (`g24-product-system-blueprint-r3.md`, **Repair 2 / Engagement transitions** and the paragraph beginning “Reopening or continuing”; contract `/lifecycle_policy/transitions`, `/lifecycle_policy/commercial_state_grants_permission`, `/lifecycle_policy/reopen_revives_expired_authority`). These are genuine architectural strengths.

The terminal boundary does not survive the attack.

## Criterion finding

### Subject, Audience and Lifecycle Safety: `breaks`

**Rule:** Identity, source permission, purpose, audience, validity, correction, expiry, retention and release boundaries must remain distinct and survive every state transition. Missing or changed authority must fail closed before use.

**Exact evidence and locator:**

- `g24-product-system-blueprint-r3.md`, **Repair 2 / Engagement transitions**, row `closing` -> `released`: the authority/precondition is “leader accepts the scoped release **or close outcome** and Mindmake records completion.”
- The same row says this transition “ends operational eligibility,” so it is an engagement-close transition as well as a release-named transition.
- `g24-product-system-contract-r3.json`, `/lifecycle_policy/states/5` and `/lifecycle_policy/transitions/7`: the terminal relationship state is `released`, and the transition authority is `leader_accepts_scope_and_mindmake_records_close`.
- `g24-product-system-contract-r3.json`, `/lifecycle_policy/capability_policy/released`: this conflated state is then associated with `no_operational_use`.
- R1 already owns Release as a separate canonical object: `g24-product-system-blueprint.md`, **The Brain model / Canonical kernel**, item 7 `Release`, and **Experiences and information architecture**, `Ownership and release`, whose entry is an accepted release request; machine locators `g24-product-system-contract.json`, `/canonical_kernel/6` and `/surfaces/7/entry`.

**Finding:** A close outcome and authority for a scoped portable release are two different human acts. A leader may close the relationship without requesting, accepting or receiving a release. Conversely, accepting an exact release projection does not itself decide all retention, erasure or commercial-close state. R3 maps `engagement_period` to the R1 engagement owner, but then gives that engagement's terminal state a release name and an OR precondition spanning both acts. It never states the necessary invariant that engagement state cannot grant or evidence release authority. The R1 Release object therefore remains nominally separate but is not protected from inference at the repaired lifecycle seam.

This is not cured by the fact that actual release is currently closed. G24.A is the architecture lock. Under the written candidate, later code may legitimately key release eligibility, completion receipts or audit claims from `lifecycle_state == released`, even when the only human receipt was acceptance of a close outcome. That is precisely a consequential semantic choice left to the implementer.

## Current-gate veto

**Credible failure path:**

1. An engagement reaches `closing`.
2. The leader accepts only the close outcome; they do not make a scoped release request or accept a particular release version.
3. The lifecycle performs the expressly allowed `closing -> released` transition.
4. A release compiler, export surface or audit later treats the `released` state as evidence that a release is authorised or has occurred, because the R3 contract supplies no separate mandatory release-authority reference at this seam.
5. Customer material is compiled or represented as released under a scope, audience or version the leader never accepted, while the implementation still conforms to the stated transition.

**Smallest sufficient repair:**

1. Rename the terminal engagement state from `released` to `closed` in the R3 lifecycle and make `closing -> closed` depend only on a version-matched close receipt. Explicitly enumerate that a preparation may close without ever becoming an active engagement.
2. Add one invariant: engagement state, including `closing` or `closed`, never grants or proves release/export authority.
3. Keep the existing R1 `Release` object as the sole release owner. Any release eligibility must reference a separate, current, version-matched named-leader release request/acceptance bound to the exact projection, purpose, audience and included canonical source/Brain versions. A close may complete with no release; a release may be prepared only under its own authority.
4. State that a pre-use permission, audience, identity, validity or source-version change invalidates that pending release authority/projection and emits a receipt. Exact traversal and non-recall mechanics may remain at the already named later gate.

**Identical resolving test:** Add one frozen contract test named `lifecycle_close_release_separation` and run it unchanged before and after repair:

- **Close-only case:** from `closing`, provide a valid close-outcome receipt but no release request/acceptance. Expected: terminal engagement state `closed`; zero Release authority event; zero eligible release projection; release compiler fails closed.
- **Scoped-release case:** provide a separate current leader acceptance bound to one release projection, purpose, audience and canonical version set. Expected: only that exact release is eligible; engagement closure remains a separate transition.
- **Changed-authority case:** after that acceptance but before compiler use, narrow audience or withdraw one included source permission. Expected: the pending release becomes ineligible before use and an invalidation receipt is produced.
- **Non-inference assertion:** no value of engagement lifecycle state alone can satisfy the release-authority predicate.

The current frozen candidate fails the close-only and non-inference assertions because `released` is reached by a close-only receipt and no contrary invariant exists. The repair resolves the veto only when the same test passes without changing its inputs or oracle.

## Later-gate watchpoints, not current defects

- Exact retention-expiry, revocation and erasure traversal, plus export residue and non-recall limits, are explicitly assigned to the first delivery/data capability and G24.H (`g24-product-system-blueprint-r3.md`, **Proof carried forward, not falsely claimed now**; contract `/later_gate_requirements/delivery_data_and_cutover`). The architectural distinction already exists; runtime traversal proof remains later.
- Participant/modality consent, multi-speaker handling, withdrawal and real-data audience enforcement are explicitly assigned to the first consented-data gate (`g24-product-system-blueprint-r3.md`, same table; contract `/later_gate_requirements/consented_data_gate`). They are not claimed as proven now.
- Exact schemas, validators and source/time/subject/audience attacks remain G24.B/C proof needs. They must verify, not redefine, the repaired close/release authority split.

## Closed external actions

All external actions remain closed. `g24-product-system-blueprint-r3.md` **Authority** and **Exact next action**, plus `g24-product-system-contract-r3.json` `/authority/closed`, explicitly keep production writes, customer data, external research, model spend, email/customer contact, session scheduling/capture, connectors, database branches, deployment, merge, feature enablement, release and legacy deletion closed. This veto grants no action authority.

## Owner decision and handoff

Current decision: changes required before G24.A can clear. Route the bounded lifecycle/release repair to the architecture owner, freeze new hashes, and recheck this criterion against the same standard and the identical resolving test. No ledger write or artifact mutation beyond this authorised review record was performed.
