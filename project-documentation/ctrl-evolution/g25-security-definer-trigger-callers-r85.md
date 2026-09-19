# G25 trigger-only privileged callers R85

**Status:** The direct-execution ACL candidate for 15 trigger functions is ready for isolated testing. Production is unchanged.

## Why this lane exists

These functions return PostgreSQL `trigger`. Their job is to run behind a table or auth event, not to be advertised as ordinary public RPC endpoints. Every one currently grants execution to `PUBLIC`, `anon`, `authenticated` and `service_role`.

The underlying machinery is not theatre:

- 23 enabled trigger attachments depend on 11 of the functions;
- `handle_new_user()` is also used internally by `handle_new_user_profile()`;
- all 183 active deployed Edge Functions and current repository runtime code contain zero direct references to the 15 names.

Three functions have neither an attachment nor a current caller: `trigger_booking_sheets_sync`, `trigger_contact_collection_sync` and `trigger_google_sheets_edge_function`. They are retirement candidates, not approved deletions.

## The candidate

The R85 candidate changes ACLs only. It removes `PUBLIC`, anonymous and authenticated execution from the 15 trigger functions while retaining explicit `service_role` execution. It does not alter a function definition, detach a trigger or call a function.

The isolated preflight found only 22 of the 23 production attachments. The missing object is `auth.users:on_auth_user_created`, which calls `public.handle_new_user_profile()`. R81 deliberately copied the three application schemas, not Auth-owned trigger objects, so its application fingerprint could not detect this gap.

Restore and runtime-test that signup hook before applying the trigger ACL candidate. The isolated verifier will then prove:

- all 15 ordinary-role routes are denied;
- service and owner access remain;
- all 15 function digests remain exact;
- all 23 enabled trigger attachments are represented, including the separately restored Auth hook;
- the internal `handle_new_user` caller remains.

Actual trigger behavior still needs a rollback-only synthetic signup smoke before production consideration. Catalog presence is not runtime proof.
