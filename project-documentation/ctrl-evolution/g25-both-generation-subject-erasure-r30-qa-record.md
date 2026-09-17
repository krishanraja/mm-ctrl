# G25 both-generation subject erasure R30 QA record

Status: local PostgreSQL cross-generation erasure pass. No migration or runtime claim.

## Evidence

- PostgreSQL 18.3 PGlite canary passes.
- One legacy and one custody-native prepared receipt are erased from one stable-custody request.
- Ciphertext, encryption version, dependencies and prior events are destroyed in both generations.
- Exactly one deterministic content-free erased event remains per affected receipt.
- An unrelated subject and workspace remain byte-for-byte unchanged.
- Exact replay is idempotent; conflicting replay, future occurrence time and legacy owner smuggling are denied.
- Both prepared writers deny silent subject revival.
- A prior R13 tombstone is bridged into stable custody instead of hiding surviving custody-native payload.
- Erasure remains possible after operator access ends and custody closes.
- A custody-event failure rolls back the preceding legacy mutation and stable tombstone.
- Forced RLS, service-only execution and lack of direct service payload-update privileges are read back.
- Four weakened SQL mutations fail the canary.
- The unchanged R13, R25, R27 and R29 gates pass beside R30.
- Strict lint passes for all changed scripts. Typecheck remains at the accepted 94-error baseline with no new failures, and the full 1,438-test unit suite passes.

## Residuals

- R13 remains callable as a legacy-only erasure operation until exact runtime cutover retires it.
- The anti-revival tombstone retention, expiry and re-consent policy is unresolved. Indefinite retention exists only inside this bounded proof.
- Source material, complete-Brain deletion and delivered external copies are outside this operation.
- A unified reader across both receipt generations remains incomplete.
- Multi-connection erasure races are untested.
- Supabase-local, PostgREST and production parity are untested.

No linked database, migration, runtime integration, legacy retirement, auth-user deletion, deployment, merge, release or external action is authorised.
