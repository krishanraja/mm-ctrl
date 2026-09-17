# G25 subject reconsent reservation, R36

R36 proves a narrow restart boundary after erasure. It allows the service to reserve identifiers for a completely new Brain scope only when the old scope is already erased and the submitted identities match durable subject and operator history.

The old scope remains erased. Its tombstone is neither cleared nor rewritten. The reserved workspace and custody principal remain absent.

## Why reservation comes before creation

A service credential can verify database facts, but it cannot prove that a person saw a statement, understood it and chose to begin again. R36 therefore does not prove the person performed the consent action. It accepts a typed receipt only after checking the old erasure, the subject's login history, the active operator, the consent statement version, the purpose and unused new-scope identifiers.

That receipt has the explicit standing `reserved_not_created`. R36 does not create the new Brain scope. A later authenticated endpoint must bind a real subject action to the receipt, and a later atomic creator must resolve the production owner and workspace-kind semantics without reusing historical login identity as permanent Brain ownership.

## Fail-closed behavior

The proof rejects a non-erased previous scope, an unrelated consenting login, an existing workspace identity, reuse of the erased workspace, a conflicting replay, browser execution and raw service insertion. Exact retries are idempotent. Semantically equivalent alternate receipt IDs converge on the first accepted reservation so retry behavior cannot fork the person's intent.

Four deliberately weakened candidates are also executed. Removing the old-erasure check, removing the subject-link check, reopening authenticated execution or reopening raw service insertion makes the proof fail.

## Human agency boundary

The design keeps two decisions separate:

1. The person explicitly chooses to start a new Brain after erasure.
2. The system creates a technically valid new scope from that accepted choice.

Neither can stand in for the other. The product must show the statement plainly, attribute the action to the authenticated subject, keep a receipt and make the consequence clear. A service-generated event, inferred preference or operator assumption is not consent.

## Boundary

This is a local PostgreSQL-compatible candidate and executable design proof. It does not establish authenticated endpoint behavior, real human consent, new-scope creation, concurrent safety, Supabase-local or PostgREST parity, migration safety, legal sufficiency or production readiness.
