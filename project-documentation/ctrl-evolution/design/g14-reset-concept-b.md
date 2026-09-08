# G14 reset concept B: Decision cockpit

**Artifact revision:** Concept B, revision 1
**Approval state:** Independent concept draft, not approved for implementation
**Rendered evidence:** None. This is a concept document only
**Downstream owner:** G14 concept synthesis and design
**Pending action:** Judge the spine against the reset brief before any render or build

## 1. Governing interaction metaphor

The surface is a decision cockpit, not a page to read. One decision is the destination. Four compact instruments report the current bearing, the evidence load, the unresolved uncertainty and the permitted next move. A single three-position **commitment lever** drives the screen:

1. **Understand**: show what the Brain currently believes and why.
2. **Test**: show whether the evidence supports a reversible test and what remains unresolved.
3. **Commit**: show whether a consequential decision is supported, constrained or not yet supportable.

The operator is not changing the Brain by moving the lever. He is asking the same Brain a harder question: “Is there enough here to go this far?” The answer appears beside the lever, at the point of action. If the fixture does not contain enough evidence to support the selected level, the surface does not invent a recommendation. It names the gap and keeps the next permitted move at the lower level.

This is a functional cockpit metaphor, not aviation styling. There are no decorative gauges, fake telemetry, chrome, gradients or animated scenery. An instrument exists only when a real fixture value can drive it. Labels use ordinary language and include their meaning in text, so a child can understand that the screen answers three questions: what do we think, why do we think it and what can we safely do next?

## 2. First five seconds

On open, the eye meets five things in one fixed sequence:

1. The customer name and freshness state in a narrow status rail.
2. The single decision focus, written as one direct question.
3. The Brain’s current answer in mint.
4. The commitment lever, initially at **Understand**.
5. The next move and its clearance state immediately beside the lever.

The current answer is readable without interaction. Beneath it, one short line states the strongest reason and one short line states the largest uncertainty. A visible instruction says **Choose how far to go**. Moving the lever to Test or Commit updates the evidence and uncertainty instruments together, then states **Supported**, **Constrained** or **Not supported by the current record** in text. No result depends on colour alone.

The first five seconds therefore establish the customer, the decision, the current belief, the main doubt and the safe next move. Nothing important sits below the fold.

## 3. Complete desktop information structure

The 1440 by 900 frame uses one continuous dark-ink working surface with etched divisions, not a collection of cards.

### Desktop frame specification

- **Canvas:** 1440 by 900. Deep ink ground. Outer margin 24 px. No page scroll at this viewport.
- **Status rail:** x 24, y 20, w 1392, h 52. Left: customer and current intervention. Centre: last verified time and source state. Right: **Private operator view** plus a projection-boundary indicator. Metadata is IBM Plex Mono.
- **Decision bearing:** x 24, y 88, w 1392, h 132. The decision question is 24 to 28 px Archivo. The current answer is 34 to 40 px Newsreader in mint. A thin amber trace behind it names the previous or weaker interpretation and why it no longer governs. It can be inspected, but it cannot drive the action state.
- **Instrument bay:** x 24, y 236, w 1392, h 640. It is divided by one-pixel warm-cream rules into three functional zones with 24 to 32 px internal breathing room.
- **Left instruments:** x 24, y 236, w 318, h 640. Three stacked readouts: **Evidence**, **Uncertainty** and **Change**. Each uses text, count or status only when supplied by the fixture. Evidence items are grouped as support, tension and missing. Uncertainty names the largest unresolved point. Change shows the current interpretation against the superseded one.
- **Commitment station:** x 358, y 236, w 488, h 640. A vertical lever occupies the left 104 px of this zone. The large answer area beside it contains the selected level, clearance state, next permitted move, one reason and one blocking gap. The lever has a white thumb, mint focus ring, centre dot and a short first-use pulse that stops after interaction. Three labelled buttons beside the track provide an equivalent keyboard and touch path.
- **Evidence and Brain window:** x 862, y 236, w 554, h 640. The upper 268 px is an evidence trace with source title, provenance, date and relationship to the active interpretation. The lower 348 px is the Living Brain inspection window. A 24 px dividing rule area carries the selected relationship label and direction.

The four instruments are:

- **Bearing:** the one current decision focus and current interpretation.
- **Evidence:** the inspectable records supporting, weakening or failing to resolve it.
- **Uncertainty:** the explicit gap that limits the selected commitment level.
- **Clearance:** the next move the current record permits at that level.

Warm cream carries structure and readable detail. Mint marks the current answer and a supported move. Amber marks change, staleness, tension and superseded history. Neither accent is decorative. Instrument motion is limited to brief needle or trace settling after lever movement, with a reduced-motion version that changes instantly.

## 4. How evidence, uncertainty and the next move relate

The commitment lever makes their relationship causal and visible.

At **Understand**, the evidence instrument answers “Why is this the current belief?” The uncertainty instrument shows the largest unresolved point, but does not obstruct reading the answer.

At **Test**, the evidence instrument narrows to records relevant to a reversible test. The clearance instrument presents the fixture’s current next move if it is supported. If a named uncertainty prevents that test, the next-move area says what is missing instead of upgrading a guess into an action.

At **Commit**, contradictory, stale, rejected or missing evidence receives full weight. The screen may show that the current interpretation remains the best available answer while still refusing to clear a consequential commitment. This separates “best current belief” from “safe basis for action”.

Every evidence row exposes provenance, source date and its typed relationship to the current interpretation. Confidence is never shown as a made-up percentage. If the fixture supplies an explicit confidence value or status, the instrument renders it with its source. Otherwise it uses factual language such as **Supported by 3 linked records** or **Confidence not recorded**, based only on fields that actually exist.

The weakest or superseded interpretation stays visible as an amber comparison trace. It can explain what changed and preserve history, but its links are visually disconnected from the live clearance path. A rejected interpretation is labelled **Rejected** and cannot contribute to the next move.

## 5. How the Living Brain is inspected

The Brain window is a small directed relationship field, not a decorative network cloud. It opens centred on the active interpretation. Only the nearest relevant nodes are shown at first: the decision, current interpretation, linked evidence, named uncertainty and next move. Lines carry arrowheads and a written relationship type such as **supports**, **contradicts**, **depends on**, **supersedes** or the exact type present in the fixture.

Selecting any evidence row or Brain node focuses the same object in both views. The inspection strip then shows its full label, type, direction, provenance, freshness and current status. Keyboard focus follows the visual focus. Enter opens the detail in place; Escape returns to the active interpretation. Touch targets are at least 44 px, and every path has a non-hover equivalent.

Current truth has a mint-lit route from decision to interpretation to permitted move. Superseded and rejected routes remain amber, thinner and explicitly labelled. They can be inspected but never become active merely because the operator clicks them.

Operator-private notes or questions, if present in the fixture, appear in a separate inset labelled **Private to Krish. Not part of the Brain.** They have no outgoing relationship into durable Brain truth. Inspection cannot promote them. Any future promotion would require a separate, explicit product action outside this concept. The customer projection receives none of this private inset or its identifiers.

## 6. How mobile changes without losing meaning

Mobile becomes one vertical instrument stack while preserving the same decision and the same lever positions.

The sticky top region contains customer, freshness, the decision question, current answer and the three-position control. The control changes from a vertical lever to a labelled segmented rail with the same **Understand**, **Test** and **Commit** values. The clearance answer stays directly below it. The first screen therefore retains the decision, current belief, uncertainty and next move.

Evidence, comparison and Brain inspection follow as three natural-height sections. They are collapsed only by summary, never removed. Each summary states its status and count before expansion. There are no nested scroll areas. The directed Brain becomes an ordered relationship trail, for example **Decision → supported by → Evidence**, rather than a squeezed graph. Direction and relationship type remain written out.

At 200 percent zoom, desktop follows the same single-column order and permits vertical page scrolling without horizontal scrolling. Controls retain visible focus and 44 px targets. Swipe is optional. Taps, keyboard actions and labelled buttons are complete paths. Reduced motion removes settling and pulse animation after preserving the instruction text.

## 7. Feasibility against the current fixture

This concept is a read and inspect transformation of the stated fixture, with a local presentation-state control. It requires no new model call, live inference, autonomous agent, simulation, write-back, collaboration, notification, projection engine or provenance service.

The screen binds only to fixture objects already implied by the brief: one current intervention or decision focus, a current interpretation, inspectable evidence and provenance, uncertainty, a next move, typed directed relationships, history and rejected or superseded states. The commitment lever is local UI state. It changes which existing evidence, uncertainty and next-move information is foregrounded. It does not change durable data.

Where the fixture does not encode an action threshold, the concept must not calculate one. The clearance instrument says **No clearance rule is recorded** and presents the fixture’s next move as **Recorded next move**, not as a recommendation generated by the interface. This is the key feasibility guardrail.

State handling is explicit:

- **Sparse:** show the current focus, then **Not enough evidence to assess Test or Commit**. Understand remains available.
- **Quiet:** show **No recorded change** with the last verified time. Do not manufacture activity.
- **Loading:** keep the decision identity visible, label each unresolved instrument **Loading**, and clear no new action.
- **Stale:** use amber, state the source date and prevent stale material from appearing as current clearance.
- **Error:** preserve only clearly marked last verified content if the fixture distinguishes it. Otherwise show **Evidence unavailable** and no action claim.
- **Rejected:** retain the interpretation in history, label it rejected and exclude it from the live route.
- **Contradictory or adversarial:** show the tension openly, raise uncertainty and withhold stronger clearance unless the fixture explicitly supports it.
- **Long content:** clamp only the first-glance line with an explicit **Inspect full record** action in the Brain window. The source text itself is never silently shortened in detail view.

The local proof passes when the representative fixture can drive all four instruments, the lever changes only presentation state, provenance remains inspectable, private content never appears in any non-private region and no unsupported clearance is inferred.

## 8. Strongest failure risk

The strongest risk is false precision. A cockpit naturally suggests that every gauge is measured and that “Commit” can be mechanically cleared. If the fixture holds narrative confidence or incomplete relationships rather than explicit thresholds, even a polished clearance instrument could overstate what the Brain knows.

The design must therefore refuse numeric certainty that is not present, label recorded facts separately from interface interpretation and default to **Not assessed** when the data contract is silent. The commitment lever is valuable only if it reveals the boundary of the evidence. If it merely turns prose into authoritative-looking gauges, the concept fails.

## 9. Why this is not a disguised conventional interface

It is not an editorial page because the sequence is governed by one direct control and a live clearance response, not by scrolling through sections. The core meaning changes at the point of action when the operator asks the Brain to support a higher level of commitment.

It is not coursework or micro-learning because there are no lessons, steps to complete, quizzes, progress scores or celebratory completion states. The operator is making a real decision, not being taught content.

It is not a project dashboard because there are no task boards, owners, due-date grids, workstreams or status-tile summaries. The next move is evidence-constrained decision support, not a unit of project administration.

It is not chat because there is no transcript, composer, assistant persona or prompt-response loop. The Brain is inspected as typed, directed, provenance-linked relationships. Private questions remain visibly outside durable truth.

The distinction is structural: one decision is held steady while the operator changes the demanded level of commitment. Every instrument responds by showing what the existing record can and cannot justify.
