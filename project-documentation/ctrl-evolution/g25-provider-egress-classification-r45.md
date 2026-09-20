# G25 provider egress classification R45

## Finding

The R44 inventory is now classified by product purpose and conservative potential data classes. This closes the dangerous ambiguity between a harmless provider name in source code and a path that may carry a leader's words, memory, decision, company context, generated briefing, email or billing identity.

This classification is intentionally conservative. A file classified as `decision_support` is treated as capable of sending decision content and Brain context even if one particular invocation sends less. Narrowing that standing requires payload-level proof, not optimism.

## What the repository can send

The current provider surface falls into seven families:

1. memory and intake paths may carry raw leader language, Brain memories and inferred traits;
2. decision support paths may carry the decision, leader context, company context and relevant memory;
3. briefing and coaching paths may carry personal context, company context and generated content;
4. research and enrichment paths may carry queries, company identifiers and public results;
5. email delivery necessarily carries a recipient address and rendered message body;
6. billing paths carry account and payment relationship metadata;
7. configured webhooks have an unknown destination and payload contract until each deployment is inspected.

## Routing decision

No new runtime may send private Brain context merely because an API key exists. It needs a verified provider mode and a request receipt. Research queries must be minimised to public or pseudonymous terms. Email delivery must remain an explicit delivery action with a content and recipient receipt. Billing stays outside the Brain-content channel. An arbitrary configured downstream is blocked until its destination and payload are known.

This is not a runtime switch. No provider call, route or live deletion function changed.

## Why it matters to the product

The Brain cannot credibly promise subject control if it knows only what it stores locally. The durable receipt must also say where a piece of context travelled, why it travelled, what class of data it contained, which retention mode applied and what eventual deletion or expiry evidence exists. The user-facing experience can remain simple because this machinery carries the complexity underneath.

## Next proof

Verify each provider's current official retention and deletion controls, distinguish default from contracted or zero-retention modes, then design the provider-receipt persistence candidate. Official policy evidence must be dated and endpoint-specific where the provider makes that distinction.
