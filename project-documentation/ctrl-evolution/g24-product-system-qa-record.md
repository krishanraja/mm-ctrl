# G24 product-system QA record

**Date:** 11 September 2026

**Outcome:** Make the founder-approved G23 product spine technically coherent as one product system and leave one bounded, falsifiable implementation slice.

**Verdict:** Partially verified. The architecture, machine contract and repository state routing are verified. Product efficacy, runtime implementation and founder intent remain unverified until their later gates.

## Build preflight

| Field | Recorded truth |
|---|---|
| **Target** | `krishanraja/mm-ctrl`, branch `codex/g20-context-exchange-proof`, starting revision `eb45578b0413dda31275ed6b550f51398a86ccfb` |
| **Current runtime** | Windows PowerShell; local repository; Node package scripts available; Supabase CLI absent; management connector used only for prior read-only schema readback |
| **Source of truth** | Founder-approved G23 R2 tag for product truth; `project-documentation/ctrl-evolution/README.md` for resumable programme state |
| **Authority** | Local architecture, contract, checker and state-route correction only |
| **Pass signals** | G23 hash unchanged; all product promises have a technical home; roles and external-action gates machine-enforced; local links and prior Brain contracts pass |
| **Rollback** | No external state changed. Local changes remain isolated in the working tree until a later commit decision |
| **Readback** | Files read from disk after write; G24 checker and full documentation suite executed from the repository |
| **Status** | Confirmed for local artifacts; deferred for founder approval and implementation |

## Evidence

| Check | Result | Observable signal |
|---|---|---|
| G23 immutable source | Pass | G24 checker recomputed the approved R2 HTML SHA-256 and matched the founder gate |
| Machine-contract structure | Pass | roles, runtime layers, eleven-table substrate, surfaces, evidence namespaces, permanent council and Crossing requirements passed |
| Authority containment | Pass | production write, customer data, email send, database branch, deployment, merge, release and backend deletion remain explicitly closed |
| Repository state routing | Pass | the evolution README links both G24 artifacts; `docs/current/design-state.md` now identifies itself as the production Blind Spot record rather than a competing evolution state route |
| Documentation integrity | Pass | `npm run docs:check` checked local links across 221 Markdown files and passed all prior Phase 2, G13 and G16 contracts plus G24 |
| Style guard | Pass | no em dash in the G24 blueprint or machine contract; `git diff --check` passed |
| Current runtime separation | Pass at source level | source search found the Decision Table reading only its fixture and no runtime reader or writer for the eleven new Brain tables |
| Live substrate status | Prior confirmed readback | eleven RLS-enabled Brain tables remained empty on 11 September 2026; no development branch existed |

## Strongest alternative tested

The strongest alternative is to continue from the approved Decision Table and add capture, Living Brain and customer pages incrementally. It would ship visible breadth sooner, but it would preserve fixture-led screens while the legacy memory and decision stores remained the real authority. That makes the product look integrated before the learning, correction and cross-decision mechanism exists.

The chosen route implements one headless Crossing first. It is slower to produce another attractive page but faster to discover whether the actual moat works.

## Open verdicts

- Founder intent: only Krish can confirm that the blueprint is the right technical expression of the approved product.
- Schema names and physical normalisation: deliberately not locked here.
- Intelligence quality: no model run or held-out comparison was performed.
- User experience: no new render was created, by design.
- Cost and performance: no target is claimed before the isolated slice is instrumented.
- Migration and deletion: no production reader, writer, cron, retention or DSAR cutover audit has begun.

## Corrections made during verification

The repository contained two documents claiming to be the resumable material-design route. `docs/current/design-state.md` was corrected to preserve its current production Blind Spot evidence while pointing active CTRL evolution to the canonical evolution README. No release evidence was changed.

The evolution README still named product architecture as the next work despite that architecture now existing. Its current phase, vertical slice, first surface and exact next action were updated to the G24 founder-review boundary.

## Commands

```text
npm run brain:g24:check
npm run docs:check
git diff --check
```

All passed.

## Next gate

Founder approval or challenge of the G24 system blueprint. Approval opens the local headless Crossing only. It does not open an external database branch, model spend, customer data, visual design, deployment, merge or release.
