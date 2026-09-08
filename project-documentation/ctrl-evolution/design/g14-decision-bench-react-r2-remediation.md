# G14 Decision Bench React R2 remediation

Date: 8 September 2026

Status: implemented and verified locally and on the remote preview

## Founder review

The founder identified five defects in the first React presentation:

- the customer projection appeared translucent;
- the Mindmake wordmark was absent from the top left;
- the sidebar did not expand;
- its icon-only controls were unclear and did not visibly change the workspace;
- two perceptually different loading experiences appeared back to back.

The founder then established a delivery rule for all future mock-ups: every presentation must include a direct HTTPS preview that can be opened and used on any remote desktop or mobile device. A localhost-only presentation is not sufficient.

## Root causes

- The customer projection is rendered through a Radix portal outside the `.decision-bench` theme scope. Its CSS variables therefore resolved to transparent values.
- The rail was an icon-only selector. It had no expansion state, destination labels or strong selected-region feedback.
- The header used the compact product glyph instead of the full Mindmaker wordmark.
- The static HTML boot and React splash used different visual signatures, while the Decision Bench route could also inherit the first-visit branded hold.

## Repairs

- The dialog now owns its required colour variables at the portal boundary and its computed background is asserted as opaque.
- The full Mindmaker wordmark is visible in the top-left shell on desktop and mobile.
- The desktop rail expands on hover or pin to name each destination and explain its role.
- Compare, Evidence, Next move and Customer view now operate as labelled controls with visible active-region state.
- The Decision Bench chunk is warmed during the initial boot, the static and React boot use the same Mindmaker ring, and the route skips the additional first-visit branded hold.
- The exact synthetic route can be enabled only in local development or in a build carrying `VITE_ENABLE_SYNTHETIC_DECISION_BENCH=1`.
- The remote preview declares `noindex,nofollow,noarchive`, remains absent from product navigation and has no Supabase dependency or database-write path.

## Verification

Local automated acceptance covers:

- one no-scroll desktop workspace with all three work regions;
- mobile progressive disclosure and minimum touch targets;
- full wordmark presence;
- rail expansion, labels and active-panel behaviour;
- opaque customer projection and operator-private exclusion;
- exact source, preparation and private-answer content;
- honest sparse, quiet, loading, stale, error and rejected states;
- rejection of an incorrect customer identifier;
- no browser errors, horizontal overflow, Supabase dependency or em dash.

Evidence:

- `evidence/g14-decision-bench-react-desktop.png`
- `evidence/g14-decision-bench-react-mobile.png`
- `evidence/g14-decision-bench-react-sidebar.png`
- `evidence/g14-decision-bench-react-customer-dialog.png`

## Deployment boundary

The authorised target is a non-production Vercel preview of the synthetic fixture. Production, authenticated integration, real customer data, persistence and public release remain untouched and separately gated.

Deployment readback:

- Vercel project: `mm-ctrl`
- environment: `preview`
- deployment ID: `dpl_9ywamPrcur1VZZoJPm2x9XjNit47`
- immutable deployment URL: `https://mm-ctrl-hh1i6mkno-krish-rajas-projects.vercel.app`
- source commit: `5409e4ea769953ff8f6906f615e9d83f33bef473`
- ready state: `READY`
- production target: untouched

The project keeps standard deployment protection. A preview-scoped shareable link was created for cross-device founder review and expires on 8 October 2026. Its access parameter is intentionally not persisted in Git. The remote route passed the same desktop, mobile, interaction, privacy-boundary, state-range and wrong-identity acceptance suite as the local build.
