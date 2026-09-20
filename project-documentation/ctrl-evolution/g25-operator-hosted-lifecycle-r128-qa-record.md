# G25 hosted operator-review lifecycle, R128 QA

## Hosted result

- Isolated project: `cgkcplcamsijghalintq` (`legibility`).
- Production project: `bkyuxvschuwngtcdhsyg`, zero writes.
- Candidate source: real live Compile, Build, Check and owner-review conveyor.
- Complete human projection: added through the authenticated R118 V2 path before operator binding.
- Allowed operator request: HTTP 200, one ready item, exactly five projected fields.
- Raw packet returned: no.
- Direct raw review-table access: hidden.
- Direct access-receipt-table access: hidden.
- Exact operator owner-decision attempt: HTTP 404.
- Cross-workspace request: HTTP 200 with public `not_available`; private receipt `operator_role_missing`.
- First request after grant revocation: HTTP 200 with public `not_available`; private receipt `audience_grant_revoked`.
- Access receipts: three, hash-valid, field counts `5, 0, 0`, outcomes `allowed, denied, denied`.
- Owner standard, criteria and packet decision state: unchanged.
- Decision authority, active-standard mutation and notification: all false.
- Fixture residue: zero across eleven measured relation groups.

## Correction cycle

The first hosted attempt failed closed with private reason `review_packet_changed`. The packet was structurally valid for the legacy R116 owner route but did not yet contain the R118 presentation. The second diagnostic run reproduced the same reason and cleaned to zero. The proof then explicitly invoked the authenticated V2 projection step, refreshed the frozen packet hash and passed without weakening the R127 validator. This is the correct repair: operator access still requires complete human-readable material, and the next product seam must make projection completion inseparable from owner-controlled binding.

## Boundary

R128 proves the hosted read membrane and revocation behavior. It does not provide a product-facing binding or operator-provisioning workflow, does not approve any UI, and grants no production, merge, deploy, release, cutover or legacy-retirement authority.
