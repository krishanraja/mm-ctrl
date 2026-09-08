# G13 My Brain blinded Judge 2 verdict

**Decision:** Select **Candidate Y** for synthesis.

**Status:** Advisory concept judgment only. This verdict does not authorise material UI implementation, production changes, merge or release.

## Review contract

- **Standard:** `g13-my-brain-sanitized-brief.md` revision 1, SHA256 `E1DDB35799C6D98423F284AA9F09876C80F164A3879BBDA7894747045284FA71`; physical contract SHA256 `D264E010C31D08191B2C30A47B2EC1DAE2366E106FC12524C347E45454011276`; machine contract SHA256 `A045794CD58FE5163DC3A5BDD99650A3C7E6E72DA10F162F30A9154BBD6A2AA7`; proof fixtures SHA256 `C8227EA40414B223DB3479FB6CC68FA99D5DE0DFDC0E6A00E945259113AB0C72`.
- **Submissions:** Candidate X SHA256 `A321C7CCC06BEBEC5C15F3CEDAD7D495371CE0919D054DCC7184CD9E0C59E436`; Candidate Y SHA256 `7078D161866CD59BE6718E34CDA155C252C5C1FA41839C7B71CDCA017891024D`; Candidate Z SHA256 `B1E0A14228071BEF02CD751ED1E752102F018AEA217FEB089E294B80326A27D4`.
- **Mode and independence:** Fresh isolated Judge 2 review. Candidate identities remained X, Y and Z during judgment. No other UI or prototype was inspected, and no communication occurred with another judge.
- **Round 1 comparison set:** A SHA256 `468C4D2D8B01FD9D96F2D1B86CFB05988C537F96D00803C6DE850C9EB8B97F9F`; B SHA256 `82E65E09CBE61EA772739D8216F399D2EF91C0DAEA56AF45F0333EDE410A61D1`; C SHA256 `C78F842A1A7710674E27B987E08E744632A5F9AA4A0DC253552AE183BFD7FE5E`; round 1 verdict SHA256 `DE4658154308E9D893BA12EB9CA63556280B076CF949398A2ED3C7971E63724B`.

## Mechanical checks

PowerShell 7 `ConvertFrom-Json` parsed both named JSON contract files successfully. Each new candidate contains all 11 required concept sections. These checks establish file structure only, not interaction quality or contract compliance. The executable Brain validator was not run because this judgment was intentionally restricted to the named files.

## Weighted score

Scores are raw rubric scores before the hard-failure gate.

| Rubric criterion | Weight | Candidate X | Candidate Y | Candidate Z |
|---|---:|---:|---:|---:|
| Product and value understandable without explanation | 20 | 18.0 | 18.5 | 16.5 |
| Portrait and Living Map feel like one coherent Brain | 18 | 14.5 | 17.0 | 16.0 |
| Correction and repair trustworthy, immediate and consequential | 16 | 15.5 | 15.5 | 15.0 |
| Radically simple under time pressure | 14 | 12.5 | 13.0 | 11.5 |
| Immersive, alive and distinctive | 12 | 11.0 | 9.0 | 12.0 |
| Visual semantics cannot overclaim the data | 10 | 6.5 | 9.5 | 2.0 |
| Sparse, dense and adverse states remain coherent | 6 | 5.5 | 6.0 | 5.5 |
| Feasible with supplied fixtures | 4 | 4.0 | 4.0 | 4.0 |
| **Raw total** | **100** | **87.5** | **92.5** | **82.5** |
| **Hard-failure result** |  | **Eligible** | **Eligible** | **Disqualified** |

## Candidate findings

### Candidate X

**Grade: B+.** It becomes an A if the temporal presentation removes every unsupported causal implication and makes the wake unmistakably a `My calls` portrait projection rather than a third product mode.

The strongest feature is the append-only experience of time. The prior meaning stays behind Now while future use changes, and the correction names rebuilt projections separately from review-required consequential work. This is unusually faithful to the correction contract and emotionally clearer than a version-history panel.

The material weakness is in the opening semantic promise. Section 2, line 32 asks **Show what shaped this**, while line 38 later retreats to **These were recorded with this decision**. The fixture proves that the aim and standard assertions were recorded with the decision, and it proves a `supports` relationship from standard to aim. It does not prove a complete causal chain into the owned call. Candidate X itself identifies this at section 10, line 163. I do not treat this as a formal hard failure because the candidate explicitly limits drawn semantic relationships and labels co-presence as recorded co-presence. It is, however, one wording or animation decision away from the unsupported-relationship hard failure.

Portrait and map unity is also less resolved than in Candidate Y. Section 7, line 107 offers shared identity anchors, but the primary surface is a temporal wake and the portrait arrives as part of the later wider Brain. The concept needs to state that the wake is the `My calls` lens of the portrait and carries the same projection budget and canonical selection, not an additional projection with looser rules.

### Candidate Y

**Grade: A-.** It becomes an A if a functional proof shows that the Connections lens can deliver a genuinely immersive wider field without weakening the fixed-object rule or adding extra panels.

Candidate Y is the best balanced answer to the brief. Section 1, line 5 establishes one fixed judgement across Portrait, Connections, Sources and Consequences. Section 4, line 43 makes the primary interaction literal: **change the lens, not the object**. This gives the user immediate ownership, preserves canonical continuity without explanation and avoids forcing spatial navigation on a busy phone user.

Its correction model is strong and correctly bounded. The current wording remains visible, the effect preview separates updates from human-review dependencies, only the two affected relationships are replaced and the Consequences lens returns four terminal receipts. Proposed, disputed, stale, private and failure states change both visibility and available action rather than merely adding badges.

No invariant regression or brief hard failure was found. Its weakest rubric area is the intended emotional effect. Four labelled lenses can become an elegant tabbed inspector, and section 10, line 123 correctly admits that one fixed judgement may feel too narrow or arbitrary. This risk is testable without altering the spine.

### Candidate Z

**Grade: Disqualified, despite an 82.5 raw score.** It becomes eligible only if the opening relationship endpoint is corrected to match the fixture, followed by a cold test showing that proximity and prominence are not read as meaning.

Candidate Z is the most immersive and the cleanest spatial-first proposal. Its focus-hopping interaction, direct map entry, bounded semantic zoom and Find fallback make agency materially different from the other candidates. The correction and adverse-state coverage are otherwise strong.

It contains a hard failure in the exact first 30 seconds. Section 2, line 21 says the standard is **connected to the current decision with the verb supports**. LB01 defines `relation-standard-aim-v1` from `item:item-standard@v1` to `item:item-aim@v1`, not to `decision:decision-marketing-1` (`g13-living-brain-proof-fixtures.json`, lines 415 to 426 and 574 to 598). Candidate Z then contradicts its own opening at line 23 by calling it the relationship to the marketing aim. As written, the first frame renders a semantic relationship for which no current typed relationship version exists.

That is an unsupported semantic relationship and regresses the contract's `RELATION_EVIDENCE_REQUIRED` boundary. It also breaks the candidate's own promise that only the three LB01 relationships are drawn. The hard-failure gate overrides its raw score. Its stated spatial-overclaim risk at section 10, line 130 remains real even after the endpoint defect is fixed.

## Hard failures and invariant regressions

| Candidate | Unsupported semantic relationship | Other hard failure | Invariant regression | Result |
|---|---|---|---|---|
| X | No formal failure, but causal framing is dangerously close | None found | None found | Eligible with semantic guardrail |
| Y | None found | None found | None found | Eligible |
| Z | Yes, `standard -> decision` is shown as `supports` without a matching relationship version | None additional | Regresses the requirement that a visible relationship be current, typed and evidence-bearing | Disqualified |

No candidate uses chat as the default, turns memory administration into the main job, styles proposals as accepted truth, depends on drag or voice alone, hides correction consequences or exceeds the stated authority boundary.

## Is any candidate disguised repetition of rejected round 1?

**No.** All three retain necessary invariant patterns from round 1, such as one dominant action, evidence before correction and in-place consequences. Those are brief requirements, not conceptual repetition.

- Candidate X replaces the folded portrait sequence with a decision-centred temporal wake, keeps the map until later and makes past versus future the state mechanic.
- Candidate Y keeps one object fixed while mutually exclusive lenses change around it. It does not unfold, open an atlas or trace a page.
- Candidate Z begins inside a freely navigable map and uses focus hopping. It does not begin with portrait selection or a folded object.

Candidate Y is superficially closest to round 1 because the same selected item persists across depths, but its agency, primary interaction, information structure and state transitions are fixed-lens inspection rather than open-and-trace progression. It is not disguised repetition.

## Pairwise diversity

Shared truth states such as accepted, proposed, disputed and stale are mandated by the contract and do not count as sameness. The comparison concerns the interaction-specific state model.

| Pair | Sequencing | Agency | Primary interaction | Information structure | State model | Result |
|---|---|---|---|---|---|---|
| X vs Y | Decision wake then correction then wider Brain vs fixed judgement then chosen lenses | Guided temporal reveal vs user-selected lens and focus | Advance recorded beat vs change lens | Now, wake, forward channel, wider Brain vs scope, fixed point, lens field, action edge | Past/current/future anchoring vs stable object with exclusive projections | **Pass, 5 of 5 axes differ** |
| X vs Z | Map deferred until after temporal value vs map on first frame | Guided reveal vs free focus, pan and Find | Advance beat vs focus hop | Temporal chain and future uses vs full spatial field | Time-bound version transition vs orientation/neighbourhood/item depths | **Pass, 5 of 5 axes differ** |
| Y vs Z | Portrait lens around a fixed statement vs direct spatial field | Lens choice around one object vs lateral exploration across objects | Change lens vs focus hop | One fixed point with four fields vs persistent map field with focus sentence | Lens replacement while object holds vs field recentering and semantic zoom | **Pass, 5 of 5 axes differ** |

The round 2 set passes the pairwise diversity requirement.

## Useful round 1 strengths to restore without copying it

Three rigorous safeguards from round 1 were weakened or omitted and should return as contract responses, not as fold, page, atlas or trace mechanics:

1. **Parity failure must stop the transition.** Round 1 Candidate A, section 7, line 165 keeps the current portrait visible and refuses to open a partial map when parity fails. Candidate Y should apply the same rule to a failed Portrait-to-Connections switch, with no fold metaphor.
2. **Incomplete repair needs an explicit state.** Round 1 Candidate A, section 8, line 180 says **Repair incomplete** and names any dependency without a terminal receipt. Candidate Y currently describes the successful four-receipt case but should specify this failure branch in Consequences.
3. **A non-spatial escape route should always exist.** Round 1 Candidate A, section 3, line 88 supplies an always-available ordered list, while Candidate C, section 9, line 198 gives long mobile meanings full-width treatment. Candidate Y should add a plain-language Find or ordered list inside Connections and preserve full relationship sentences in the reading order. This restores accessibility and dense-state control without recreating an atlas.

## Winner and bounded synthesis borrow

**Winner: Candidate Y.** It is the clearest expression of one Brain across portrait, relationship, evidence and consequence, and it carries the lowest credibility risk under the two-minute mobile scenario.

Borrow only these bounded elements:

- From Candidate X, borrow the labels **Before** and **From now on** inside Candidate Y's existing correction preview. Do not borrow the wake sequence, causal framing or delayed-map structure.
- From Candidate Z, borrow **Find in my Brain**, **Return to current focus** and one brief settling transition when Connections opens on a larger field. Do not borrow map-first entry, free panning as the default or any endpoint not present in LB01.
- From round 1, restore the parity-stop, incomplete-repair and ordered non-spatial fallback rules listed above. Do not restore folds, pages, paper, atlas language or open-and-trace sequencing.

## Preserved dissent

Candidate X has the strongest emotional account of append-only correction. If its unsupported causal implication is removed and the wake is explicitly constrained as the `My calls` portrait lens, it could outperform Candidate Y on emotional resonance and consequence comprehension.

Candidate Z is the strongest expression of an alive Living Map. A corrected endpoint would remove the immediate hard failure, but the spatial-semantic risk would still require unusually convincing cold-test evidence before it should beat Candidate Y.

## Strongest failure risk

Candidate Y may become a polished four-tab inspector that technically preserves truth but fails the brief's demand for an immersive, alive and emotionally resonant Brain. The decisive proof question is whether a cold mobile user can switch to Connections, feel that the same judgement has opened into a wider living system, and reach another meaningful item without perceiving an arbitrary starting point or a generic tabbed detail view. If that fails, the synthesis should not add spectacle. It should either import the bounded full-field transition from Candidate Z or reconsider Candidate X after its semantic framing is repaired.

## Owner decision

Advance Candidate Y to functional synthesis with the bounded borrows and three restored safeguards above. Candidate Z is not eligible in its current wording. Candidate X remains the credible dissenting alternative. Krish retains the final decision on synthesis and any later implementation gate.
