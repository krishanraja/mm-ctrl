# G25 HTTP RPC transport proof R93

**Status:** Anonymous, owner and cross-subject behavior is proved through the isolated project’s real Auth and PostgREST transport. Production is unchanged.

## What changed in confidence

R89 through R92 proved the repaired function bodies inside PostgreSQL. R93 proves that Supabase Auth establishes the expected subject and that PostgREST preserves the same boundary.

An anonymous caller can still use the two deliberate public lookup routes. It cannot read pending verification work, verify a Brain fact or pin a decision. A signed-in owner can read their own pending work and track record, list their own MCP tokens, verify their own fact and pin their own decision. The same bearer token cannot read the second subject’s pending work or track record, verify the second subject’s fact or pin the second subject’s decision.

The database post-state confirmed the distinction: only the owner’s fact became verified and only the owner’s decision became pinned.

## The role-helper finding

`has_role` has both `app_role` and `text` overloads. PostgREST correctly refuses a direct call because it cannot disambiguate them. Database policies can resolve the typed overload and continue to use it. This means the helper is internal policy machinery, not a customer HTTP API. R93 records that truth rather than pretending a public route exists.

## Honest fixture chronology

The first direct SQL Auth fixture reached GoTrue but returned `unexpected_failure`. The fixture omitted empty token sentinel fields that GoTrue expects when scanning a password user. The repaired fixture used the standard empty token fields and timestamps, then both users authenticated successfully. The final pass added owned and cross-subject Brain and decision rows so successful mutation and denial could be observed in storage.

The password, publishable key and bearer tokens existed only in transient process memory. They were never printed or written to a repository file. Cleanup removed both Auth users, both identities, trigger-created profiles and roles, both facts, every related event and both decisions. The read-back count for every fixture class was zero.

## Remaining boundary

This closes the authenticated HTTP prerequisite named by R92. It does not authorize the production hotfix. Extension-version compatibility and critical-path smoke remain open, followed by an explicit production execution decision.
