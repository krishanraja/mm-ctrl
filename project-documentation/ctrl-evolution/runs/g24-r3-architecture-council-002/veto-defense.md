# G24 R3 Independent Veto Defense

**Run:** `g24-r3-architecture-council-002`

**Role:** Independent Veto Defense, history-aware Pack B and Pack C review

**Recommendation:** `REPAIR`

## Decision

R3 should not clear on its frozen bytes. Two current-gate defects survive the strongest defense:

1. the lifecycle graph has no defined exit from `preparing` and uses undefined grouped source tokens in the machine contract; and
2. the blueprint permits a `typed provisional result` for invalid selector input while the machine contract permits only five results and names `abstain_hold` as the fail-closed result.

The three sealed veto files do not establish three independent repair roots. The Epistemic Integrity demand for a new canonical `epistemic_policy_ref` overstates G24.A and duplicates the R1 trust architecture. The Subject, Audience and Lifecycle Safety release failure path ignores the existing R1 Release authority and the closed release capability, but its naming concern is usefully removed inside the surviving lifecycle repair. The selector contradiction in the Epistemic and Reality verdicts is one defect and needs one repair.

This is `REPAIR`, not `CLEAR`, because a conforming implementation still has to invent a safe preparation exit and can choose incompatible meanings for an invalid or contradictory selector input. It is not `STOP` because both defects are narrow seams. The R2 product direction and all four intended R3 repair areas remain coherent.

## Review contract and frozen identities

- **Standard:** `g24-r3-architecture-recheck-v1`, accepted, owner `CTRL permanent council contract`, fresh 12 September 2026.
- **Submission:** the frozen R3 blueprint, machine contract and delta.
- **Mode:** history-aware cross-examination after Pack A freeze. All seven sealed verdicts, all seven durable histories, the prior R2 adjudication and the relevant frozen R1, R2 and R3 artifacts were read only after identity verification.
- **Authority:** this local review record only. No frozen input, judge history, implementation, state route or external system was changed.
- **Excluded:** builder commentary, founder prediction and conversation history were not read.

PowerShell `Get-FileHash -Algorithm SHA256` was used on exact paths. JSON parsing and structural observations establish identity and syntax only, not semantic correctness.

### Standard, manifest, submission and prior adjudication

| Artifact | Expected and observed SHA-256 | Result |
|---|---|---|
| `standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | match |
| `sealed-verdicts.json` | `e79e4353d85387710ddf8b239ca68a150fbdc155fae68ca4f692fffddd19ee87` | match |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |
| R2 `adjudication.md` | `17d51854d9e155a0d88aeadef9ff882949c7a8a3fe529c57016664d902b46c2b` | match |

The three R1 baseline hashes and four R2 dependency hashes declared in `brief.md` also matched before those artifacts were used.

### Sealed verdicts and durable histories

| Specialist | Sealed verdict SHA-256 | History SHA-256 | Result |
|---|---|---|---|
| Human Agency | `5639692a627eb4914aff042cb79551dbeb1ea407d6e2330f8b2d9f970cf02cca` | `84e1f9d750b5dff7b144e18f019275a047eae0597eca470675c14f6a9088cd2b` | both match |
| Epistemic Integrity | `246e6844e9c25e28fc9ac7dca34d40258795cfe77a687af60dc7f17f8a59d51a` | `78e81bcc8090baab9569950ec1639ce2568513f6023268ee994d787005538d3c` | both match |
| Subject, Audience and Lifecycle Safety | `03f822e43e3fd7e0573836bf93ef4c9b20e32a9f3a906ef871422ebb0fe372aa` | `fc1baa3f5277fba7b3de6e047456445179aad2dee0cf0d0c2d1f1c3e570d9a21` | both match |
| Consequential Usefulness | `969326d0ce5b3376f638ad77fa20b8948f2fddbec0cbca69dc2f8a8d1d18d258` | `02e5d12ea6c4d05066a89f305a267e2f5c789e078e1de04c7b10d1fb465f1c9e` | both match |
| Living Brain Integrity | `543e440a26daf101471e9b516e0f535953fe8f2007df05149a90fa3680f05b39` | `25e4c84a3352ede838e326a499cafe9e75a4ff037c0c10c2d432e62adf119573` | both match |
| Human Comprehension and Access | `de65d887231d3106269aa5582ed0f43e55e5953248210883c6eb2b4b1f8fbda6` | `a674845dc23be23538a8e8c9ba4b3864282955006d64a03ceba962ccbe11ec79` | both match |
| Behavioural and Implementation Reality | `6276c92ec65342a0f3d6c8184bdbcf1dfcd51b49b95003663fc0575d8eeb858e` | `5d55b9e87a8437999e5ee81af02ac7ce453b310a4ea2c4876d53da2e253f1c06` | both match |

## Defense of every sealed veto

### EI-V1: new epistemic-policy authority

**Defense result:** not sustained at G24.A.

The strongest defense is that the finding separates the epistemic rules from their actual owner, then treats that separation as proof that no owner exists.

R1 already owns the relevant trust architecture:

- `g24-product-system-blueprint.md`, **Universal source envelope**, requires immutable identity, subject, audience, epistemic type, currentness, source spans and derivative lineage.
- R1 **Brain-item standing** keeps maturity, standing, audience and consequence permission independent and requires supporting and contradicting assertions, valid time, staleness and influence history.
- R1 **Model task registry** assigns source qualification, evidence planning, an independent challenger and council evaluation while forbidding model promotion into canonical state.
- R1 **Retrieval policy** applies deterministic identity, audience, standing, validity and consequence filters before semantic retrieval.

R3 then supplies the missing extension binding at `g24-product-system-blueprint-r3.md`, **The inherited-integrity rule**, lines 55-88. It requires current canonical source, assertion and accepted Brain versions; a trusted cutoff; source capability; supporting and contradicting assertions; provenance-root collapse; use-specific sufficiency; causal standing; applicability; and pre-use invalidation. Line 71 expressly forbids model-authored output from upgrading effective standing. Lines 82-84 prohibit causal promotion, first-arrival resolution and copied-root corroboration. The trusted application owns the selector at lines 147-212 and must apply those predicates before burden.

That is the semantic policy for this gate. Requiring another canonical `epistemic_policy_ref` as a condition of clearance risks creating exactly the parallel authority that R3 was told not to add. The prior R2 adjudication required the extension to bind to R1, state one trusted cutoff, preserve contradiction, distinguish source capability from claim standing, collapse common roots and forbid causal promotion. R3 does all of those. The prior adjudication explicitly assigned exact schemas, semantic-oracle fixtures, source mutations and safe-novel enforcement to G24.B/C.

The sealed failure path also assumes trusted code may accept model-authored `capable`, `sufficient` and `applicable` labels merely because the referenced records exist. That implementation contradicts R3 line 71, the hard precedence at lines 175-184 and the model-role restriction at lines 147-149 and 212. It is not a conforming implementation of all frozen artifacts.

The live-countercase requirement is likewise present without needing a new root. The selector consumes the current evidence-coverage version, whose use-specific record includes supporting and contradicting canonical assertion references. R1's independent challenger supplies the countercase role. R3 requires conflict preservation, current watermarks and either admissible resolving evidence or abstention. Exact issuance and negative fixtures remain a mandatory G24.B/C watchpoint, consistent with the Epistemic judge history that trusted metadata must not upgrade meaning. They are not evidence that the current architecture lacks the rule.

**Disposition:** convert EI-V1 to a later-gate enforcement watchpoint. Do not add the proposed subsystem or require a new authority object at G24.A.

### EI-V2 and BIR-V2: invalid-input provisional result

**Defense result:** sustained once, narrowed to one textual partition.

The defense cannot reconcile R3 blueprint line 208 with the machine contract. The blueprint says missing, stale, ambiguous, contradictory or invalid input returns `abstain_hold` **or a typed provisional result**. Contract pointers `/intervention_selector/outputs`, `/exactly_one_output` and `/fail_closed_output` expose only five route results and make `abstain_hold` the fail-closed result. No artifact defines the provisional result's route, standing or actionability.

The two sealed verdicts describe the same defect, not two repairs. The Epistemic resolving test is also too broad where it demands `abstain_hold` for every contradiction. R3 line 210 intentionally permits valid canonical evidence conflict to choose the smallest eligible resolving evidence route. Invalid controlling authority and valid unresolved evidence conflict are not the same condition.

**Smallest surviving repair:** replace the alternative at line 208 and mirror one partition in the contract:

1. unknown, missing, mismatched, future-dated, expired or invalid controlling identity, subject, authority, audience, purpose, lifecycle or version state returns exactly `abstain_hold` and creates no actionable intervention;
2. current valid controlling state with unresolved evidence ambiguity or contradiction may return `enrich`, `ask` or `session` only when that resolving route passes every preceding eligibility rule and carries the conflict forward, otherwise it returns `abstain_hold`; and
3. `provisional` may exist only as non-authoritative diagnostic metadata on the hold receipt. It is never a sixth route and never bypasses eligibility, approval or invalidation.

### Subject, Audience and Lifecycle Safety release veto

**Defense result:** not sustained as an independent release-authority defect; fold its ambiguity into the lifecycle repair.

The sealed failure path assumes a later release compiler may treat `lifecycle_state == released` as sufficient authority. That would violate existing R1 and R3 rules:

- R1 owns Release as a separate canonical object at `g24-product-system-blueprint.md`, **Canonical kernel**, and the release surface begins only from an `accepted release request` at **Experiences and information architecture / Ownership and release** and contract `/surfaces/7/entry`.
- R3 maps `engagement_period` only to the existing consequential-work engagement aggregate. It does not map it to Release.
- R3 maps `intervention_delivery` to the existing chain with `no new delivery authority`.
- R3's capability table says `closing` is eligible only for an accepted release and describes the later `released` row as customer-held release, not new release eligibility.
- The R3 authority contract keeps `release` closed.

An implementation that compiles a release from engagement state alone therefore does not satisfy the full inherited contract. The specialist is right that `released` is a poor name for a relationship terminal reachable from acceptance of a close outcome. The phrase invites an error, but it does not erase R1's separate accepted-release-request authority.

Because the lifecycle graph independently needs repair, the smallest clean response is to rename the relationship terminal to `closed` and state that no engagement lifecycle state proves or grants Release authority. This removes the ambiguity without adding a release subsystem, restating R1's full release schema or pulling export and erasure mechanics into G24.A.

### BIR-V1: lifecycle graph totality

**Defense result:** sustained narrowly.

Expanding a grouped transition into physical rows is not, by itself, a new product decision. Exact storage and validator shape belong later. The sealed veto becomes valid because the grouping hides a real missing semantic path.

The contract enumerates six states but uses `intensive_proof_or_continuing` and `active_or_paused` as `from` values. Neither is a state and `active` is never defined. More importantly, `preparing` can move only to `intensive_proof`. R3 therefore gives Krish authority to open a bounded operator-private preparation scope but defines no outcome when Krish cancels, the leader declines or no engagement is accepted. One conforming implementation can keep that preparation indefinitely readable; another can invent that `active` includes `preparing` and close it. The architecture, not a later timeout value, must own that difference.

The verdict's proposed new `cancelled_before_engagement` state is more design than is necessary. The existing lifecycle can be repaired without a second terminal concept.

**Smallest surviving repair:** use one relationship terminal named `closed`; add a receipted `preparing -> closed` transition for Krish cancellation or a recorded leader decline or withdrawal; invalidate all prepared and unsent derivatives; and limit the closed state to required access, correction, retention and deletion obligations. Expand the grouped source tokens into the explicit existing-state edges they denote. Keep `closed -> preparing` as a new explicit preparation decision that cannot revive old authority.

This same edit removes the release-name ambiguity. Release remains the separate R1 object and capability.

## Attack on the four sealed passes

### Human Agency

The owned Human Agency result still holds. R3 separates answer evidence, derived case updates and human-owned proposals; requires named authority for purpose, success, boundary, durable judgement and learning; invalidates changed approvals; and makes refusal non-punitive. The lifecycle and selector repairs must preserve those controls.

The pass is too broad only where it treats all downstream authority dependencies as closed. An invalid controlling authority reference can currently enter the undefined provisional branch. That is repaired under the selector root, but it does not show that answers or commercial continuation automatically become the leader's authority.

### Consequential Usefulness

The pass withstands attack. The accepted R1 decision frame, decision-relative requirement, expected material effect, per-answer effect and route-mutation exclusion form one coherent architecture chain. Demanding a competent baseline now would repeat the R2 prosecution overreach already rejected by adjudication. The baseline, independent state diff and real lift remain blocking G24.C and pilot evidence.

### Living Brain Integrity

The owned no-shadow-Brain result substantially holds, but two dependency statements in the pass are overclaimed. Its direct Epistemic slice calls the enumerated fields sufficient to prevent copied labels from manufacturing standing, and its direct Reality slice says the selector is total and fail closed. The second is false on the frozen line 208 conflict. Neither statement can be used to cancel the surviving selector repair.

Judge history supports a narrow boundary: static declarations and canonical equality do not prove arbitrary runtime meaning or freshness. R3 has the architecture rule; G24.B/C must prove enforcement. The present selector contradiction is textual and current, while the broader semantic attack remains later proof.

### Human Comprehension and Access

The pass withstands current-gate attack. Wording, control, grammar, complete options, write-in, premise rejection, material effect, answer effect, visible consequence and approval are one versioned atom. Field presence does not prove a fitting or understandable rendered interaction, and the sealed verdict correctly keeps those fixtures and participant tests at G24.C/D.

The phrase `where honestly possible` for unknown, defer and refuse does not create a separate veto because the atom must record their behaviour, R1 preserves answer or decline, forced formats always require premise rejection, and R3 prohibits adverse inference or pressure. Later fixtures must still reject implementations that use the qualifier to remove a genuinely available honest exit.

### Pass attack conclusion

No new independent current-gate defect appears beyond the two surviving repair roots. The passes do, however, overstate aggregate closure when they rely on selector totality. A specialist pass on its owned criterion cannot defeat the directly reproduced cross-criterion contradiction.

## Smallest sufficient repair set

### Repair A: close and normalize the lifecycle graph

Amend only the lifecycle prose and matching contract:

1. Rename the engagement terminal `released` to `closed`.
2. Add `preparing -> closed` with named human authority, version match, receipt and invalidation of every prepared or unsent derivative.
3. Replace grouped `from` tokens with explicit edges among the enumerated states.
4. Preserve the existing close, pause, continuation and reopen meanings.
5. State one invariant: engagement state never grants, proves or substitutes for the separate R1 Release authority. Release still requires the current accepted release request bound to its exact projection and audience.

**Identical resolving test:** parse the lifecycle state set and transition list; require every endpoint to be an exact state; reject `_or_` and undefined group tokens; run matching and stale-version cases for every edge; prove a declined or cancelled preparation reaches `closed`, emits a receipt and leaves no eligible prepared derivative; prove no lifecycle state alone satisfies the R1 release-authority predicate.

### Repair B: partition selector invalidity from resolvable conflict

Amend only blueprint line 208 and the matching selector contract:

1. invalid controlling state yields exactly `abstain_hold` with no actionable derivative;
2. valid but unresolved evidence conflict may choose only an otherwise eligible resolving route, preserving the conflict, or hold; and
3. provisional status is diagnostic metadata only, not a route or authority.

**Identical resolving test:** use one table with missing subject, mismatched workspace, future-dated source, expired permission, stale frame, invalid lifecycle, valid independent conflict with an eligible resolving source, valid conflict without one, and a model-proposed route that violates precedence. Require exactly one of the five routes; require `abstain_hold` for every invalid controlling case; permit a resolving route only for valid eligible conflict; preserve the conflict; forbid side effects from provisional metadata; and invalidate the result after any controlling watermark changes.

## Protected strengths and later proof

Both repairs must preserve the nine-object R1 ownership map, one canonical Brain, human-owned purpose and call, no model promotion, explicit continuation, independent permission, pre-use invalidation, one trusted selector, source eligibility before burden, common-root collapse, causal restraint, quiet and abstention, the versioned intervention atom, non-punitive honest exits, Krish's pull-only session control and all closed external actions.

Do not add a second evidence or release authority. Do not lock physical schemas, numeric budget values, final copy or provider policy at G24.A. G24.B/C must still prove source capability, trusted cutoff, common-root collapse, live contradiction and countercase handling, safe-novel meaning, invalid input, lifecycle transitions, currentness, selector totality and independently observed material effect. G24.D and later gates still own rendered comprehension, capture consent, delivery revalidation, erasure traversal, portability, decision-quality lift and commercial efficacy.

## Owner handoff

`REPAIR`: apply only Repair A and Repair B, freeze new hashes, and rerun the identical tests and a fresh council. No external action opens and no implementation begins on the frozen R3 bytes.
