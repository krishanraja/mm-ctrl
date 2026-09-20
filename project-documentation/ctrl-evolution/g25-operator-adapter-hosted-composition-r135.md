# G25 operator adapter hosted composition, R135

Status: `strict_hosted_adapter_passed`

R135 closes the gap left honestly open by R134. During a fresh disposable hosted lifecycle on the isolated Supabase project, the live operator RPC response was intercepted at the application boundary and passed through the exact `getOperatorPendingQueue` TypeScript adapter used by R133.

The adapter made the one live RPC call itself, validated the workspace input and rejected any response outside the strict R131 schema. The accepted response then returned to the existing hosted authority probe, which independently confirmed the exact five allowed fields, hidden raw packet, denied operator decision, unchanged owner standard and zero cleanup counts.

This proves live hosted bytes can cross the strict application projection without a hand-written duplicate parser. It still does not construct a browser session, render the gateway from live data, connect a public route, touch production or open the customer surface.

The next safe step is a private rendered composition using an explicitly isolated client and a disposable authenticated operator. It must keep the public synthetic proof separate and must not import the current global production client.
