# G24 trusted canonical ingress R27 QA record

**Parent:** frozen R26 commit `4f63710f16ea75b2b9240a1ae523f381e1c138ed`

- Exact materializer: passed
- Focused checker: 30 mutation families passed
- Machine SHA-256: `269d2b29d9e1b894c8c2bc5168c939fb0af92d3ce5bfe4b4de71a9d16348db0b`
- Founder lock: passed
- Locked kernel: 211 tests passed
- Full documentation chain: passed
- Diff and frozen R26 immutability: passed

Mutation coverage includes collision insert, overwrite and nondeterminism; missing dual proof roles; invented aggregate proof; one-row or equal-nonce assumptions; cross-clause nonce drift; invalid-proof nonce poisoning; missing malformed target or dual-proof storage; weak byte bounds; competing replay schemas; missing replay identities, response fingerprints and unconstrained replay fingerprints.

This record makes no PASS claim and authorises no runtime or external action.
