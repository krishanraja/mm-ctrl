# Concept T: The Wake

**Revision:** T1
**Territory:** Temporal-first
**Artifact state:** Concept only, not rendered and not approved
**Authority boundary:** A self-contained proof may later be rendered from the supplied fixtures. This concept does not authorise production UI, schema, migration, merge or release.

The Wake begins with the decision the user owns now. It then reveals the small sequence of pressure, aim and judgement recorded behind that decision. When the user corrects a judgement, the past remains intact while the future path visibly changes. Only after that value has landed does the user enter the immersive Living Map.

## 1. Governing interaction metaphor

The governing metaphor is **a decision moving through time and leaving a truthful wake**.

The opening surface has one fixed temporal marker labelled **Now**. The current decision sits on that marker, large enough to read in one glance:

> Redesign the work before making any conclusion about the people.

Behind it is a collapsed wake, represented by three quiet beats. It is not a document, a trail to trace, or a miniature graph. Each beat is a recorded moment that can be revealed in order:

1. the pressure that made a decision necessary;
2. the aim that gave the decision direction; and
3. the judgement that constrained how the aim should be pursued.

Ahead of Now is a narrow future channel showing where the current judgement may be used next. This is not a prediction. It contains only known dependency uses or clearly labelled next-work contexts.

The metaphor makes the version model felt without exposing it. A correction does not rub out the wake. It creates a new current judgement at Now and changes the channel ahead. Past decisions and delivered work remain attached to the wording that existed when they were made.

The Living Map is the second mode, not the opening interaction. Once entered, it becomes a full-viewport field of the same accepted entities. The opening decision stays the visual anchor so the transition feels like entering the wider Brain around something already understood.

## 2. Exact first 30-second sequence

**0 to 4 seconds:** The user sees one live decision, the pressure above it in smaller type, and the Now marker. The dominant action is **Show what shaped this**. A quiet line below reads **Private to you**, which is a real audience state, not reassurance.

**4 to 10 seconds:** On tap, the decision stays fixed. The first wake beat appears immediately behind it: **You were trying to build a marketing organisation capable of shaping an AI-native category.** The transition moves once and settles.

**10 to 16 seconds:** A second beat appears: **You had already set this standard: before consequential work ships, the human owns the final judgement and finish.** Its relationship to the aim is named beside it in plain language: **This protects the quality of the category work.** The label is backed by `relation-standard-aim-v1` and never implies more than the recorded `supports` relationship.

**16 to 21 seconds:** The sequence closes at the owned call. A short annotation says **These were recorded with this decision**, reflecting the decision's evidence assertions without claiming an unrecorded causal edge. The dominant action changes to **Check that standard**.

**21 to 26 seconds:** On tap, the standard rises into focus. Its source state is visible in one line: **You said this in an interview, 7 Sep.** Two actions appear: **Still right** and **Too broad**.

**26 to 30 seconds:** The user taps **Too broad**. The surface asks one ordinary-language question: **Where should human final judgement be required?** The first tap option is **Work that leaves the business**. A second option, **Say it my way**, opens voice or text. No map, legend or memory administration appears in the first 30 seconds.

## 3. Where the user has agency

Agency is concentrated at the moments where the user's authority matters:

- reveal or leave the recorded reasoning behind the call;
- inspect the exact source and plain-language relationship explanation;
- affirm the judgement, mark it too broad, or dispute it;
- choose a bounded narrowing in one tap, speak a replacement, or type one;
- inspect the before and from-now-on meanings before committing;
- decide whether to review affected consequential work now or later;
- enter the wider Living Map when they want breadth rather than forcing it on arrival; and
- move through the map by tap, keyboard controls or explicit next and previous controls, with drag available only as an additional path.

CTRL drafts the correction from the user's one-tap choice, but the final **Use this meaning** action belongs to the user. Silence, exposure and navigation never count as approval.

## 4. Primary interaction

The primary interaction is **tap to reveal the next recorded cause or consequence around the current decision**.

It is a stepwise temporal reveal, not scrolling through cards. One tap advances the wake from pressure to aim to judgement to call. Selecting any beat replaces the dominant action with the one thing that can be done there: inspect evidence, correct meaning or return to the call.

The interaction is intentionally asymmetric. The decision at Now holds still while earlier context arrives behind it. During a correction, the past remains still and the future channel changes ahead of it. This makes the product rule legible through behaviour: accepted history is preserved, current understanding can change, and future use follows the new current version.

Voice is offered only inside **Say it my way**. The same correction can always be completed by tap and typing. All input persists with a visible saved state.

## 5. Information structure

The surface has four layers, disclosed in this order:

1. **Now:** one current, human-owned decision and its original pressure.
2. **The wake:** the smallest relevant sequence of aim, judgement, tension or preference recorded with the call. Each relationship is written as a verb phrase such as **protects**, **qualifies** or **is in tension with** only when a current typed relationship supports it.
3. **The forward channel:** known future uses and known affected dependencies. It never presents imagined outcomes as facts.
4. **The wider Brain:** the concise portrait and immersive Living Map, both built from the same projection manifest.

The five human lenses remain available as a compact mode strip after the first sequence: **What matters, How I judge, My calls, Unresolved, What changed**. They are views over the same accepted state, not storage folders. The default lens is **My calls** because this concept begins with the decision.

Evidence inspection is one level deeper than meaning. It shows source type, speaker, date, the source statement and why it is allowed in the current view. Technical identifiers may be present in a secondary proof drawer for the functional proof, but they are not required language for the everyday experience.

The Living Map uses three bounded depths from the contract: orientation, neighbourhood, then item and evidence. It never exposes all records at once.

## 6. State model

The concept treats truth state as behaviour, not decorative badging.

| State | Behaviour in The Wake | Behaviour in the Living Map |
|---|---|---|
| Accepted current | May shape the opening sequence and current future channel | Present as a current eligible entity |
| Proposed | Appears only in a separate **Needs your view** interruption after the main sequence | Excluded from the accepted field; available only in an explicitly provisional review layer |
| Disputed | Removed from current guidance; history remains inspectable | Absent from the current field and visible only through item history |
| Superseded | Anchored to the period and decisions where it applied | Absent from the current field; visible in change history |
| Correcting | The proposed new wording is shown as a before and from-now-on comparison | No map mutation until the user confirms |
| Repaired | Current portrait and map rebuild; consequential uses receive named receipts | Changed current entities move once into their rebuilt state and settle |
| Private audience rejected | No decision, wording, counts or structural clues are exposed; the surface offers account recovery or access request | No field is rendered |
| Loading | The decision frame and Now marker remain, with a restrained progress state | No speculative nodes or links appear |
| Stale | The last verified projection remains readable with an as-of label and a **Refresh before using** action | Interaction that could imply current truth is paused until refresh |
| Recoverable error | Preserved input and the last verified state remain; retry names exactly what failed | The last verified field remains visibly frozen rather than inventing partial structure |

Unsupported relationships never render. Layout tethers are not exposed as semantic lines and never enter an inspector. Distance carries no meaning. Node size represents relevance to the current projection only. Proposed inferred material from LB01 remains omitted from accepted state, and a viewer without the private grant receives no Brain projection as required by LB03.

This state model is feasible in a self-contained proof because LB01 supplies the opening accepted state, LB04 supplies the correction and repair transition, and the remaining fixtures supply deterministic adverse and scale states.

## 7. How portrait and Living Map remain visibly one Brain

The portrait and Living Map share three identity anchors:

- identical wording for every canonical version;
- the same compact kind mark for an aim, standard, preference, tension, context or decision; and
- the same change pulse, used only when a version or relationship has actually changed state.

After the opening wake, **See the whole Brain** changes the mode without changing the selected entity. The decision at Now contracts into the decision entity at the centre of the full-viewport Living Map. The already revealed aim, standard and preference take their positions around it. Only the three current, evidence-bearing relationships in LB01 draw semantic lines. Their plain-language meanings are available on selection, not hidden behind a prerequisite legend.

The wider field feels alive through responsive focus, not ambient animation. Selecting an entity brings its eligible neighbourhood forward and quiets unrelated entities. Newly corrected or repaired entities make one purposeful movement and settle. Reduced-motion mode replaces movement with an immediate state change and a short textual receipt.

Returning to portrait keeps the same entity selected and restores it to the appropriate human lens. Canonical-reference parity is therefore visible as continuity, not merely asserted in copy.

## 8. The correction and repair moment

After **Too broad**, the user chooses **Work that leaves the business** or says the correction in their own words. CTRL drafts this ordinary-language meaning:

> Before externally consequential work ships, the human owns final judgement and finish; reversible internal drafts may remain delegated.

The confirmation surface shows only two blocks:

- **Before:** the previous meaning, labelled **Still part of your history**.
- **From now on:** the narrower meaning, with **Externally consequential** and **Reversible internal drafts** called out as scope and exception.

The dominant action is **Use this meaning**. On confirmation, a single forward pulse begins at Now. The prior standard remains behind Now, attached to the earlier decision. The new standard becomes current ahead of Now. Two relationship statements update in place:

- **Human release judgement protects consequential AI-native category work.**
- **Distinctive human voice remains part of consequential final craft.**

The consequence appears beside the confirmation action, not in a distant summary:

**Changed now**

- Current portrait rebuilt.
- Living Map rebuilt.

**Needs your review**

- Board brief already delivered.
- Brain release already shared.

The receipt says **Nothing already delivered was silently rewritten** and pairs that claim with the two named review-required records. The user can choose **Review now** or **Keep for later**. Repeating the same confirmed correction returns the same receipt rather than creating another change.

On entering the Living Map after repair, the old standard is not a current node. The current standard uses v2, the old semantic relationships have been replaced by their v2 forms, and the unaffected tension relationship remains. History can still show v1 and its exact period of use.

## 9. Sparse and dense Brains

For a sparse first-use Brain with one decision, The Wake still works. It opens on the call and reveals only the recorded beats that exist. Missing beats are not replaced with guesses. If there is no current decision yet, the opening keeps the same temporal frame but asks one question: **What are you deciding now?** The user can choose a recent work context, speak one sentence or type it. This is a decision capture, not a chat thread and not a memory setup flow.

The sparse Living Map treats space as calm focus, not emptiness to disguise. One to five accepted entities occupy a deliberate full-viewport composition with a direct invitation to inspect evidence or add the next owned decision. No completion percentage, memory count or health score appears.

For 120 items and 180 relationships, the opening remains exactly one decision and its bounded wake. Entering the Living Map starts at orientation with at most eighteen current entities. Selecting one enters a neighbourhood of at most twenty-four total entities. The final depth is the selected item and evidence. Search may nominate an entity to focus, but it does not bypass audience, standing, maturity or evidence rules.

Long labels use a two-stage treatment on narrow screens: a meaningful first line with a clear expand action, then the full wording at item depth. No label is reduced to a cryptic taxonomy word. The page remains the only scrolling surface.

## 10. Strongest reason this concept could fail

The strongest failure risk is that the temporal sequence feels persuasive enough to imply causality the contract has not actually established. A polished progression from aim to judgement to call could be misread as a complete explanation of why the person decided, even though the fixture proves recorded inputs and only some typed relationships.

The concept fails if testing shows users saying **CTRL knows why I made that decision** when the evidence supports only **these were recorded with the decision**. The protective rule is strict: every beat must name its evidentiary role, every semantic verb must map to a current relationship, and gaps must remain gaps. The first functional proof should therefore test comprehension of both value and limits, not only whether the sequence feels clear.

A secondary risk is that beginning with one call makes the Brain feel narrower than it is. The transition into the full Living Map must deliver genuine breadth and immersion once the user asks for it, or the concept will feel like decision history with a graph added later.

## 11. Constraints that make it materially distinct

1. **Decision before system.** The first frame is the live owned call at Now. There is no overview, dashboard grid, graph canvas, chat box or quantity summary before it.
2. **Time changes meaning.** Past accepted wording stays attached to past decisions while confirmed corrections alter only the current and future path. A correction can never visually rewrite history.
3. **Causality is earned.** The sequence may use a causal verb only when the contract contains the matching current, typed, evidence-bearing relationship. Recorded co-presence is labelled as recorded co-presence.
4. **The Living Map is a reveal, not scenery.** It receives the user's selected decision and already understood entities only after the temporal interaction. It cannot sit decoratively beside portrait cards.
5. **Motion is a state receipt.** Movement occurs only for reveal, focus, correction, dispute or repair, then stops. There is no perpetual drift, sparkle or simulated thinking.
6. **Consequences split at the point of correction.** Replaceable projections visibly rebuild while delivered work and shared releases stop in a named review queue. This distinction is part of the main interaction, not an administrative log.
7. **Privacy can erase the whole experience.** Without the required audience grant, the surface reveals no decision, map shape, counts or semantic hints.
8. **The interface never asks the user to manage memory.** The available actions are understand a call, inspect why something is present, correct a judgement, review consequences and explore the wider Brain.

The proof passes only if a busy leader can state, after less than two minutes: **what the decision is, which judgement shaped it, what changed after the correction, what stayed historical, and which consequential artifacts now require review.**
