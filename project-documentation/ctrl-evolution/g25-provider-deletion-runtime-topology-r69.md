# G25 provider deletion runtime topology R69

**Status:** The three-cell secret-isolation contract is locally proved. No deployment boundary is yet proved.

## Why code-level roles are not enough

If one runtime can read the issuer key, both database credentials, the decryption capability and provider credentials, three database roles are theatre. R69 makes the deployment boundary part of the machine contract rather than leaving it in an architecture diagram.

The required cells are:

- **Authority issuer:** can sign one R68 authority. It has no custody database credential, encryption capability, decryption capability or provider credential.
- **Crypto writer:** can register. It has one writer database credential and an encrypt-only capability. It cannot sign, decrypt or call provider deletion.
- **Deletion worker:** can lease, decrypt, call provider deletion and destroy. It has one worker database credential, a decrypt-only capability and a deletion credential. It cannot sign or encrypt.

Every cell must have a different deployment boundary, secret domain and set of secret references. Generic credentials such as `SUPABASE_DB_URL`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` fail the compiler because they conceal privilege breadth.

## What the manifest does not prove

A manifest can prevent architectural drift in review and CI, but it cannot prove the cloud configuration matches it. The next evidence must inspect actual service boundaries, secret-manager policies, custom database users and cryptographic permissions without reading secret values.

The current R64 local AES keyring also does not prove encrypt-only versus decrypt-only power. Production requires KMS or an equivalent broker whose policy can grant those operations separately. Until that exists, R69 is a target topology, not a deployed security claim.

## Bounded result

Fourteen local tests pass. They cover cell cardinality, boundary uniqueness, secret-domain uniqueness, credential reuse, generic privileged credentials, signing leakage, decryption leakage, provider-credential leakage, operation escalation, unexpected fields and deterministic fingerprinting. No credential, service, queue, KMS policy, database role or provider was created.
