# G25 hosted operator-review lifecycle, R128

Status: `isolated_authenticated_lifecycle_passed_zero_residue`

R128 proves that the R127 operator membrane works against a real owner candidate rather than a hand-authored demo row. A disposable owner candidate travelled through the live Compile, Build and Check conveyor, became a genuine owner review packet, gained the required R118 human-readable projection and was then bound to one disposable workspace.

An independently authenticated disposable operator with the exact owner-granted role and finite audience-purpose grant received one pending item. The response contained only five fields: review ID, question, headline, consequence and ready time. Direct reads of both the raw review table and the access-receipt table returned no usable data.

The proof then supplied the operator with the exact private packet and standard hashes and attempted an owner decision through the real review route. It returned 404 and left the packet and owner standard unchanged. Asking for another customer's workspace returned HTTP 200 with the same public `not_available` response while the private receipt recorded `operator_role_missing`. Revoking the exact audience grant took effect on the next request; the public response remained identical and the private receipt recorded `audience_grant_revoked`.

The three authenticated operator attempts created three hash-valid receipts: one allowed receipt naming five returned fields and two denied receipts naming none. Every receipt states that no decision authority was granted, no active standard was mutated and no notification was sent.

Cleanup removed all three Auth users, both workspaces, the role, grant, stable operator identity and auth link, access receipts, candidate requests, review packets, criteria and generated artifacts. Every measured fixture count returned zero. Production received zero writes.

This proof exposes the next real seam. The legacy R116 preparation path creates a valid owner-only packet but not the R118 presentation required for operator projection. R128 repaired the fixture through the authenticated V2 presentation path before binding it. Product wiring must never rely on an administrator to remember those two steps. R129 may design and locally prove one owner-controlled, presentation-complete packet binding operation that is exact and idempotent, grants no operator role or audience access, and cannot rebind a packet across customers.
