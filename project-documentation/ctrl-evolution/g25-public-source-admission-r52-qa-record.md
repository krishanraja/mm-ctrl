# G25 public source admission R52 QA record

Status: dormant public-evidence admission pass. No live-fetch claim.

## Positive evidence

- Fifteen R52 tests and thirteen upstream R50 tests pass.
- Fixed configuration, company, domain and multi-source topic admissions pass.
- Missing evidence, unsafe URL forms, private hosts, address literals, unverified routing, stale evidence and unsafe redirects fail closed.
- Transport failure is mapped to a bounded error.
- Nested private fields still fail at the R50 exact-shape boundary.
- Repository typecheck reports zero new errors.

## Residuals

- The public-route attestation is an injected dependency and has no runtime implementation yet.
- DNS rebinding, redirect resolution, decompression limits and transport timeouts require that hardened adapter.
- Evidence presence does not establish that a public claim is true, only that it was publicly observable at the cited digest.
- No R51 receipt writer consumes the admission yet.

No network call, provider call, migration, linked database, deployment, merge, release or production claim is authorised.
