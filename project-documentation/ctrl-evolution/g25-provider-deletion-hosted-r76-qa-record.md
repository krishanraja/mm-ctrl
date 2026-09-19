# G25 provider deletion hosted Supabase R76 QA record

## Environment and containment

- One data-less development branch was created at the founder-approved `$0.01344` hourly rate.
- Four synthetic Auth users and synthetic fixture rows were created only inside that branch.
- The branch was deleted after 31.22 minutes and a fresh CLI listing showed only `main`; its straight-line cost estimate is `$0.006992`, with `$0.01344` retained as the conservative one-hour ceiling.
- Production was queried read-only for migration metadata, the failing historical migration statement and the existing backup table's column shape.
- Production writes, customer records, provider requests, deployment, merge and release remained at zero.

## Migration replay evidence

- Supabase migration replay stopped after `20251120222342`.
- The next historical migration, `20251209014653`, failed with SQLSTATE `42P01` because `backup_workshop_sessions` does not exist in replayed history.
- The same table exists in production with fifteen nullable columns and no replayed creation statement in the repository.
- Candidate verification therefore used a labelled fixture on the isolated branch and does not claim production-schema compatibility.

## Hosted execution evidence

- The exact R10 through R13, R22, R23, R49, R51, R53, R63, R65, R67, R68, R73, R74 and R75 candidates applied in separate hosted migration connections.
- R68's first Vault-backed call failed on the ambiguous `key_id` reference.
- The R76 forward repair applied successfully.
- One valid signed token produced one authority spend and one active encrypted handle.
- One corrupted token was rejected.
- Three dispatches and twelve lifecycle events exercised custom roles, dead-lettering, outsider denial, current-custodian recovery, custody transfer, a real Auth JWT and post-hardening recovery linkage.
- The outsider's attempted event does not exist.
- The replacement custodian's JWT event exists.
- Direct privilege inspection showed operation-specific function grants, no custom-role direct table access, no service-role deletion wrapper and no machine-operator recovery wrapper.
- Temporary role-switch grants restored their prior Supabase membership options after every probe.

## Advisor evidence

- After R76 hardening, no R76 provider table remained in the `RLS enabled, no policy` findings.
- `brain_workspace_roles` and `brain_audience_grants` no longer appeared as public tables with RLS disabled.
- The provider dispatch, event and deletion-handle foreign keys no longer appeared in missing-index findings.
- Unrelated inherited historical findings remain and are not waived.

## Residual risks

- The production migration ledger cannot currently reproduce production schema.
- The branch was initially marked migration-failed and required an explicit verification foundation.
- The public RPC wrapper is test-only and must not ship.
- The provider runtime topology still has no selected queue, acknowledgement transport or provider deletion implementation.
- Production concurrency, pooler behavior, provider behavior, legal retention validation and observability remain unproved.
- The legacy inherited schema still exposes advisor findings outside the R76 candidate surface.

## Engineering gate

R76 is valid hosted evidence and creates an engineering veto on production integration. The narrow R76 repair supersedes the R68 hosted verifier in the candidate chain. Every candidate remains dormant. Reproducibility must be repaired first, followed by the same proof on a healthy empty branch, before any production migration is proposed.
