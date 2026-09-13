# G24 trusted canonical ingress contract R21

**State:** twentieth local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R20 candidate at `19443d23d92cc670a3cc1150327694ae879c2f6d`

## Purpose

R21 closes the six trust-boundary failures found in the independent R20 attacks. The generated JSON is the complete effective contract derived byte for byte from frozen R20.

## Result schemas are current

The operation result inventory is regenerated from the effective `use_release` union and both effective branch schemas. The inventory must equal those schema objects exactly. Historical R12, R6 and R11 schema identifiers cannot become active inventory.

## Held history has one exact shape

`held` and `replayed_held` are closed object schemas with exact versions. The committed-hold row and immutable response blob both bind the exact `held` schema version. Historical replay must validate the stored response as `held`, derive only the allowed replay fields and validate the result as `replayed_held`.

Unavailable, duplicate, corrupt or mismatched durable evidence still returns no response and creates no protected effect.

## Session authority is durable evidence

The case-control actor comes from closed append-only server-session evidence. Trusted issuer, trusted evaluator, account to stable actor binding, account access standing and server-session principal each have an exact current-row rule, row identity and content fingerprint.

Issuer, evaluator, binding, standing, expiry, registry lookup, case authority and grant checks resolve in one serializable transaction snapshot. Fresh mutation compares and swaps every controlling row before commit. Replay requires the current live stable actor to equal the original receipt actor. Fresh mutation requires the current live stable actor to equal the current engagement operator. Revoked, offboarded, expired, missing, duplicate, stale, untrusted or mismatched evidence holds without registry disclosure or write.

The caller cannot assert an actor.

## Hold identities are exact

Every case hold reason selects one closed typed fingerprint input, one domain and one result status. Each dependency has an explicit availability bit and either its canonical typed bytes or one exact literal unavailable sentinel. Correlation IDs are server-generated from sixteen cryptographically secure random bytes before any hold fingerprint or rejection result.

The selected admission row to reason mapping is exhaustive. Implementations cannot substitute a different sentinel, invent a reason or omit an unavailable dependency from the fingerprint.

## Release issuance branches before outbox work

The Release issuance graph selects the outcome before entering either branch. Pending delivery assembles exactly one outbox genesis after the universal result fingerprint. Invalidated-before-use executes an explicit zero-outbox assertion. The two branches share no processing node and rejoin only at the atomic transaction commit.

The result remains independent of later terminal fingerprints. The terminal-consumption row remains the sole authoritative Release receipt.

## Visible experience and boundary

R21 adds no interface copy, approval, customer state or administration. Session evidence, row versions, fingerprints, replay checks, sentinel values, hold routing and issuance order remain backstage.

R21 is still local trust infrastructure. It authorises no adapter, database change, customer data, research, model or provider call, deployment, merge, release or legacy-backend deletion. It does not prove intelligence, comprehension, decision quality, delight or customer value. Independent technical review remains blocking.
