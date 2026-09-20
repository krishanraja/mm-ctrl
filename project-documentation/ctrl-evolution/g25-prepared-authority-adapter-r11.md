# G25 prepared-authority adapter, R11

Status: `postgresql_wasm_real_brain_authority_pass_decision_authority_closed`

Machine record: [g25-prepared-authority-adapter-r11.json](g25-prepared-authority-adapter-r11.json)

## What is now real

R11 replaces the R10 test registry with fail-closed adapters over the canonical Brain shapes that can honestly support currentness today:

- an exact `brain_item_version`, bound to workspace owner, subject, audience and purpose;
- an exact external `brain_source`, with an integrity digest, external locator and active retention.

The adapter returns only authority metadata: kind, record, version, digest, recorded time and exact scope. It never returns the source or item content. The digest still covers the semantic row, including its encrypted content, so a meaningful row change moves the authority fingerprint without leaking the material into the dependency receipt.

R11 then uses both real authority kinds in the R10 atomic store. The resulting prepared receipt cannot be created from a stale version, a future observation, the wrong workspace, a superseded or prohibited item, an expired source, a wrong-purpose source or an unverifiable source.

## Current does not mean true

The adapter accepts both `current` and `disputed` Brain items because an actively disputed belief can be important context. It does not erase that distinction: standing is part of the hashed projection, so a change from disputed to current changes the authority digest. Any downstream projection must preserve the epistemic standing rather than presenting currentness as endorsement.

External sources are deliberately stricter. A source without the exact `prepared_intelligence` purpose remains unavailable. R11 does not widen older records through a compatibility guess.

## Deliberately closed

Decision cases and claims still return no authority. Their legacy rows lack a canonical Brain workspace binding and immutable snapshot fingerprint. Enabling them by inferring workspace from a user would manufacture certainty and weaken the very boundary R7 introduced.

This is a real exclusion, not unfinished copy. The kinds remain closed until their data model can support exact authority.

## Exact proof

On exact-pinned PGlite 0.5.8, PostgreSQL 18.3 proves:

- both canonical Brain authority kinds produce content-free receipts;
- the item and source are accepted by the R10 atomic store together;
- semantic item changes move the authority digest;
- stale version, pre-recording observation and cross-workspace reuse fail closed;
- superseded and prohibited-in-context item versions fail closed;
- expired, wrong-purpose and unverifiable external sources fail closed;
- decision authority remains disabled;
- removing consequence permission, retention or workspace isolation makes the canary fail;
- rollback leaves zero Brain, prepared-receipt or event rows.

## Honest boundary

The disposable fixture matches the canonical columns R11 reads, but it is not the full migration graph. Supabase-local image, extension, RLS integration and PostgREST parity remain pending while Docker and Podman are unavailable. Multi-connection replay, correction invalidation, cryptographic erasure, migration and a runtime caller also remain closed.

The next safe step is atomic correction invalidation: when authority changes, every affected prepared receipt must stop looking current and receive a payload-free lifecycle event in the same transaction.
