# G25 research provider outcome, R55

R55 completes the in-memory half of the dormant research corridor. After a future dispatcher acts, the classifier can express only three honest initial outcomes: accepted, rejected or unknown. It binds the event evidence to the prepared receipt, provider and request digest.

A raw provider request ID is permitted only as transient input. It is converted through an injected provider-scoped HMAC and never appears in the returned R51 event command. If the provider returned no identifier, the durable field remains null. CTRL does not invent traceability it does not possess.

When a retention control is verifiable only on the response, such as a returned ZDR header, the classifier requires a response-control digest. A pre-request assertion alone cannot satisfy that mode. The evidence digest also binds the outcome kind, response digest and optional control-response digest.

## Boundary

Ten R55 tests and nine R54 tests pass. Typecheck reports no new errors. The HMAC key and provider result are synthetic. The module does not call a provider or database, and it does not yet prove that the composed receipt plus initial event are accepted together by PostgreSQL.

No live route, external request, linked database, migration, deployment, merge or release was touched.
