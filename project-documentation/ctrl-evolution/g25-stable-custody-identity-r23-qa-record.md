# G25 stable custody identity R23 QA record

Status: local stable-identity and cryptographic compatibility pass. No migration or runtime claim.

The proof fixture pins legacy-backfill acceptance to one hour before its fixed transfer timestamps, so the archived test remains valid independently of the machine's wall clock. Production SQL still uses `now()` for real backfills.

## Evidence

- Eight direct workspace and prepared-data constraints read back against private stable subject or historical principal tables with `RESTRICT` behavior.
- Every operator principal uses an identity distinct from its linked auth user.
- Planned transfer then operator removal leaves three workspaces and all protected prepared evidence unchanged.
- A dual-role person's subject and operator principals remain while their authentication links, roles and grants disappear.
- A removed operator's outstanding JWT reads zero receipts; the explicitly granted replacement reads one.
- Transfer alone creates zero roles and zero grants.
- Out-of-band auth deletion yields `transfer_required`; later recovery reaches active custody without restoring the deleted login.
- Duplicate-current-custodian and wrong-source-transfer controls are blocked.
- Auth-bound historical-owner and auth-cascading subject negative controls fail as required.
- Twenty-eight adjacent authority and crypto tests pass, including two R23 tests that prove old ciphertext survives custody transfer and rejects historical-owner rewriting.

## Residuals

- This candidate has not run in a Supabase local image or linked environment.
- Multi-connection transfer races and PostgREST behavior remain untested.
- New prepared writes are not yet bound to stable custody in the runtime adapter.
- Customer closure is modeled but not executed.
- Anti-revival tombstone retention and re-consent remain unresolved blockers.
- Non-FK identifiers, storage, external processors and provider receipts remain outside this proof.

No migration, linked or production database use, auth-user deletion, automatic transfer, customer closure, runtime integration, deployment, merge or release is authorised.
