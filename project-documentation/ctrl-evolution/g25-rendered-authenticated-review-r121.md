# G25 rendered authenticated review R121

Status: passed in isolated development; permanent product route remains closed
Date: 2026-09-20
Depends on: R120 authenticated product gateway

## Outcome

R121 mounts the founder-approved review experience over the real `StandardReviewGateway` and Supabase adapter in Chromium. The browser holds a real authenticated session for a short-lived synthetic owner in isolated project `cgkcplcamsijghalintq`. The approved layout and wording are unchanged.

Three serial browser journeys passed:

- a 1440 by 900 desktop rendered the exact immutable packet, opened its evidence layer and prepared all four reviews before any rule changed;
- a desktop owner approved and reversed one rule while a 390 by 844 phone holding an older packet moved to the explicit stale state;
- a separate 390 by 844 phone rejected its packet, showed the current rule was kept and produced no horizontal overflow.

The browser made the real decisions. No backend shortcut supplied the approval, rejection, conflict or reversal result. The proof used the product's actual React experience, gateway, Supabase adapter and authenticated V2 Edge Function.

## Sequencing defect caught

The first proof attempt prepared later candidates only after an earlier rule had changed. The backend correctly marked them stale, but that did not represent the intended concurrency scenario. The repaired proof freezes every review packet before the first decision. One packet then wins, one already-open packet loses, and the winner reverses. The failed attempts cleaned all fixture rows before the corrected run.

This matters beyond testing: a review link must refer to a packet frozen before the leader opens or decides it. Creating a supposedly competing packet after the standard has changed cannot prove stale-state behavior.

## Containment

- The fixture used wholly synthetic users, evidence and standards.
- The browser bundle contained only the isolated URL and publishable key. The short-lived password and session were supplied to Playwright at runtime and were never written to a file, bundle, receipt or log.
- The harness is local, unlinked and absent from product navigation.
- The final cleanup count is zero for auth users, review packets, decisions, applications, reversals, versions, artifacts and criteria.
- Production received no write. Customer data, merge to main, release, cutover and legacy retirement remain closed.

## Honest boundary

The product surface is now proved from rendered browser to authenticated receipt, but the permanent operator route still accepts only the locked synthetic R118 preview. A durable review link and pending-review retrieval contract do not yet exist. The local harness deliberately accepts check ID and result hash in its temporary URL; that is proof plumbing, not the intended customer address.

## Exactly one next action

R122 should create a stable owner-private review address backed by a read-only retrieval action for an already frozen packet, then connect the authenticated product route behind a closed feature flag. The customer URL must not expose fixture credentials or require a check hash, and unknown or cross-owner identifiers must remain indistinguishable.
