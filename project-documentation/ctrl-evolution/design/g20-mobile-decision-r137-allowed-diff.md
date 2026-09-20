# G20 mobile Decision Session R137 allowed diff

## Baseline

- Approved phone artifact: `public/g20-mobile-decision-r136.html`
- Founder-lock commit: `081443eae8716538ba0a7abe34e2c080c6e288f7`
- Implementation route: `/operator/customers/SYN-CUST-014/decisions/INT-014`
- Phone boundary: `620px` and below

## Allowed implementation changes

1. Add a typed phone projection derived from the locked Decision Table fixture.
2. Add the sequential mobile session and its scoped responsive styles.
3. Mount that session alongside, not instead of, the existing desktop Decision Table.
4. Pass the phone answer into the existing Claude brief input pipeline.
5. Let the separate human-call step select an existing route inside the session.
6. Add focused model, viewport, interaction, state and preservation tests.
7. Record the founder lock, implementation contract, verification evidence and limits.

## Explicitly protected

- `DecisionBenchPage.css` remains byte-for-byte unchanged from the baseline.
- The existing desktop Decision Table stays visible above `620px` and retains its decision, route, evidence, test, Claude handoff and audit flow.
- A phone answer does not record a human decision.
- No database, customer Brain or durable write is introduced.
- The approved mock remains unchanged and continues to be the visual reference.

## Truthful correction inside the lock

The illustrative mock said `9 sources`. The implementation derives `7 linked sources` from the fixture's current-read and counter-case references. This is a data-integrity correction, not a design change.
