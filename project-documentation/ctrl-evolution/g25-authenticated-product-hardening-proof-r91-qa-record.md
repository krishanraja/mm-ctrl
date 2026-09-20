# G25 authenticated-product hardening proof R91 QA record

## Catalog verification

- Target functions resolved: 8 of 8.
- Anonymous execution denied: 8 of 8.
- Authenticated execution preserved: 8 of 8.
- Service ACL dispositions matched: 8 of 8.
- Inherited `PUBLIC` execution denied: 8 of 8.
- Pin null and exact-owner guards present: 2 of 2.

## Runtime verification

- First attempt: exact-signature mismatch, transaction rolled back, no effect.
- Cross-subject track record: blocked.
- Cross-subject pin: blocked.
- Cross-subject outcome: blocked.
- Cross-subject resolve: blocked.
- Owned pin: pass.
- Owned outcome and Brain application: pass.
- Owned resolve and track record: pass.
- MCP mint, list and revoke: pass.
- Contest submission: pass.
- Service track record: pass.
- Anonymous pin body guard: blocked.
- Persistent fixture rows: zero.

## Whole exposure surface

- Original R82 routes: 45.
- Isolated dispositions: 45.
- Remaining anonymous advisor routes: 3, intentional and guarded.
- Remaining authenticated advisor routes: 17, intentional signed-in capabilities.

## Production boundary

- Production `pin_decision` risk remains open.
- Production memory-mutator risks from R90 remain open.
- Production writes: zero.
- HTTP/PostgREST transport proof: open.
- Production mutation readiness: false.

## Verdict

`ISOLATED_PRIVILEGED_SURFACE_DISPOSITION_COMPLETE_LIVE_RISKS_OPEN`
