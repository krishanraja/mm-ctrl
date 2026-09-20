# G25 public research query boundary R50 QA record

Status: dormant typed-construction pass. No runtime privacy claim.

## Positive evidence

- Thirteen targeted tests pass.
- Fixed, company-name, domain and public-topic shapes produce deterministic prepared requests.
- Domains are normalised and reject email addresses and URLs.
- Topic terms reject sentences, names written as phrases and duplicates.
- Missing public-source proof, provider-kind mismatch and private extra fields fail closed.
- Query-minimisation and exact-request digests are produced.
- Repository typecheck reports zero new errors.

## Residuals

- Public-source truth is asserted by a digest, not independently resolved by this pure module.
- A single atomic term can still be semantically sensitive even when syntactically valid.
- No live provider route or R49 database writer imports the module.
- Provider-specific URL, header and query serialisation remain outside this proof.

No external call, migration, linked database, deployment, merge, release or production claim is authorised.
