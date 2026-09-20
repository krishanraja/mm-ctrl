# G25 receipt-store state machine, R5

Status: `local_pure_state_machine_pass`

Machine contract: [g25-receipt-store-state-machine-r5.json](g25-receipt-store-state-machine-r5.json)

Dependency: [G25 lossless producer receipts R4](g25-lossless-producer-receipts-r4.md)

Verification: [G25 receipt-store R5 QA](g25-receipt-store-state-machine-r5-qa-record.md)

## Result

A pure local state machine now specifies how prepared-intelligence receipts may exist without becoming a second Brain.

It separates:

- an append-only, payload-free event ledger;
- canonical content blobs that can be erased;
- current receipt availability;
- projections that depend on exact receipt identities;
- delivery events that carry no truth authority.

## What it prevents

R5 fails closed when:

- one receipt identity is replayed with different content or scope;
- owner, subject, audience or purpose does not match;
- a receipt has expired;
- a correction touches one of its Brain dependencies;
- the subject has been erased;
- a projection depends on any unavailable receipt;
- delivery is attempted after correction, expiry or erasure;
- input is malformed or is not canonical JSON.

Exact replays remain idempotent. An exact projection replay stays idempotent even if a later correction has made the projection stale.

## Correction and projection behavior

Every accepted receipt names the Brain records on which it depends. A correction command can invalidate only matching receipts in the same exact scope. Any prepared projection bound to an invalidated receipt then resolves as stale.

The state machine does not rewrite the old receipt or quietly regenerate a briefing. That future action must pass the Brain and selection machinery again.

## Erasure behavior

The audit ledger never stores content. Erasure removes the separate content blob and adds a payload-free tombstone containing only identities and fingerprints. The tombstone blocks silent re-creation of content for that owner and subject.

This is a model, not proof of production deletion. Encryption, key destruction, backups and vendor convergence remain separate gates.

## Delivery is not truth

A read, audio, email or export delivery event may be recorded only while its receipt is available. If a later correction invalidates that receipt, the prior delivery record remains historical but cannot keep the receipt or its projection current.

## Honest limits

The in-memory store is not authenticated against a hostile caller. There is no database, transaction isolation, RLS, encryption, backup deletion, concurrent writer test or live readback. Correction replacement lineage and a future explicit new-consent path after erasure are also not modeled.

## Next gate

Map this state machine onto the existing Brain governance and retention architecture as a migration proposal only. The proposal must reuse owner, workspace, audience, correction and erasure authority rather than creating parallel policy. It must include transactional write/readback, RLS, encryption, idempotency, rollback and zero-live-caller evidence before any database change is authorised.
