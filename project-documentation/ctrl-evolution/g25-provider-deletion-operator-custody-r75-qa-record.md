# G25 provider deletion stable-custody recovery R75 QA record

## Automated evidence

- Vitest: 4 PostgreSQL integration tests passed.
- The current stable custodian can request recovery only with an active human session and workspace role.
- A second user holding the same workspace role but no custody is denied.
- Revoking the stable operator auth link denies recovery while leaving the workspace role intact.
- Customer-authorised custody transfer denies the former operator and admits the replacement operator after explicit access is present.
- The test composes the exact R23 stable-custody candidate with the R73 through R75 dispatch and recovery candidates.

## Residual risks

- All role and claim changes occur in one PGlite process.
- Hosted Supabase Auth, PostgREST role switching and independent login sessions are unproved.
- The R68 pgcrypto and Vault verifier remains unexecuted.
- Production schema compatibility and migration ordering are unproved.
- No queue, acknowledgement, provider deletion, observability or deployment exists.

## Decision

R75 is the only acceptable local operator-recovery authority after R23. Do not deploy the earlier R73 or R74 operator wrapper without the R75 stable-custody overlay. The next honest gate is an empty disposable Supabase environment with truly independent connections.
