# Provenance

Independently generated from sanitized brief `SB-001`, with no access to other candidates.

## Territory C concept spine: The Evidence Bench

1. Governing interaction metaphor

A quiet physical workbench where one evidence slip can be tested against the leader’s own claims.

The leader does not read CTRL’s analysis. They place an observed fact beside the claim they believe it bears on. CTRL then arranges the remaining evidence around that choice, leaving unsupported territory visibly empty.

The first contrast is:

> The team has not yet been tested against a clear new standard.

Supporting distinction:

- **Leader said:** the team is hesitant to change and too much time goes into low-value manual production.
- **Evidence supports:** manual production is consuming time; the next-state strategy, incentives and success measures are not yet defined.
- **CTRL infers:** the operating conditions may be the immediate constraint.
- **Still unknown:** how quickly the present team could adopt a committed standard under changed incentives.

This reframes the decision without answering it or making an employment recommendation.

2. Exact sequence from arrival to next action

1. The leader arrives on one full-height field. Their decision and current view remain in a compact, persistent strip at the top, with the full wording recoverable in one tap.
2. One evidence slip sits between two claim ledges: **“The team is hesitant to change”** and **“Manual work is consuming time.”** A third destination says **“This does not answer either.”**
3. The single ask is: **“What does this one-hour meeting actually bear on?”** The leader taps a destination, or speaks or types their relationship.
4. That choice is acknowledged and preserved immediately. CTRL then settles the other available evidence into the field: no committed next-state strategy; incentives and success measures unchanged.
5. The area beneath team adoption remains intentionally empty. The contrast appears beside that gap, exactly where the leader acted: **“The team has not yet been tested against a clear new standard.”**
6. One follow-up ask replaces the placement prompt: **“Does this contrast hold?”** Responses are **It holds**, **I see it differently**, **Correct something**, and **Not relevant**.
7. If it holds, the one prominent next move is **“Name the standard to test.”** If resisted, CTRL asks for the one piece of evidence it is missing. A correction reopens the affected slip and recomputes the field. Irrelevant removes the contrast without disturbing the leader’s prior.
8. The quiet escape remains available throughout: **“Leave with my view unchanged.”**

The field updates in place. It never becomes a briefing page or a sequence of accumulated messages.

3. Primary user action and safe escape

The primary action is to assign one observed fact to the claim it genuinely supports. Tap is the default. Voice and text express the same relationship without requiring spatial precision.

After the contrast, the primary next move is **“Name the standard to test.”** It advances the leader’s own change condition without taking the decision away from them.

The safe escape is **“Leave with my view unchanged.”** It preserves the last committed state unless the session is off record.

4. Information structure

- **Persistent decision strip:** decision, provisional view and save or off-record state.
- **Leader claim ledges:** only claims derived from the leader’s words.
- **Evidence slips:** each carries a plain-language fact and a mono source label.
- **Unsupported space:** a deliberately empty place showing what the evidence does not establish.
- **Contrast at the point of action:** Newsreader claim, with separate labels for evidence, inference and unknown.
- **Response controls:** the four required ways to accept, resist, correct or reject relevance.
- **Single next move:** one prominent action plus one quiet escape.

There are no axes, scores, connecting lines, confidence percentages or scrolling canvas. Spatial proximity means “bears on,” never “more certain.”

5. State model

- **Ready:** prior and change condition are present; one evidence relationship awaits the leader.
- **Committed placement:** the leader’s choice is acknowledged locally before any remote analysis.
- **Contrast revealed:** evidence, inference and unknown remain separately labelled.
- **Accepted:** the next move becomes “Name the standard to test.”
- **Resisted:** CTRL asks one narrow question: “What evidence makes team reluctance the constraint?”
- **Correcting:** the selected claim or evidence slip becomes editable; its prior relationship is withdrawn and the contrast is regenerated from the corrected input.
- **Irrelevant:** the contrast disappears and the decision remains unchanged.
- **No usable evidence:** CTRL asks one narrow evidence question. If the answer still cannot support a contrast, it abstains plainly.
- **Slow analysis:** the committed placement stays visible with “Saved here; still checking.” Work is cancellable and no dramatic placeholder substitutes for a result.
- **Stale or conflicting Brain context:** the affected context stays separate in amber, marked as old or conflicting, and cannot determine the placement until ignored or corrected.
- **Off record:** the field works in memory only and states that nothing will be kept. Closing discards it.
- **Interrupted return:** CTRL restores the last committed placement and response, not a half-generated contrast. Preserved unsent input is offered back to the leader.
- **Zero Brain proposal:** the session ends after the chosen next move with no learning prompt or maintenance language. Nothing reusable being learned is treated as a valid outcome.

6. Why it feels magical without hiding uncertainty or control

The magic comes from evidence behaving like a physical material. Facts settle only where they can bear weight, and the missing evidence becomes perceptible as empty space rather than a warning from an oracle.

The leader causes the reveal through one judgment of their own. CTRL’s contribution is the rearrangement and the concise contrast, not an unexplained verdict. Amber marks what moved or remains unsettled. Mint appears only after the leader chooses their own next move.

Subtle ambient movement can make uncommitted evidence feel alive, but the complete relationship is present when motion is disabled. Reduced motion switches settling to an immediate state change.

7. Feasibility against the stated runtime primitives

This can be represented as bounded structured data:

- claim fragments with source ownership;
- evidence items with source and freshness state;
- a small validated relationship set such as supports, challenges, does not answer and unknown;
- one generated contrast with separately validated evidence, inference and unknown text;
- one committed response and one next-action state.

Owned React components render the bench, ledges, evidence slips, response controls and recovery states. AI supplies validated text and relationship choices, never markup or coordinates.

Existing voice capture supports spoken placement or correction. Local draft preservation supports immediate acknowledgement and interrupted return. Existing sheets can expose the full decision or correction controls without crowding the field. Existing loaders and recovery primitives cover slow and failed analysis.

Tap targets are semantic buttons with visible focus and screen-reader labels. DOM reading order follows claim, evidence, relationship, contrast and action. At narrow widths or 200% zoom, the active evidence slip is followed by its three relationship controls in normal flow. The spatial meaning survives without requiring drag, pan, hover or animation. Keyboard and voice users perform the identical decision.

8. Strongest failure mode and kill condition

The strongest risk is that the field becomes a miniature analytical dashboard, or that users interpret proximity as a score or CTRL’s judgment of the team.

Kill the concept if observed mobile testing shows any of the following:

- leaders cannot explain the contrast after one evidence placement;
- they read the field as measuring team capability or recommending restructuring;
- the interface needs axes, connectors, a legend, pan, zoom or multiple simultaneous placements to make sense;
- the primary state cannot remain one ask with one obvious action at 390 × 844, 360 × 800 and 200% zoom.

That is a hard-constraint risk, not a polish issue. If spatial meaning needs explanation, the interaction metaphor has failed.

Applied: [krish-principles](C:/Users/krish/.codex/skills/krish-principles/SKILL.md), [strategy-brief](C:/Users/krish/.codex/skills/strategy-brief/SKILL.md), and [krish-design](C:/Users/krish/.codex/skills/krish-design/SKILL.md).
