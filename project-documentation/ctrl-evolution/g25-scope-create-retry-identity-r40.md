# G25 scope-creation retry identity correction, R40

R40 applies the R39 lesson to the second half of restart.

R38 originally required both the same request fingerprint and the same server-generated creation ID for idempotent replay. If the database committed but the HTTP response was lost, the next attempt would carry a new creation ID and be reported as a conflict even though it represented the same accepted instruction.

Creation identity now follows the accepted consent plus the server request fingerprint. A fresh transport event ID and later timestamp return the first creation. A changed request fingerprint still fails closed.

The regression proof now exercises exact replay, fresh-ID replay and conflicting-request replay. Exactly one creation row and one new Brain remain.

This does not prove simultaneous multi-connection races. It proves the correct sequential recovery semantics for the future adapter.
