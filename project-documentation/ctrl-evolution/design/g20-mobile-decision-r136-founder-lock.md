# G20 mobile Decision Session R136 founder lock

## Decision

On 20 September 2026 Krish reviewed the public rendered artifact at `public/g20-mobile-decision-r136.html` and responded:

> ok this much better

When asked whether this could be treated as approval to replace the current phone experience with the sequential model, Krish answered:

> yes

This is explicit approval of the R136 phone interaction model. It is not approval to change the desktop Decision Table, merge to `main`, release to production or connect a durable customer write.

## Approved artifact

- Path: `public/g20-mobile-decision-r136.html`
- Commit: `081443eae8716538ba0a7abe34e2c080c6e288f7`
- SHA-256: `bbbf3a195566f7b164bae6c61e4a183f1eea65e140ed3cbd6e58474898649d3d`
- Public review route: `https://krishanraja.github.io/mm-ctrl/g20-mobile-decision-r136.html`

## Locked product rule

At phone widths, the Decision Table becomes a sequential decision session rather than a narrow dashboard:

1. Show the exact decision, one short conditional current view and one consequential question.
2. A tap or voice answer updates the recommendation but never records the leader's call.
3. The result appears where the answer was given and remains undoable.
4. Counter-case and human decision are later turns, not additional cards on the first screen.
5. Evidence, routes, case against, sources and history live in a separate full-screen Basis layer.
6. Sparse, stale, conflicted, loading and failed data suppress false certainty.
7. Preserve the current desktop instrument and all underlying evidence, route, Claude handoff and audit machinery.

## Implementation correction permitted by data truth

The proof displayed `9 sources`. The locked synthetic fixture has seven unique sources linked to the current read and counter-case. The React implementation must derive and display `7 linked sources` rather than repeat the illustrative count.

## Revisit trigger

Reopen the interaction model only if rendered evidence shows that one active turn cannot fit at 320 by 568, that users cannot reach or understand the Basis layer, or that sequencing prevents a consequential decision task that the approved desktop instrument supports. Spacing, wrapping, focus, asset and other implementation defects remain routine repairs inside this lock.
