# G25 provider deletion persistence authority R72

**Status:** The narrow persistence-authority overlay is locally proved. No identity or grant is provisioned.

## The contradiction it resolves

R69 correctly denied the authority issuer a custody database credential. R71 then made durable dispatch history necessary. Giving the issuer `service_role` to write that history would undo every least-privilege decision made since R66.

R72 adds a separate permission plane without widening custody:

- The issuer receives a dedicated dispatch-ledger login that can only record dispatches and append issuer events.
- The crypto writer keeps its R69 writer credential and gains only target-event append beside verified registration.
- The deletion worker keeps its R69 worker credential and gains only target-event append beside verified lease and destruction.
- Operator recovery uses a human session. It receives no new machine secret.

The overlay binds the exact R69 topology fingerprint. Writer and worker credential references must match that topology; the issuer ledger credential must be separate. Generic credentials, reused references and extra functions all fail closed.

## What this does not claim

The compiler handles secret references and function names, not secrets or database privileges. It does not create roles, issue passwords, inspect a cloud deployment or prove human-session RLS. Those claims begin only after PostgreSQL tables and functions exist and a disposable environment shows the real grants.

## Bounded result

Ten local tests pass. They cover the accepted overlay, deterministic ordering, issuer privilege escalation, operator machine credentials, generic service credentials, reuse, topology identity drift, stale topology, duplicate principals and unexpected fields. No credential, role, table or environment was changed.
