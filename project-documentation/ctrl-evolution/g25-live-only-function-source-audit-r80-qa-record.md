# G25 live-only function source audit R80 QA record

## Retrieval

- All 68 slugs in R79 were retrieved through the read-only Supabase function endpoint.
- One batch hit the provider rate limit. The retry respected the returned wait window and completed in smaller sequential batches.
- Final retrieval errors were zero.
- Raw code was not added to the repository.

## Static evidence

- Combined source size: 2,593,805 bytes.
- Functions with a platform deployment SHA: 29.
- Distinct environment-variable symbols: 32.
- Distinct table references: 44.
- Service-role symbol present: 39 functions.
- Explicit `auth.getUser` marker present: two functions.
- `verify_jwt=false`: 31 functions; 22 also reference the service-role symbol.
- High-confidence credential literal matches under the bounded scanner: zero.

## Caller scan

A current-repository fixed-string scan excluded project evolution records, candidate SQL, checker scripts and generated output. It found runtime references for `enrich-company`, `google-sheets-sync` and `transcribe`. Documentation, configuration and test-only mentions were not treated as callers.

External invocation logs, deployed older frontends, webhook registrations and third-party schedules were not available through this scan. Sixty-five functions therefore remain `caller_unknown`, not `unused`.

## Verdict

The source is retrievable and the first risk queue is known. Authentication sufficiency, present-day business value and retirement safety remain unproved. No source publication, function mutation, secret read, deployment or deletion occurred.
