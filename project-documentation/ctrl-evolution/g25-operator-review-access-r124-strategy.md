# G25 operator review access, R124 strategy

## Outcome

Freeze the smallest honest authority boundary that lets Krish pull one customer's pending standard review without becoming that customer, using a browser service credential, or acquiring decision authority.

## Why this gate exists

R123 proved an owner-private queue. It did not prove cross-customer operator access. The current review packet is bound to an auth user, but it has no explicit Brain workspace, stable subject, audience or purpose. The Brain substrate already separates workspace membership from content visibility. Operator access must reuse that spine rather than create a second permission system.

## Governing choices

1. Reuse `brain_workspaces`, `brain_workspace_roles` and `brain_audience_grants`.
2. Require an authenticated user linked to a stable operator principal.
3. Require the customer owner to grant the exact `operator` role and the exact audience-purpose pair `delivery_team_private` plus `standard_change_review_preparation`.
4. Require a finite `expires_at` chosen from an explicit engagement or consent window. Do not invent a thirty-day or ninety-day product rule.
5. Recheck role, grant, expiry, revocation, workspace lifecycle and packet binding on every read. Cached authorization never survives a new request.
6. Extend `standard_change_review_packets` in place with workspace, subject, operator-projection audience and operator-projection purpose. Do not label the raw packet itself delivery-team visible and do not add a parallel packet-scope concept. Old unbound packets remain owner-only.
7. Return only the frozen operator-safe projection: review ID, question, headline, consequence and ready-since time. The raw packet remains owner-only. Raw source text, evidence detail, hashes, criteria, prompt material and private Brain items remain closed.
8. Record every allowed and denied attempt in one general append-only `brain_access_receipts` concept. Store identity, scope, purpose, result and returned field names, never private plaintext.
9. Keep customer authority intact. The operator can prepare a conversation and open the safe projection. The operator cannot approve, reject, apply or reverse the customer's standard.
10. Keep the system pull-only. Access begins only after Krish deliberately selects a customer workspace. No notification, automatic outreach or hidden background read is created.

## Existing truth this preserves

- A role establishes membership, not content visibility.
- An audience grant establishes exact purpose-bound visibility, not ownership or custody.
- Stable subject, stable operator, authentication login and custody remain separate identities.
- Supabase remains the single source of truth.
- One durable table represents one concept; multiple surfaces may read it, but no shadow permission or audit store is introduced.
- Service-role credentials remain server-side and cannot become a browser access mechanism.

## Current runtime gaps

- `standard_change_review_packets` lacks workspace, subject, operator-projection audience and operator-projection purpose columns.
- The stable operator-principal schema exists only in the verified custody candidate chain, not the live review runtime.
- No general append-only access-receipt table currently proves who read customer Brain material.
- R123 derives the owner from `auth.uid()` and cannot be widened safely by swapping in a caller-supplied owner ID.

These gaps mean R124 is an executable contract, not a runtime access claim.

## Next bounded implementation

R125 may create a local rollback-only PostgreSQL candidate that extends the packet in place, introduces the one general access-receipt concept and proves an authenticated operator read under positive and adversarial cases. It must not infer scope for old packets, deploy to production, expose full packet content or add operator decision authority.
