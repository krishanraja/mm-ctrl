# G25 provider deletion dispatch lifecycle R71

**Status:** The append-only dispatch lifecycle is locally proved. Persistence remains unproved.

## What the ledger can now say

A deletion operation is no longer reduced to “sent” or “failed.” R71 distinguishes dispatch, target acceptance, completion, retryable failure, terminal failure, retry request, dead-lettering, operator recovery request and a linked recovery dispatch.

Every event names the immediately preceding event. Event identities are unique, time cannot move backwards, and every event stays within one R70 dispatch and attempt. Completion stores a result-receipt SHA-256. Failure stores a bounded machine code and evidence SHA-256. Neither stores provider content, customer content, ciphertext, raw handles or explanatory prose.

## Retry and recovery

A retryable failure may request one linked retry while attempts remain. Attempt five cannot request attempt six; it must dead-letter. A terminal failure can dead-letter immediately.

Dead-lettering ends automatic work but does not pretend the problem is resolved. The lifecycle separately reports:

- `automatic_terminal`: automation will not continue on this dispatch.
- `operator_attention_required`: a person must decide what happens next.
- `closed`: the dispatch completed, handed off to a bounded retry, or was linked to an operator-approved recovery.

An operator recovery is two events: a request backed by a note digest, then a link to a different replacement dispatch. History is preserved rather than rewritten.

## Bounded result

Fourteen local tests pass. They cover success, retry, fifth-attempt dead-lettering, terminal failure, premature dead-letter rejection, operator recovery, chain integrity, duplicate identity, post-completion mutation, actor scope, content-free failure detail, time regression, dispatch substitution and unexpected fields. No database, queue, alert or recovery UI was touched.
