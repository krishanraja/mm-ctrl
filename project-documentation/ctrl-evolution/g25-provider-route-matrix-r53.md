# G25 provider route matrix, R53

R53 closes a semantic hole in the provider registry. A structurally valid receipt could otherwise claim that Stripe performed research, that Brave was a fixed feed or that an email-delivery operation served decision support. Every field would be individually valid while the record as a whole was false.

The database overlay now couples provider, processor kind and purpose. It also separates fixed public research routes from customer-shaped public queries. Artificial Analysis and fixed RSS use `fixed_public_fetch` with no query-minimisation digest. Other research routes need a minimisation digest and one of the accepted public-policy, provider-retention or verified ZDR standings.

The local canary records valid public search, fixed fetch and private model receipts. It rejects Stripe as research, an ordinary search route as a fixed fetch, a fixed feed as an ordinary query, billing retention as research control and delivery under a decision purpose.

## Boundary

This is a check-constraint overlay on the empty dormant R49 plus R51 candidate, not a migration. It does not prove any provider account setting or make any external call. No linked database, live route, deployment, merge or release was touched.
