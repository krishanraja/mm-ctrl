# G14 Decision Bench React R1 QA record

## Status

`IMPLEMENTED_LOCAL_SYNTHETIC_SLICE`

Founder authority was given on 8 September 2026 to build the fixture-backed local React route with synthetic data, no database writes and no deployment. This record covers that bounded implementation only.

## Rendered route

`/operator/customers/SYN-CUST-014/decisions/INT-014`

The route is available only in Vite development mode. It is not present in navigation or authenticated-route prefetching. Any customer or intervention identity other than the two locked synthetic identifiers resolves to the standard not-found surface.

## Source discipline

- Canonical data: `design/g14-private-brain-builder-fixture.json`
- Approved visual and interaction direction: `design/g14-decision-bench-proof-r1.html`
- Fixture adapter: `src/features/operator-brain/fixtureDecisionBenchAdapter.ts`
- React surface: `src/features/operator-brain/DecisionBenchPage.tsx`
- Scoped visual system: `src/features/operator-brain/DecisionBenchPage.css`
- Browser gate: `scripts/check-ctrl-g14-decision-bench-react.mjs`

The fixture is imported as raw text and validated before use. The adapter rejects non-synthetic status, an unexpected customer identity, an unexpected intervention identity or a missing evidence graph. The feature imports no Supabase client and invokes no persistence or Edge function.

## Visual review

The rendered implementation was inspected at 1440 by 900 and 390 by 844 after automated capture.

- Desktop uses one no-scroll decision instrument. Comparison, evidence, the focused Brain route and next-session preparation remain visible together.
- The decision heading is compact and subordinate to the instrument.
- Current and discarded meanings are visually distinct without hiding history.
- The evidence path and five-node local Brain route preserve typed, inspectable meaning.
- The action panel fits its available height and its primary action has sufficient contrast.
- Mobile shows one work region at a time with a persistent three-part control.
- Purposeful line icons replace decorative motifs. No sparkle symbol is used.

Evidence captures:

- `design/evidence/g14-decision-bench-react-desktop.png`
- `design/evidence/g14-decision-bench-react-mobile.png`

## Interaction and integrity checks

`npm run brain:g14:react-check` passed all dedicated checks:

- locked synthetic route and development-only containment;
- no feature-level Supabase or Edge function dependency;
- no em dash in feature copy;
- ready desktop composition without vertical or horizontal page overflow;
- one mobile work region at a time and 42-pixel primary navigation targets;
- low-height reflow at 720 by 450 without horizontal overflow;
- exact source assertion in the evidence dialog;
- exact opening question and all four listening signals in session preparation;
- private guidance labelled with no durable effect;
- customer projection contains the approved synthesis and excludes the operator-private assertion;
- sparse, quiet, loading, stale, error and rejected states all render honestly;
- the wrong customer identity cannot enter the route.

Additional verification:

- Focused Vitest file: 2 tests passed.
- Repository typecheck baseline: passed with no new TypeScript error.
- Focused ESLint on the feature, route and checker: passed.
- Production build and prerender: passed.
- Standards check: passed.
- G14 implementation contract and locked artifact hashes: passed.
- Full repository lint: failed on the existing backlog of 102 errors and 10 warnings outside this slice. The changed files introduced no focused lint failure.

## React quality review

The route is lazy-loaded and excluded from general prefetching. Static fixture parsing is hoisted to module scope. Components are declared outside the page render. State is limited to the selected panel, comparison, Brain item and open dialog. No network waterfall or new global event listener is introduced.

## Remaining boundary

This is not a production operator feature. It creates no real account, schema, customer data, GitHub repository, deployment or release. The next gate is the founder's reaction to the real local route. Database architecture and authenticated integration remain separately authorised work.
