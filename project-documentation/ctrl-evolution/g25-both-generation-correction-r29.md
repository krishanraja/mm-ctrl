# G25 both-generation correction, R29

R29 prevents the Brain from telling two different stories after a correction merely because one derivative was written before the custody transition and another was written after it.

One stable-custody correction now identifies an exact affected authority record and an exact current replacement. In one PostgreSQL operation it invalidates every matching legacy R10 receipt and custody-native R25 receipt, writes a payload-free event beside each, records separate generation counts and preserves everything unrelated.

## Why this matters

A correction is not a new opinion layered on top of an old one. Once a source or Brain item has been validly replaced, no prepared briefing, recommendation or context package derived from the superseded authority may continue to appear current.

The transition cannot make this guarantee generation-dependent. The user's correction must travel across the entire system or the Brain is not trustworthy.

## Verified locally

- PostgreSQL 18.3 invalidates exactly one affected legacy receipt and one affected custody-native receipt.
- An unrelated receipt in each generation remains current.
- A custody transfer between derivation and correction does not change the stable correction scope.
- Each affected receipt receives one deterministic, payload-free invalidation event in its own generation.
- Exact replay returns the original generation counts; a conflicting replay fails closed.
- A forced failure while writing the custody-native event rolls back the earlier legacy update, event and correction receipt as well.
- Superseded replacement authority, extra legacy ownership identity and ordinary authenticated execution all fail closed.
- Removing either generation's exact-record predicate, or removing replacement-currentness enforcement, makes the canary fail.

## Architecture boundary

R29 creates a separate custody-native correction receipt. It does not rewrite R12 history. The current authority is checked through the R25 stable-custody adapter, so operator login and legacy owner identity do not enter the new correction identity.

R12 remains a valid historical proof and legacy-only mechanism. It cannot remain a competing result-producing runtime writer once the dual-generation path is adopted, because invoking it alone would again permit generation drift. Exact runtime cutover and retirement therefore remain a later gate.

## Boundary

This is a non-migration local PostgreSQL proof. It does not regenerate invalidated intelligence, repair already delivered external copies, execute subject erasure or expose a unified reader. Multi-connection races, Supabase-local and PostgREST parity, migration preflight, runtime integration and production observability remain unproved.
