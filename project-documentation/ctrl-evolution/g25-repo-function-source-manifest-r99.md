# G25 repository function source manifest R99

**Status:** All 121 repository-backed Edge Functions now have deterministic source identities, present entrypoints and explicit gateway posture. This removes configuration ambiguity without pretending that static configuration is security proof.

## The gap R99 closes

The recovery baseline contained source for 115 of the 183 active production functions, but 48 of those local routes had no explicit `verify_jwt` setting in `supabase/config.toml`. A recovery deployment could therefore depend on tool defaults rather than an inspectable decision. R105 added two forward portability routes, R113 added the owner-bound measurement route, and R115 added three candidate standard-change routes. The current repository inventory is 121 while the production comparison set remains 115.

Read-only production metadata showed that 47 of the 48 currently verify JWT and `nudge-briefing` does not. R99 records those observed values locally, then records one deliberate fail-closed change: `prompt-coach` now requires gateway JWT verification as well as handler-level user verification. The two R105 portability routes also require JWT. Eighty-three local routes now verify JWT and thirty-four do not. The one production mismatch within the shared production set is intentional.

This is preservation, not approval. A JWT-disabled route with a service-role marker is not automatically safe. A JWT-enabled route is not automatically subject-correct. Every route still needs its own caller, handler and adversarial authentication proof before isolated deployment.

## Deterministic source machinery

The inspector walks every function directory in bytewise order. It records each file's relative path, byte length and SHA-256 digest, then derives one source digest per function. It also fingerprints all 185 shared files and binds that shared-tree digest into every function entry. Any change to a route or common dependency therefore changes the manifest.

The full derived manifest can be inspected on demand without copying function source into documentation:

`node scripts/inspect-ctrl-g25-repo-function-manifest-r99.mjs`

The compact form is:

`node scripts/inspect-ctrl-g25-repo-function-manifest-r99.mjs --summary`

## Environment dependencies

Forty-seven distinct environment-variable symbols are referenced directly across the local functions and shared tree. Their names are recorded so deployment can fail closed on missing configuration. No value was retrieved, printed or persisted. R104 supersedes this coarse view with exact per-route transitive closures and 58 classified symbols. Several symbols are feature flags or public configuration rather than secrets.

## What remains open

- Thirty-four repository-backed routes currently have `verify_jwt=false` and require route-specific review.
- The other eighty-four still require subject, role and caller-bound behavior proof unless a later hosted receipt closes that route.
- Sixty-eight active production functions remain live-only and retain the R79 and R80 preserve-until-proved boundary.
- Environment values need an approved secure source and value-free parity verification.

No function was deployed. Production was queried for metadata only and was not changed.
