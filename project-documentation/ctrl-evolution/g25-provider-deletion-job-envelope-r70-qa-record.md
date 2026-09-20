# G25 provider deletion job envelope R70 QA record

## Automated evidence

- Vitest: 14 tests passed.
- ESLint: compiler, tests and isolated config passed.
- Dispatch output includes no ciphertext or raw provider handle.
- Destination derives from the verified operation.
- R69 topology fingerprint mismatch fails closed.
- Dispatch time is contained by the five-minute R68 authority.
- Retries stop at five and require explicit predecessor lineage.
- Tampered tokens and another job's authority fail closed.
- Extra fields are rejected before compilation.

## Residual risks

- No transport identity, queue, persistence or delivery guarantee exists.
- No acknowledgement or terminal result is modeled.
- Concurrent retry delivery has not been tested.
- Dead-letter and operator recovery behavior are unspecified.
- A future worker must reverify authority at the database boundary; trusting the dispatch alone is forbidden.

## Decision

Accept R70 as the only allowed cross-cell dispatch shape. Keep all transport and runtime claims closed until append-only lifecycle receipts and recovery semantics are proved.
