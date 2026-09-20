# G25 subject reconsent endpoint R37 QA record

Status: dormant endpoint logic verified by 10 targeted tests. No deployed endpoint, new-scope, migration or production claim.

## Evidence

- The published statement fingerprint matches its exact text.
- Authentication failure prevents scope resolution and reservation.
- The request shape rejects extra privileged identity fields.
- Consent attribution uses the authenticated user ID.
- Subject, custody and operator identities come from the injected server resolver.
- Receipt and future-scope identities come from the injected server UUID source.
- Wrong decision, old statement version and wrong statement hash fail closed.
- Unavailable scopes do not reveal existence or ownership detail.
- Reservation errors do not leak database detail.
- A result claiming scope creation is rejected.

## Residuals

- There is no Edge Function entrypoint or HTTP integration.
- The future entrypoint must authenticate through Supabase Auth and must not accept a service credential as subject consent.
- Rate limiting, challenge freshness, replay telemetry and browser interaction design are not proved.
- The atomic new-scope creator and personal-workspace ownership semantics remain unresolved.
- Supabase-local, PostgREST, multi-connection and production behavior remain unproved.

No application caller, endpoint deployment, scope creation, migration, linked database use, release, merge or external action is authorised.
