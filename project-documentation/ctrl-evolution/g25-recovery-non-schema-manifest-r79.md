# G25 recovery non-schema manifest R79

**Status:** The first operational manifest is captured read-only. It prevents a clean database baseline from silently deleting useful machinery.

A schema squash is not the whole product. The captured production inventory has 183 active Edge Functions. At capture time, Git had source directories for 115 deployable functions plus `_shared`, and all 115 existed live; 68 additional live functions had no matching local source directory. Git now has 122 deployable function directories. The seven later local-only routes are the two portable-Brain routes, `measure-standard`, the three R115 candidate-standard routes and the R116 owner-review route; their repository presence does not retroactively claim a production deployment. Production also has eight installed extensions, 15 scheduled jobs, five Storage buckets, two publications covering ten tables, 31 roles with 19 memberships and two named Vault entries.

R79 records the 68 live-only function slugs individually. That is preservation evidence, not an instruction to copy them all. Some are likely old product machinery, some may still carry valuable behavior and some may be insecure or obsolete. Each must be captured and classified as:

- preserve as-is only when its source, caller and current outcome are verified;
- improve when the capability remains valuable but the implementation or experience is below the new standard;
- replace when a new pipeline subsumes it with proven parity;
- retire only when callers, data dependencies and recovery evidence show it is safe.

This is the same rule already agreed for the content feed, audio briefing and brain controls: do not lose useful behavior, and do not assume legacy behavior is beyond improvement.

## Privacy boundary

The database probe hashes scheduled commands, Vault names and descriptions inside PostgreSQL. It returns no command text, secret name or secret value. The Edge Function inventory reads deployment metadata only; it does not retrieve function source or secrets.

## Next recovery lane

Capture the source and caller map for the 68 live-only functions before any clean-project cutover can be considered. The result should be a disposition register, not a mass redeploy. Auth settings, function environment-variable names, bucket object data and external webhook registrations remain separate evidence lanes.

No production state changed.
