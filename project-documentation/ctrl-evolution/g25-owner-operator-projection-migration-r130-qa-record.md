# G25 owner-to-operator projection lifecycle, R130 QA

## Migration and rollback

- Isolated project: `cgkcplcamsijghalintq` (`legibility`).
- Production project: `bkyuxvschuwngtcdhsyg`, unlinked and zero writes.
- Migration version: `20260920190000`.
- New packet fields: exactly two, first-bound owner and time.
- Owner binding RPC: executable by `authenticated`; denied to `anon` and direct `service_role`.
- Existing packet rows bound by migration: zero.
- R115 conveyor, R123 owner-private queue and R127 operator membrane: preserved.
- Destructive rollback: passed.
- Prior four-field constraint restored by rollback: passed.
- Exact restore and catalogue readback: passed.
- Restored catalogue SHA-256: `a52495727685241d2146a3247d754433b2df543e89a5ca000a1f20443effd05f`.

## Hosted lifecycle

- Candidate source: real live Compile, Build, Check and owner-review conveyor.
- Presentation completion and exact workspace binding: one authenticated owner action.
- Exact retry: idempotent; first-bound time preserved.
- Cross-owner and cross-workspace rebind: denied.
- Roles and grants created by binding: zero.
- Operator projection: HTTP 200, one ready item, exactly five allowed fields.
- Raw review packet: not returned and direct table read hidden.
- Operator owner-decision attempt: HTTP 404.
- Active standard, criteria and packet state: unchanged.
- Notification: none.
- Fixture residue: zero across eleven measured relation groups.

## Boundary

R130 changes only the isolated development project. It does not approve the product-facing owner or operator experience and grants no production, merge-to-main, release, cutover or legacy-retirement authority.
