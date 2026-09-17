# G25 provider exchange retry identity correction, R51

R51 corrects a defect found while composing the next provider boundary. R49 made the request payload digest part of the table's unique key. That would incorrectly describe two separate executions of the same search as one event forever. At the same time, an exact retry checked only the receipt ID, callsite and request digest, so changed retention evidence could be silently treated as the same operation.

The corrected model separates three identities:

- receipt UUID identifies the stored record;
- operation idempotency digest identifies one intended execution and its retries;
- request digest identifies the outbound payload and may legitimately recur in later operations.

Lifecycle events now use the same separation. An exact retry converges on the first record. Reusing the operation identity with changed evidence, time or state fails closed. Using a new operation identity with the same request payload creates a new receipt.

## Boundary

The overlay deliberately refuses to apply when the dormant R49 tables contain rows. R49 was never authorised or applied as a migration, so there is no live backfill to improvise. A future reviewed migration should materialise the consolidated R51 table definition directly.

The six-check canary runs in single-process PGlite. The exception path is prepared for a database uniqueness race, but independent-connection concurrency is not proved. No linked database, live route, provider call, deployment, merge or release was touched.
