# G25 deployed RPC dependency index R88 QA record

## Retrieval

- Active deployed functions: 183.
- Retrieved successfully: 183.
- Errors after bounded retry: 0.
- Functions with at least one retained dependency: 22.
- Distinct literal RPC dependencies: 13.
- Distinct Edge Function dependencies: 1.

## Containment

- Raw source committed: no.
- Dynamic arguments committed: no.
- Environment values committed: no.
- Secret values committed: no.
- Production writes: zero.

## Correction

- Prior false-negative contract: R83.
- Corrected caller: `send-results-email` to `sync_lead_to_sheets`.
- Caller trust route: service-role client.
- R83 ACL decision changed: no, because `service_role` was retained.

## Verdict

`DEPLOYED_LITERAL_DEPENDENCY_INDEX_DURABLE_PRIOR_FALSE_NEGATIVE_CORRECTED`
