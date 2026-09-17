# G25 delivery and billing retention evidence R47

## Finding

Email delivery and billing cannot share the same erasure story as private Brain records.

Resend necessarily receives the recipient address and rendered email body. Its current official material says email and log data is retained for 30 days on active Free, Pro and Scale plans, backups persist for 7 days, and remaining customer data is deleted within 90 days after account termination. Delivery also creates copies in recipient inboxes and receiving mail systems that CTRL cannot recall.

Stripe operates under financial, fraud and legal retention duties. Its customer-delete API removes payment details and prevents further operations, but the deleted customer shell remains retrievable. Its privacy centre says personal data obtained from Business Users is generally retained for five or more years in most jurisdictions after the relationship or last transaction, whichever is later.

## Repository reality

- four files send directly to Resend;
- the shared email helper returns a provider message ID;
- no current Edge Function writes the existing `email_analytics` table;
- three direct send paths do not use the shared helper as a durable receipt boundary;
- account deletion does not orchestrate Resend deletion or expiry evidence;
- account deletion cancels Stripe subscriptions but does not delete the Stripe customer;
- neither provider action has a unified, workspace-scoped lifecycle receipt.

## Required model

The receipt state must distinguish:

1. accepted by provider;
2. delivered beyond CTRL's recall boundary;
3. provider policy expiry pending;
4. operationally deleted at provider;
5. legally or operationally retained residual record;
6. unknown or failed verification.

That is more honest than a single `deleted` boolean. It also lets the customer experience stay simple: the UI can say that an email was sent and cannot be recalled, or that billing is closed while regulated payment records remain.

## Official sources retrieved 17 September 2026

- [Resend GDPR and retention](https://resend.com/security/gdpr)
- [Resend Data Processing Addendum](https://resend.com/legal/dpa)
- [Stripe delete-customer API](https://docs.stripe.com/api/customers/delete)
- [Stripe Privacy Center](https://stripe.com/privacy-center/legal)

## Limits

This is technical product evidence, not legal advice. Plan-specific contracts and actual provider account configuration still require inspection. No email was sent, no subscription was cancelled and no provider record was deleted.
