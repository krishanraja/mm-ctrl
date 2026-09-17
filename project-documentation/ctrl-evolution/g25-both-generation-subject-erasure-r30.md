# G25 both-generation subject erasure, R30

R30 prevents a subject's prepared intelligence from surviving merely because some of it was written before the stable-custody transition and some after it.

One service-only operation now destroys protected payload material in both the legacy R10 and custody-native R25 generations, removes their dependencies and prior events, leaves one deterministic content-free erased event per receipt, and records one stable-custody tombstone that both writers must respect.

## Why this matters

Erasure cannot mean “deleted from the newer table.” A leader should not need to know which generation stored a briefing, recommendation or context package before asking for it to disappear.

Nor can operator access be the thing that makes privacy possible. If a login has already been removed, a delivery relationship has ended or custody has been closed, an authorised erasure must still be able to reach the subject's protected prepared material. The operation therefore validates the durable workspace, custody and subject relationship without requiring a current operator login.

## Verified locally

- PostgreSQL 18.3 erases one legacy receipt and one custody-native receipt in one call.
- Ciphertext and encryption-version material are null in both generations after erasure.
- Dependencies and prior events are removed; exactly one deterministic erased event remains beside each receipt.
- A separate subject and workspace remain byte-for-byte unchanged.
- Exact replay returns the original counts; conflicting replay and a second erasure identity cannot rewrite the result.
- Both R10 and R25 writers reject silent revival after the stable tombstone exists.
- A subject already carrying an R13 legacy tombstone is not mistaken for complete erasure. R30 still removes the custody-native payload and records stable custody completion.
- Erasure succeeds after the relevant custody assignment has ended and the custody principal has been closed.
- A forced custody-event failure rolls back the earlier legacy mutation, dependency deletion, event replacement and stable tombstone.
- Extra legacy owner identity, future occurrence time and ordinary authenticated execution fail closed.
- Removing either generation's subject scope, custody payload destruction or the stable anti-revival seam makes the canary fail.

## Architecture boundary

The new erasure receipt is stable-custody native and contains no operator login or legacy owner identity. The existing R13 tombstone remains historical evidence and still participates in the shared anti-revival check. R30 does not rewrite or delete it.

R13 also remains callable as a legacy-only erasure operation. That is an intentional historical compatibility boundary, not a complete runtime design. It cannot remain a competing result-producing writer after cutover because invoking it alone would leave custody-native material untouched.

The R30 function is a narrowly granted `private` security-definer operation. Browser roles cannot execute it, and the service role has no direct insert or payload-update privilege that could bypass its checks.

## Policy boundary

The proof keeps the new content-free anti-revival tombstone without an expiry. That is the conservative local behavior needed to prove non-revival, not a final product or legal retention promise. Its purpose, lawful basis, duration, expiry and re-consent behavior remain an explicit founder and policy gate from R16.

## Boundary

This is a non-migration local PostgreSQL proof. It does not delete the subject's complete Brain, remove external copies, erase source material outside these two prepared-receipt generations, retire the R13 writer or expose a unified reader. Multi-connection races, Supabase-local and PostgREST parity, migration preflight, runtime integration and production observability remain unproved.
