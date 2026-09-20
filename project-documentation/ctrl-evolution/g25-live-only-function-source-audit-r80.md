# G25 live-only function source audit R80

**Status:** All 68 live-only function bundles were inspected read-only. No preserve, improve, replace or retire disposition has been inferred from a name.

The 68 bundles contain roughly 2.59 MB of source across 32 environment-variable symbols and 44 referenced tables. Thirty-nine reference the service-role symbol. Thirty-one have platform JWT verification disabled, including 22 that also reference the service role. None of those 31 contains the explicit `auth.getUser` marker used by two JWT-protected functions in this set.

That does not mean the 31 routes are exposed. Some are intentionally public intake or webhook routes, some inspect an authorization header and some use a shared secret. Static marker detection cannot prove the request is validated correctly, that replay is prevented or that tenant scope is preserved. It is a review queue, not a vulnerability verdict.

The current repository has a clear runtime reference to only three live-only functions:

- `enrich-company`, used by the application API layer;
- `google-sheets-sync`, invoked from `decision-watch`;
- `transcribe`, used by the API layer, voice UI, operator decision capture and decision advisor.

The other 65 may still be reached by deployed older clients, schedules, webhooks or external systems. Their absence from current-repository code is not retirement evidence.

The largest bundles are not small forgotten handlers. `submit-mindmake-brief`, `mindmake-personal-read` and three lead-email routes each carry more than 130 KB of source and shared enrichment machinery. They should be decomposed or replaced deliberately, not copied into the new backend as opaque monoliths.

No high-confidence GitHub, Supabase, Vercel, OpenAI, Google or JWT literal pattern was detected. This is a bounded secret scan, not proof that arbitrary credentials or private material are absent. Raw retrieved source was not written to Git.

## Next gate

Trace live usage and external callers, then review the 31 JWT-disabled routes first. Disposition follows observed value and security evidence. The product capabilities can survive while the implementation is simplified, hardened or replaced.
