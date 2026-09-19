# G25 Auth hook and trigger ACL proof R87

**Status:** The missing signup hook and the second privileged-function hardening lane are proved in the isolated recovery project. Production is unchanged.

## A recovery gap became a tested capability

The blank replay lacked production's `auth.users:on_auth_user_created` trigger. R87 restored it without replacing the existing trigger function. The resulting trigger definition has the exact production digest.

A synthetic signup then proved the behavior that matters:

- the Auth row caused a public profile to be created;
- the same person received the default `user` role;
- every synthetic row was removed before the test migration succeeded.

The first attempt through the inspection channel was blocked because that channel is read only. That refusal is preserved in the history. The successful path used a named, self-cleaning migration in the isolated target.

## The ACL hardening did not break the trigger

The R85 ACL migration then removed direct `PUBLIC`, anonymous and authenticated execution from 15 trigger-returning functions. It retained owner and service execution and changed no function body.

The verifier proved:

- 15 of 15 ordinary-role routes denied;
- 15 of 15 service and owner routes retained;
- 15 of 15 definition digests unchanged;
- 23 of 23 production-equivalent trigger attachments enabled;
- the internal `handle_new_user` caller retained.

The synthetic signup passed again after the ACL change. This is the key continuity proof: the trigger still performs its real job even though it is no longer exposed as a direct ordinary-user RPC.

## Security progress without a broad revoke

The isolated project began with 41 anonymous and 45 authenticated privileged-function warnings. The two narrow ACL lanes have reduced those counts to 17 and 21. The reduction is exactly 24 routes, matching nine high-risk writers plus 15 trigger functions. Unrelated advisor counts did not move.

The remaining surface still needs route-specific work. The next lane is eight anonymous readers, especially `get_pending_verifications(uuid)`, followed by behavioral ownership tests for the 13 authenticated product routes.
