# G25 prepared-receipt crypto, R9

Status: `local_crypto_extension_passed_database_use_blocked`

Machine record: [g25-prepared-receipt-crypto-r9.json](g25-prepared-receipt-crypto-r9.json)

Verification: [G25 prepared-receipt crypto R9 QA](g25-prepared-receipt-crypto-r9-qa-record.md)

## Outcome

The strict Brain cipher now understands a prepared receipt as its own semantic record, not a disguised source.

A prepared payload is authenticated against:

- workspace;
- subject;
- receipt record ID;
- `prepared_receipt` and `payload` meaning;
- canonical audience;
- exact `prepared_intelligence` purpose;
- the R7 authority-envelope fingerprint.

Changing any of those values makes decryption fail before plaintext is returned. A receipt therefore cannot be silently moved between audiences or attached to a different authority state even inside the same workspace and subject.

## Improvement over the existing cipher

The previous cipher checked that record and field tokens were each known, but not that their pairing made semantic sense. R9 adds exact pair enforcement:

- source and content;
- assertion and statement;
- item version and meaning;
- relationship version and explanation;
- prepared receipt and payload.

This is a genuine improvement, not just preservation. Invalid combinations now fail closed.

## Compatibility

Existing valid Brain contexts produce the exact same associated-data bytes as before. Cipher version, algorithm, keyring behavior and rotation behavior are unchanged. R9 adds context only for the new prepared-receipt kind.

## Deliberate boundary

R9 proves pure local cryptographic behavior. It does not create a database table, touch a key or environment, execute RLS, encrypt production content or connect runtime callers.

Database-backed use remains blocked until the R8 exact-purpose canary passes against a disposable local PostgreSQL runtime.
