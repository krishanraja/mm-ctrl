# G25 atomic reconsented scope creation, R38

R38 proves the first honest restart after erasure: one accepted reservation creates one separate personal Brain in one transaction. It does not make the old Brain recoverable. The old tombstone remains intact and is checked again at the moment of creation.

## Identity is no longer ownership

The original schema required a personal workspace's subject UUID to equal its owner UUID because both were Auth users. R23 deliberately changed those meanings: the subject became the stable person and `owner_id` became immutable history. Keeping the old equality rule would silently turn a historical login-shaped identifier back into present ownership.

R38 removes that stale equality rule for the new model. The new personal Brain has four explicit identities:

- the same stable subject, because the person continues;
- a fresh workspace-scoped historical principal, because this is a new record of scope;
- the signed-in subject's current owner role, because present access must be revocable;
- the accepted operator's custody assignment, because operational control must be transferable.

The new historical principal uses the reserved workspace ID and the `workspace_scoped_v2` origin. It is not the subject's Auth user ID.

## Atomic creation

The creator locks the accepted reservation, rechecks the old erasure, current subject access, active operator and every reserved identity, then creates the workspace, roles, private audience grant, custody principal, consent-backed custody assignment and creation receipt in one transaction.

The reservation can be consumed once. An exact retry returns the same scope. A different creation identity for the same consent is rejected. Missing erasure, revoked subject access, retired operator or any reserved-identity collision causes the whole transaction to fail.

## Boundary

This is a local PostgreSQL-compatible candidate. PGlite proves transactional behavior on one connection, not concurrent connection races. No migration or runtime caller exists. Supabase-local constraints, PostgREST exposure, operational telemetry, rollback rehearsal and production performance remain unproved.
