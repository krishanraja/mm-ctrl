# G25 operator review access, R124

Status: `headless_authority_contract_frozen_runtime_closed`

R124 freezes the missing authority boundary between the owner-private R123 queue and a future Krish operator view.

An operator read is allowed only when one authenticated login is linked to a stable operator principal, the exact customer workspace is deliberately selected and active, an owner-granted `operator` role is active, and an owner-granted `delivery_team_private` grant for `standard_change_review_preparation` is active and unexpired. The review packet must independently name the same workspace, subject and owner, bind its operator-safe projection to the same audience and purpose, and still be ready.

The finite grant expiry comes from explicit engagement or consent, not an arbitrary product duration. Any revocation, expiry, role removal, workspace mismatch, subject mismatch, owner mismatch or audience mismatch fails closed on the next request.

The authorized projection is deliberately small: review ID, the frozen question, headline, consequence and ready-since time. The raw packet remains owner-only. The projection grants no approval, rejection, application or reversal power. The owner-private route remains the only decision route.

Every attempt must produce an append-only access receipt containing the authenticated user, stable operator principal, workspace, subject, owner, role issuer, grant, audience, purpose, requested resource, result, reason and returned field names. It contains no private plaintext. Allowed data and its receipt must be committed atomically; denied attempts are receipted while the caller receives only `not_available`.

The contract reuses the existing workspace role and audience grant system. The future schema must extend `standard_change_review_packets` in place rather than create a second scope mapping. It may introduce one reusable `brain_access_receipts` table because no access-audit concept exists today.

The executable evaluator passes one positive case and seventeen adversarial cases. It rejects missing stable identity, wrong workspace, inactive workspace, owner use of the operator route, wrong or revoked roles, self-granted authority, wrong purpose, wrong audience, open-ended or expired grants, cross-workspace and cross-subject packets, owner-private projections, wrong projection purpose and decided packets.

This is not live operator access. Current review packets remain owner-only because they do not yet carry the required workspace and audience binding. No database, Edge Function, UI, notification, customer data, production deployment, merge, release or legacy retirement is authorized by R124.
