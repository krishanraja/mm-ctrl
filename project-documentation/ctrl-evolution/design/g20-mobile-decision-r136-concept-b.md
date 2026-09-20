# R136 concept B: Decision Session

A conversational adviser session, one turn at a time. It is not a chat feed. Completed turns collapse into a running brief, leaving only the current recommendation and next consequential ask.

## Live view

1. Compact decision label, owner and due point.
2. The Brain's current recommendation plus its governing condition.
3. One question that could change the call, with two or three decision-specific choices, `Not known`, voice and text fallback.
4. A one-line Basis entry to a full-screen inspection layer.

The sequence is orient, answer, confirm interpretation, recalculate, optionally challenge, then record a human call. The answer rail is thumb reachable, but an explicit control records the answer so a stray tap cannot advance the session. Evidence, routes, counter-case and provenance live in the inspection layer; prior turns and receipts live outside the active session.

At 320 by 568, one turn fits the usable viewport and exact longer wording opens separately. The strongest risk is anchoring: a persistent Brain recommendation may pull the leader's answer toward it. Conditional wording and a required counter-case before consequential adoption mitigate but do not remove that risk.
