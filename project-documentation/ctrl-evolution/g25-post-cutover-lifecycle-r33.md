# G25 post-cutover prepared lifecycle, R33

R33 proves that the final R32 service boundary supports the complete prepared-intelligence lifecycle it claims to expose.

One retained legacy receipt and one custody-native receipt are read together. One stable-custody correction then invalidates both. New material based on replacement authority becomes the only current result. One subject erasure finally destroys the protected payload and dependency material in both generations while the unified reader reports the Brain as erased.

## Why this matters

Privilege diagrams can be internally consistent and still leave the real product unable to complete a valid operation. A security definer can lack a grant, depend on caller privileges by mistake, or succeed in isolation while the following reader exposes stale material.

R33 tests the sequence a real service must survive, not only the shape of its doors.

## Verified locally

- Custody-native creation succeeds as `service_role` after the R32 cutover.
- The unified reader returns exactly one retained legacy receipt and one custody receipt.
- One correction invalidates exactly one receipt in each generation and leaves zero current items.
- Exact correction replay is idempotent.
- A custody receipt derived from replacement authority can be created and becomes the only current item.
- One stable erasure destroys one legacy and two custody payloads and every dependency row.
- Three receipt identities remain with exactly one content-free final erased event each.
- Exact erasure replay is idempotent.
- The unified reader returns `erased` with zero items.
- Legacy create, raw insert and raw revival attempts remain denied after the full lifecycle.
- Anonymous and authenticated roles cannot execute any active entrypoint.
- Six weakened cutover mutations fail the canary.

## Deliberate preservation

The legacy receipt is created before the cutover and never rewritten into the custody table. R33 proves that preserved history can remain useful through the unified reader and can still be corrected and erased by the stable-custody operations. This is the required middle ground between deleting proven machinery and leaving competing runtime paths alive.

## Boundary

This is a deterministic local PostgreSQL proof using one database connection. It does not prove multi-connection races, transaction retry behavior, Supabase-local or PostgREST parity, application caller correctness, migration safety or production operation. It does not authorise a linked database change, runtime integration, deployment, merge or release.
