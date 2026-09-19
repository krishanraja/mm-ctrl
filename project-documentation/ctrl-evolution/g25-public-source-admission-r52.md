# G25 public source admission, R52

R50 required a public-source digest but could not establish what it represented. R52 adds the missing admission step. A proposed company name, domain or set of topic atoms must be found in fresh, bounded public evidence before it can enter the prepared research-query contract.

## The admission boundary

- Fixed feeds bind to the reviewed route-configuration digest and do not fetch customer-shaped evidence.
- Web evidence is limited to four credential-free HTTPS locators with no query string or fragment.
- Local hostnames, address literals and nonstandard ports fail closed. Redirect targets pass the same test.
- The future fetch adapter must explicitly attest that DNS resolution and every network hop remained public.
- Only successful textual responses are accepted, with a 128 KiB cap and a five-minute freshness window.
- Company names and every topic atom must appear in the response evidence. A domain must match the public hostname or response evidence.

The returned object contains only source-locator, final-locator and content digests, plus the R50 prepared query. It does not retain fetched bodies or raw source URLs.

## Honest limit

This pure module cannot itself prove how DNS resolved or which socket the HTTP client reached. That responsibility is deliberately explicit in the future `verified_public_route` fetch adapter. The tests use a controlled fake and make no live-web or SSRF-resistance claim for a deployed transport.

## Boundary

Fifteen R52 tests and all thirteen R50 tests pass. The repository type gate reports no new errors. No network request, provider call, live route, migration, linked database, deployment, merge or release was touched.
