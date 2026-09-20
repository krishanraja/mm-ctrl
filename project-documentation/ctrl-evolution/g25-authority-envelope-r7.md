# G25 authority envelope, R7

Status: `local_contract_repair_passed`

Machine record: [g25-authority-envelope-r7.json](g25-authority-envelope-r7.json)

Input: [G25 persistence mapping R6](g25-persistence-mapping-r6.md)

Verification: [G25 authority envelope R7 QA](g25-authority-envelope-r7-qa-record.md)

## Outcome

R7 repairs three of R6's five blockers at the persistence-envelope boundary without writing SQL or changing the characterized R5 state machine.

Every candidate receipt now has to name an exact workspace, owner, subject, canonical audience and `prepared_intelligence` purpose. Friendly interface language maps once at the boundary:

- `customer_private` becomes `person_private`;
- `operator_private` becomes `delivery_team_private`.

Opaque context strings cannot become persistence authority. Every dependency must name its authority type, record UUID, exact version, SHA-256 fingerprint, observation time and full canonical scope. The claim is checked against a current authoritative snapshot. A missing or moved version fails closed.

## Why this is an improvement

This does not preserve R5's weaker scope for compatibility. R5 remains a characterization artifact. The persistence route improves it by adding tenancy, one canonical audience vocabulary and inspectable version-bound correction authority.

That is the founder's clarified transition rule in practice: retain the useful lifecycle behavior, replace the ambiguous contract.

## Deliberate limits

R7 is a pure local contract. `current_authority` is caller-supplied test data, not a database read, lock or attestation. It does not prove concurrent currentness, exact-purpose RLS, encryption context, transaction behavior or service authorization.

The two remaining R6 blockers are therefore still real:

1. exact purpose must be enforced and adversarially tested in a separate RLS canary;
2. strict encryption needs a semantically exact prepared-receipt record and payload context after that boundary is accepted.

No migration, database call, runtime integration, deployment or legacy retirement is authorised.
