# G25 operator review runtime gateway, R133

Status: `runtime_gateway_passed`

R133 turns the accepted R132 operator question into a narrow, injectable runtime seam without connecting a route or a database client. The gateway can read only the strict five-field operator projection from R131. Until that projection is valid and available, it renders nothing.

## Why this exists

The visible card was accepted, but its synthetic fixture could not safely become live by merely swapping in a query. An operator can change customers quickly, a session can change while a request is in flight, and React development mode can mount effects twice. A naive connection could therefore show one leader's question under another leader's name or write duplicate access receipts.

The gateway binds every settled result to the exact client reference, workspace ID and validated leader label that produced it. Any identity change hides the old result synchronously. Late responses are ignored. The same in-flight read is shared for one client and workspace, preventing a duplicate receipt call under React Strict Mode.

## Locked behaviour

- The Supabase client is injected. No global or production client is imported.
- The only data operation is `getOperatorPendingQueue` from R131.
- Invalid workspace IDs and invalid leader labels cause no request and no UI.
- Loading, unavailable, invalid, failed and unknown states are visually identical: literal `null`.
- Safe internal status codes remain available for diagnostics without retaining transport details.
- Available copy is rendered exactly as returned by the strict projection. There is no fallback prose.
- The leader label is dynamic, validated and rendered as text.
- Changing client, workspace, leader or enabled state removes the old question immediately.
- Changing review packet resets the local copied state.
- The gateway does not poll, retry, persist, message, notify the leader, mutate a standard or make a decision.
- The ready-only hidden status announces an asynchronously arriving question to assistive technology.

## Scope boundary

This is a fake-client runtime composition proof. The accepted synthetic R132 URL remains the visual proof and stays visually unchanged. R133 does not add a route, connect the isolated database, touch production, open the customer surface, merge, release or retire legacy machinery.

The RPC is read-shaped but is known to append an access receipt when eventually connected. A later isolated rehearsal must therefore bind the exact non-production project, use a disposable authenticated identity and prove cleanup before any route wiring is considered.

## Independent acceptance

The final architecture judge and human-value judge both returned sealed ACCEPT verdicts after the complete staged implementation. They independently confirmed the complete customer identity binding, stale-response suppression, Strict Mode receipt-call deduplication, silent failure states, exact upstream copy, assistive announcement, preserved R132 experience and closed customer, database, production and authority boundaries.

## Feedback chronology retained

The original synthetic card established the correct minimal operator experience. The runtime review then exposed a less visible but serious risk: old content could survive the first render after a customer, client or enabled-state change. The correction treats the selected customer identity as one indivisible context, hides stale material immediately, preserves only sanitized diagnostic states and keeps the public surface free of error copy or loading theatre. This is the same product principle as the user's repeated feedback: retain sophistication in deeper layers while making the visible experience radically simple.
