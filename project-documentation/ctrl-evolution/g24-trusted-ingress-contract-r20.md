# G24 trusted canonical ingress contract R20

**State:** nineteenth local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R19 candidate at `0851d07d99d4f25ce315c7d7b2e60f75f97bb46d`

## Purpose

R20 closes the four trust-boundary failures found in both R19 attacks. The generated JSON is the complete effective contract derived byte for byte from frozen R19.

## Release identity is acyclic

Release now has an explicit issuance dependency graph. The transaction first resolves current authority and projection inputs, assembles a result-independent terminal precommit identity and computes its fingerprint. Both result branches contain only the neutral terminal-consumption reference and that precommit fingerprint. The selected result bytes and universal operation-result fingerprint come next. Only then may the terminal-consumption semantic and row-envelope fingerprints be computed.

The result never contains or depends on either later terminal fingerprint. The terminal-consumption row remains the sole authoritative Release receipt and binds the precommit identity, selected result schema, universal result fingerprint and exact result branch.

## Legacy branch receipts are inactive

The old pending-delivery and invalidation branch receipts no longer appear in active write sets, replay identity, fingerprint schemas or outbox authority. Invalidated-before-use is one terminal-consumption outcome with no outbox. Pending-delivery is one terminal-consumption outcome with one exact outbox genesis.

The outbox origin binds the selected result schema and universal operation-result fingerprint. It does not trust a branch-specific legacy fingerprint.

## Holds are reconstructible history

A committed hold has one closed append-only registry row and one closed content-bearing response blob, each with a complete fingerprint and unique lookup. They commit atomically or neither exists.

Held replay is an exhaustive historical projection of those two immutable records. It adds only replay time and fixed historical and non-current flags. Missing, duplicate, corrupt or mismatched hold evidence returns no response and creates no protected effect.

## Case actor comes from the live session

The case-control caller cannot provide an actor field. The server derives the stable actor only from the authenticated live session before registry lookup. Exact replay requires that live actor to equal the original receipt actor. Fresh mutation requires that live actor to equal the current engagement operator.

Account, operator-offboarding and session revocation are checked for both paths. Missing, stale, ambiguous, offboarded or revoked identity fails closed without registry disclosure or write.

## Case outcomes are total

One ordered pre-admission and registry table covers request-size failure, parse failure, malformed or closed-schema failure, request-fingerprint failure, session failure, revocation, exact replay, different-actor replay, collision, fresh-authority failure, stale authority, commit, serialization exhaustion and unexpected internal failure.

Every result is a member of one closed union. Each hold has its own domain-separated evaluation fingerprint and discloses no receipt, binding or registry identity.

## Exact lifecycle references

The canonical predecessor lifecycle reference is accepted as a property key only when the key is byte-for-byte equal to that exact field name. Punctuation and identifier suffixes are invalid.

## Visible experience and boundary

R20 adds no interface copy, approval, customer state or administration. All fingerprints, receipts, row versions, actor derivation, failure routing and issuance order remain backstage.

R20 is still local trust infrastructure. It authorises no adapter, database change, customer data, research, model or provider call, deployment, merge, release or legacy-backend deletion. It does not prove intelligence, comprehension, decision quality, delight or customer value. Independent technical review remains blocking.
