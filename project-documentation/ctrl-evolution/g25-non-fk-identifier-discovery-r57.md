# G25 non-FK identifier discovery, R57

R17 could only see relations connected to `auth.users` through declared foreign keys. R57 inventories the opposite surface: columns capable of identifying or linking a person without that catalog path.

## What the executable inventory found

The generated schema contains 76 tables and 932 row columns. Conservative name and type rules identify 183 non-FK candidates:

- 36 high-risk lookup anchors such as email, phone, auth-like UUID and provider identity;
- 31 names, network identifiers or pseudonymous linkage fields;
- 116 JSON containers that may embed identity or personal context beyond the visible schema.

Thirteen high-risk anchors belong to tables the live account-deletion function never mentions. They include referral email pairs, executive-intake and pulse participants, workshop participants, leads, legacy `users` identity and an unlinked publication creator.

Migration history adds 94 candidates absent from the generated schema. Seventeen of the newly visible candidates are JSON-bearing columns in the R115 candidate-standard machinery; they are included because a new migration must expand the erasure inventory even while that machinery remains isolated. Eighteen high-risk examples in unmentioned tables include email analytics, Edge delivery, kit delivery and memory-related identities. This is evidence of schema drift or historical residue, not proof that every table is live. The real PostgreSQL catalog must resolve that ambiguity.

## Why this does not become a generic delete loop

An email or name match does not establish subject ownership. The same email may be a facilitator, referrer, recipient, audit actor or account holder, each with a different deletion, redaction or retention rule. Likewise, finding a table name in `delete-account` does not prove nullable legacy rows or embedded JSON are covered.

The correct next step is a reviewed target registry for the current generated-schema anchors, followed by live-catalog reconciliation for migration-only findings. No query or deletion is generated from a naming heuristic.

## Boundary

This is static repository evidence. It does not inspect a linked database, row values, storage or provider systems. It changes no live deletion code and performs no migration, deployment, merge or release.
