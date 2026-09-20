# G25 stable custody envelope, R24

R24 defines the write identity for new prepared intelligence after R23 separates login, subject, custody and historical identity.

New receipts bind to the workspace's stable custody principal. They do not bind to an operator principal, an authentication user or the legacy `owner_id`. An operator transfer therefore changes who may steward and access the Brain without changing the authority identity of intelligence already produced for that Brain.

## Verified locally

- The versioned R24 envelope requires workspace, stable custody principal, subject, canonical audience, exact purpose and typed current authority.
- A matching custody readback must be `active`. `transfer_required`, `closed`, unknown, mismatched and malformed custody states fail closed.
- Operator, auth-user or other unknown fields cannot be smuggled into the stable scope.
- Dependency scope must match the exact custody principal as well as workspace, subject, audience and purpose.
- Stale, missing, duplicate or malformed authority remains held.
- Dependency order cannot change the authority fingerprint.
- Changing the current operator outside the stable scope leaves the exact envelope and fingerprint unchanged.
- The legacy R7 envelope and R23 cryptographic compatibility checks pass unchanged beside R24.

## Why this is separate from access

The custody principal says which customer Brain the prepared object belongs to. It does not say which human can read or write it. Current access remains the combination of live auth identity, workspace role and exact audience-purpose grant. Current stewardship remains the custody assignment. This prevents a transfer from either rewriting history or silently granting access.

## Boundary

R24 is a pure TypeScript contract. No database table, write function or runtime producer uses it. It does not migrate R7 receipts, change old fingerprints or claim that scheduled producers have proved current custody.

The next gate is a versioned atomic-store candidate that accepts R24 for new writes while preserving R7 and R10 data exactly. The principal-removal planner must then consume R23 custody state before any executable removal path can open.
