# G25 provider deletion runtime topology R69 QA record

## Automated evidence

- Vitest: 14 tests passed.
- ESLint: topology compiler, tests and isolated config passed.
- Exactly one issuer, writer and worker are required.
- Deployment boundary, secret domain and every non-null secret reference must be unique.
- Generic admin or database credentials fail closed.
- Each cell has an exact operation set and exact required or forbidden capability set.
- The compiler stores references only, never secret values.
- Canonical topology SHA-256 is stable across harmless ordering differences.

## Residual risks

- Actual deployment and secret-manager state have not been inspected.
- Supabase custom-login creation and rotation are unproved.
- R64 uses a local symmetric keyring and does not itself provide KMS operation separation.
- Provider credentials may not support sufficiently narrow deletion-only scopes.
- Cross-cell queues, job authentication, acknowledgement and replay behavior are unspecified.
- No database or provider integration ran.

## Decision

Accept R69 as the required topology and a CI-verifiable manifest format. Do not claim runtime isolation until deployment evidence matches the compiled manifest.
