# G13 concept A: The Fold

**Concept status:** Independent interaction spine for a functional proof. Not a rendered design or implementation specification.

## Governing interaction metaphor

The Brain is a pocket field map that opens from the decision in front of you.

The concise portrait is the map while folded. It exposes only the few landmarks useful to the current decision. The Living Map is that same object unfolded, with the same items retaining their wording, identity and visual treatment as more context becomes available. There is no jump from a dashboard to a separate graph.

The fold is informational, not decorative. Each opening reveals one further level of truth: current judgement, a supported connection, then the source and change history. Spatial position helps navigation only. A line carries meaning only when it is a current, typed, evidence-bearing relationship.

## State of use

A leader opens the Brain on a 390 by 844 pixel phone between meetings. The page is already focused on the consequential marketing decision in the fixture. The first view requires no scrolling and presents one dominant action. Deeper evidence may use the page's natural scroll, never a scroll region inside a panel.

## The exact first 30 seconds

### 0 to 4 seconds: orient

The closed map fills the frame. Its cover reads **My Brain, for this marketing decision** and states the owned call:

> Redesign the work before making any conclusion about the people.

Immediately beneath it, one sentence explains what the Brain is contributing now:

> Your release standard is helping protect the quality of this call.

The only dominant control is **Open the connection**. A quiet line states the audience and freshness in plain language: **Private to you · current 8 Sep**. It is useful state, not reassurance.

### 4 to 10 seconds: recognise the judgement and connection

One tap unfolds the cover into two joined panels. The left panel is the current standard:

> Before consequential work ships, the human owns the final judgement and finish.

The right panel is the aim:

> Build a marketing organisation capable of shaping an AI-native category.

A route joins them and labels itself at the point of connection:

> **Supports** · Human release judgement protects the quality of AI-native category work.

The route is the fixture's current `supports` relationship, not a proximity inference. A secondary control on the standard reads **Why this is here**.

### 10 to 16 seconds: inspect the source

Tapping **Why this is here** lifts a narrow source flap directly beneath the standard. It says **You said this in an interview · 7 Sep** and shows the supporting assertion verbatim. It also shows **Trusted · confirm before consequential use** in ordinary language as **You confirmed this, and CTRL must check with you before using it on consequential work**.

The action beside the wording is **This is too broad**.

### 16 to 23 seconds: correct in ordinary language

Tapping **This is too broad** replaces the source flap with one question:

> What should require your final judgement?

The first answer is a large tap target: **Externally consequential work**. A second control, **Say it another way**, opens voice and text as equal alternatives. Nothing depends on voice.

After the first tap, the exact revised meaning appears in place, not in a distant summary:

> Before externally consequential work ships, the human owns final judgement and finish; reversible internal drafts may remain delegated.

The dominant control becomes **Make this my current standard**. The prior wording remains visible below as **Current wording being replaced**.

### 23 to 30 seconds: see the consequence

On confirmation, the standard panel turns over like one leaf of the map. The revised wording occupies the same landmark. The two affected routes redraw and relabel against the new version. A compact receipt opens from the same panel:

- **Updated now:** this portrait and the Living Map
- **Needs your review:** the board brief and the shared release

Nothing says the delivered work was fixed. **Review affected work** becomes the next dominant action. The prior wording is available under **See what changed**.

Reduced-motion mode replaces folding, turning and route drawing with immediate state changes and a short focus-preserving crossfade.

## Where the user has agency

The product chooses a relevant starting point from the supplied task context, but the user controls every semantic commitment.

1. They open or ignore the offered connection.
2. They inspect the evidence before changing anything.
3. They choose a narrow structured correction or provide their own ordinary-language correction by voice or text.
4. They see the complete replacement wording before accepting it.
5. They explicitly make the new version current.
6. They decide when to review affected consequential work. CTRL may flag it, but cannot rewrite it.
7. At any map level, they can choose another landmark by tap, keyboard, or an always-available ordered list. Dragging may reposition the view but is never required.

## Primary interaction

The primary interaction is **tap to unfold around one chosen landmark**.

Each tap expands the same physical surface by one semantic level:

1. folded portrait;
2. one explained relationship;
3. the selected item's neighbourhood;
4. item, evidence and change history.

Back reverses one fold and restores focus to the control that opened it. This creates progressive disclosure without a legend, inspector maze or separate detail page.

## Information structure

### Folded portrait

The portrait has five labelled map folds: **What matters**, **How I judge**, **My calls**, **Unresolved** and **What changed**. They are lenses over the same accepted items, not exclusive storage areas. The current decision determines which fold faces the user first. No more than twelve items can appear across the folded portrait, but the mobile first frame shows one call, one relevant judgement and one next action.

### Connection fold

Opening a connection reveals only relationships attached to the selected item. Every semantic route prints its relationship verb and plain-language explanation directly on the route. The user never has to decode colour or consult a graph legend. Relationship evidence is one tap away from its label.

### Unfolded Living Map

The orientation view contains at most eighteen eligible current entities. Selecting a landmark unfolds its neighbourhood, capped at twenty-four entities including the selected item. Selecting again opens the full item and evidence level: meaning, where it applies, exclusions, exceptions, sources, relationship explanations, version history and correction.

Node shape distinguishes a Brain item from a first-class decision. Within Brain items, a small written kind label such as **standard** or **aim** does the work of classification. Size communicates relevance to this selected decision only. Distance and placement carry no semantic meaning. Non-semantic layout tethers are not drawn as routes and never enter the relationship view.

### The margin

Proposed and disputed material lives on a physically separate margin reached through **Needs a decision**. It uses unfinished outlines, explicit state words and no accepted-state routes. The proposed pattern from the fixture appears only here as **Suggested, not part of your Brain yet**. A disputed item is inspectable in history but cannot appear in the folded current portrait or steer the current map.

## State model

### Navigation state

- `folded_portrait`: the decision-focused current portrait.
- `connection_open`: one selected item pair and one or more labelled, supported relationships.
- `orientation`: up to eighteen current entities.
- `neighbourhood`: selected entity plus up to twenty-three eligible neighbours.
- `item_and_evidence`: one entity with applicability, evidence, exceptions, history and correction.

### Truth state

- `accepted_current`: eligible held or trusted state, rendered as solid map material.
- `proposed`: isolated in the margin and explicitly awaiting a decision.
- `disputed`: absent from current guidance, available only through unresolved or history inspection.
- `superseded`: visible only in change history, never as a current landmark or route endpoint.
- `private_rejected`: no item names, counts, silhouettes or topology are exposed.

### Correction state

- `editing`: prior wording is preserved while a replacement is drafted.
- `preview`: complete proposed wording and scope are visible before acceptance.
- `applying`: the chosen control is busy and duplicate submission is disabled while the idempotent correction resolves.
- `rebuilt`: portrait and map now use the new canonical version.
- `review_required`: consequential outputs remain unchanged and are listed beside the correction.
- `recoverable_failure`: prior accepted state remains current, the draft persists, and retry is available.

### Projection state

- `loading`: the folded map skeleton shows no invented labels or routes.
- `current`: the audience and as-of state are visible in plain language.
- `stale`: the last verified map remains readable with **May be out of date**, its timestamp and **Refresh** at the same point.
- `recoverable_error`: the last verified state remains clearly dated, with retry and no claim that the Brain is current.
- `empty_authorised`: a single blank fold asks for one recent decision or judgement by tap, voice or text. It does not show a completion score.
- `private_rejected`: a closed surface states that this Brain is not available in the present audience context and offers only a route back.

## How portrait and Living Map remain visibly one Brain

The Living Map is revealed by unfolding the portrait, not by navigating to another product mode. An item preserves the same wording, kind label, physical mark and change state through every level. The decision-focused portrait is therefore a cropped, folded projection of the same canonical references shown in the map.

During the unfold, the visible portrait landmarks move into their map positions while any additional eligible landmarks enter at the new edges. The selected item never disappears. A quiet **Same Brain · wider view** label is present only during the transition. This makes parity perceptible without exposing canonical reference syntax or a technical manifest.

If the projector returns a parity failure, the unfold does not proceed. The current portrait remains visible with a recoverable error. The interface never tries to hide the mismatch with a partial map.

## The correction and repair moment

The corrected standard keeps its stable landmark but visibly becomes a new leaf. **See what changed** places old and new wording in reading order, with the narrowed condition and new exclusion called out in words. The old leaf is labelled **Replaced 8 Sep** and cannot be selected as current guidance.

The existing `supports` and `qualifies` routes do not silently survive. They disappear during `applying` and return only as their fixture-backed replacement versions with revised explanations. The unaffected tension relationship remains unchanged.

The repair receipt sits on the corrected landmark because that is where the user acted. It reports all four known dependencies:

- portrait rebuilt;
- map rebuilt;
- board brief requires review;
- shared release requires review.

If any dependency lacks a terminal receipt, the state reads **Repair incomplete** and names the unresolved dependency. The new standard may be recorded, but the interface cannot present the repair as complete.

## Sparse and dense Brains

### Sparse first use

The fold count does not change. Empty lenses simply stay folded and quiet. The strongest accepted item receives enough space to be read as a real judgement, not as one lonely tile in an empty dashboard. The next action asks for one recent decision because decisions naturally yield aims, standards, tensions and evidence without asking the user to administer memory.

### Dense state at 120 items and 180 relationships

The product never renders the whole Brain as a hairball. The folded portrait remains capped at twelve and starts with the decision-relevant subset. Orientation remains capped at eighteen. Neighbourhood remains capped at twenty-four. A deterministic **Elsewhere in this Brain** index lets users jump by the five human lenses and search plain-language meanings without changing the truth set.

Long labels wrap to natural card height. The page may lengthen at the item and evidence level, but no component scrolls internally. On desktop, unfolding uses the extra width to keep the selected route and evidence in view. On mobile, the same semantic order becomes a vertical sequence with route labels placed between their endpoints. Keyboard focus, reading order and screen-reader relationship text follow that sequence rather than the decorative coordinates.

## Adverse and boundary states

- An unsupported relationship never produces a route. The two items may both be present, but spatial proximity is left unexplained and carries no claim.
- A viewer without the private audience grant sees no Brain content or content-derived counts.
- Proposed inferred learning can appear only in the explicit margin, never in the folded portrait, current route network or task guidance.
- A disputed or superseded version can be found through history but cannot steer the current experience.
- On a narrow screen, route labels become full-width sentences between stacked endpoints so meaning is not lost to cramped linework.
- All actions have visible focus, at least one non-drag path and one non-voice path. State is not conveyed by motion, colour, position or size alone.

## Feasibility with the supplied fixtures

LB01 supplies the six portrait and map entities and three semantic routes needed for the complete first sequence. LB04 supplies the replacement wording, two replacement relationships and four repair outcomes for the correction moment. LB03 drives the private-rejection state. LB05 and LB06 drive the disputed and proposed margin treatments. LB07 proves the three unfolding budgets at representative scale. LB02 and LB08 prove that unsupported links and layout tethers never become visible semantic routes.

A self-contained HTML proof can express the fold states, deterministic fixture views, tap and keyboard transitions, route labels, correction preview and repair receipt without a production schema or graph engine. Motion is an enhancement to state continuity, not a functional dependency.

## Strongest reason this concept could fail

The physical folding metaphor could become theatrical and delay comprehension, especially on a narrow phone. If a user notices the paper mechanics before recognising their judgement and the supported connection, the concept has failed its main job.

The falsifiable test is whether a cold user can identify the current call, repeat the standard, explain the supported connection and find its source within thirty seconds without instruction. If the fold animation or vocabulary lowers that rate, remove the simulated depth and retain the same reveal sequence as immediate planar expansion.

## Constraints that keep it materially distinct

1. **One object, two depths.** Portrait and map must be the folded and unfolded states of the same surface. They cannot become a card dashboard beside an unrelated network view.
2. **One landmark drives the sequence.** The user opens context around a selected judgement. They do not begin with filters, metrics, administration or a chat prompt.
3. **Every visible route speaks for itself.** A semantic connection must print its type and fixture-backed explanation at the connection. Colour, distance and a legend cannot carry the claim.
4. **Correction changes the object in place.** The current landmark turns into a new version, affected routes are visibly replaced, and downstream consequences appear beside the action. A toast or remote activity log is insufficient.
5. **Provisional thought stays on the margin.** Suggested and disputed material is spatially and verbally outside accepted current judgement, even when it is useful to inspect.
6. **Density is handled by refolding, not zooming out.** The system reveals bounded relevant subsets and an ordered index. It never celebrates the total graph or asks the user to navigate a full network.

## Concept call

Use The Fold as a proof of whether one Brain can feel intimate, alive and trustworthy through continuity rather than spectacle. Its sharpest bet is that the moment of unfolding makes the relationship between portrait and map instantly self-evident. The counterpoint is that physical metaphor is unforgiving: if the first reveal takes longer than the value it delivers, it must collapse to the same sequence without the theatrical motion.
