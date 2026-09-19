# G24 trusted canonical ingress contract R22

**State:** twenty-first local repair candidate for independent attack; no adapter, database or runtime implementation

**Supersedes:** the rejected R21 candidate at `754994c868c31c29ffe5ed077ac3668d7ed9b95c`

## Purpose

R22 closes the seven trust-boundary failures found in the independent R21 attacks. The generated JSON is the complete effective contract derived byte for byte from frozen R21.

## One server-presented human principal

The server presents one closed, fingerprinted principal projection. Its session reference, session-instance hash, workspace, account, stable actor, principal kind, actor class, authority version, issue time, expiry and current standing bind exactly to the selected durable session evidence. The principal fields shared with `principal_schemas.human_session` match byte-for-byte. Request, principal and current case must name the same workspace.

The caller cannot supply this projection or any field within it. Session-instance lookup is uniquely scoped by workspace and fails closed on any missing, duplicate, stale or cross-workspace evidence.

## Authority stores cannot appoint themselves

The session issuer, evaluator, account-to-actor binding, account standing and session evidence stores each have one internal writer, explicit issuance and transition operations and a direct-DML prohibition. Issuer and evaluator authority begins at one offline root trust anchor. Account and session rows join exact current trusted issuer and evaluator evidence.

All authority, standing and grant rows resolve in one serializable snapshot. Any concurrent revocation, offboarding, expiry or authority change causes retry and then a hold without write.

## Receipts preserve the authority actually used

Every case-control receipt contains and fingerprints the complete session authority read set: root anchor, presented principal, session evidence, issuer, evaluator, account binding, account standing, case binding and grant seals. Commit rehydrates each exact row version, recomputes its fingerprint and compares and swaps the complete set in the same transaction.

## Hold dependencies have exact types

Every fingerprint dependency has one source path, source schema, scalar type, availability bit and canonical encoding. Identifiers use the identifier encoding. A SHA-256 request fingerprint uses exactly thirty-two raw digest bytes. Alternate text, hexadecimal, identifier, raw or implementation-defined substitutions are forbidden. Unavailable values still use only the exact R21 sentinel bytes.

## Replay is an exact historical projection

`replayed_committed` is one exact closed schema. Committed replay validates that schema and retains the selected result-schema digest. Held replay no longer claims that the whole payload is unchanged while also adding replay fields. Instead, every historical field equals the original held response and only status, replay time, historical flag and current-standing flag may differ.

## Release schemas bind meaning, not labels

The `use_release` result derivation is versioned. Its union and both branches bind exact schema references plus SHA-256 digests of canonical schema bytes. The selected schema digest persists through result blob, committed success, response, replay, Release terminal consumption and pending outbox lineage. A same-version semantic change therefore fails verification.

## Visible experience and boundary

R22 adds no interface copy, approval, customer state or administration. Principal projection, authority stores, read sets, fingerprints, replay checks and schema digests remain backstage.

R22 authorises no adapter, database change, runtime connection, customer data, model or provider call, UI change, deployment, merge, release or external action. It does not prove intelligence, comprehension, decision quality, delight or customer value. Independent technical review remains blocking.
