# G25 public research query boundary, R50

R50 prevents the research layer from treating an interview answer as a search prompt. The module does not clean arbitrary prose. It only constructs a request from one of four explicit public shapes: a fixed public fetch, a public company name, a bare public domain or a short list of atomic public topic terms.

## Why construction beats redaction

A regular expression can remove an email address but cannot know which strategic detail, personal name or unusual phrase identifies a leader. A redacted paragraph can still reveal the very thing it was meant to protect. R50 therefore has no input field for raw memory, interview text or decision prose. Unknown fields fail closed.

Provider and shape are coupled. People Data Labs receives only a company name on the company-enrichment path. BuiltWith and Tranco receive only a bare domain. General search providers receive two to ten simple public terms, not a sentence or quotation. Artificial Analysis and fixed RSS routes receive no customer-shaped query.

## Receipt handoff

The constructor returns the exact data classes plus two digests: one for the bounded outbound request and one for the minimisation decision including its public-source evidence digest. These match the R49 receipt vocabulary without persisting the raw query in the registry.

## Honest limit

The module proves shape and stable evidence binding. It cannot open the cited source and establish that a term was genuinely public. A caller could lie while supplying a valid digest. Runtime use therefore still needs a separately authorised public-source admission resolver with inspectable provenance. No live research caller imports this module.

## Boundary

Thirteen targeted tests and the repository type gate pass. No provider was contacted, no live query changed and no migration, linked database, deployment, merge or release was touched.
