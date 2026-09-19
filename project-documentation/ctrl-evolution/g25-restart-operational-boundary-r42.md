# G25 restart operational boundary, R42

R42 specifies how R41 may eventually become reachable without turning a rare, consequential human choice into an ordinary API call.

## Live boundary

The future Edge Function has one public operation: accept the signed-in subject's exact restart decision. Creation is internal and is never a second browser endpoint. The function accepts `POST` only, requires a verified user JWT, limits JSON to 2 KB, allows only configured product origins and returns the bounded R41 response codes.

No model is involved. No service credential may stand in for the subject. The browser cannot supply subject, operator, custody, consent, creation or future-workspace identity.

## Abuse and retry controls

Before authentication, the edge may apply a coarse IP abuse ceiling without recording the address in product telemetry. After authentication, the proposed initial limit is five attempts per subject and previous workspace in 15 minutes and 20 per subject in 24 hours.

The limiter must distinguish attempts from effects. R39 and R40 convergence remains authoritative, so an allowed retry never creates another reservation or Brain. A limit response is `429 restart_rate_limited` with a retry time and reveals nothing about workspace existence.

## Minimal telemetry

Operational events may record event name, release version, route version, outcome code, duration bucket, retry standing and a keyed correlation digest. They must not record bearer tokens, email, raw user or workspace UUIDs, request bodies, statement text, database error text, Brain content, old custody or new custody IDs.

Required events are:

- statement served;
- request rejected by bounded reason class;
- reservation created, idempotent or converged;
- creation created or idempotent;
- reservation pending creation;
- downstream contract mismatch;
- endpoint disabled by rollout control.

The controller-owned audit receipt remains in PostgreSQL. Telemetry is not the consent record.

## Alerts

Alert immediately on any downstream contract mismatch, any attempt to return a scope other than the accepted consent's scope, or any uniqueness invariant failure. Alert when `reserved_not_created` remains unresolved for five minutes, when failure rate exceeds 5 percent over 15 minutes after at least 20 attempts, or when p95 database duration exceeds five seconds over the same minimum sample.

Low traffic must not manufacture noisy percentage alerts. A pending receipt has a repair queue and operator runbook; it is never silently retried by an LLM.

## Rollout

The feature is off by default behind a server flag and a workspace allowlist.

1. Rehearse the exact migration, grants, rollback and concurrent retry tests in Supabase local.
2. Run synthetic operator-only probes with no customer identity.
3. Run one internal subject restart through the real authenticated path.
4. Enable one explicitly consenting pilot workspace with Krish observing the receipt and recovery telemetry.
5. Expand only after zero contract mismatches, zero duplicate effects and every pending reservation resolves under the runbook.

There is no bulk enablement step. Each added workspace is a separate rollout decision.

## Rollback

Rollback disables the server flag and preserves every accepted receipt and created scope. It does not drop tables, reverse erasure, delete a partially created Brain or edit consent history. Pending reservations remain visible to the repair runbook. Database rollback means forward-fixing the candidate migration after rehearsal, not restoring a backup over newer human actions.

## Remaining gates

No live caller is allowed until real PostgreSQL concurrency, Supabase-local migration and rollback, PostgREST grants, Edge Auth integration, rate-limit storage, telemetry redaction and the operator repair runbook all pass. Legal and controller review of the statement and retention records remain separate gates.
