# G25 isolated share-card hosted proof R102 QA record

## Deployment

- Target: isolated reused development project.
- Function: `share-card` only.
- Hosted version: 1.
- Hosted status: active.
- Gateway JWT: disabled by explicit route contract.
- Other functions in the target: zero.

## Database authority

- New migration applied: `20260918144500`.
- RLS enabled: yes.
- Service-role execute grants: one.
- Public, anonymous and authenticated execute grants: zero.
- Test counter rows after cleanup: zero.

## HTTP proof

- Valid GET: 200 PNG, 35,959 bytes.
- PNG signature: exact.
- Cache control: `public, max-age=86400`.
- `X-Content-Type-Options`: `nosniff`.
- POST: 405.
- Oversized URL: 413.

## Boundary

- Customer data read or written: zero.
- Secret values retrieved: no.
- Production functions deployed: zero.
- Production writes: zero.
- Broader Edge Function restoration approved: no.

## Verdict

`SINGLE_ISOLATED_NON_EMAIL_FUNCTION_HOSTED_PASS_BROADER_RESTORATION_CLOSED`
