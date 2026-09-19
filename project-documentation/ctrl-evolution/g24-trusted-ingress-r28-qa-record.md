# G24 trusted canonical ingress R28 QA record

**Parent:** frozen R27 commit `41984124b10f31aeb51a55aaee1639d2b074652c`

- Exact materializer: passed
- Focused checker: 37 mutation families passed
- Machine SHA-256: `6c0f8c998506bf8df1a43c6b3b669e355513d346050b2fc1fef4d5482c4e3f69`
- Founder lock: passed
- Locked kernel: 211 tests passed
- Full documentation chain: passed
- Diff and frozen R27 immutability: passed

Mutation coverage includes stale session request versions and proof fields; request fingerprint key drift; bundle substitution and weak content addressing; missing dual receipt evidence or nonce receipts; composite nonce authority; collapsed or incomplete hold slots; stale and unresolved manifest refs; replay cycles, self-hashes and cross-row splicing; collision writes and nondeterministic request identity; recursive same-version semantic changes; visible and external expansion.

This record makes no PASS claim and authorises no runtime or external action.
