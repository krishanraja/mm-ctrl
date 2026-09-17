# G25 non-cascading owner guard R22 QA record

Status: local PostgreSQL canary pass, no custody-solution or runtime claim.

## Evidence

- Four exact owner constraints read back with PostgreSQL delete action `r` (`RESTRICT`).
- A blocked differently-subjected owner deletion leaves six fixture records unchanged.
- Workspace transfer alone remains blocked by the three historical prepared-owner references.
- A role-only operator deletion succeeds and leaves the customer workspace present.
- Subject deletion after workspace transfer removes the subject workspace and its prepared rows.
- Replacing every owner restriction with cascade makes the canary fail as required.

## Residuals

- The guard deliberately does not solve custody transfer.
- Historical attribution and encryption binding need a stable identity independent of an operator login.
- The anti-revival tombstone purpose and retention period remain unbound.
- Concurrent transfer, removal and erasure have not been exercised.
- Supabase-local image and PostgREST parity remain untested.

No linked database, migration, auth-user deletion, automatic transfer, customer closure, deployment, merge or release is authorised.
