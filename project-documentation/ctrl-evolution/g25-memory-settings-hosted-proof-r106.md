# G25 memory settings hosted proof R106

**Status:** A signed-in leader can read and change only their own Brain privacy and retention settings on the isolated project. The old privileged implementation is gone.

## Why the old route was not acceptable

The legacy settings function authenticated the user, then switched to a service-role client for ordinary reads and writes. It accepted unbounded JSON, logged the user's identifier, created default rows on a read and routed the cache action through a fragile URL segment. RLS existed but the route stepped around it.

R106 uses the caller's JWT and RLS throughout. There is no target-user argument or service-role dependency. A first GET returns truthful defaults without creating a database row. PUT accepts only four named settings, validates exact types and retention values, and caps the body at 4,096 bytes. The cache action is a closed client instruction, not a claim that server or browser data has already been erased.

## Hosted proof

Two temporary users began with no settings rows. Both received default settings with `persisted: false`, and the database still held zero rows. User A then disabled all three memory controls and selected 30-day retention. User B selected 90-day retention while keeping the default booleans. Each user could see exactly one row after writing, and A received zero rows when explicitly filtering for B.

The route rejected an unauthenticated request, a string in place of a boolean, an extra target-user key, unsupported retention, wrong media, wrong method and an oversized body. Repeating A's update retained one row. The cache instruction returned exactly three legacy local-storage keys.

Every Auth, identity, profile and settings fixture was removed.

## Honest limit

This proves owner control of settings, not enforcement across every ingestion or retention path. It does not prove browser storage was actually cleared, raw sources were deleted, retention jobs ran, lifecycle temperatures are correct or account erasure is complete. Those controls remain separate proof gates.

No database migration, email, payment, model or external-write route was enabled. Production remains unchanged.
