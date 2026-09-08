# G14 Decision Bench implementation contract and local slice plan

**Date:** 8 September 2026
**Status:** Contract complete, material application implementation not authorised
**Governing founder lock:** `design/g14-decision-bench-r1-founder-lock.md`
**Machine contract:** `g14-decision-bench-implementation-contract.json`
**Target repository:** `krishanraja/mm-ctrl` on `codex/trust-containment-2026-09-05`

## Outcome

Turn the approved Decision Bench into one real operator instrument without making the existing application's historical schemas or feature silos the new product architecture.

The first implemented slice will let Krish open a synthetic customer decision at a direct local route and use the complete approved surface at desktop and mobile sizes. It will prove the React composition, state model, accessibility and audience projection boundary before any account, database, GitHub or production work.

## Technical call

Retain the current app and transplant the approved Decision Bench into it behind a new projection contract. Reuse capabilities that have already earned their place. Do not remodel the new Brain inside `user_memory`, do not treat `memory_edges` as canonical semantic truth, and do not grant Krish browser access to another user's rows through a service credential.

This is the correct middle ground because the repository already has useful decision, evidence, voice, responsive-shell, loading, correction and graph-rendering mechanics. It does not yet have the workspace, subject, audience, versioning and repair authority needed for the product now being designed.

## Current repository truth

| Approved need | Current capability | Contract call | Gap before real customer use |
|---|---|---|---|
| Consequential decision identity | `decision_cases.statement`, lifecycle fields and pinned decision flow | Adapt | No customer workspace or subject identity |
| Current meaning | `recommendation`, claims, tensions and user calls | Adapt only when provenance is unambiguous | No versioned synthesis standing or audience |
| Historical meaning | status and event fragments | Do not infer | Needs append-only item versions and supersession |
| Exact evidence | `decision_evidence` with source, excerpt, reliability, date, score and theme | Reuse behind evidence manifest | No assertion offsets or audience ceiling |
| Open question | breakpoint assumption and `validate_next` can seed it | Adapt | No first-class knowledge-gap record |
| Focused Brain route | `BrainGraph` can render nodes and edges | Reuse rendering mechanics | `memory_edges` lacks the approved relation set, version and evidence authority |
| Private working guidance | No safe equivalent | New transient session contract | Must not silently become durable memory |
| Customer preview | No audience-aware projection | New projection contract | Requires customer-safe allowlist and grants |
| Operator access to a customer Brain | Owner-only RLS on current tables | Do not bypass | Requires workspace roles and audience grants |
| Correction and repair | memory correction functions and events show useful mechanics | Characterise and replace as authority | Needs append-only versions and dependency-complete repair |

## Target read contract

The surface receives one `DecisionBenchProjection`. Components do not query legacy tables directly.

```ts
type Audience = 'operator_private' | 'customer_private';
type ProjectionState = 'ready' | 'sparse' | 'quiet' | 'loading' | 'stale' | 'error' | 'rejected';

interface DecisionBenchProjection {
  identity: {
    workspaceId: string;
    subjectId: string;
    decisionId: string;
    projectionVersion: number;
    asOf: string;
  };
  customer: CustomerSummary;
  decision: DecisionSummary;
  currentMeaning: BrainItemView;
  historicalMeanings: BrainItemView[];
  openGap: KnowledgeGapView | null;
  sources: SourceAssertionView[];
  focusedRoute: BrainRouteView;
  sessionPlan: SessionPlanView | null;
  privateAsk: TransientGuidanceView | null;
  customerPreview: CustomerProjectionView | null;
  state: ProjectionState;
}
```

The adapter must fail closed if workspace, subject, audience, current version or source references are ambiguous. A partial projection becomes `sparse`, `stale` or `error`; it does not fill missing fields with model confidence.

## Component boundary

Create a new operator feature package rather than bending the current consumer `PressureTestPanel` or `DecisionMap` into two incompatible jobs.

```text
src/features/operator-brain/
  contract.ts
  fixtures/mayaDecisionBench.ts
  adapters/fixtureDecisionBenchAdapter.ts
  DecisionBenchPage.tsx
  DecisionBenchHeader.tsx
  MeaningComparison.tsx
  EvidenceBench.tsx
  FocusedBrainRoute.tsx
  NextSessionMove.tsx
  CustomerProjectionPreview.tsx
  DecisionBenchStates.tsx
```

Shared primitives may come from `DesktopShell`, `MobileFrame`, buttons, focus handling, motion preferences and the Brain renderer. Existing feature pages remain untouched during the first slice.

## Route and visibility

The planned route is:

`/operator/customers/:workspaceId/decisions/:decisionId`

For the first local slice it is available only through a direct URL and resolves only the synthetic fixture IDs. It does not appear in primary navigation, accept arbitrary identifiers, read Supabase or write anything. This makes the product behavior testable without pretending the missing operator authorization model exists.

## Interaction and state rules

1. The decision, current meaning and open question remain visible in every state.
2. Current and historical meaning are shown together. A historical item is visibly superseded and can never populate the current action basis.
3. Evidence opens to exact source assertion, date, kind, audience and the Brain item it supports.
4. The Brain view shows only the selected item's fixture-backed route. Layout proximity has no semantic meaning.
5. `Prepare next move` prepares material and wording. It does not execute, approve or mark a decision safe.
6. The private ask is transient. Closing or refreshing discards it in the first slice.
7. Customer preview is constructed from an explicit customer-private allowlist. Operator-private fields are absent from its input object, not merely hidden by CSS.
8. Desktop at 1440 by 900 does not page-scroll. Mobile at 390 by 844 shows one work region at a time with persistent section controls.
9. Loading keeps the last verified projection visible. Stale and error states name the affected source boundary and never mutate the Brain.
10. Rejected meaning stays in history but is excluded from current guidance and customer projection.

## First local vertical slice

### Phase 0: premise gate

- Verify the exact reviewed proof and fixture hashes.
- Freeze the `DecisionBenchProjection` schema and fixture adapter output.
- Prove no component imports Supabase or an Edge Function.
- Prove the direct route does not enter primary navigation.

Failing any item stops the slice before UI composition.

### Phase 1: component transplant

- Rebuild the approved layout as React components using existing tokens and viewport shells.
- Preserve the approved information hierarchy and compact type scale.
- Reuse the Brain renderer only if it can accept the focused route without inventing hub or distance semantics. Otherwise use a small dedicated SVG route renderer.
- Implement comparison, evidence selection, route selection, transient ask, customer preview and required fallback states.

### Phase 2: deterministic verification

- Unit-test projection validation, audience filtering, history exclusion and transient guidance.
- Browser-test 1440 by 900, 390 by 844 and the 200 percent reflow equivalent.
- Assert no page scroll, no horizontal overflow, visible keyboard focus, minimum 42 pixel mobile controls and reduced-motion equivalence.
- Assert every exact fixture quote and relationship reference resolves.
- Assert operator-private source `SRC-104`, Brain items `BI-104`, `BI-106`, `BI-108`, `BI-109` and private guidance cannot enter the customer preview.
- Run typecheck, focused tests, build, standards checks and a local runtime flow.

### Phase 3: founder implementation gate

Present the actual React route at a direct link. Compare it against the locked proof at both primary viewports. Approval here covers local implementation parity only.

## Later gated slices

### Workspace and audience canary

Introduce the G13 physical model for workspaces, roles, sources, assertions, versioned items, relationships and grants. Use a migration only after exact action-time approval. The canary must prove owner, operator and customer isolation with negative cross-audience tests.

### Designated operator account

Enable one explicitly named test workspace. Shadow-read qualified legacy data through adapters and write only new domain events. Compare the old and new projections before any legacy migration.

### Mindmake proof cohort

Use a very small named cohort. Measure whether the bench improves session preparation, preserves correction and makes consequential decisions sharper. Do not equate return desire or screen use with decision quality.

## Required retained capability tests

- Decision evidence keeps source title, URL where applicable, exact excerpt, observed or published date, retrieval time and reliability.
- Voice capture preserves local draft, review, retry and explicit consent before a source envelope is created.
- Shells preserve bounded viewport behavior, focus order, interruption recovery and reduced motion.
- Brain rendering accepts canonical typed relationships and does not create semantic links from visual layout.
- Current decision actions remain functional and unchanged outside the new route.

## Kill rules

- If the local slice needs direct legacy-table reads inside presentation components, stop and restore the projection boundary.
- If a graph renderer requires fabricated or unevidenced relationships, replace it for this surface.
- If customer preview safety depends on hiding already-loaded private content, fail the audience boundary.
- If the surface needs page scrolling at 1440 by 900 to expose the next move, fail visual parity.
- If the new workspace schema becomes a renamed copy of `user_memory`, stop the migration design.
- If operator access requires a browser service credential, stop the account slice.
- If the first real customer Brain is mostly invented or provenance-poor, present a sparse Brain rather than a complete-looking one.

## Build contract

**TARGET:** `mm-ctrl`, new local operator route, starting from the revision containing this contract.
**CURRENT RUNTIME:** Windows and PowerShell; React 18, Vite 5, TypeScript, Tailwind, Supabase client and Playwright.
**SOURCE OF TRUTH:** `project-documentation/ctrl-evolution/README.md`, the G14 founder lock and the machine contract above.
**AUTHORITY:** Contract and local planning only. Material React implementation, database work, accounts, deployment and release remain gated.
**PASS SIGNALS:** Machine contract validation; exact artifact hashes; complete capability map; explicit slice boundaries; deterministic test plan; canonical state readback.
**ROLLBACK:** Documentation-only commit can be reverted without affecting application or production state.
**READBACK:** Repository checks, JSON contract validator, Git diff and remote branch head.
**STATUS:** Contract confirmed; implementation deferred pending its exact gate.

## Next gate

Authorise the fixture-backed local React slice described above. This gate would permit new local feature files, a direct local-only route and deterministic tests. It would not permit database changes, real accounts, customer data, navigation exposure, deployment or release.
