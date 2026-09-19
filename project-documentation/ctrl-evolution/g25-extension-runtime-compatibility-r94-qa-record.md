# G25 extension runtime compatibility R94 QA record

## Interface parity

- Used signatures compared: 6.
- Exact signature matches: 6.
- Production introspection: read only.
- Production writes: zero.

## `pg_cron`

- Named schedule created and read back: pass.
- Unschedule by name: pass.
- Unschedule by ID: pass.
- Remaining fixture jobs: zero.

## `pg_net`

- Credential-free request ID returned: pass.
- Queue method, URL and timeout shape: pass.
- Background worker consumed request: pass.
- Worker recorded expected loopback connection error: pass.
- Probe table removed: pass.
- Queue and response fixtures removed: pass.

## `vector`

- Column width: 1,536.
- Restored `match_user_memory` function executed: pass.
- Exact vector similarity: `1`.
- Orthogonal vector similarity: `0`.
- Ranking: correct.
- Auth, profile, role and fact fixtures: zero.

## Verdict

`TESTED_EXTENSION_APPLICATION_SURFACE_COMPATIBLE`
