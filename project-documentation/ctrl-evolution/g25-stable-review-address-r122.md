# G25 stable review address R122

Status: passed in isolated development; product feature flag remains closed
Date: 2026-09-20
Depends on: R121 rendered authenticated lifecycle

## Outcome

R122 replaces proof-only check IDs and hashes with one stable owner-private address:

`/operator/reviews/<review-packet-id>`

The address opens an already frozen packet. Opening it is read-only. It cannot create a packet, mutate a standard, deploy or release anything. The leader does not see or carry a check ID, result hash, packet hash or credential in the URL.

The existing founder-approved review screen is unchanged. The permanent product route is implemented behind `VITE_ENABLE_STANDARD_REVIEW_ADDRESS=1`, requires an authenticated user and is absent from product navigation. The flag remains off.

## Isolated implementation

The isolated database now exposes `open_standard_change_review_v3(uuid)` to `authenticated` only. It:

- derives ownership from `auth.uid()`;
- returns only a ready packet owned by that user;
- verifies the complete packet hash and both packet schema markers before returning it;
- returns the same not-owned condition for an unknown ID and another owner's ID;
- returns false deploy and release authority;
- performs no insert, update or delete.

`review-standard-change-v3` is active at version 1 with JWT verification enabled. A downloaded copy of its deployed entrypoint matched the reviewed local entrypoint exactly. The RPC has authenticated execute only; `anon` and `public` have no execute privilege. An unauthenticated request returns 401.

## Hosted browser proof

Three Chromium journeys passed against short-lived synthetic users and four real frozen packets:

- a 1440 by 900 browser opened the exact packet from the clean private address, inspected evidence, approved and reversed the rule;
- an unknown address and cross-owner address produced identical customer-visible failure states;
- a 390 by 844 phone opened a second stable address and rejected the rule without horizontal overflow.

The browser made every decision through the actual address gateway, Supabase adapter and authenticated V3 route. The first attempt met the new route's cold-start window while correctly holding the single loading state; the hosted expectation was widened without changing product behavior. Both attempts cleaned all fixture rows. The final cleanup count is zero for auth users, packets, decisions, applications, reversals, versions, artifacts and criteria.

## Containment

- No customer or production data was used.
- The publishable key was transient and the passwords and sessions never entered a file, bundle, receipt, URL or log.
- The V3 migration and function exist only in isolated project `cgkcplcamsijghalintq`.
- Production mutation, merge to main, release, cutover, customer messaging and legacy retirement remain closed.

## Exactly one next action

R123 should add a read-only owner-private pending-review queue that returns only ready frozen packets in consequence order. It should give Krish one safe link to share and one reason it matters, without sending any notification or changing the approved review screen.
