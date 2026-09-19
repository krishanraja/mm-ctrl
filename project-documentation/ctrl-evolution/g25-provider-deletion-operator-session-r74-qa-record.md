# G25 provider deletion human operator session R74 QA record

## Automated evidence

- Vitest: 4 PostgreSQL integration tests passed.
- Active, non-anonymous workspace operators can append the allowed recovery transition.
- Missing and anonymous claims fail closed.
- Authenticated outsiders cannot recover another workspace's dispatch.
- Revoked operator roles lose recovery authority immediately.
- `provider_deletion_operator` and `service_role` cannot execute the recovery function.
- R73 event-chain and transition validation still governs the accepted event.

## Residual risks

- JWT state is simulated with PostgreSQL settings rather than hosted Supabase Auth.
- The test uses one PGlite connection, not isolated sessions or PostgREST.
- The interim workspace role is not yet joined to R23 stable operator identity and current customer custody.
- The operator recovery link can name a future dispatch, but queue creation and reconciliation are not implemented.
- No migration, live policy, credential or deployment exists.

## Decision

R74 supersedes the R73 operator grant for any future candidate assembly. Human recovery must not be reintroduced as a machine credential. Stable-custody binding and independent hosted-session proof remain mandatory before integration.
