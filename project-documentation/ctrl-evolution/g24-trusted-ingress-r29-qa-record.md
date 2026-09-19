# G24 trusted canonical ingress R29 QA record

**Parent:** frozen R28 commit `e3fcddbd7f4bc61c91122211831c0daf7d5ebc92`

- Exact materializer: passed
- Focused checker: 39 mutation families passed
- Machine SHA-256: `2f020a872e112a5fc07079f9128a8ee9952b8f4741005a295c0333d680eb4395`
- Founder lock: passed
- Locked kernel: 211 tests passed
- Full documentation chain: passed
- Diff and frozen R28 immutability: passed

Mutation coverage includes self-asserted and role-spliced bundle fields; wrong proof hashes, nonce subjects and verifier joins; weak bundle addressing; missing nonce receipt refs and read-set artifacts; incomplete receipt evidence; partial branch commits and crash-poisoned nonces; missing malformed-bundle evidence and role-spliced raw slots; unbound registry and hold source refs; missing replay lookup, first-replay writes, non-atomic pre-materialization and cross-row replay splicing.

This record makes no PASS claim and authorises no runtime or external action.
