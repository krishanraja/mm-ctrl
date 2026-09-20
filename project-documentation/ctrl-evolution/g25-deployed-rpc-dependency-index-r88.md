# G25 deployed RPC dependency index R88

**Status:** Literal database-RPC and Edge Function dependencies from all 183 active deployed bundles now have a durable, source-free index.

## Why this exists

Repeated transient source scans were wasteful and, worse, one produced a false negative. R83 originally said none of the nine high-risk functions had a deployed Edge Function caller. The structured R88 extractor found that `send-results-email` calls `sync_lead_to_sheets`.

The security decision remains correct because the R83 ACL retained `service_role`, and the deployed caller uses the service-role symbol. The evidence record is corrected rather than silently rewritten.

## What is retained

For each literal dependency, the index stores only:

- the database RPC name and calling Edge Function slug;
- the invoked Edge Function name and calling slug;
- scan coverage and error count.

It stores no raw deployed source, arguments, environment values or secrets.

The current index covers 183 active functions with zero retrieval errors. It found 13 distinct database RPC dependencies and one Edge Function-to-Edge Function dependency across 22 callers.

## Limits

Dynamic function names assembled at runtime are not visible to a literal extractor. An absent name is bounded evidence, not retirement approval. The index should be regenerated whenever deployed function versions materially change and compared before any ACL, function or migration disposition.
