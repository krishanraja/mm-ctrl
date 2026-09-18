# G25 authenticated-product hardening proof R91

**Status:** The remaining eight signed-in product routes pass ownership and continuity tests in isolation. Production is unchanged.

## What the lane contains

These are real product capabilities, not functions to delete: decision pinning, outcome capture, decision closure, track record, contest submission and MCP-token management. Seven are now executable only by a signed-in user. Track record also retains its deliberate service route.

## The second null-identity defect

`pin_decision` repeats the same SQL three-valued comparison found in the memory functions. With no user identity, the live denial condition is unknown instead of true. Because anonymous execution is also live, a caller with a case id can pin that case and clear the owner's prior pin.

The isolated definition now requires a non-null caller and an exact owner match, constrains both updates to that caller and removes anonymous and unnecessary service execution.

## Runtime proof

Two synthetic users and four synthetic decisions exercised the complete family. Cross-subject track-record, pin, outcome and resolve attempts were denied. The owner could pin, record an outcome, apply it to the Brain, resolve a separate decision, read the track record, mint-list-revoke an MCP token and submit a contest. The service track-record route remained available. Every row was removed.

The first smoke attempt was rolled back before assertions because its integer literal did not match the exact `smallint` RPC signature. The corrected exact-type test passed. The failed attempt left no database effect and is retained in the chronology rather than hidden.

The isolated anonymous advisor now reports only three deliberately retained routes: minimal registration lookup, minimal share-card lookup and the guarded role helper required by RLS. All 45 functions from the original exposure inventory now have an isolated disposition. That is not a production rollout decision.
