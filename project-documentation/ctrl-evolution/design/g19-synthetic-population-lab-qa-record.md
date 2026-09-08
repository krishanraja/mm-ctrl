# G19 synthetic population lab QA record

Status: local rendered QA passed; matching remote preview pending

Date: 8 September 2026

## QA target

- Repository: `C:\Users\krish\Documents\Codex\2026-09-04\read\work\mm-ctrl`
- Source revision: merged G18 base `8ca3393a4aa8329f2ceeba66d9045dc1a965efe1` plus the uncommitted G19 lab implementation under test
- Deployment: local Vite development server; matching remote preview required before any founder review or merge
- Identity match: local runtime will be launched from the source above
- Primary user and promise: Mindmake operator inspecting whether synthetic Brain inputs, processing boundaries and diagnostic oracles remain legible across hostile data and viewports
- Tasks: find and switch a case; understand its identity and decision context; inspect source processing; distinguish required insight from prohibited inference; navigate by keyboard; survive empty, long-token, multilingual and adversarial-content cases
- Viewports and browser: Chromium at 1440 by 900 and 390 by 844; 200 percent zoom and reduced-motion checks where supported
- Access: local repository and local browser; no authentication, provider call or database connection required
- Test data: deterministic `synthetic_demo` population only; no cleanup required because the lab makes no write
- Write authority: local implementation fixes inside the G19 branch only
- Stop points: no real account creation, analytics assumption, database write, model call, external send, production deploy or public navigation
- Evidence location: this record plus redacted local screenshots outside the production bundle
- Pass signal: every selected case retains identity and source boundaries, dangerous content remains inert, important content is reachable without horizontal clipping, controls work by pointer and keyboard, and invalid or disabled routes fail closed

## Results by task

| Task | Status | Evidence | Consequence |
|---|---|---|---|
| Open an empty Brain without fabricated meaning | verified | `SYN-CUST-101`; React render gate and Chromium | Empty evidence produces an explicit restraint state. |
| Switch between synthetic cases | verified | Previous and next controls plus the mobile account selector | Identity and route update without a second full-page load. |
| Find and open a case by keyboard | verified | Search for Priya Raman, focus the result link and press Enter | The desktop lab does not depend on pointer or hover input. |
| Inspect source routing and diagnostic boundaries | verified | Source metadata, expected outcome, required notices, prohibited inference and next move render together | Operators can compare what entered with what the system may conclude. |
| Survive hostile range | verified | `SYN-CUST-107`, `SYN-CUST-125`, `SYN-CUST-126`, `SYN-CUST-132` | Long identity, long prose, a 500-character token and script-shaped text do not cause horizontal overflow or execution. |
| Preserve multilingual evidence | verified | `SYN-CUST-106` Arabic source rendered with `dir=auto` | Mixed-direction text remains readable and contained. |
| Fit desktop and mobile | verified | Chromium at 1440 by 900, 390 by 844 and 720 by 450 with reduced motion | Desktop is no-scroll; mobile uses vertical disclosure; all tested viewports avoid horizontal overflow. |
| Reject unknown synthetic identities | verified | `SYN-CUST-999` | The preview route fails closed to the standard not-found surface. |

## Confirmed finding and repair

### P2 Hidden desktop document overflow

- Environment: local Vite development server, `/operator/lab/synthetic-population/SYN-CUST-101`, Chromium 1440 by 900
- Reproduction: load the empty account and compare `document.body.scrollHeight` with `window.innerHeight`.
- Expected: the desktop instrument occupies one viewport and scrolls only inside its account and source panes.
- Observed before repair: the page looked correct but the document measured 2,640 pixels high against a 900-pixel viewport.
- Consequence: keyboard and wheel navigation could enter a large visually empty page region.
- Repair: make the desktop lab exactly `100vh`; restore automatic document height below the 760-pixel mobile breakpoint.
- Verification: fixed. The original test and all adjacent viewport tests pass.

## Verification evidence

- Focused deterministic and React gate: 61 passed, including all 48 accounts.
- Chromium acceptance gate: 8 passed.
- Production build and prerender: passed.
- Baseline TypeScript gate: 94 current, 94 known baseline, 0 new.
- Changed-file ESLint and whitespace checks: passed.
- Local visual frames inspected: `test-results/g19-desktop-volume.png` and `test-results/g19-mobile-adversarial.png`. These are test evidence, not product assets.

## What held up

The dense desktop view keeps source path, diagnostic restraint and failure pressure simultaneously visible without a large editorial hero. Mobile removes the account rail, preserves a direct selector and converts the same information into deliberate vertical disclosure. Script-shaped source content remains literal text and cannot steer or execute inside the interface.

## Unverified and blocked

- The remote Vercel preview must match the eventual G19 commit before founder review.
- Browser zoom at exactly 200 percent was approximated through a 720 by 450 compact viewport; native browser zoom remains unverified.
- No screen reader pass has been performed.
- This lab does not prove the approved Decision Bench or customer Living Brain against every fixture. It exposes the data and oracle range that those product surfaces must subsequently consume.
- No diagnostic model, Supabase branch, authentication, persistence or cross-device data sync was exercised.
