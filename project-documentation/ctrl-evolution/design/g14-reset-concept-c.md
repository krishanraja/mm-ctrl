# G14 reset concept C: Decision Watershed

**Concept revision:** C-01
**Evidence boundary:** Reset brief only
**State of use:** Private desktop preparation between meetings or before a consequential customer session
**Materiality:** Material interaction concept
**Authority:** Concept document only. No implementation, production change or durable Brain write is authorised
**Approval state:** Proposed and unrendered
**Downstream owner:** Design synthesis and, if selected, one rendered desktop frame
**Pending action:** Test whether the frame communicates the focus, its basis and the next inspection within five seconds

## 1. The Decision Watershed

The Brain is a living terrain shaped by its own typed, directional relationships. The current intervention is the watershed outlet and the one fixed centre of gravity. Brain objects sit upstream or downstream according to relationship direction. Evidence is anchored at the exact relationship it supports. Current interpretations occupy the active ground. Weaker, superseded and rejected interpretations remain visible on a lower history contour, but no route to action can travel through them.

The operator does not open sections or read a report. They move an **attention lens** across the terrain. The lens snaps to a Brain object or relationship and exposes the connected route: what feeds this belief, where it points, what evidence holds it up and where certainty breaks. The first unresolved relationship on the route becomes a clearly labelled **decision gap**. That gap, not a summary panel, reveals the next inspection.

Spatial meaning is fixed and learnable:

- Nearness means relationship distance from the current intervention, never importance.
- Arrowheads mean relationship direction.
- Line pattern and a written label mean relationship type.
- Mint marks the currently supported answer.
- Amber marks something changed, superseded or rejected.
- An open cream line labelled **uncertain** means the relationship is not secure enough to guide action.
- A low, dim contour contains history. It can be inspected but cannot join the active route.

The terrain may breathe very slightly when evidence or state changes, but meaning never depends on motion.

## 2. The first five seconds

At first paint, the operator sees the customer's name, the private boundary and one plain sentence naming the current intervention. The current intervention is already in the lens. No welcome copy, setup step or animation delays it.

The active route is visible immediately. One mint-supported path shows why the present interpretation is credible. The path stops at an open relationship labelled with its type and **uncertain**. At that break, a short instruction reads: **Inspect this gap next**. Beside it sits the actual next move from the fixture when one exists. If the fixture contains no next move, the surface says **No next move recorded** and offers only **Inspect the relationship**.

Within five seconds the operator should be able to say:

1. This is the decision we are preparing for.
2. This is what the Brain currently believes and why.
3. This relationship is not secure yet.
4. This is the next thing to inspect.

## 3. The desktop field

### Frame specification at 1440 by 900

- **Outer frame:** 24 px inset on all sides, deep ink ground, no page scroll at the target viewport.
- **Identity rail:** 56 px high. Left: customer and current intervention. Centre: fixture freshness. Right: **Private view** and the projection boundary status. The intervention remains named here while the terrain moves.
- **Working field:** 724 px high in two regions separated by a 16 px rule gap.
- **Terrain:** 920 px wide. It contains the fixed current-intervention anchor, the relationship field, the attention lens and the inline decision gap. The default route fits entirely in view. A larger Brain may be panned without moving the current intervention out of its home marker.
- **Section cut:** 456 px wide. This is a vertical instrument readout, not a stack of cards. It shows the selected relationship statement, type and direction, current interpretation, uncertainty, supporting evidence and provenance in one aligned cut through the terrain.
- **Command rail:** 40 px high beneath the field. It carries the relationship key, keyboard commands and the view-only status of the current selection.

The primary view has three simultaneous layers:

1. **Current route:** the minimum connected path needed to understand the intervention.
2. **Decision gap:** the first active-path relationship that is uncertain, lacks inspectable support or leads only to a non-current interpretation.
3. **Section cut:** the evidence and provenance for the object under the lens, aligned to the decision gap so the verdict sits where the operator acts.

All other Brain material is present as quiet topography. It gains legibility only when the lens approaches it. This preserves the sense of a living whole without making the operator decode the whole graph.

There are no KPI tiles, activity feeds, task columns, lesson progress bars or chat composer. Headings name the selected object: **Relationship**, **Evidence**, **Provenance**, **Uncertainty**, **History** and **Next inspection**.

## 4. Evidence, uncertainty and the next inspection

Evidence does not live in a detached library. Each evidence marker is attached to the relationship or interpretation it supports. Selecting a relationship highlights its evidence markers on the terrain and opens their source details in the section cut. Each confident meaning therefore has an inspectable path to provenance.

Uncertainty changes the route rather than merely adding a badge. An uncertain relationship is open, cannot carry the mint answer forward and stops the active path. The stop is the decision gap. The operator can inspect evidence on either side, compare the current and historical interpretations, and then return to the gap without losing context.

The next move obeys a strict display rule:

- If the fixture provides a next move connected to the selected gap, show it verbatim at the gap.
- If it does not, show **No next move recorded** and make the next interface action **Inspect the relationship**.
- Never generate business advice from graph shape alone.
- Never present an action supported only by a superseded or rejected interpretation.
- If evidence is missing, stale or errored, name that state beside the action and withhold any ready-to-act treatment.

This makes uncertainty operational. It controls what can appear as supported, while still leaving the operator free to inspect every relevant object.

## 5. Inspecting the Living Brain

The attention lens is the primary control. Pointer users drag it across the field. It snaps to the nearest object or relationship and draws only the connected route. A click pins the selection. Wheel or trackpad movement pans the terrain only when the Brain exceeds the field.

The complete non-drag path is always available:

- **Tab** enters the terrain and then reaches the section cut and rails.
- **Arrow keys** move along relationship direction. Left and right follow incoming and outgoing links. Up and down move between sibling links.
- **Enter** pins or unpins the selected object.
- **H** reveals or hides the history contour.
- **Escape** returns the lens to the current intervention.

Touch uses the same model: drag the lens, tap to pin and use visible previous and next relationship controls as the reliable alternative.

Selecting a typed relationship shows its label and arrow at full contrast, then reveals its evidence anchors. Selecting an evidence anchor shows source and provenance. Selecting a current interpretation shows the weaker or superseded interpretation directly below it on the history contour, with the reason for its non-current state when that reason exists in the fixture.

Operator-private material sits on a separate ruled plane labelled **Private**. It never connects to the projection route. The local proof only renders private questions already present in the fixture. It does not add a question-authoring or Brain-writing capability. A private question can therefore be inspected without creating or changing a durable node, relationship or interpretation.

The projection view, where fixture visibility data permits it, removes the private plane before layout and recomputes the route from customer-visible objects only. It never masks private text after rendering. If the fixture cannot establish visibility, projection is blocked with **Projection unavailable: visibility is not established**.

## 6. The mobile route

Mobile keeps the same object model but turns the terrain into a single traversable route. The current intervention stays fixed at the top. Beneath it, one relationship segment fills the screen: source object, typed arrow, target object, evidence count, provenance state and uncertainty. The decision gap remains inline at the first blocked segment.

The operator swipes or taps **Previous relationship** and **Next relationship** to travel the route. Tapping **Evidence** replaces the segment with its section cut, and **Back to relationship** restores the same place. History opens beneath the current interpretation, never as a separate destination that could be mistaken for current guidance.

Private and projection views remain visually and semantically distinct. The private marker stays fixed in the top bar. Customer projection never receives private objects.

At 200 percent zoom, desktop uses this same linear route pattern and allows normal page scrolling. Nothing requires a two-dimensional overview to understand the focus, evidence, uncertainty or next inspection. Focus order follows route order. All controls have visible focus, plain labels and viable touch targets. Reduced motion removes breathing and animated route drawing while preserving every state change through line pattern, text and position.

## 7. Fit with the current fixture

The local proof uses only the objects named or required by the brief: one current intervention, Brain objects, typed directional relationships, interpretations and their current or non-current state, uncertainty, evidence, provenance, private material, next-move text where present and freshness or error state where present.

Layout is deterministic and front-end only:

1. Fix the current intervention at the home marker.
2. Place directly connected incoming objects upstream and outgoing objects downstream.
3. Place additional hops on successive contours, ordered by a stable fixture identifier.
4. Put non-current interpretations on the history contour.
5. Select the first directionally connected relationship that is explicitly uncertain, has no inspectable evidence, or resolves only to a non-current interpretation as the decision gap.
6. If more than one relationship qualifies, keep fixture order and show the remaining gaps as quiet open lines. Do not invent a priority score.

No model call, embedding, semantic inference, new confidence score, durable write, collaboration service or generated recommendation is required. Lens movement, pinning, panning and history reveal are local view state.

State handling is honest:

- **Sparse:** show the intervention and every available connection. If no supported route exists, say **No supported route yet**.
- **Quiet:** show the current route without artificial alerts or motion.
- **Loading:** preserve the frame and labels, use static contour placeholders and say what is loading.
- **Stale:** show the available terrain with its recorded time and a persistent **Stale** label. Do not show ready-to-act treatment.
- **Error:** preserve the intervention, name the failed region and offer only the retry already supported by the proof.
- **Rejected:** keep the interpretation on the amber history contour with **Rejected** in text. It cannot join the active route.
- **Unknown:** use **Unknown**. Never convert absence into low confidence or inferred meaning.

## 8. The strongest failure risk

The terrain could become a strategy-game map that looks impressive but slows comprehension. Spatial novelty is useful only if the operator can identify the intervention, the supported interpretation, the provenance path and the next inspection faster than in a plain record view.

The mitigation is severe restraint: one default route, one lens, one decision gap, fixed spatial grammar, full text labels and a section cut that reads in ordinary language. A linear relationship list must also exist in the semantic document order for keyboard and assistive technology, even when the visual field is shown.

The kill test is simple. Give the frame to someone unfamiliar with the product for ten seconds. Ask them what decision is being prepared, why the Brain believes its current answer and what needs inspection next. If they cannot answer all three without explanation, the terrain metaphor has failed and should not proceed to implementation.

## 9. The instrument, not a familiar shell

This is not an editorial page because there is no document sequence, chapter hierarchy or scroll-led reveal. The operator starts inside the current relationship route and changes the visible argument by moving the lens.

It is not coursework or micro-learning because there are no lessons, completion states, quizzes, badges or staged disclosure of teaching content. The Brain is inspected, not taught.

It is not project management because there is no backlog, owner grid, status board, due-date hierarchy or task completion loop. The next inspection is a knowledge gap tied to evidence, not a task card.

It is not chat because there is no conversation transcript, prompt box, assistant persona or turn-taking rhythm. The operator acts on Brain objects and relationships directly.

Its governing object is the typed directional relationship. Its governing action is moving the attention lens. Its governing state change is a route stopping at uncertainty. Those three choices make the Brain itself organise attention and reveal the next decision.
