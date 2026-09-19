# G25 extension runtime compatibility R94

**Status:** The newer default extension versions are compatible with the exact interfaces and behaviors used by the restored application. This is a bounded application-surface claim, not general equivalence.

## Why this mattered

The first blank replay restored the application schema exactly but could not install production’s older extension patch versions. Schema parity alone could therefore hide a runtime break in schedules, HTTP dispatch or semantic memory retrieval.

R94 first compared the six used function signatures across production and the isolated project. All six match exactly: both `cron.schedule` forms, both `cron.unschedule` forms, `net.http_post` and the restored `match_user_memory` function over vector input.

## Runtime behavior

The recovery project then exercised the behavior behind those interfaces.

- `pg_cron` created and read back a harmless far-future job, removed it by name, created a second job and removed it by ID. No fixture jobs remain.
- `pg_net` accepted a credential-free loopback POST, returned an ID, wrote the expected queue shape, let its background worker consume the request and recorded the expected local connection error. The response, queue row and transient probe table were removed.
- `vector` stored two 1,536-dimensional Brain facts and queried them through the restored `match_user_memory` function. The exact vector scored `1`, the orthogonal vector scored `0`, and ranking was correct. The Auth user, profile, role and facts were removed.

Production was queried only for interface metadata. Production writes remain zero.

## What this does not prove

R94 does not assert that every feature of the three extensions is equivalent across versions. It proves the exact application surface found in the production schema and migrations. A later application change that uses another signature or operator needs its own compatibility evidence.

The remaining recovery gap is now above these primitives: end-to-end critical application behavior, non-schema restoration and the second clean replay.
