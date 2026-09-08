# Concept A: The Decision Bench

The Decision Bench treats one customer's Brain as a piece of evidence-led decision equipment. The operator does not read a prepared story or ask a chatbot to invent one. He compares live interpretations against their evidence, tests the effect of uncertainty, and leaves with one defensible next move.

## 1. Governing interaction metaphor

The screen is a decision table with an evidence bench beneath it.

The current intervention is the single case under examination. Across the table, each column is an interpretation of that case. One column is marked **Guiding now**. Any weaker or superseded interpretation appears beside it as **History**, visually quieter and unable to drive the next move. Rows expose the practical questions that separate the interpretations, such as what the customer is trying to protect, what pressure is changing the decision, and what remains unproven.

Krish's primary interaction is comparison. Selecting a table cell brings its evidence onto the bench. He can pin two cells for a direct comparison, reveal disagreement, or mark an uncertainty as relevant to the next move. These manipulations change the working view only. They do not rewrite durable Brain truth.

The bench metaphor is functional rather than decorative. It gives every statement somewhere to be tested, every uncertainty a visible consequence, and every action a visible basis.

## 2. The first five seconds

The top line says, in plain language, **Decision: [current intervention or decision focus]**. Immediately below it, a compact sentence answers **What the Brain currently believes** and is tagged **Guiding now**.

The eye then meets three adjacent facts:

- the current interpretation;
- its confidence, expressed as a plain label with the reason for that label;
- the proposed next move, with any condition that must be resolved first.

Amber is reserved for the one thing that could change the move. Mint identifies the supported answer or action. Warm cream holds the working surface against a dark ink frame. The purpose should be legible without prior product knowledge: compare what the Brain believes, inspect why, then choose what to do next.

If the fixture is sparse, stale, loading or unavailable, that condition occupies this same first-read area. The interface never fills the gap with generic advice.

## 3. Complete desktop information structure

At 1440 by 900, the complete primary task fits within one fixed application frame. The page itself does not scroll.

### Utility rail, 72 px wide

A dark ink vertical rail holds customer identity, Brain status, projection control and access to private material. Labels appear on focus, hover or at 200 percent zoom. The customer projection control is a deliberate preview action, not an ambient mode. Private notes and questions are marked with a lock and are excluded from that preview by construction.

### Case header, 112 px high

The header spans the remaining width and contains:

- customer name and freshness state;
- **Decision: [focus]** as the dominant line;
- a one-sentence **Guiding now** interpretation;
- a compact projection boundary indicator: **Private view** or **Customer preview**.

No other objective competes with this decision focus.

### Comparison table, 486 px wide by 596 px high

The left working region is the decision table. It has two or three interpretation columns, depending on the fixture:

- **Guiding now**, which alone may inform the action;
- **Alternative**, when the fixture contains a credible competing interpretation;
- **History**, for weaker, rejected or superseded meaning.

Rows are fixed, decision-facing objects rather than article sections: **Meaning**, **Evidence fit**, **Unknowns**, **What changes the decision**, and **Action consequence**. Each populated cell shows a short claim, its confidence label and an evidence count. Empty cells say what is missing. Historical cells cannot be promoted by a casual click. If the underlying fixture has no alternative, the unused column becomes an honest empty state rather than a generated hypothesis.

Selecting a cell updates the evidence bench. Shift-select or the visible **Compare** control pins a second cell and splits the bench into a source-by-source comparison. A keyboard user follows the same row and column model with arrow keys and a clearly announced selection state.

### Evidence bench, 570 px wide by 596 px high

The centre region examines the selected claim. Its top strip states **Testing: [claim]**, provenance coverage, freshness and confidence. Beneath it is a compact evidence ledger with one row per source item:

- source label and source type;
- the supported or conflicting point;
- captured date or freshness signal;
- relationship to the claim, such as **supports**, **challenges** or **context only**;
- an inspect control that opens the available source detail.

When two cells are pinned, rows align by source rather than producing two long narratives. Agreement appears in mint, meaningful contradiction in amber, and absence remains uncoloured. Evidence is never reduced to an unexplained score.

The lower 148 px of the bench is the **Living Brain lens**. It shows a local, typed and directed neighbourhood for the selected claim, with a list fallback. This keeps the graph available without letting it take over the decision task.

### Action dock, 240 px wide by 596 px high

The right region stays visible while the comparison changes. It contains, in order:

1. **Next move**, a single proposed action in mint;
2. **Because**, the two or three claims currently supporting it;
3. **Before acting**, unresolved uncertainties that constrain or block it;
4. **Private question**, a scratch input for Krish to test what he needs to learn next;
5. **Use next move**, disabled when a blocking uncertainty is active, or available as a local proof action when the fixture permits it.

A private question creates a temporary comparison lens labelled **Private working view**. It can filter or highlight existing fixture evidence, but it cannot become Brain truth. Any durable change would require a distinct, explicit future workflow and is not represented as available here.

### Bottom status strip, 48 px high

The strip reports data freshness, incomplete source coverage, loading, stale, error or rejected state, and the active keyboard shortcut hint. Rejected material remains inspectable as history and is never silently removed.

### Concise desktop frame specification

Use a 1440 by 900 canvas with a 72 px dark ink rail, 24 px outer gutters, a 112 px case header, a 24 px gap, a 596 px working row and a 48 px status strip. Within the 1344 px content width, allocate 486 px to the comparison table, 24 px gap, 570 px to the evidence bench, 24 px gap and 240 px to the action dock. Use warm cream for the table and bench, dark ink for structure and primary text, mint only for supported current meaning and executable action, and amber only for change, contradiction, staleness or decision-relevant uncertainty. Keep body text at 16 px minimum, controls at 44 px minimum height and focus rings visible. Panels may internally reveal detail in drawers, but completing the primary compare, inspect and decide loop requires no page scroll.

## 4. Evidence, uncertainty and the next move

The next move is a function of the current interpretation, not an isolated recommendation. Its **Because** list points back to exact table cells, and those cells point to exact evidence rows. This makes the chain inspectable in both directions.

Uncertainty is part of that chain. Each unknown is classified by effect:

- **Blocking** means the action control is unavailable and the dock instead offers the next evidence-seeking question;
- **Could change this** leaves the action available but places its condition directly beside it in amber;
- **Watch** remains visible without overstating its effect.

Selecting an unknown highlights which interpretation and action consequence it could alter. Krish can include or exclude an unknown from his private working comparison to understand its effect, but this does not change its durable status. The persistent label **Working view only** prevents exploration from masquerading as a Brain update.

## 5. Inspecting the Living Brain

The Living Brain lens opens from any claim, evidence item or action basis. It begins with a local neighbourhood, not an undifferentiated network. The selected object sits in the centre, with one-hop relationships labelled by type and direction, for example **evidence supports claim**, **claim informs interpretation**, or **interpretation guides action**. Arrow direction is explicit in both graphics and text.

A toggle switches between the compact graph and an equivalent structured list. Selecting a relationship updates the evidence bench with its provenance, status and freshness. Superseded and rejected nodes remain reachable through a **History** filter, rendered quieter and barred from the current action chain. Missing relationships are shown as gaps, not inferred connections.

At reduced motion, graph changes cross-fade or update instantly. At 200 percent zoom, the list becomes the default and the three main regions reflow into a single focused panel with persistent tabs.

## 6. Mobile without loss of meaning

Mobile becomes a three-step instrument, not a cut-down feed:

1. **Compare** shows the decision focus, current interpretation and one competing or historical interpretation as a row-by-row selector.
2. **Inspect** shows the evidence ledger for the selected cell, followed by the typed relationship list.
3. **Act** shows the next move, its basis, constraints and private question field.

A persistent top bar retains the decision focus and private or customer-preview state. A persistent bottom stepper shows where the operator is in the same compare, inspect and decide loop. Pinning a comparison changes to an A/B toggle rather than side-by-side columns. No evidence, uncertainty classification, provenance or historical status disappears. Touch targets remain at least 44 px and no gesture is the sole way to perform an action.

## 7. Feasibility against the current fixture

This concept needs only the fixture's existing decision focus, interpretations or meaning, evidence and provenance, confidence or uncertainty, current versus weaker status, relationships, and proposed next move. The table is a rearrangement of those objects around comparison.

The local proof can be implemented with deterministic fixture-backed selection, pinning, filtering, source inspection, history visibility and action enablement. The private question can be a clearly labelled transient input that searches or filters already available fixture content. It does not require persistence, model calls, collaborative editing, automatic Brain mutation, new ingestion or a real customer-sharing system.

Customer preview can be proven as a filtered presentation of the same fixture that omits every object marked private. Where the fixture lacks a value, the interface renders a named empty, stale, loading, error or rejected state. It does not fabricate coverage to make the concept look complete.

## 8. Strongest failure risk

The strongest risk is that a dense comparison table feels analytical before it feels useful. Too many rows, badges or evidence counts could make Krish perform data interpretation rather than support his decision.

The design should therefore keep only five stable rows, use plain-language confidence labels, and reveal full provenance detail only for the selected cell. The action dock must always explain the practical consequence of the current selection. If a row does not change understanding, uncertainty or action, it does not belong on the primary frame.

## 9. Why this is not a conventional editorial page, course, project dashboard or chat UI

The organising unit is a comparison cell, not a paragraph, lesson, task or message. The screen does not ask Krish to consume a narrative in order, complete modules, manage work items or hold a conversation with an assistant.

Meaning changes through direct operator manipulation of rows, columns, pinned claims and evidence. Every manipulation updates the inspectable basis and practical consequence in adjacent regions. History is present but non-operative. Uncertainty changes action availability. Private questions remain visibly provisional. The structure therefore behaves like a decision instrument whose state can be interrogated, not an editorial page with side panels or a familiar dashboard wearing Brain language.
