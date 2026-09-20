# G25 unified current prepared reader, R31

R31 gives the product one answer to a simple question: what prepared intelligence is safe and current for this person now?

The caller does not need to know whether an item was written before or after the stable-custody transition. One service-only reader examines both generations, applies the same currentness rules to each, and returns a deterministic sequence.

## Why this matters

A database row is not current merely because it still exists. Its source may have been replaced, its retention window may have ended, it may have been corrected or erased, or it may have been prepared for a future moment that has not arrived.

Those distinctions cannot be left to each screen, briefing or Claude handoff to remember independently. If stale material can be recovered by choosing an older table or a different query order, the Brain is not trustworthy.

R31 therefore makes currentness a retrieval property, not a UI convention.

## Verified locally

- Exact current legacy and custody-native receipts are both returned.
- Invalidated receipts from either generation are absent.
- Expired receipts and future-produced receipts are absent.
- Receipts whose authority dependency is no longer exact current authority are absent even if a correction job has not marked the receipt yet.
- A receipt without any dependency is absent rather than treated as trustworthy by default.
- A subject-erasure tombstone returns explicit `erased` standing and an empty item list.
- Reversing the two generation branches produces the same ordered receipt answer.
- Separate current receipts remain visible even when their content fingerprints match. The reader does not silently collapse legitimate context.
- Cross-workspace custody, inactive custody and legacy owner smuggling fail closed.
- The service role can execute the reader. Ordinary authenticated clients cannot execute it or query the six raw prepared tables directly.
- Seven weakened SQL mutations fail the canary.

## Currentness contract

Every returned item must satisfy all of these conditions at the server's statement time:

1. exact stable workspace, custody, subject, audience and purpose scope;
2. active custody;
3. produced already and not expired;
4. not invalidated and not erased;
5. protected payload and encryption version still present;
6. at least one provenance dependency; and
7. every dependency still resolves to the same current authority version and fingerprint observed by the receipt.

The final order is `produced_at` descending, then content fingerprint and receipt ID. It never relies on `UNION ALL` branch order or a preference for one storage generation.

## Architecture boundary

R31 revokes authenticated raw-table reads introduced by the two historical stores. Result-producing application code must use the service-only function after its own authenticated route has established that the request is allowed. Service infrastructure retains the table privileges needed by the existing writers, so exact writer retirement remains a separate cutover gate.

The response deliberately carries encrypted payloads and stable receipt metadata, not legacy owner identity. Decryption, projection into customer-facing language and delivery remain outside this database contract.

## Boundary

This is a non-migration local PostgreSQL proof. It does not wire a runtime route, prove API authorization, retire either writer, settle anti-revival retention, test concurrent reads against correction or erasure, or prove Supabase-local and PostgREST behavior. No linked database, migration, customer delivery or deployment is authorised.
