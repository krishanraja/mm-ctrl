# G24 trusted canonical ingress R30 QA record

**Parent:** frozen R29 commit `c6362ca899d164d2ec632d80f65f6c2e766f782c`

- Exact materializer: passed
- Focused checker: 45 mutation families passed
- Machine SHA-256: `78bbac3dc89bb89ce4309161ab43f4e62456fb7f86616f61f7dd454a3b55b03b`
- Founder lock: passed
- Locked kernel: 211 tests passed
- Full documentation chain: passed
- Diff and frozen R29 immutability: passed

Mutation coverage includes forged R29 parent identity and all three corrected R28 provenance roots; caller bundle refs; random bundle identities; request-sourced workspaces; missing, redirected or open projection fields; projection fingerprint and store substitution; incomplete receipt projection triples; singular nonce leakage into session read sets; missing role-specific nonce evidence; invalid consuming-hold branches; raw evidence carrying nonce authority; session hold evidence missing from hold, result or transaction; hold aliases; competing replay stores; missing or spliced historical response evidence; first-replay writes; missing atomic replay materialization; nonce receipt weakening; raw role splicing; same-version semantic drift; visible-surface expansion and external action.

This record makes no PASS claim and authorises no runtime or external action.
