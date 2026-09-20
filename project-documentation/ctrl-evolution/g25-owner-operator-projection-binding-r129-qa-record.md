# G25 owner-controlled operator projection binding, R129 QA

## Local PostgreSQL proof

- Candidate: `supabase/candidates/g25_owner_operator_projection_binding_r129.sql`.
- Runtime: `@electric-sql/pglite@0.5.8`.
- Presentation completion and workspace binding: same transaction.
- Exact retry: idempotent; first-bound time preserved.
- Bound scope: one workspace, its subject, `delivery_team_private`, `standard_change_review_preparation`, owner and first-bound time.
- Other owner: denied.
- Cross-workspace rebind: denied.
- Stale check: denied.
- Decided packet: denied.
- Direct authenticated table update: denied.
- Partial scope: denied by the all-or-none constraint.
- Operator roles created: zero.
- Audience grants created: zero.
- Operator access, owner decision authority, active-standard mutation and notification: all false.
- Rebind mutation control: failed the preserved acceptance expectation as required.
- Production writes: zero.

## Boundary

R129 is schema and PostgreSQL behaviour only. It does not deploy the candidate, provide operator access, approve a product UI, touch customer data or authorize production mutation, merge, release, cutover or legacy retirement.
