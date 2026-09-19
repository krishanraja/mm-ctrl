# G25 provider deletion dispatch lifecycle R71 QA record

## Automated evidence

- Vitest: 14 tests passed.
- ESLint: lifecycle reducer, tests and isolated config passed.
- Strict transition graph and predecessor chain are enforced.
- Target worker, issuer and operator events have separate actor rules.
- Result, failure and recovery detail is digest-only and bounded.
- Retry attempt five cannot silently become attempt six.
- Retryable failures cannot dead-letter prematurely before attempt five.
- Automatic terminal, operator attention and closure are not conflated.
- Unknown fields are rejected.

## Residual risks

- Events are not persisted append-only yet.
- Two writers can still race outside this pure reducer.
- Queue acknowledgement is not tied to event commit.
- Alerting and operator recovery interface do not exist.
- Evidence digests are not yet linked to durable evidence records.
- No database, transport or provider behavior ran.

## Decision

Accept the R71 transition and recovery semantics. Require PostgreSQL persistence and concurrency proof before selecting or connecting a queue.
