# G25 HTTP RPC transport proof R93 QA record

## Anonymous HTTP

- Public share lookup: `200`, empty result.
- Public intake lookup: `200`, empty result.
- Pending verification read: `401 / 42501`.
- Memory verification mutation: `401 / 42501`.
- Decision pin mutation: `401 / 42501`.
- Direct overloaded role-helper call: `300 / PGRST203`, correctly classified as internal policy machinery.

## Authenticated HTTP

- Subject A password grant: `200`.
- Subject B password grant: `200`.
- Owner pending work: `200`, one fixture row.
- Cross-subject pending work: `403 / 42501`.
- Owner track record: `200`, one fixture row.
- Cross-subject track record: `400 / P0001`.
- Owner MCP-token list: `200`, empty list.
- Owner fact verification: `200 / true`.
- Cross-subject fact verification: `200 / false`, no mutation.
- Missing fact verification: `200 / false`, no mutation.
- Owner decision pin: `204`.
- Cross-subject decision pin: `403 / 42501`.
- Missing decision pin: `403 / 42501`.

## Stored post-state

- Owner fact: `verified`.
- Cross-subject fact: `inferred`.
- Owner decision pinned: yes.
- Cross-subject decision pinned: no.

## Cleanup and authority

- Auth users: zero.
- Auth identities: zero.
- Profiles: zero.
- Roles: zero.
- Facts: zero.
- Related events: zero.
- Decision cases: zero.
- Credentials or bearer tokens persisted: no.
- Production writes: zero.
- Production hotfix applied: no.

## Verdict

`ISOLATED_HTTP_TRANSPORT_PASS_PRODUCTION_EXECUTION_CLOSED`
