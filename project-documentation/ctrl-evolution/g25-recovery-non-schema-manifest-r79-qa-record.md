# G25 recovery non-schema manifest R79 QA record

## Database metadata

- The pinned query returned eight fingerprint domains.
- It recorded 15 cron jobs, eight installed extensions, two publications, ten publication-table memberships, 31 roles, 19 role memberships, five Storage buckets and two Vault name records.
- Cron commands, Vault names and Vault descriptions were hashed in the database and not returned.
- Secret values were never selected.

## Edge Functions

- Supabase returned 183 functions, all active.
- 117 require platform JWT verification and 66 do not.
- Git contained 115 deployable function directories plus `_shared` at the production observation; every one existed live.
- Git now contains 121 deployable function directories. Six later routes are recorded as local-only since the observation rather than being falsely described as deployed.
- Sixty-eight live functions have no matching local source directory; all slugs are pinned in the contract.

`verify_jwt=false` is not by itself a vulnerability because webhooks and cron handlers may enforce their own authentication. It is a mandatory review flag. No function is declared safe from metadata alone.

## Verdict

The non-schema preservation register is sufficient to stop a baseline or cutover from pretending these surfaces do not exist. Source capture, caller tracing, behavior verification and disposition remain open. No deployment, deletion, secret read or production write occurred.
