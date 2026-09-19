# G25 stable-principal login removal, R28

R28 replaces the old operational assumption that an authentication user can stand in for a person, an operator and the owner of a Brain.

It plans exactly one operation: removing one login. The database first reads that login's current subject links, operator links, customer custody, workspace roles and audience grants into an evidence-bound context. The pure planner then decides whether access can be removed immediately or whether customer-authorised custody transfer must happen first.

## The important human rule

Removing a login does not erase a person or their Brain.

A login may be the route through which someone reaches their own Brain, the route through which an advisor operates customer Brains, a workspace role, an audience-purpose grant, or several of those at once. R28 keeps those meanings separate.

If the login is the last active route to an operator who currently holds customer custody, deletion is blocked until a customer-authorised transfer. If the same stable operator has another active login, custody does not move at all. The access route changes; the customer relationship does not.

## Verified locally

- Thirteen deterministic planner cases cover sole-custodian access, alternate login continuity, role-only access, subject preservation, mixed personal and customer scope, closed custody and fail-closed malformed evidence.
- A PostgreSQL 18.3 canary reads two real relational workspaces through the R23 identity and custody model.
- The context's SHA-256 binds the exact verified inventory supplied to the planner.
- Revoked operator links, roles and grants leave current scope; the stable subject Brain remains.
- Ordinary authenticated callers cannot run the privileged relationship inventory.
- Missing users, incomplete active custody, duplicate identity and unrelated workspaces fail closed.

## Security boundary

The readback function is a narrowly granted security-definer function with an empty search path. It locks the target authentication row while reading, timestamps the snapshot inside PostgreSQL, returns no source content and grants execution only to the service role. The caller cannot backdate the inventory to revive expired access. The function does not mutate anything.

That lock ends with the surrounding transaction. A future executor must read, validate and act inside one transaction or reject a changed evidence hash. R28 does not prove same-transaction deletion, transfer races, an external Auth API sequence or Supabase-local and PostgREST parity.

## Historical relationship

R20 remains useful evidence of the founder's subject-versus-operator policy, but it used legacy ownership language and caller-assembled relationships. R28 supersedes it for operational planning because R28 reads the stable R23 identities and custody state directly.

## Boundary

This is a non-migration local proof. It performs no login deletion, custody transfer, customer closure or subject erasure. It creates no runtime route and touches no linked or production database. Correction, erasure and unified reading still need to work across both the legacy and custody-native prepared-intelligence generations before migration can be considered.
