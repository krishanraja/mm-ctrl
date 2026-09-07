# G14 Private Brain Builder R1 QA record

Status: verified local proof; founder reaction pending

## QA target

- Repository: `mm-ctrl`, branch `codex/trust-containment-2026-09-05`
- Deployment: local static proof at `http://127.0.0.1:4189/g14-private-brain-builder-proof-r1.html`
- Identity match: local file served from the current working tree
- Primary user and promise: Krish can see the one best customer intervention, understand why the Brain changed, prepare the next move, ask a bounded private question, inspect the causal Brain and preview what the customer would see
- Tasks: understand the intervention; inspect the change receipt; prepare and adapt the move; inspect the living Brain; check audience separation; recover from sparse, quiet, loading, stale, error and rejected states
- Viewports: Chromium at 390 x 844 and 1440 x 900
- Access: local repository and browser only
- Test data: synthetic Maya Chen / Aperture House fixture; no cleanup required
- Write authority: local proof files, screenshots and QA evidence only
- Stop points: no production account, upload, external send, publish, database write or deployment
- Evidence location: `project-documentation/ctrl-evolution/design/evidence/`
- Pass signal: all named tasks are operable in both viewports; causal provenance and audience are visible; failure states preserve the current Brain; no console errors, clipping, horizontal overflow, inaccessible primary controls or unintended external actions

## Result

Verdict: verified for the bounded local proof.

- Proof SHA-256: `40922dc18d7295e3f57ee846603403694dc19ef265c6e282ce54bdbd5be4b3cd`
- Fixture SHA-256: `d4f0c836f333b94fbde2f1fc8ef4ad697c42258400b46237cefb2bc660287fd8`

- `npm run brain:g14:r1-check` passes fixture integrity and the complete named browser flow at 390 x 844 and 1440 x 900.
- The opening is intervention-first. The Living Brain is an optional causal inspector, not the home screen.
- The change receipt preserves the weaker interpretation, exact source, supported replacement and unresolved question.
- Session preparation exposes the exact opening, material, listening signals, causal test, fallback, reshape, alternative and rejection controls.
- The private ask returns evidence-bounded operator guidance and explicitly has no durable effect.
- The Living Brain renders ten canonical meanings, five typed relationships and standing, evidence, version and audience for the selected meaning.
- The customer projection excludes the operator-private note and has no send or publish action.
- Sparse, quiet, loading, stale, error and rejected states all preserve an honest recovery route.
- Both viewports pass horizontal-overflow, keyboard-focus, touch-target, reduced-motion and console-error checks.

## Corrections made during verification

- Increased the narrow mobile `Rotate` control to the required touch width and reran the complete suite.
- Normalised unstyled button backgrounds after the first visual render exposed native browser chrome on back controls, then reran the complete suite.
- Moved the synthetic-proof disclosure above the mobile content frame so it no longer obscures action controls, then reran the complete suite.

## Evidence

- `evidence/g14-r1-mobile-now.png`
- `evidence/g14-r1-mobile-change.png`
- `evidence/g14-r1-mobile-prepare.png`
- `evidence/g14-r1-mobile-brain.png`
- `evidence/g14-r1-mobile-customer.png`
- `evidence/g14-r1-desktop-now.png`
- `evidence/g14-r1-desktop-change.png`
- `evidence/g14-r1-desktop-prepare.png`
- `evidence/g14-r1-desktop-brain.png`
- `evidence/g14-r1-desktop-customer.png`

## Not verified

- This proof uses a synthetic customer and deterministic fixture. It does not verify inference quality on real customer evidence.
- No authentication, production persistence, ingestion adapter, LLM execution, GitHub export, deployment, external send or release path was exercised or authorised.
- Founder taste and intent remain the next material gate.
