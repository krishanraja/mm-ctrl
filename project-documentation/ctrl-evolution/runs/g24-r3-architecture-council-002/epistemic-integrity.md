# Epistemic Integrity sealed review

**Run:** `g24-r3-architecture-council-002`  
**Specialist:** Epistemic Integrity  
**Verdict:** `VETO`

## Review contract and independence

- **Standard:** `g24-r3-architecture-recheck-v1`, accepted, owner `CTRL permanent council contract`, fresh 12 September 2026, SHA-256 `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858`.
- **Mode:** fresh isolated specialist pass. The standard was read and hash-verified before any submission artifact. R1, then R2, then R3 were read in Pack A order.
- **Exclusions:** I did not open `runs/g24-r2-architecture-council-001/`, `judge-history/`, any other specialist output, builder commentary, founder prediction or conversation history. References to prior review inside the frozen R3 artifacts were treated as inert claims and were not followed.
- **Authority:** local review record only. The sole authorised write is this file. No external research, model spend, customer-data action, message, database action, deployment, merge, release or other external action was performed.
- **Current-fact boundary:** the evidence note's externally derived claims remain explicitly unverified and non-normative. This review tests only the frozen architecture.

## Mechanical

PowerShell `7.6.5` `Get-FileHash -Algorithm SHA256` was run against every frozen artifact named in the brief. Every expected hash matched the bytes read:

| Artifact | SHA-256 | Result |
|---|---|---|
| `standard.md` | `67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858` | match |
| `g24-product-system-blueprint.md` | `2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a` | match |
| `g24-product-system-contract.json` | `16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba` | match |
| `g24-product-system-qa-record.md` | `e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731` | match |
| `g24-product-system-blueprint-r2.md` | `52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980` | match |
| `g24-product-system-contract-r2.json` | `1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2` | match |
| `g24-product-system-r2-delta.json` | `d67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2` | match |
| `question-and-enrichment-evidence-2026-09-12.md` | `c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb` | match |
| `g24-product-system-blueprint-r3.md` | `446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5` | match |
| `g24-product-system-contract-r3.json` | `5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09` | match |
| `g24-product-system-r3-delta.json` | `c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb` | match |

PowerShell `ConvertFrom-Json` parsed `input-manifest.json` and all five frozen contract/delta JSON files without error. A deterministic property check found no `epistemic_policy_ref` in inherited integrity, no epistemic-policy input to the selector and no live-countercase input to the selector. Mechanical checks establish identity, parseability and field presence only; they do not establish semantic truth.

## Strongest part attacked

I attacked the apparently strongest seam: R3 `Repair 1: close every R2 object onto R1` together with `Repair 3: one total route-selection boundary`. It correctly maps each R2 object to one R1 owner, derives effective state from canonical references, names source capability, trusted cutoff, provenance roots, contradiction, sufficiency, causal standing and applicability, rejects first arrival, and gives trusted code the final selector transition. Those are substantial controls.

The attack still succeeds. The architecture does not identify a trusted, versioned producer or policy for the semantic outcomes the selector consumes, does not bind a live countercase to selection, and contains a conflicting non-hold outcome for bad inputs.

## Criterion

### Epistemic Integrity: `breaks`

**Rule:** `standard.md` section `Epistemic Integrity` and current-gate conditions 1, 3 and 5. Every decision-shaping claim must earn standing from capable attributable evidence under a trusted cutoff, visible uncertainty, contradiction and a live countercase; similarity, copied labels and model confidence cannot upgrade standing or causality. The selector must be trusted, total and fail closed.

#### EI-V1: decisive epistemic predicates are fields without a trusted semantic owner

**Exact evidence and locator:**

- `g24-product-system-blueprint-r3.md`, `Repair 1: close every R2 object onto R1`, lines 55-88: every use records `source capability`, `root provenance when independent corroboration is required`, a `sufficiency rule and result`, `causal standing` and why an item is applicable. The text says these are recomputed, but does not state who or what authoritative policy determines them.
- `g24-product-system-contract-r3.json`, `/inherited_integrity/use_specific_semantics`: the same concepts are enumerated as `source_capability`, `independence_requirement`, `sufficiency_rule`, `sufficiency_result`, `causal_standing` and `applicability_result`.
- `g24-product-system-contract-r3.json`, `/inherited_integrity/controlling_references` and `/intervention_selector/inputs`: neither array contains a versioned epistemic-policy reference or a current independent-countercase reference.
- `g24-product-system-contract-r3.json`, `/intervention_selector/trusted_code_validates_references_precedence_and_transition`: trusted code is required to validate references, precedence and transition, but no rule binds it to validate the provenance and authority of the semantic results themselves.
- `g24-product-system-contract-r3.json`, `/intervention_selector/source_eligibility_before_burden`: `counterevidence_treatment` is named, but no live countercase, current challenger version or explicit `none found within <search boundary>` result is required.

**Finding:** the architecture protects canonical object identity but leaves the meaning-producing seam open. An implementer must decide who may set source capability, when independent roots are mandatory, where the trusted cutoff comes from, what counts as sufficient or applicable, how an association may be used, and what qualifies as a live countercase. Those are consequential semantic choices at G24.A, not physical-schema or later empirical-proof details. A model can propose the labels, and trusted code can validate only that the references and fields exist. The resulting copied labels can therefore award effective decision standing despite the prose prohibition.

**Credible failure path:**

1. One canonical article and two syndicated copies share a provenance root; a prior Brain item is textually similar but scope-mismatched; one current contradicting assertion exists.
2. A model-authored coverage candidate sets `independence_requirement=false`, `source_capability=capable`, `sufficiency_result=true`, `causal_standing=association` and `applicability_result=true`, and omits any live independent countercase result.
3. The trusted application verifies that referenced records exist, follows the declared precedence and accepts the internally consistent labels. This satisfies every validation duty expressly assigned to trusted code.
4. The selector returns `reuse` or `enrich`, and the association or scope-mismatched prior changes the decision route. Similarity and model-selected epistemic labels have upgraded standing while common-root support and the live contradiction remain materially unresolved.

**Smallest sufficient repair:** add one canonical, versioned `epistemic_policy_ref`, owned through an existing R1 governance authority and never authored or promoted by a model, to inherited controlling references, selector inputs, output watermarks and invalidation triggers. The referenced policy must bind: claim-kind-to-source-class capability; trusted-cutoff derivation and comparison; when independent provenance roots are mandatory; sufficiency and applicability predicates; causal-promotion requirements; and a current live-countercase/contradiction result. Models may propose evidence and labels, but only policy evaluation may produce selector-eligible results. A missing, unknown, stale or inapplicable policy, or an indeterminate predicate, must yield `abstain_hold`. This repairs semantic ownership without locking physical field names, numeric thresholds or provider choices.

**Resolving test, to be used identically for repair recheck:** freeze one selector fixture containing one source plus two same-root syndications, one scope-mismatched but semantically similar Brain item, one live contradicting assertion and model-authored `capable/sufficient/applicable` labels. Omit the current `epistemic_policy_ref` and current countercase result. The only accepted output is `abstain_hold` with no downstream eligible derivative. Rerun the identical bytes with a current policy whose independence and applicability rules reject the model labels; the output must remain `abstain_hold`, and changing only model confidence or labels must not change it. Changing the policy version must invalidate the prior selector result.

#### EI-V2: fail-closed prose and machine contract disagree

**Exact evidence and locator:**

- `g24-product-system-blueprint-r3.md`, `Repair 3: one total route-selection boundary`, line 208: bad input returns ``abstain_hold` or a typed provisional result`.
- `g24-product-system-contract-r3.json`, `/intervention_selector/outputs`, `/intervention_selector/total_for_invalid_missing_stale_ambiguous_and_contradictory_input` and `/intervention_selector/fail_closed_output`: the only declared fail-closed result is `abstain_hold` among five exact outputs.

**Finding:** `typed provisional result` has no defined route, eligibility, authority, expiry or prohibition on decision use. The prose permits it while the machine contract excludes it, and the pack declares no precedence rule between the two artifacts. An implementer can satisfy one frozen artifact while violating the other's fail-closed semantics.

**Credible failure path:** on stale or contradictory evidence, an implementation returns a provisional `reuse` or `enrich` result and allows it to shape preparation because no contract says a provisional result is non-actionable. The machine implementation still exposes one of the five route names, while relying on the blueprint's express alternative to a hold.

**Smallest sufficient repair:** replace the quoted alternative with an unconditional `abstain_hold`. If provisional diagnostics are useful, define them only as non-actionable fields on the hold receipt, never as a selectable or persistable route. Mirror that invariant in both prose and machine contract.

**Resolving test, to be used identically for repair recheck:** submit five frozen selector cases differing only in one defect: missing, stale, ambiguous, contradictory or invalid controlling input. Every case must return exactly `abstain_hold`; no case may emit an eligible `reuse`, `enrich`, `ask` or `session`, create approval state, or persist a decision-shaping derivative. The same test must fail any implementation exposing a provisional route outside the hold receipt.

## Current-gate defects versus later proof

**Current G24.A defects:** EI-V1 is a missing semantic-authority binding; EI-V2 is an internal fail-closed contradiction. Either permits an implementation that conforms to the written candidate while making an unsafe product-defining choice. Both must be repaired before architecture lock.

**Later proof needs, not additional G24.A vetoes:** after the repaired authority binding exists, G24.B/C must still prove exact schema and validators, trusted-clock and cutoff attacks, same-root collapse, stale and cross-case reuse, contradiction and countercase freshness, causal-standing attacks, malformed and safe-novel inputs, and total fail-closed execution. G24.F/G must still establish real decision-quality lift. None of those empirical results is falsely required from this document gate.

## Preserved boundaries

The R1 object ownership map, canonical-reference-only effective state, first-arrival prohibition, common-root collapse requirement, public/private reuse boundary, correction and permission invalidation, and explicit `Question Yield` uncertainty are retained strengths. The R3 contract keeps all external actions closed, including production write, customer data, account creation, external research, model spend, email/customer contact, session scheduling or capture, connector or database-branch creation, deployment, merge, feature enablement, release and legacy deletion. This veto grants no authority to open any of them.

## Owner decision and handoff

`VETO`: repair EI-V1 and EI-V2, freeze new hashes, and rerun this criterion against the identical resolving tests. No ledger write is authorised or proposed. Council adjudication and the founder retain the downstream decision.
