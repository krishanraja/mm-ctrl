# G25 research egress boundary R48

## Correction

R44 correctly inventoried 15 named commercial or configured-downstream signatures, but it was not the whole research-egress surface. The decision and briefing systems also call Artificial Analysis, Tranco, GDELT, Hacker News through Algolia and a fixed set of RSS publishers. Those routes matter even without an API key because a customer-derived query can still leave the Brain boundary.

R48 expands the research view to 12 route families and distinguishes three materially different cases:

1. a private decision or Brain context transformed into a search query;
2. a public company name or bare domain used for enrichment;
3. a fixed public fetch that contains no customer context.

## Routing rule

Research providers never receive a leader name, email, verbatim interview answer or raw Brain memory. A decision claim must be converted into the smallest public question that can test it. Company enrichment may use only a verified public company name or bare domain. Fixed feeds and leaderboards must remain independent of the customer.

This rule is stricter than saying a query is safe because it goes to a search engine. The current decision retrievers can send an AI-scoped version of a raw claim to Perplexity, Exa, Brave and NewsAPI. That is not acceptable for the new private-Brain runtime until a deterministic query-minimisation adapter and receipt exist.

## Provider findings

- Exa and Brave advertise enterprise ZDR, but the account mode is not proved.
- Tavily's current marketing says ZDR is core, while its privacy policy allows some query use for service improvement unless the contract says otherwise. Contract evidence is required.
- NewsAPI and People Data Labs public materials reviewed here do not give a precise enough API-query retention mode for private context.
- BuiltWith can answer a domain-only question, but the repository uses an older endpoint, places the API key in the URL and does not use the current documented `NOPII` response control.
- Artificial Analysis is a fixed leaderboard fetch and needs no customer query.
- Tranco needs only a bare public domain.
- GDELT, Hacker News Algolia and fixed RSS feeds should receive only public or pseudonymous topics, never source Brain text.

## Official sources retrieved 17 September 2026

- [Perplexity API terms](https://www.perplexity.ai/hub/legal/perplexity-api-terms-of-service)
- [Exa enterprise security](https://exa.ai/docs/reference/security)
- [Brave Search API](https://brave.com/search/api/)
- [Tavily privacy policy](https://www.tavily.com/privacy)
- [NewsAPI privacy policy](https://newsapi.org/privacy)
- [BuiltWith Domain API](https://api.builtwith.com/domain-api)
- [People Data Labs Privacy Center](https://privacy.peopledatalabs.com/)

## Limits

Public policy text is not account configuration. Several public or community endpoints do not publish a sufficiently precise query-retention promise. The safe response is minimisation, not an invented guarantee. No provider was called and no live route changed.
