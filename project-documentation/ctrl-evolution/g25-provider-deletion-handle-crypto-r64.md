# G25 provider deletion handle crypto R64

Status: capability-specific encryption proved. Persistence closed.

R64 keeps raw provider object IDs out of content-free receipts and closure facts while preserving the ability to perform a later, authorized deletion. The handle is encrypted with AES-256-GCM. Associated data binds it to the workspace, provider exchange, handle record, provider, custody class, creation time, expiry and provider-deletion purpose.

## Two custody classes

An ElevenLabs generation handle is useful only during the provider's operational retention window. It must expire within 35 days and should be destroyed earlier after operational deletion.

A Stripe customer object exists for the account relationship, not one request window. Its handle therefore uses encrypted account-lifetime custody with no arbitrary calendar expiry. It must be destroyed after operational account closure. The legally retained Stripe record remains a separate R63 fact and never justifies keeping the operational handle.

## What is prevented

Ciphertext cannot be moved to a different workspace, receipt, handle record or expiry. Provider and custody-class substitution reject. Raw handles must be bounded printable tokens with no spaces or control characters. Key rotation writes with the new key while allowing old ciphertext to be read under its recorded key ID.

This is cryptographic envelope proof, not key-management proof. No table, lease, consumer, closure hook or provider call exists yet. The next gate is function-only persistence with single-purpose leasing and mandatory destruction semantics.

No provider call, database write, migration, live route edit, deployment, merge or release is performed by R64.
