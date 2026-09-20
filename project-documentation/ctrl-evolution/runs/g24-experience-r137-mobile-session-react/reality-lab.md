# R137 rendered reality lab

Date: 20 September 2026

Route: `/operator/customers/SYN-CUST-014/decisions/INT-014`

Authority: local synthetic branch proof only

## Automated rendered proof

Command:

`npx playwright test src/__tests__/e2e/g20-decision-table-react-r4.spec.ts --project=chromium`

Result after the first blind-review veto and repair: `12 passed`.

The suite proves:

- the first complete turn fits at both 390 by 844 and 320 by 568;
- no horizontal overflow exists;
- every visible phone button is at least 44 pixels high;
- the Mindmake image is complete and has non-zero natural width;
- the previous recommendation remains visible while the answer is evaluated;
- answering does not record the human call;
- both a selected call and leaving the decision open are represented truthfully;
- the Basis layer is separate and full-screen;
- the existing desktop route, route comparison, evidence controls, test design, Claude brief and return audit still work;
- sparse, stale, conflicted, loading and failed states use distinct honest language.
- sparse, stale and conflicted answers identify the next evidence target without claiming that evidence now exists;
- a stale Basis remains stale, marks no route as current and cannot contradict the parent standing;
- browser speech recognition supplies a captured transcript to the same answer path, with an explicit unavailable path;
- focus moves to the recalculated result and returns to `Inspect basis` when the Basis closes.

## Direct visual inspection

The actual React route was inspected in the in-app browser, not inferred from source.

### 320 by 568

- Header, exact decision, conditional current view, one consequential question, three answers, voice affordance and evidence cutoff all fit without page scrolling.
- No clipped copy, broken imagery, nested scroll or horizontal overflow was observed.
- The tap result replaced the question in place and exposed only `Challenge this`, `Record my call` and `Undo answer`.
- Typography remained readable without shrinking the decision into metadata.

### Basis

- The Basis replaced the decision surface with a natural-scrolling full-screen layer.
- Evidence, routes considered, case against, and sources and history were present in that order.
- The close action remained available at the top.
- Direct inspection confirmed that closing returned keyboard focus to `Inspect basis`.

### Desktop

- At desktop width the existing Decision Table rendered unchanged as the wide decision instrument.
- Its three routes, causal bet, supports, pull-back, human question and two actions remained visible in a no-scroll view.

## Mechanical checks

- Founder-lock contract checker: pass.
- Focused model and fixture tests: 8 passed.
- ESLint over changed TypeScript, React and Playwright files: pass.
- Raw TypeScript compile: pass.
- Repository typecheck gate: 94 baseline issues, 94 current issues, zero new.
- Production build and prerender: pass.
- Standards checker and `git diff --check`: pass.

## Limits

- Voice uses the browser speech-recognition capability. Browser support and microphone permission remain environmental constraints; an unavailable browser fails explicitly instead of pretending to capture speech.
- Phone state is session-only and disappears on refresh.
- No customer Brain or database is written.
- Main, production, merge and release remain closed.
