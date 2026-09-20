# G25 Auth signup hook recovery R86

**Status:** A critical clean-recovery gap is proved and an isolated repair packet is ready. Production is unchanged.

## The missing machinery

Production has an enabled `AFTER INSERT` trigger on `auth.users` named `on_auth_user_created`. It calls `public.handle_new_user_profile()` to create the matching public profile and default user role.

The blank recovery project has the exact function body but not the trigger attachment. R81 correctly proved the three application schemas it claimed to copy. It could not prove an object owned by the managed `auth` schema. The distinction is now explicit rather than hidden inside a green schema fingerprint.

Without this hook, a newly registered person could exist in Auth without the profile and role expected by the application. That is a critical-path recovery failure, not a cosmetic discrepancy.

## The isolated repair

The R86 candidate creates `auth.users:on_auth_user_created` only when it is absent. It points explicitly to `public.handle_new_user_profile()` and does not replace the function.

The proof packet has two parts:

1. A read-only catalog check confirms one enabled attachment and the production function digest.
2. A self-cleaning synthetic signup migration inserts an `example.invalid` fixture directly into the blank database, verifies the expected profile and default role, then deletes every fixture row before it can succeed.

No external Auth API is called and no email is sent. The database inspection channel is read only, so the first smoke attempt correctly refused the insert. The self-cleaning migration path preserves that boundary and leaves a named test receipt.

## Sequence

Restore and prove this hook before applying the R85 trigger ACL candidate. Then the ACL proof can preserve all 23 production attachments rather than accepting a recovery target that was already incomplete.
