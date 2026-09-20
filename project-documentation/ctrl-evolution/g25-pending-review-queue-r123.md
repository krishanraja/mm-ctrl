# G25 pending review queue R123

Status: passed in isolated development; no notification or operator surface added
Date: 2026-09-20
Depends on: R122 stable owner-private review address

## Outcome

R123 gives an authenticated owner one trustworthy next review without exposing the machinery or inventing importance from prose. The response contains only:

- the number of ready reviews;
- one next review identifier and safe private path;
- the exact frozen question, headline and consequence;
- when the packet became ready.

If no review is ready, the response says so without fabricating work. It does not return packet hashes, check identifiers, evidence internals or another owner's state.

## Selection restraint

The current packet model has no evidence-backed urgency or materiality field. R123 therefore refuses to claim that a model can identify the most consequential packet from persuasive wording alone. It selects the oldest ready packet first, with a stable identifier tiebreak, and explicitly records `materiality_inferred: false`.

This is a temporary honest ordering rule, not the future intelligence model. Consequence-aware priority must be earned later from governed decision importance, timing and human commitments rather than guessed from copy length or model confidence.

## Isolated implementation

The isolated database exposes `get_pending_standard_change_review_v4()` to `authenticated` only. It derives the owner from `auth.uid()`, counts only that owner's ready packets, validates the selected packet hash and both frozen schema markers, and performs no insert, update or delete.

`review-standard-change-v4` is active at version 2 with JWT verification enabled. Its downloaded entrypoint matches the reviewed local entrypoint. The RPC has authenticated execute only; `anon` and `public` have no execute privilege. An unauthenticated request returns 401. The database linter reported no finding tied to the R123 function.

## Hosted lifecycle proof

One live isolated run created three complete frozen review packets for a short-lived owner and exercised the real product projection through V4:

- the first read returned three ready reviews and the first packet's exact safe path and consequence;
- rejecting that packet reduced the count to two and selected the second packet;
- approving the second reduced the count to one and selected the third packet;
- every queue read left the active standard untouched;
- no notification was sent;
- all fixture users, packets, decisions, applications, reversals, versions, artifacts and criteria were removed.

The first hosted attempt exposed an invalid Edge import map and failed before queue access. The probe cleaned every fixture row. The import map was corrected to the proven V3 dependency contract, the function was redeployed, and the complete repeat passed. The failure and repair remain part of the evidence rather than being hidden.

The build gate also exposed that R122's new authenticated address binding lacked its own experience-governance receipt. A corrective preflight receipt now records that the binding changes no approved visual treatment, claims no new experience approval and remains closed to navigation and release.

## Authority boundary

This is an owner-private queue. It does not let Krish silently enter every customer's Brain. The operator dashboard still needs an explicit workspace-role and audience-grant contract, including expiry, revocation and an access receipt, before cross-customer retrieval can be implemented.

Production mutation, merge to main, customer notification, release, cutover and legacy retirement remain closed.

## Exactly one next action

R124 should freeze the smallest explicit operator-access grant and audit contract needed for Krish to retrieve a customer's pending review without impersonation, blanket service-role access or audience leakage. It should reuse the existing workspace and authority doctrine, remain headless, and make no production change.
