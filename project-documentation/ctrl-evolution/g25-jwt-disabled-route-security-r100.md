# G25 JWT-disabled route security R100

**Status:** Every current JWT-disabled repository route now has an explicit static disposition. This closes the unclassified queue, not the hosted security gate.

## What changed

R99 found fourteen JWT-disabled routes outside the existing containment harness. Ten already had a credible route-specific guard. Four needed repair:

- `capture-lead` remains public but now has method, media, byte, per-isolate, distributed IP and hashed-email limits. Rate-limit authority fails closed.
- `prompt-coach` now requires gateway JWT, verifies the user with Auth and rate-limits paid inference per user. It no longer belongs in the JWT-disabled set.
- `send-diagnostic-email` is machine-only and requires an exact configured bearer before it can send.
- `share-card` remains public for share previews but now has method, URL, field, per-isolate and distributed IP limits plus cache controls.

The four routes are now enforced by the trust-containment source harness. The other ten retain their existing route-specific contracts and are pinned by the R100 checker.

## Replacement-project portability

`decision-reactions` and `stripe-webhook` were silently hard-wired to the production project reference. They now require an exact configured `EXPECTED_SUPABASE_PROJECT_REF`, so the same source can be safely bound to an isolated target without weakening the production guard.

The Stripe handler also used to continue after a non-conflict failure to record its idempotency key. It now returns 503 before any access-grant side effect so Stripe can retry after the durable replay authority recovers.

## What is still not proved

No Edge Function has been deployed. Static markers and pure tests do not prove Supabase gateway behavior, environment values, provider signatures, distributed rate limiting or load behavior. The public capture and card routes still require a platform-level bot or abuse control decision before release. Signed webhook routes require hosted replay tests with test credentials.

The production project remains untouched. The sixty-eight live-only functions remain preserved under the existing do-not-retire boundary.
