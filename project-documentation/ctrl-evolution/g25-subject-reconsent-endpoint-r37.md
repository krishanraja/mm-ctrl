# G25 subject reconsent endpoint logic, R37

R37 turns the human-agency boundary into executable, dormant endpoint logic. A future signed-in subject sees one short statement and sends one exact decision: start a new Brain while the old one stays erased.

The statement is deliberately plain:

> Start a new Brain. My old Brain stays erased. Only information I add or approve from now on can enter the new one.

Its text, version and fingerprint are pinned together. Changing the wording requires a new version rather than silently changing what an earlier receipt means.

## What the browser is allowed to say

The browser may send only the previous workspace, the fixed decision, and the pinned statement version and fingerprint. It cannot submit the stable subject, previous custody, active operator, receipt ID, future workspace ID, future custody ID or tenant key.

Those privileged identities come from authenticated server context, a server-side scope resolver and server-generated UUIDs. The reservation command sets `consented_by_user_id` from the authenticated user, never from request content. R36 then rechecks the durable relationships in PostgreSQL.

## Bounded responses

An unavailable scope returns the same response whether the old workspace is absent, belongs to somebody else or is not eligible. Reservation errors do not expose database messages. A successful response returns only the receipt identity and `reserved_not_created` standing.

The logic also rejects any downstream response that claims the scope was already created. The person's acceptance and the system's creation remain separate, inspectable events.

## Boundary

This is a tested shared module, not a deployed Edge Function. Nothing imports it from an Edge Function entrypoint. Authentication, JSON parsing, rate limiting, abuse controls, HTTP headers, PostgREST behavior and database wiring remain future integration work. The tests prove endpoint logic under injected adapters; they do not prove a person acted, understood the statement or received legal advice.
