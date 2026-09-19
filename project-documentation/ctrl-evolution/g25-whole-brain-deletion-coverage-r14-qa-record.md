# G25 whole-Brain deletion coverage R14 QA record

Date: 17 September 2026

Verdict: `REPOSITORY_COVERAGE_MAP_COMPLETE_EXECUTION_CLOSED`

## Verified from the repository

- All eleven canonical Brain tables are present in the coverage contract.
- Canonical workspaces, sources and stable items have auth-user or workspace cascade paths.
- The current delete-account function maintains manual explicit and sweep lists.
- It purges only `ctrl-briefings` and `documents`, one list page at a time.
- `generate-skill-export` writes ZIPs to `skill-packages`.
- The deletion response can report `success: true` alongside non-empty errors.
- The account-deletion E2E suite is skipped and checks a bounded table list.
- Retained audit inserts include the user's email.
- External processors are present across AI, search, audio, email, billing and spreadsheet flows.
- No runtime, migration, provider or customer data was changed.

## Not proved

- Complete deletion of any real account.
- Provider-side or backup deletion.
- Recursive storage coverage.
- Legal basis and retention duration for surviving audit evidence.
- A schema-derived execution plan, retry model or completion receipt.

## Required next gate

Define exact retention policy and external-copy language, then build a fail-closed erasure planner whose inventory is derived from the schema and whose completion receipt distinguishes deleted, scheduled and customer-controlled copies.
