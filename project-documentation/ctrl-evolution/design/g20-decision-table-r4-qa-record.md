# G20 Decision Table R4 QA record

**Date:** 9 September 2026
**Status:** local and protected-preview verification complete; founder gate pending

## Exact artifacts

- Baseline: `public/g20-decision-table-proof-r3.html`, 49,379 bytes, SHA-256 `3372f57efcf35287fc91aae02677d205b9169372b5fa43973ae530394a9b3bd1`.
- Candidate: `public/g20-decision-table-proof-r4.html`, 51,011 bytes, SHA-256 `cca7a99a0cc0548f4d9065eb0b2e2f7d20f046cda4a60dacf28ceaf01aa7fcdc`.
- R4 fixture: `g20-decision-table-r4-fixture.json`, 19,404 bytes, SHA-256 `beb5435a79de55845a08970fa07b1098be3a719e7046e6de6eb2e498adbd06d7`.
- Data: deterministic synthetic Maya Chen and Aperture House material only.
- Local route: `http://127.0.0.1:4195/g20-decision-table-proof-r4.html`.
- Protected deployment: `https://mm-ctrl-bxll7xn91-krish-rajas-projects.vercel.app/g20-decision-table-proof-r4.html`.
- Deployment ID: `dpl_HYRQMWsqhVedofUi2JUHgGCNzEXv`.
- Deployment source commit: `91ee9544af5ba5a317ebcd890ee2728783a4a6b9` on `codex/g20-context-exchange-proof`.
- Temporary share access: issued through Vercel and expires 9 September 2026 at 23:56 BST; the access token is not stored in this ledger.
- Refreshed share access: regenerated on 11 September 2026 for the unchanged deployment and expires 12 September 2026; the access token is not stored in this ledger.
- Production and Supabase state: unchanged.

## Rollback readiness

R3 remains byte-identical and its protected preview remains available as the prior known-good comparison. This R4 deployment is an immutable preview with no production alias, database write or customer path. Recovery is to stop using the R4 URL and return to the retained R3 artifact or deployment. No data rollback is required.

## Allowed-diff verification

The complete R3-to-R4 source diff was inspected against `g20-decision-table-r4-revision-delta.md`.

- R3 remains byte-identical to its recorded baseline hash.
- The opening decision, Brain read, recognitions, current view, three route meanings, recommendation, test, complete base Claude brief and returned-work assessment remain unchanged.
- The only opening change is the accessible description of `Ask me more`, from harder questions to useful questions.
- The deeper layer replaces the abstract two-step reveal with one plain question, immediate tap choices, one optional note and one clear action.
- Route-specific leader, Brain-check and similar-decision questions remain distinct.
- The selected choice and optional note reach the Claude brief with leader-answer, pending-evidence or prior-decision standing.
- The 320 by 568 correction changes only the deeper layer and keeps every answer and action visible without a nested scrollbar.

No undeclared change was found.

## Browser evidence

Test: `src/__tests__/e2e/g20-decision-table-proof-r4.spec.ts`

Seven Chromium journeys pass locally and against the exact protected deployment:

1. the opening preserves the consequential decision, personal recognitions, routes and primary action;
2. the deeper layer opens one plain question with choices and a disabled action until one answer is selected;
3. every question supports an optional note, while choosing `Something else` opens it automatically;
4. the leader answer, selected Brain evidence request and similar-decision answer reach the Claude brief with distinct standing;
5. switching routes changes the questions without changing the main table;
6. source inspection, evidence capture, the complete Claude handoff and returned-work assessment still work; and
7. 1440 by 900, 390 by 844 and 320 by 568 avoid horizontal overflow, while sparse, stale and wrong-customer states fail honestly.

Final local run: seven of seven passed in 15.3 seconds. Final protected-preview run with fresh rendered captures: seven of seven passed in 12.4 seconds.

## Rendered evidence

- Opening desktop: `g20-decision-table-r4-1440x900.png`, 153,928 bytes, SHA-256 `3f996cc8e6bbaf42bbc1a14bcf26b70eb9c1916f39813bb1b08f06ebfb769779`.
- Opening mobile: `g20-decision-table-r4-390x844.png`, 82,500 bytes, SHA-256 `6a9420d681a518333ba3f1459dd0ce1cdaefb188b015fa6720047481a109c963`.
- Opening minimum width: `g20-decision-table-r4-320x568.png`, 56,085 bytes, SHA-256 `399cbac851ef7227a54f03ca835e162dd4dcb92855e4052eedddce23d741a6bf`.
- Question desktop: `g20-decision-table-r4-challenge-1440x900.png`, 126,203 bytes, SHA-256 `2956886d2f21c7efcb8fca3ddf36ede3cee435f6bda55e9c7581ed487d44fc10`.
- Question mobile: `g20-decision-table-r4-challenge-390x844.png`, 59,394 bytes, SHA-256 `b296407879a3120f090a0dd46cc5ad8b218034a8093e6f9203ad36bcd0255147`.
- Question minimum width: `g20-decision-table-r4-challenge-320x568.png`, 34,189 bytes, SHA-256 `d7aa5e5d357547d7e01dd831b0e6c9c6c2fd91abf9b29e24b0cab4be2dca62f4`.

The protected-preview capture run reproduced all six retained images byte for byte. Original-resolution inspection confirms that the question, choices, explanation, optional note and both actions fit at every retained viewport. The primary action remains visibly disabled before selection, the choice state is legible, and the deeper layer adds no dashboard clutter.

## Repository checks

- `npm run standards:check`: pass, including the no-em-dash gate.
- `npm run docs:check`: pass across 158 current and reference Markdown files plus the existing evaluation, Living Brain and Brain canary contracts.
- `npm run typecheck`: pass, 94 legacy diagnostics and zero new diagnostics.
- `npm test -- --run`: pass, 1,019 tests in 64 files.
- `npm run build`: pass, 2,811 modules and seven of seven prerender routes.
- Changed-file ESLint: pass with zero warnings.
- `git diff --check`: pass.

The build retains existing browser-data age, chunk-size and Supabase static and dynamic import warnings. The R4 static proof did not introduce them.

## Capability boundary

This synthetic proof establishes the interaction contract, not production diagnostic intelligence. It does not prove that a live model will always choose the right unknown, write choices this plainly, avoid leading the leader, retrieve the right work, match an earlier decision safely or update a recommendation correctly. Implementation needs a held-out question-quality gate that rejects abstract language, tests information value and preserves provenance before a generated question can reach a customer.

## Verdict

R4 is locally and remotely verified as the final corrective revision inside the Decision Table spine. It is not founder-approved, implemented in React, connected to production data, merged, live or released.

Next gate: present the direct protected HTTPS route cold and record Krish's unanchored reaction. If R4 is rejected, return to fresh divergence rather than refining this spine again.
