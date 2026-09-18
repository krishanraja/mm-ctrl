# G25 critique authority R112 QA record

## Frozen files

- Route SHA-256: `9ac6120f0156d61ff767e095c2de05a2ea3d0351d0b54530376e5038ec1a66c3`
- Prompt SHA-256: `3069504c06240fa71a3eaae3dd1d12304847772ede05543282c21274c7a62203`
- Migration SHA-256: `74f32d0fa37ff836bc6573df1e02b846edee7097dd1a6a0a6973ea4b242fb987`
- Hosted probe SHA-256: `00509da64c061e1125a3c38402972c7ca0a15ff569bbbc66deb6fca3898cc174`
- Review client SHA-256: `8e1e4971ac350e1cf90fcc388888a2f24371230841470e3627fcce1a45b8f9da`
- Containment manifest SHA-256: `caf2c5634e37e3321a8d9ea4661ede331ad53479aa4c5abf00ee5d05f9dc0bea`
- Hosted bundle SHA-256: `7bb20ed9ae445d2f122b252a1988dc6e81f7a548394b36ddc0ddcb3f43c3e4dd`

## Deterministic verification

- Critique-core tests: 45 passed.
- Project-binding tests: two passed.
- Public-request boundary tests: six passed.
- Focused total: 53 passed.
- Trust containment: 59 contracts passed.
- Typecheck: 94 current, 94 baseline, zero new errors.

## Hosted authority proof

The deployed route is version 1, ACTIVE and gateway JWT verification is enabled. Migration `20260918180000` is recorded once. The Edge capability name and matching Vault capability name are present; the generated capability value was held only in process memory. There is one reservation overload and one finalization overload. Anonymous callers cannot execute the reservation RPC.

The primary hosted run returned immediately with HTTP 202, then reached `ready/done`. It asked for all three lenses. Evidence and signature ran; standard correctly abstained because the fixture had no compiled criteria. The meta-judge ran. Exactly one critique run and three model-purpose receipts remained before cleanup.

Exact replay returned HTTP 200, `idempotent: true` and the same run. Changed content under the same request ID returned HTTP 409. A second account saw zero run rows. The ninth daily request and the request after the hard spend ceiling both returned HTTP 429.

When new evidence arrived while the panel was working, finalization refused the stale source and the run ended failed with no result. When a trigger forced the terminal write to fail, the run ended failed with no result. Cleanup left zero transient auth users, runs, evidence rows, evidence-source rows and usage rows.

## Authority boundary

- Production writes: zero.
- Production deploys: zero.
- Production secret writes: zero.
- Isolated function deploys: one.
- Isolated migrations: one.
- Email sends: zero.
- Billing changes: zero.
- Merge, cutover and retirement authority: closed.
