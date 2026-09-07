# G13 Living Brain rendered proof QA record

## QA target

- **Repository:** `https://github.com/krishanraja/mm-ctrl.git`, local branch `codex/trust-containment-2026-09-05`, starting revision `bde8ea168a2780a7a0f98c46891a3cc6e8d520d6`
- **Deployment:** local static proof at `http://127.0.0.1:4189/g13-living-brain-proof-r1.html`
- **Identity match:** confirmed for the local working tree after each edit; this is an uncommitted prototype, not a production deployment
- **Primary user and promise:** a busy, non-technical leader can inspect an owned call, understand exactly what CTRL knows, correct a standard, see bounded consequences, and enter the same truth in an immersive Brain
- **Tasks:** understand the owned call; distinguish co-presence from an evidenced relationship; inspect the source; narrow the standard; understand repair scope and history preservation; enter and explore the Living Map; return to the decision
- **Viewports and browser:** Chromium at 390 × 844 and 1440 × 900
- **Access:** public local artifact, no authentication, integrations or provider calls
- **Test data:** synthetic G13 fixture only; no production or customer data; no cleanup needed
- **Write authority:** local in-memory prototype state only; no persistence, external sends, schema changes or deployment
- **Stop points:** any production persistence, repository export, external communication, analytics or network mutation
- **Evidence location:** this record and local redacted screenshots under `project-documentation/ctrl-evolution/design/evidence/`
- **Pass signal:** every task completes through visible controls; exact relationship claims remain fixture-faithful; correction preserves v1, proposes v2, distinguishes two automatic repairs from two review-required artifacts; map contains five items and exactly three semantic relationships; both viewports avoid clipping and horizontal overflow; keyboard focus and reduced-motion support remain observable

## Selected checks

- First-time comprehension and next-action clarity
- Explicit separation of saved facts, supported relationships and unknown causality
- Consequence-labelled correction and recoverable navigation
- Mobile touch target, clipping and horizontal overflow checks
- Keyboard operability, focus visibility, landmarks and live announcements
- No error overlay, blank state, broken asset or console error
- Refresh and hash deep-link behaviour for prototype proof states
- No persistence claim beyond the fixture proof

## Results

**Status:** passed on 7 September 2026 against the local working tree.

- Mobile Chromium at 390 × 844 and desktop Chromium at 1440 × 900 both loaded meaningful content without an error overlay, page error, console error or horizontal overflow.
- The full path completed in both viewports: owned call, recorded context, source, meaning check, correction, impact preview, repair receipt and Living Map.
- The product explicitly stated that the decision has no asserted relationship while exposing the one supported relationship between the standard and aim.
- The correction preserved standard v1, introduced bounded standard v2, rebuilt the portrait and Living Map, and left the board brief and shared release review-required.
- The map rendered five canonical items and exactly three semantic edges. The selected decision exposed no invented edge. The standard exposed only its `supports` and `qualified by` relationships.
- Portrait and map showed the same corrected standard.
- The initial mobile pass found the two Brain-view tabs were 32px high. They were increased to a 44px minimum and the complete suite then passed.
- All visible mobile controls now meet a practical 42px minimum target. Reduced-motion behaviour and hash-addressed refresh both passed.

Evidence:

- [`evidence/g13-mobile-opening.png`](evidence/g13-mobile-opening.png)
- [`evidence/g13-mobile-map.png`](evidence/g13-mobile-map.png)
- [`evidence/g13-desktop-opening.png`](evidence/g13-desktop-opening.png)
- [`evidence/g13-desktop-map.png`](evidence/g13-desktop-map.png)

Run again with:

```bash
npm run brain:g13:render-check -- http://127.0.0.1:4189/g13-living-brain-proof-r1.html
```

This is proof of the interaction and semantic contract only. It is not evidence of production persistence, integration, migration or release readiness.
