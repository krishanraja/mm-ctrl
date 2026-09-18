# G25 repository function source manifest R99 QA record

## Source identity

- Local function directories: 118.
- Present `index.ts` entrypoints: 118.
- Per-function source digests: 118.
- Shared files bound into every route: 185.
- Configured routes without local source: zero.
- Derived manifest SHA-256: `c44ba7ae89d8a63854513a6f8d798bae6e2fde010842c1e5b7555583968e8eaa`.

## Gateway posture

- Explicit `verify_jwt=true`: 84.
- Explicit `verify_jwt=false`: 34.
- Unspecified local gateway posture: zero.
- Shared production routes compared: 115.
- Production-posture mismatches: one intentional fail-closed override for `prompt-coach`.
- Previously implicit postures made explicit: 48.

## Dependency inventory

- Unique environment-variable symbols: 46.
- Functions with a service-role marker: 54.
- Functions with an explicit `getUser` marker: 59.
- Environment values retrieved: no.

## Open gate

- Route-specific authentication proofs complete: no.
- Live-only source recovered into repository: no.
- Edge Function restoration ready: no.
- Isolated functions deployed by R99: zero. Later receipts deploy thirteen bounded routes.
- Production writes: zero.

## Verdict

`REPO_FUNCTION_SOURCE_AND_GATEWAY_POSTURE_REPRODUCIBLE_ROUTE_SECURITY_STILL_OPEN`
