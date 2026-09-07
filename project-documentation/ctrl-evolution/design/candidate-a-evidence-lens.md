<!-- Provenance: Independently generated from sanitized brief SB-001, with no access to other candidates. -->

## Territory A concept spine: The Evidence Lens

**Revision:** `A-001`  
**Status:** Text-only divergence concept. Unrendered, unvalidated, and not implementation authority.

1. **Governing interaction metaphor**

A single physical evidence lens travels across one fixed statement. At rest, the instrument shows the leader’s current view. The leader drags one clearly tactile thumb from **My view** toward **Evidence so far**. Beneath the moving lens, the statement changes in place rather than navigating elsewhere.

At full travel, the contrast reads:

> Your current view makes team hesitancy the obstacle. The evidence comes from a team working without a committed next-state strategy or redesigned incentives. Their ability to adopt the new standard remains untested.

The gesture is fully reversible. Sliding back restores the leader’s words unchanged. Amber marks the unresolved movement in the frame. Mint does not appear because this is a contrast, not an answer.

2. **Exact sequence from arrival to next action**

- Arrival shows the decision, the leader’s current view, and a recoverable line for what would change the route.
- A local-save or off-record status is visible immediately. Voice, tap, and text correction controls are present from the start.
- The lens sits at **My view** with the instruction: “Slide from your view to the evidence.”
- During the drag, the leader’s statement remains legible while the evidence-qualified reading appears only inside the lens.
- At the far endpoint, the complete contrast settles directly beside the control. Beneath it appears: “Still unknown: how quickly this team changes under a committed strategy and changed incentives.”
- A compact source line distinguishes **You said**, **Evidence shows**, **CTRL infers**, and **Still unknown**. Each label can disclose its bounded detail without moving the user into a report.
- One primary action appears: **Respond to this contrast**.
- That action opens one ask with four responses: **Useful**, **Not convinced**, **Correct it**, or **Not relevant**. Voice is primary-capable, with tap and text equivalents.
- The quiet escape is **Leave for now**. The last committed state remains resumable unless the session is off record.

3. **Primary user action and safe escape**

The signature action is one reversible drag across the evidence lens. Its purpose is comparison, not scoring or selecting an answer.

The next-action control is **Respond to this contrast**. It preserves all required forms of agency without privileging acceptance.

The safe escape is **Leave for now**, visually quiet but always reachable. It never discards persisted input without telling the user.

4. **Information structure**

The surface is one continuous instrument field, not a set of cards:

- Persistent header: decision and current view.
- Recoverable context: the leader’s change condition.
- Central instrument: one statement, one rail, one movable lens.
- Endpoint contrast: located at the gesture itself.
- Epistemic source line:
  - **You said:** the team is hesitant and too much time goes to low-value manual production.
  - **Evidence shows:** one recent brainstorming meeting took about an hour; no committed next-state strategy, redesigned incentives, or new success measures were in place.
  - **CTRL infers:** team readiness has not yet been tested under the conditions the leader named.
  - **Still unknown:** whether the present team can adopt quickly once those conditions change.
- Action dock: neutral response action and quiet exit.

Source details expand within the natural page flow. They do not become cards, a transcript, or a nested scrolling region.

5. **State model**

- **Ready:** Prior, change condition, save state, voice control, and untouched lens are visible.
- **Exploring:** The lens follows the pointer continuously. Releasing it anywhere preserves that comparison position; returning it left restores the original view.
- **Revealed:** The full contrast, unknown, provenance labels, and response action appear together.
- **No usable evidence:** The lens remains available but reveals “There is not enough evidence to form a useful contrast.” CTRL asks one narrow question: “What have you observed when the team worked under a clear strategy and changed incentives?” Voice, tap, and text remain available.
- **Slow analysis:** The prior is already acknowledged locally. The instrument says it is preparing the comparison, offers cancellation, and never blocks correction or leaving.
- **Stale or conflicting Brain context:** The affected source is marked amber and excluded from the contrast unless reconciled. Current conversation evidence remains usable. No stale context is silently blended in.
- **Off record:** The surface states “Off record. Nothing will be saved.” Input can be acknowledged in the active session but is discarded on exit and cannot promise resume.
- **Interrupted return:** CTRL restores the last committed state. A completed reveal returns revealed; an unfinished drag returns to the prior endpoint without pretending the reveal was completed.
- **Correction:** The old contrast is visibly withdrawn, the leader’s correction is preserved, and the lens returns to the start for a fresh reversible comparison.
- **Useful, resisted, or irrelevant response:** The chosen response is recorded as the leader’s position, not CTRL’s conclusion.
- **Zero later Brain proposal:** After the eventual decision, the product can close with “Nothing reusable changed” and no maintenance prompt, update theatre, or forced learning.

6. **Why it feels magical without hiding uncertainty or control**

The leader touches their own sentence and watches its evidentiary boundary appear inside the same words. The effect is immediate, spatial, and reversible. It feels alive because the product responds in the same perceived beat and because the contrast is discovered through the hand rather than delivered as a pronouncement.

The magic is constrained by persistent provenance. The leader can always see which words are theirs, what the evidence establishes, what CTRL inferred, and what remains unknown. Sliding backwards, resisting, correcting, or dismissing the contrast remains as easy as revealing it.

7. **Feasibility against the stated runtime primitives**

The concept maps cleanly to the existing React 18, Vite, and TypeScript application:

- A bounded instrument component driven by structured prior, evidence, inference, unknown, lens-position, and response states.
- Pointer events for the signature drag, backed by a semantic range control.
- Tap-to-endpoint, keyboard, and screen-reader comparison paths so drag is never mandatory.
- Existing voice capture for correction and response, with tap and text alternatives.
- Existing local draft preservation, recovery states, loader, sheet, and evidence primitives.
- Validated text and state choices supplied by AI, while owned components control all markup and layout.
- Natural reflow at narrow widths, zoom, and keyboard-open states. The primary action must not depend on a fixed overlay that can obscure content.

8. **Strongest failure mode and kill condition**

The strongest failure mode is that the lens reads as a “truth revealer,” causing the right endpoint to feel more authoritative than the evidence permits.

Kill the concept if unaided observed testing shows that leaders describe the revealed endpoint as CTRL’s proven answer, cannot distinguish evidence from inference, or need coaching to reverse or correct the comparison. That would violate both the human-agency and data-honesty constraints at the mechanism level, so visual refinement would not rescue it.

**Hard-constraint risk:** The signature gesture cannot become drag-only. The semantic tap, keyboard, and screen-reader paths must preserve the same reversible comparison and source distinctions. If they reduce the interaction to an unrelated fallback or if 200% zoom hides the contrast or response control, the concept fails the accessibility and mobile-reliability boundary.
