# G25 dormant reconsent orchestrator, R41

R41 composes the whole restart path without creating a live caller.

It runs the R37 authenticated acceptance and R36 reservation first. Only a valid `reserved_not_created` result can reach R38 creation. The creation request fingerprint is stable for the accepted consent, while the transport event ID may change safely across retries.

The important middle state is named rather than hidden. If reservation succeeds but creation returns an unknown result, the response is `reconsent_reserved_pending_creation`, includes the accepted consent ID and says the operation is retryable. It never claims that the Brain exists. A later attempt converges on the first reservation and first creation.

Success returns only the consent receipt, creation receipt, new workspace and active-new-scope standing. Old workspace, custody and database detail are not exposed.

This is a dormant shared module with five tests. No Edge Function entrypoint imports it. HTTP parsing, Supabase Auth wiring, service RPC adapters, rate limiting, observability and deployment remain closed.
