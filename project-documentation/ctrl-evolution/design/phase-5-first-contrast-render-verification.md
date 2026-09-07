# CTRL Phase 5 first-contrast render verification

**Verification revision:** `RV-001`

**Artifact:** `first-contrast-mock-r1.html`

**Status:** Browser-rendered provisional synthesis awaiting unanchored founder reaction. This is not production acceptance or implementation authority.

## Visible contract

The render uses one reversible Evidence Lens with two categorical endpoints. It does not model degrees of truth. The first endpoint preserves the leader's own prior. The second shows one different, evidence-bounded reading and a visibly incomplete `Still unknown` region. Mint is withheld because CTRL has not supplied an answer.

The only primary next action is `What is your read?`, with voice beside it. Expanding it offers the four required positions: the contrast holds, the leader is not convinced, something is wrong, or the contrast is not relevant. `Leave for now` is the persistent safe escape.

The optional source disclosure separates the leader's statement, one observed fact, CTRL's reading and what is not established. No visible sentence claims more than the frozen fixture.

## Browser evidence

Headless Chromium rendered the contrast state with no console or page errors.

| Check | Result |
|---|---|
| `390 x 844` CSS pixels | No horizontal overflow. Full primary state and safe escape fit in one viewport. Primary and voice controls are `52` CSS pixels high. |
| `360 x 800` CSS pixels | No horizontal overflow. The safe escape ends at pixel `779`. Total document height is `801`, with the one-pixel difference caused by border rounding. |
| Simulated 200% view | A `195 x 422` CSS viewport at device scale `2` rendered a `390` physical-pixel image with no horizontal overflow, statement or control overlap. Content remains available through ordinary vertical scroll. Primary and voice controls are `48` CSS pixels high. |
| Simulated virtual keyboard | At `390 x 500`, the document remains normally scrollable and has no fixed action surface that can cover the reply controls. |
| Reduced motion | The complete contrast, unknown and controls render without requiring animation. |
| State transitions | Current view, contrast, source detail, response choices, voice state and reset were exercised. Reset closes expanded panels and restores the leader's prior. |

The interaction uses a semantic range control with two values, labelled endpoint buttons, visible focus treatment and equivalent tap and keyboard routes. Interactive targets meet or exceed the current WCAG 2.2 `24 x 24` CSS-pixel minimum. The layout also preserves information through narrow-width reflow, following the current W3C guidance for [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) and [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

## Visual inspection

The primary, narrow, simulated zoom, reduced-motion and keyboard-height captures were inspected as pixels. R1 keeps the decision, contrast, categorical comparison, unknown, source disclosure, next action, voice and safe escape legible without a dashboard, chat transcript, multi-card report, graph, confidence value or staged evidence sequence.

## Unproved conditions

This browser pass does not prove that a leader understands the lens without explanation, interprets the right endpoint as a partial reading rather than truth, or feels delight rather than presentation. It also does not replace screen-reader, device, browser-zoom or real virtual-keyboard testing.

The mock uses the target type roles when those faces are locally available and explicit system fallbacks otherwise. Any production version must self-host the canonical Archivo, Newsreader, IBM Plex Mono and Source Serif 4 files.

Founder review is intentionally cold. If the endpoint reads as CTRL's answer, the interaction is a concept failure and the next spine is The Second Reading. Do not repair that failure with labels, onboarding or more explanation.
