# Provenance

Independently generated from `SB-001`. This generator had no access to other candidates.

## Territory B: The Second Reading

### 1. Governing interaction metaphor

A decision sentence is read twice, like an editorial proof.

The first reading preserves the leader’s view exactly. The record then passes through it in a short, deliberate sequence. The second reading returns as a more precise contrast, not a verdict:

> The visible hesitation is being read as a capability signal. The available evidence comes from before a clear strategy, changed incentives or new success measures, so it cannot yet show whether the team can meet the new standard.

The same reading position holds throughout. No slider, dial, spatial plot, card stack or transcript.

### 2. Exact sequence from arrival to next action

1. A compact, persistent decision line shows: “Should the marketing function be reoriented around AI?” The current view and change condition are one tap away throughout.
2. **First reading** appears in Newsreader, labelled `YOU SAID`: “Probably yes. The current team is hesitant to change, while too much time is spent on low-value manual production.” Local preservation is acknowledged immediately. Speak, tap and type controls are already available.
3. One dominant control, `Second reading`, starts the comparison. `Not now` remains the quiet escape.
4. The page holds the first reading for one beat, then introduces three short record passages in order:
   - `RECENT EVIDENCE`: One social-post brainstorming meeting lasted about one hour.
   - `RECENT EVIDENCE`: No clear next-state marketing strategy had been committed.
   - `RECENT EVIDENCE`: Incentives and success measures had not been redesigned.
5. Each passage replaces the prior passage in the same reading position. The leader can advance, pause or cancel. Nothing requires waiting through animation.
6. **Second reading** resolves into the contrast above. Amber marks only the clause that moved. Mint does not appear because CTRL has not supplied an answer.
7. A compact source ledger follows:
   - `YOU SAID`: The team appears hesitant and too much work is low-value manual production.
   - `THE RECORD SUPPORTS`: The observed moment occurred before strategy, incentives and measures changed.
   - `CTRL INFERS`: The current evidence does not isolate the team’s ability to adopt a new standard.
   - `STILL UNKNOWN`: Whether the team can adopt quickly under a committed strategy and changed incentives.
8. One ask appears: “Is this reading fair?” The proof marks are `Fair`, `Not convinced`, `Needs correction` and `Not relevant`, with speak and type alternatives.
9. If marked `Fair`, the single forward action becomes `What would be a fair test?` Choosing it opens one narrow follow-up outside this reviewed moment. `Not now` remains available.

### 3. Primary user action and safe escape

The primary action is to mark the second reading, then continue to `What would be a fair test?` if the contrast holds.

The safe escape is `Not now`. It preserves the last committed step in normal mode and makes no decision on the leader’s behalf.

`Not convinced` asks what the evidence has missed. `Needs correction` captures one correction and withdraws the current second reading. `Not relevant` records rejection without arguing back.

### 4. Information structure

The surface is one vertical editorial object:

- Persistent decision line
- Recoverable current view and change condition
- First reading
- Sequential evidence passages
- Second reading
- Four-line source ledger
- One response ask
- One forward action or quiet escape

At narrow widths and 200% zoom, everything remains single-column. The response area follows content in natural flow and moves above the virtual keyboard when input begins. No fixed element can cover entered text or the primary action. Previous passages remain recoverable through `First reading` and `Record used`, so the sequence never depends on memory or animation.

### 5. State model

- **Normal:** `first reading → record passages → second reading → leader mark → next action`.
- **No usable evidence:** The first reading remains. The second reading says, “There is not enough record for a responsible second reading.” CTRL either abstains or asks one narrow question.
- **Slow analysis:** The saved first reading stays visible with `Your words are safe. Still reading.` The work is cancellable. No progress ring or false estimate appears.
- **Stale Brain context:** Stale material is labelled in amber and excluded from the second reading. If it is useful but non-essential, CTRL proceeds from current evidence alone.
- **Conflicting Brain context:** The conflict is stated plainly. CTRL either produces a narrower contrast unaffected by it or abstains and asks one resolving question.
- **Off record:** A clear `OFF RECORD` source state appears before capture. The interaction can run in-session, but no words, marks or derived contrast persist after exit.
- **Interrupted return:** The leader resumes at the last committed beat. Completed passages do not replay unless requested.
- **Correction:** The second reading is visibly withdrawn, the corrected first reading is preserved, and the evidence sequence runs again. The old contrast cannot remain presented as current.
- **Irrelevant:** The rejection is accepted without persuasion. The leader can leave safely.
- **Zero Brain proposal:** After the eventual decision, the sequence may close with “Nothing reusable to carry forward.” No proposal appears merely to make the session feel productive.

### 6. Why it feels magical without hiding uncertainty or control

The magic is editorial, not theatrical. The leader watches their own sentence become more exact as the record changes what it can honestly carry.

Every transformation retains a visible source class. Amber identifies movement or unresolved ground. The leader controls pace, can interrupt the reading, can inspect the earlier wording and can reject the result. Reduced motion converts each beat into a user-advanced text change with identical meaning. Quiet ambient life can sit in the typesetting cursor or paper-like rhythm, but no information depends on it.

### 7. Feasibility against the stated runtime primitives

The concept maps cleanly to the existing responsive shell, evidence primitives, local draft preservation, voice capture, accessible controls, loaders, recovery states and sheets.

The runtime needs bounded structured fields for decision, prior, change condition, evidence passage, source class, freshness state, inferred contrast, unknowns and leader response. Owned components render each beat. AI supplies validated text and state choices only, never layout or arbitrary markup.

Keyboard order follows reading order. Every proof mark is a semantic control with visible focus and a comfortably large target. Voice has tap and text equivalents. The sequence can be reproduced without motion, making the core behavior feasible in the current React, Vite and TypeScript application.

### 8. Strongest failure mode and kill condition

The main risk is staged persuasion. Pacing can make a bounded inference feel more authoritative than the evidence warrants, especially when the second reading is cleaner than the leader’s original words. The sequence can also feel slow during a live conversation.

Kill the concept if fresh-context leaders describe the second reading as a finding about the team, cannot distinguish evidence from CTRL’s inference and the remaining unknown, or feel trapped in presentation before they can respond. Also kill it if reduced motion, 200% zoom or a visible keyboard breaks the before-and-after relationship.

Hard-constraint risk: the temporal reveal survives only if every beat carries its source label and the first reading remains recoverable. Remove either, and the concept fails data honesty and human agency.
