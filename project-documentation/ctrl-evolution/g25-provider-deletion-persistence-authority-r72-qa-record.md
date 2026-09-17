# G25 provider deletion persistence authority R72 QA record

## Automated evidence

- Vitest: 10 tests passed.
- ESLint: compiler, tests and isolated config passed.
- Exact functions are assigned to issuer, writer, worker and operator.
- Issuer cannot gain custody functions.
- Operator cannot be converted into an unattended machine credential.
- Generic Supabase admin or database references fail closed.
- Credential reuse and R69 identity drift fail closed.
- Topology fingerprint and canonical authority fingerprint are enforced.
- Unexpected fields, including any password field, fail closed.

## Residual risks

- Database roles and grants do not exist yet.
- Human-session recovery authorization and RLS are unspecified.
- Credential creation, storage and rotation are unproved.
- A deployment can still diverge from this manifest until state attestation exists.
- Dispatch and event persistence, replay and concurrency remain unproved.

## Decision

Accept R72 as the only allowed persistence privilege map. Database implementation must match it exactly and must not use `service_role` as a shortcut.
