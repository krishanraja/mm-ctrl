# G25 human review binding R118 QA record

Status: isolated implementation passed; authenticated end-to-end product exercise remains R119
Date: 2026-09-20

## Verified implementation

| Layer | Result |
|---|---|
| Presentation builder | Requires complete copy, at least two resolved ledger statements, a countercase and a validation plan |
| Packet binding | Presentation is added before decision and the packet SHA is recomputed |
| Legacy packet safety | A packet cannot be silently upgraded after it leaves `ready` |
| Function boundary | `review-standard-change-v2` is active at version 2 with JWT verification enabled and `Cache-Control: no-store` |
| Privileges | V2 wrapper executable by `authenticated`, not `anon`; private builder executable by neither |
| Product contract | Strictly validates the presentation and refuses false deploy or release authority |
| Decision binding | Sends both reviewed packet SHA and planned standard SHA |
| Reversal binding | Validates the real R116 `restored: true` receipt |
| Focused tests | 18 of 18 passed |
| Browser journeys | 5 of 5 passed at 1440x900, 390x844 and 320x568 |
| Typecheck | No new errors; current baseline 94, expected baseline 94 |
| Targeted lint | Passed |
| Dedicated Vite build | Passed; standalone synthetic preview emitted successfully |

## Hosted database proof

Migration `standard_change_human_projection_r118` is recorded in the isolated project at provider version `20260920081457`. A rollback-only SQL probe created a synthetic owner, two ledger examples, an accepted proposal and a change request. It proved the full presentation shape, then removed one evidence statement and proved the helper rejected the packet as incomplete. The transaction rolled back and the synthetic user is absent.

Fresh provider readback confirmed:

- both functions exist;
- only the authenticated wrapper is exposed;
- the private builder is not exposed to ordinary roles;
- the Edge Function is active, version 2 and JWT protected;
- normalized deployed entrypoint and presentation-core bytes match the reviewed local files;
- an anonymous POST is rejected with HTTP 401 before the function body runs;
- the probe left no synthetic identity behind.

The Supabase security advisor reports the authenticated `SECURITY DEFINER` wrapper as an intentional warning because the wrapper is the explicit RPC boundary. The helper itself is not exposed. Performance advisor findings concern pre-existing unindexed foreign keys on the R115 and R116 tables; R118 adds no table or foreign key.

## Experience and failure states

The browser suite proves the approved one-question hierarchy, equal centred action labels, evidence disclosure, focus trap and restoration, approval, explicit reversal confirmation, exact restoration receipt, stale state, incomplete projection, no horizontal overflow and 44px controls. The standalone build was tested through the same five journeys, not only the development route.

## Defect caught before founder handoff

The first frontend draft expected a reversal field named `reversed`. Direct comparison with the R116 database contract showed that the authoritative receipt says `restored`. The parser, fixture, tests and static checker now require `restored: true`. This is precisely why the screen must consume the contract rather than paraphrase it.

## Known repository-wide limitation

The ordinary `npm run build` preflight reaches the new experience receipt, then stops on nine pre-existing em-dash violations in historical G24 documents unrelated to R118. The direct Vite production build passes. Those unrelated documents were not rewritten inside this change.

## Not proved

R118 does not yet prove an authenticated browser session against the isolated database, refresh persistence, duplicate network delivery, real device handoff, physical iOS or Android behavior, production concurrency, customer value, merge or release readiness.
