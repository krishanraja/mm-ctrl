# G25 standard-change owner gate R116 strategy

Status: in progress
Date: 2026-09-19
Target: isolated Supabase project `cgkcplcamsijghalintq` only
Source revision: `1bb7e9afdec4a8088c901f83a7523b202ce931a8`

## Outcome

One owner can inspect the exact passed R115 candidate, approve or reject that frozen change, and, after approval, atomically create a new active standard version. The same owner can reverse that application only while it is still the active head. Every action is hash-bound, owner-scoped, idempotent and read back from the isolated database. Apply, reject and reversal never authorise skill deployment, release, production, merge, cutover or legacy retirement.

## Why this route

The selected route is an append-only owner decision and version lineage around the existing `generated_artifacts` and `criteria` sources of truth. Apply creates a new standard artifact and one new criterion version inside one database transaction. Reversal creates a new head whose body is byte-identical to the prior standard and reactivates the exact prior criterion set. Neither action rewrites or deletes historical artifacts, criteria, checks, owner decisions or receipts.

The rejected material alternative is an `is_active` pointer beside `generated_artifacts`. That would introduce a second definition of the active standard while current consumers still resolve the newest standard artifact. It would require a broad reader migration before this bounded restoration stage could be trusted. R116 instead preserves the existing newest-artifact contract and adds explicit lineage and stale-head checks.

## Chain

`krish-principles -> strategy-brief -> build-apps-with-krish -> krish-build -> Supabase and Postgres contracts -> CTRL Check -> verification-loop`

No new material visual surface is in scope. R116 proves the data and authority contract that a later approved minimal owner review experience can consume.

## Governing rule

- Only a `passed` R115 Check over a `compiled` actionable candidate can produce an apply-ready review packet.
- The review packet freezes the exact source artifact, current criteria, proposed criterion diff, passed Check, evidence pointers, package hashes, planned artifact bytes and rollback consequence.
- The owner action must name the packet hash, planned standard hash and a stable idempotency request.
- Approval applies only the frozen packet. Rejection records the decision and changes no standard or criterion.
- Apply is one transaction. If any source, Check, criterion or active-head identity has changed, it writes nothing.
- Reversal is a new version, not deletion. It is allowed only if the applied artifact and applied criteria remain the current head.
- A successful apply or reversal remains private Brain state. Deployment and release stay closed.

## Assumptions and risks

- `generated_artifacts` newest `kind='standard'` row remains the active standard contract for this stage. A newer external writer therefore makes a prepared review stale.
- `criteria.is_current` remains the current criterion contract. The frozen criteria snapshot includes every active row, so unrelated concurrent change causes conflict rather than silent overwrite.
- R115 `compiled.amendment.instruction` is the owner-accepted replacement text for `narrow_applicability` and `revise`. R116 does not ask a model to reinterpret it.
- `retain`, `gather_evidence`, `add_awaiting_candidate`, `needs_evidence` and `no_change` are not applyable. R116 must not turn absence or uncertainty into a rule.
- Applying a revision must produce a meaningfully different criterion. A no-op packet is refused even if R115 passed.
- The body of a governed standard must not keep candidate-only wording. R116 renders a flat active version from the root elicited standard plus the complete current criterion snapshot and the accepted change record.
- A later standard or criterion change blocks reversal. R116 will never overwrite later work to make rollback appear clean.

## Authority

Autonomous authority covers local implementation, deterministic tests, a new exact migration, JWT-enabled Edge routes, synthetic hosted fixtures, migration and function deployment to the named isolated project, value-free advisor readback, complete isolated rollback and exact restore, and an atomic branch commit.

Closed without a new exact gate: production `bkyuxvschuwngtcdhsyg`, `main`, pull request merge, public release, customer data, Vercel production, legacy retirement, deletion and secret rotation.

## Pass signals

1. One synthetic passed candidate produces one immutable owner review packet with an exact before and after diff and stable hashes.
2. Approval creates exactly one new standard artifact and one criterion version in one transaction; the old artifact and criterion remain recoverable; deployment and release flags remain false.
3. Exact retry returns the same decision and application. A changed retry returns conflict. Two racing approval requests produce one application.
4. Rejection creates a decision but no artifact, criterion or application.
5. Cross-owner reads look absent and direct table writes fail.
6. Stale source artifact, stale criteria, non-passed Check, non-actionable candidate, packet tampering and no-op change all write nothing.
7. Reversal creates one new standard head whose body hash matches the pre-apply standard and restores the exact pre-apply current-criteria hash. Exact retry is idempotent. A changed or non-head reversal is refused without writes.
8. Cleanup leaves zero synthetic users and R116 rows.
9. A complete exact rollback removes only R116 functions, tables and migration history, leaves R114 and R115 intact, and an exact restore passes the hosted proof again.
10. A rollback takes receipt-first, access-exclusive `NOWAIT` locks over all R116 authority tables plus the active standard and criteria stores before snapshot derivation. An active owner RPC therefore causes an immediate no-change refusal rather than waiting into a lock cycle. Once the locks are held, rollback refuses both an unknown later standard head and an unknown later criteria-only state before any database mutation or Edge route removal.
11. Focused tests, full tests, build, documentation, baseline typecheck, secret scan, advisors and a fresh isolated CTRL Check reviewer pass.

## Rollback ready

The known-good isolated baseline is R115 at commit `1bb7e9afdec4a8088c901f83a7523b202ce931a8`, with thirteen R115 migrations and three R115 functions already source-verified. R116 will add its own explicit migration allowlist, function allowlist, destructive isolated rollback operator and exact restore operator. The rollback must not touch R114 decisions, R115 candidate records outside synthetic R116 fixtures, production or unrelated Edge routes.

## Exactly one next action

Create the R116 migration through the current Supabase CLI, then implement the frozen review, owner decision, atomic apply and head-safe reversal contract against local fixtures before any isolated deployment.
