# G25 SECURITY DEFINER exposure R82

**Status:** Read-only exposure audit complete. No grant or routine mutation is authorised.

## The finding

Production has 45 `SECURITY DEFINER` functions executable by at least one ordinary API role. Forty-one are executable by `anon`; all 45 are executable by `authenticated`; 39 inherit execution from `PUBLIC` defaults.

Fifteen return `trigger`. Calling them as ordinary RPC functions should fail, but there is no product reason to advertise direct execution. Their trigger behavior does not require public RPC privileges, so the future backend should remove that unnecessary route after dependency proof.

The remaining 30 are normal callable functions. Twenty-six are anonymous. The dangerous centre is nine anonymous functions that contain write operations and no visible `auth.uid()`, JWT or database-role guard. None has an actual caller in current repository runtime code. Six appear only in generated TypeScript definitions and three have no current repository reference.

That is not retirement evidence. Older deployed clients, cron, webhooks and live-only Edge Functions may still call them. It is enough to block carrying the grants forward without explanation.

## The four disposition lanes

1. **Nine anonymous writers without a visible identity guard:** block from the future backend until a specific internal or public use case, caller and authorization contract is proved.
2. **Eight anonymous readers without a visible identity guard:** require an explicit public product case and cross-subject tests. `get_pending_verifications(uuid)` is used by current code and accepts a caller-supplied user id, so a friendly function name cannot substitute for authorization proof.
3. **Thirteen functions with an `auth.uid()` marker:** preserve as candidates because current runtime code uses them, but test ownership, revoked access, arbitrary ids, stale tokens and service-role behavior. A text marker is not a security verdict.
4. **Fifteen trigger functions:** preserve trigger wiring while removing direct ordinary-role execution after dependency proof.

## Why this is not an automatic revoke

Broadly revoking these functions in production could break old clients or internal workers. Broadly preserving them would carry unnecessary privilege into the rebuilt backend. The safe route is a generated least-privilege ACL candidate plus an attacker, owner and trusted-worker test matrix in the isolated environment. Only then can a narrow migration be proposed.

The first clean replay has the same exposure digest as production. This confirms that R81 reproduced the issue exactly rather than introducing it.

## Next safe move

Build the no-write disposition and test packet for all 45 functions. Resolve callers for the nine anonymous writers first, then generate but do not apply the least-privilege ACL delta. Production grants, functions and policies remain untouched.
