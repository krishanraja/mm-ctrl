# G20 Decision Table R4 React implementation record

**Date:** 11 September 2026

**Status:** locally verified, branch-only, synthetic

**Branch:** `codex/g20-context-exchange-proof`

**Base revision:** `4c644bd8cef7083171ff817e45a0ba0ecfb10ab9`

**Route:** `/operator/customers/SYN-CUST-014/decisions/INT-014`

## Outcome

The founder-approved R4 Decision Table now runs as the actual React operator slice behind the existing synthetic preview gate. It replaces the older G14 shell at that route without changing product navigation, customer delivery, authentication, database state or the production release.

The implementation preserves the approved loop:

1. begin with one consequential decision;
2. compare three materially different routes;
3. show the Brain's current read, counter-case and important unknown;
4. open one concrete tap-first question at a time only when invited;
5. keep optional notes and preserve leader answers, evidence requests and prior-decision warnings as different kinds of input;
6. define the test and its kill condition;
7. copy a complete human-readable Claude brief; and
8. bring returned work back for a five-part judgement audit.

The old customer-projection modal is removed from this operator slice. The future customer interface remains a separate, unopened design task.

## Data and authority boundary

- The route reads `g20-decision-table-r4-fixture.json` through a Zod-validated typed adapter.
- The fixture remains synthetic and identifies Maya Chen and Aperture House as synthetic demonstration data.
- Source references must resolve. All three route identities and the default route must exist. At least one operator-private source must remain distinct from customer-private evidence.
- Evidence capture lives only in React component state and disappears on reload.
- The route is unlinked, `noindex`, limited to the exact synthetic identifiers and available only in Vite development or a build with the explicit synthetic-preview flag.
- No Supabase client, customer row, email, notification, Claude API call, account creation or durable write is used.

## Rendered acceptance

The implementation was exercised against a local Vite runtime at the exact protected route.

| Check | Result |
|---|---|
| Consequential decision, Brain read and three personal recognitions | Pass |
| Three route tabs and provisional `Current best route` label | Pass |
| Route-specific interpretation and strongest counter-case | Pass |
| One contextual question at a time | Pass |
| Tap-first choices, optional note and distinct input standing | Pass |
| Editable kill condition | Pass |
| Complete clipboard handoff with no opaque capsule or unresolved reference | Pass |
| Returned-plan audit with four failures and one useful direction | Pass |
| Exact source inspection | Pass |
| Ephemeral evidence capture and honest local-only wording | Pass |
| Sparse, stale and wrong-customer failure states | Pass |
| 1440x900 opening state with no page scroll | Pass |
| 390x844 and 320x568 with no horizontal overflow | Pass |
| Visible controls at least 38 pixels in both dimensions | Pass |
| Browser error overlay and page error check | Pass, none found |

Thirteen Chromium acceptance tests passed across the unchanged static R4 proof and the React implementation. The React slice owns six of those tests. The full Vitest suite passed 1,087 tests across 70 files, including the R4 fixture/model contract and the adjacent G21 internal-range regression. Changed-file ESLint, the 94-diagnostic typecheck baseline, documentation checks, standards checks, the production build and all seven prerender routes passed.

## File identities

| File | SHA-256 |
|---|---|
| `DecisionBenchPage.tsx` | `a8a7af9da02058afd76bcc4b0b8b8a92d3e4ddad259d944f0fb74420c3e331ca` |
| `DecisionBenchPage.css` | `781629787c83fd933f77d98b62fbb103ac8a0eea02b30cd938f5327af903d7ac` |
| `decisionBenchModel.ts` | `ffd7504f6d89df5b6c294a99ad8c35eb4bc690bba88ddad57e18de38a645f004` |
| `fixtureDecisionBenchAdapter.ts` | `4f4a33145d1d7ef2ea480c20b4e0057cfb3b3be1a06ff3fda376b736719cb7dc` |
| `g20-decision-table-r4-fixture.json` | `beb5435a79de55845a08970fa07b1098be3a719e7046e6de6eb2e498adbd06d7` |

## Known boundary and next gate

This record proves the interaction and implementation against deterministic synthetic data. It does not prove diagnostic efficacy, live ingestion, durable capture, customer suitability or production readiness.

The next gate is exact approval for a protected non-production preview deployment. The deployed revision must then pass the same desktop and mobile tasks before Krish is asked for the implemented-medium verdict. Merge, production release, customer data, email and the customer surface remain closed.
