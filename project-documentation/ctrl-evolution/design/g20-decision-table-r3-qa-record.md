# G20 Decision Table R3 QA record

**Date:** 9 September 2026  
**Status:** local and protected-preview verification complete; founder gate pending

## Exact artifacts

- Baseline: `public/g20-decision-table-proof-r2.html`, 38,839 bytes, SHA-256 `e01297915d03b2f0249fabad3dcc034d86c8452c2a939a180640fd772fe3c018`.
- Candidate: `public/g20-decision-table-proof-r3.html`, 49,379 bytes, SHA-256 `3372f57efcf35287fc91aae02677d205b9169372b5fa43973ae530394a9b3bd1`.
- R3 fixture: `g20-decision-table-r3-fixture.json`, 19,105 bytes, SHA-256 `255bdc3b8dc8fda8655bd13cf4268d56f658371c7f98e3304b8f3f77daffa4f7`.
- Data: deterministic synthetic Maya Chen and Aperture House material only.
- Local route: `http://127.0.0.1:4194/g20-decision-table-proof-r3.html`.
- Protected deployment: `https://mm-ctrl-j9jwonoaz-krish-rajas-projects.vercel.app/g20-decision-table-proof-r3.html`.
- Deployment source commit: `2fe5d31`.
- Temporary share access: issued through Vercel and expires 9 September 2026 at 22:57 BST; the access token is not stored in this ledger.
- Production state: unchanged.

## Allowed-diff verification

The complete R2-to-R3 source diff was inspected against `g20-decision-table-r3-revision-delta.md`.

- R2 remains byte-identical to its approved baseline hash.
- The opening decision, Brain read, supported recognitions, current view, all three route meanings, primary action, test, complete base Claude brief and returned-work assessment remain unchanged.
- `Working route` changes only to `Current best route` in the route tab and test eyebrow.
- The existing unresolved recognition gains one `Ask me more` entry point. No new dashboard row, rail or visible panel is added.
- The deeper layer adds route-specific questions, their causal decision effect, one response at a time, and typed leader answer, pending evidence and prior-decision inputs in the Claude brief.
- The only new historical claim is explicitly synthetic and exists in the versioned R3 fixture.

No undeclared change was found.

## Local browser evidence

Test: `src/__tests__/e2e/g20-decision-table-proof-r3.spec.ts`

Seven Chromium journeys pass:

1. the opening preserves the consequential decision, three personal recognitions, three routes and primary action while naming Route 2 as the current best route;
2. the deeper diagnostic is optional, opens one question at a time, changes with the selected route and moves through leader answer, Brain evidence task and prior-decision match;
3. a kept answer, pending evidence task and prior-decision match reach the copied Claude brief with distinct standing and a warning that analogy is not proof;
4. personal evidence continues to change the interpretation of each route;
5. the complete standalone Claude brief and returned-work assessment still work;
6. source inspection and `Add evidence` still perform visible actions; and
7. 1440 by 900, 390 by 844 and 320 by 568 avoid horizontal overflow, desktop avoids page scroll, mobile keeps the primary action in its initial viewport, and sparse, stale and wrong-customer states fail honestly.

The final local run passed all seven journeys in 8.4 seconds.

The same seven journeys passed against the exact protected deployment in 21.1 seconds. The protected entry established the temporary Vercel session, then every journey exercised the stable deployment origin. No production route or database was used.

## Rendered evidence

- Opening desktop: `g20-decision-table-r3-1440x900.png`, 153,928 bytes, SHA-256 `3f996cc8e6bbaf42bbc1a14bcf26b70eb9c1916f39813bb1b08f06ebfb769779`.
- Opening mobile: `g20-decision-table-r3-390x844.png`, 82,500 bytes, SHA-256 `6a9420d681a518333ba3f1459dd0ce1cdaefb188b015fa6720047481a109c963`.
- Deeper layer desktop: `g20-decision-table-r3-challenge-1440x900.png`, 146,340 bytes, SHA-256 `c79621e175e8c9ca169a766d908e4d8eacf9a1a96c5fcecdd86394f1477a6dad`.
- Deeper layer mobile: `g20-decision-table-r3-challenge-390x844.png`, 70,146 bytes, SHA-256 `d244eb1f6d7c577574f42c8fb5bf959e8423c31cc4a36c1dfdcde9bdfb829578`.
- Temporary remote opening desktop capture: 153,928 bytes, SHA-256 `3f996cc8e6bbaf42bbc1a14bcf26b70eb9c1916f39813bb1b08f06ebfb769779`.
- Temporary remote deeper-layer mobile capture: 70,146 bytes, SHA-256 `d244eb1f6d7c577574f42c8fb5bf959e8423c31cc4a36c1dfdcde9bdfb829578`.

Original-resolution inspection confirms:

- the opening remains visually and spatially the R2 Decision Table;
- `Ask me more` occupies the former source action inside the existing unresolved recognition;
- no extra dashboard section or decorative element competes with the decision;
- the deeper layer presents one large plain question, one reason, one route effect and two actions;
- desktop and mobile preserve hierarchy, focus and touch target clarity; and
- the deeper layer fits within the mobile viewport without nested scrolling.

The temporary remote captures are byte-for-byte identical to their retained local counterparts, so duplicate binaries are not committed. Original-resolution remote inspection confirms that the exact protected deployment preserves both the uncluttered opening and the one-question mobile layer.

## Repository checks

- `npm run standards:check`: pass, including the no-em-dash gate.
- `npm run docs:check`: pass across 155 current and reference Markdown files plus the existing evaluation, Living Brain and Brain canary contracts.
- `npm run typecheck`: pass, 94 legacy diagnostics, zero new diagnostics.
- `npm run build`: pass, 2,811 modules and 7 of 7 prerender routes.
- `git diff --check`: pass.

The build retains existing browser-data age, chunk-size and Supabase static and dynamic import warnings. The R3 static proof did not introduce them.

## Capability boundary

This synthetic proof demonstrates the proposed interaction and data standing. It does not establish that production models can generate questions of this quality, retrieve the right work, match prior decisions safely, persist answers, rank analogies, update a recommendation, or improve real decisions. Those require a held-out diagnostic-quality gate, provenance rules and real system implementation after founder approval.

## Verdict

R3 is locally and remotely verified as a targeted synthetic revision. It is not founder-approved, implemented in React, connected to production data, merged, live or released.

Next gate: present one direct protected HTTPS route cold and record Krish's unanchored reaction before explanation or React implementation.
