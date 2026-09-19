# G25 provider deletion stable-custody recovery R75

**Status:** Recovery authority now follows current customer custody locally. Independent hosted sessions remain unproved.

## The completed human authority chain

R74 proved that recovery needs an active human workspace operator. R75 closes the remaining ownership gap by requiring the same signed-in user to resolve through R23's stable identity model:

1. the session is authenticated and non-anonymous;
2. the user has an active operator role on the dispatch's workspace;
3. the login has an active link to a non-retired stable operator principal;
4. that operator holds the workspace's single current custody assignment;
5. the customer custody principal is still open.

A workspace role alone is insufficient. A stable operator link alone is insufficient. A former custodian retaining both login and workspace access is still insufficient after authorised transfer.

## Why this matters to the product

The customer's Brain remains attached to its subject and customer custody, not to whichever Mindmake operator first created it. Operational recovery can move to a replacement steward through the same explicit custody transition without rewriting the Brain, dispatch history or historical evidence.

This makes the principle visible in machinery: an exceptional action belongs to the current accountable human relationship, not an old account, an old owner field or a permanent administrator credential.

## What this does not claim

The proof composes the exact dormant R23, R73, R74 and R75 candidates inside one PGlite process. It does not prove hosted Supabase Auth, PostgREST, independent login sessions, production RLS, migration compatibility, queue delivery or provider action. The SQL remains a dormant candidate.

## Bounded result

Four focused integration tests pass. They cover the current custodian, an operator without custody, a revoked stable auth link and a full customer-authorised transfer from former to replacement operator. No linked database, customer record, credential, provider or deployment changed.
