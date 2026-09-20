# G24 R3 Living Brain Integrity review

## Verdict

`PASS_WITH_WATCHPOINTS`

No current G24.A Living Brain Integrity defect was found. The frozen R3 candidate closes the shadow-memory, derivative-standing, silent-rewrite and private cross-case reuse seams at architecture level while preserving the R1 correction and portable-release contract. Exact schema enforcement, runtime invalidation, clean-room portability and erasure/non-recall behaviour remain named later-gate proofs.

## Review contract and independence

- **Standard:** `g24-r3-architecture-recheck-v1`, accepted, owner `CTRL permanent council contract`, fresh 12 September 2026, SHA-256 `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`.
- **Criterion:** Living Brain Integrity only, plus the standing, human-authority, lifecycle and fail-closed dependencies strictly necessary to decide it.
- **Submission:** the three frozen R3 artifacts listed below.
- **Mode:** fresh isolated sealed Pack A pass. The standard was read and hash-verified before any submission artifact. R1 was then read before R2, and R2 before R3.
- **Exclusions honoured:** I did not read `runs/g24-r2-architecture-council-001/`, `judge-history/`, another specialist output, builder commentary, founder prediction, README state conclusions or conversation history. References to excluded material inside frozen artifact prose were treated as inert claims and were not followed.
- **Authority:** this review file only. No implementation, ledger write, external research, customer-data action or other external action was performed.

## Frozen identity and mechanical checks

SHA-256 was computed with `Get-FileHash -Algorithm SHA256` in PowerShell 7.6.5. Every declared frozen hash matched byte-for-byte.

| Artifact | Expected SHA-256 | Actual SHA-256 | Result |
|---|---|---|---|
| `runs/g24-r3-architecture-council-002/standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | match |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| `research/question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |

Control-file identities were also recorded: `brief.md` SHA-256 `92fe4ceaf1453d8f6217d7f94b11032903c9cd136a7f45928c1d918baf087b62` and `input-manifest.json` SHA-256 `f5e52b5bb32e5b4d0286560f3415886176ed65121d2a3be384b8c8131ea273a8`. The pack declares no independent expected hashes for those two files, so no match claim is made for them.

`ConvertFrom-Json -Depth 100` parsed the R1, R2 and R3 contracts, both deltas and the input manifest without error. A deterministic invariant check found exactly nine unique R2 extension objects in R3, each with one non-empty `r1_owner` field and `new_canonical_root: false`; it also confirmed canonical-reference-only effective state, `derivative_can_award_standing: false`, `private_reasoning_cross_case_reuse: false`, a total exactly-one fail-closed selector, preservation of R2 history, one canonical Brain and closed external actions.

These mechanical checks establish byte identity, parseability and enumerated literal invariants only. They do not prove physical-schema enforcement or runtime behaviour.

## Strongest part attacked

I attacked the apparently strongest claim: that the ownership map plus inherited-integrity rule actually prevents an implementer from creating a shadow Brain while still satisfying the prose.

The attempted failure paths did not survive the frozen contract:

1. **Projection awards itself standing.** An implementer persists `evidence_coverage` and treats its copied labels as truth. This conflicts with `g24-product-system-blueprint-r3.md` section **Repair 1: close every R2 object onto R1**, where `evidence_coverage` is a rebuildable projection that cannot award standing, and with `g24-product-system-contract-r3.json` pointers `/object_map/2`, `/inherited_integrity/effective_state_from_canonical_references_only` and `/inherited_integrity/derivative_can_award_standing`.
2. **An answer silently rewrites durable judgement.** Recording a leader answer directly mutates the Brain. This conflicts with R3 blueprint section **Intervention authority**, paragraphs beginning “The immutable answer event” and “The third cannot become accepted”, and contract pointers `/intervention_authority/answer_effect_layers`, `/intervention_authority/human_owned_changes_require_named_authority` and `/intervention_authority/answer_can_be_authority_event_only_if`.
3. **A reusable public claim smuggles private case reasoning into another case.** This conflicts with R3 blueprint section **The inherited-integrity rule**, paragraph beginning “Public claims may be reused”, and contract pointers `/inherited_integrity/public_reuse_by_immutable_reference_only` and `/inherited_integrity/private_reasoning_cross_case_reuse`. The public reference may travel; applicability, sufficiency, contradiction, audience and standing are recomputed in the authorised target case, while private reasoning does not travel with it.
4. **A stale projection survives correction or authority change.** R3 requires current canonical references and input-version watermarks, makes invalid controlling references ineligible, and invalidates or rebuilds affected coverage, plan, question, session, capsule and unsent-delivery projections. This is stated in R3 blueprint section **The inherited-integrity rule**, paragraphs beginning “Unknown, missing” and “Any controlling input-version change”, and in contract pointers `/inherited_integrity/controlling_references`, `/inherited_integrity/invalidation_triggers`, `/intervention_selector/controlling_change_invalidates_before_use` and `/lifecycle_policy/permission_change_invalidates_unsent_derivatives_before_use`.
5. **History or release becomes silently mutable.** The frozen R1 baseline remains controlling: `g24-product-system-blueprint.md` sections **Canonical kernel**, **Runtime and storage** and **Correction cascade** require versioned Brain items, append-only correction, dependency repair, immutable published releases and successor releases. R3 preserves rather than replaces that baseline through exact hashes and `g24-product-system-r3-delta.json` pointers `/preserves_r2_as_history`, `/protected_strengths/2` and `/forbidden_interpretations/0`.

The remaining implementation choices are representation choices, not permission to create a second authority: the physical tables may vary, but a conforming implementation cannot make a derivative canonical, let it award standing, silently overwrite accepted memory or carry private reasoning across cases.

## Criterion findings

### Living Brain Integrity: `holds`

**Rule:** Memory remains canonical, versioned, inspectable, portable and correctable. Extensions cannot create shadow truth, erase history, reuse private reasoning across cases or let a derivative award itself standing.

**Evidence and finding:**

- **Canonical and no shadow truth:** R3 blueprint **Repair 1**, ownership table and inherited-integrity rule; R3 contract `/object_map` and `/inherited_integrity`. All nine R2 objects resolve to the R1 system, none is a new canonical root, and all decision-shaping standing derives from current canonical references.
- **Versioned and no silent rewrite:** R3 blueprint **Intervention authority** and **Question atom**; R3 contract `/intervention_authority` and `/intervention_atom`. Immutable answer evidence, rebuildable case effects and human-owned durable proposals are separate; exact-version approval is invalidated by material change.
- **Inspectable:** R1 blueprint **Brain-item standing**, **Experiences and information architecture** and **Operator depth contract** require meaning, scope, evidence, contradiction, authority, audience, version, invalidation and influence history to be inspectable, with portrait and map resolving to the same canonical references. R3 adds controlling watermarks and reasoned selector outputs rather than another presentation truth.
- **Correctable without erased history:** R1 blueprint **Correction cascade** preserves source and prior interpretation, closes or disputes rather than overwrites, repairs deterministic dependencies and issues a receipt. R3 blueprint **Permission change before use** preserves the separate semantics of correction, permission change and erasure, while extending invalidation to the new R2 derivatives.
- **Private cross-case boundary:** R3 blueprint **The inherited-integrity rule**, final paragraph, and R3 contract `/inherited_integrity/public_reuse_by_immutable_reference_only` plus `/inherited_integrity/private_reasoning_cross_case_reuse` permit immutable public references while preventing private reasoning from hitchhiking across cases. Accepted, authorised Brain judgement may still be proposed for a later different decision under R1 applicability and human-review rules.
- **Portable, not a second Brain:** R1 blueprint **Runtime and storage** makes GitHub/ZIP a portable customer-owned projection rather than the hot database, requires returned edits to re-enter as proposed changes, and requires portability across two supported agent environments. R1 **Correction cascade** makes published releases immutable and successor-based. R3 preserves one canonical Brain and keeps release closed at this gate.

### Direct dependency: Epistemic Integrity standing slice: `holds`

R3 blueprint **The inherited-integrity rule** and contract `/inherited_integrity/use_specific_semantics` require source capability, supporting and contradicting assertions, provenance-root independence, use-specific sufficiency, causal standing and applicability. This is enough to prevent a derivative or repeated copy from manufacturing the standing on which Brain reuse depends.

### Direct dependency: Subject, Audience and Lifecycle Safety use slice: `holds`

R3 blueprint **Permission change before use** and contract `/lifecycle_policy` make permission change distinct from correction and erasure, invalidate unsent derivatives before use and forbid reopening or commercial continuation from reviving grants. This closes the route by which stale authority could make shadow memory usable.

### Direct dependency: Human Agency durable-state slice: `holds`

R3 blueprint **Intervention authority** and contract `/intervention_authority` prevent an answer event or model output from automatically becoming purpose, boundary, durable judgement or learning. The named human authority and pre-disclosed exact material effect are required.

### Direct dependency: Behavioural and Implementation Reality architecture slice: `holds`

R3 blueprint **One total route-selection boundary** and contract `/intervention_selector` make the selector exactly-one, total and fail-closed for missing, stale, ambiguous, contradictory and invalid inputs. Runtime conformance is not claimed here and remains a later-gate watchpoint.

No other criterion was necessary to establish this specialist ruling and no specialist-wide ruling is made on those criteria.

## Current-gate defects

None identified under the accepted G24.A veto boundary. An implementer cannot satisfy the written R3 candidate while also giving an extension independent standing, silently rewriting accepted Brain state, erasing correction history or reusing private reasoning across cases without contradicting explicit normative fields.

## Later-gate watchpoints

1. **Physical ownership and projection proof, G24.B/C:** implement one enforceable owner/reference shape for every mapped object; prove that deleting and rebuilding coverage, selector and session projections yields the same current state and that no auxiliary table, cache, vector index, receipt body or model trace can become a read authority.
2. **Standing and invalidation attacks, G24.B/C:** exercise source-root, copied-label, stale cutoff, future-dated, subject collision, audience narrowing, Brain-version retirement, permission withdrawal and correction cases. Each identical attack must make the derivative ineligible before use, quarantine or rebuild it, and emit the required receipt.
3. **Private cross-case isolation, G24.B/C:** prove that an immutable public claim can be referenced by two authorised cases while assertion-to-case rationale, private source spans, operator reasoning, selected Brain items and model context from case A are absent from case B unless separately and explicitly authorised through the canonical Brain contract.
4. **No silent rewrite, G24.B/C:** prove event/current-projection equivalence and that answer capture changes only immutable case evidence until the exact named authority accepts any separately disclosed durable proposal.
5. **Portable release, G24.E:** deterministically generate the accepted audience-bounded projection, verify its manifest and hashes, import it into two clean environments, and demonstrate that edits return only as provenance-bearing proposals rather than writes to live canonical memory.
6. **Erasure and residue, first delivery/data capability and G24.H:** prove revocation and erasure traversal across canonical state, derivatives, indexes, object bytes and outstanding capsules, and accurately disclose immutable customer-held releases, exported copies and non-recall limits. This is explicitly deferred; it is not evidence of a current G24.A architecture defect.

## Closed actions preserved

`g24-product-system-contract-r3.json` `/authority/closed` keeps all of the following closed: production write, customer data, account creation, external research run, model spend, email send, customer contact, session scheduling, session capture, connector creation, database branch creation, deployment, merge, feature enablement, release and legacy-backend deletion. This review opened none of them.

## Owner decision and handoff

No identified Living Brain Integrity break under the frozen hashes. Preserve the watchpoints as blocking proof obligations at their named later gates. The owner decides whether the overall seven-criterion G24.A gate clears; this specialist result neither approves implementation nor changes gate state.

No ledger entry is proposed or written.
