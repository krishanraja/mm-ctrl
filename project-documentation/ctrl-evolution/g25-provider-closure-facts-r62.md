# G25 provider closure facts R62

Status: orthogonal lifecycle semantics proved. Persistence closed.

R62 replaces the idea that provider closure is one status with four independent obligations:

- disposition of the exchanged payload;
- operational deletion of a provider object;
- an explicit regulated-retention boundary;
- an explicit external-copy boundary.

This allows the product to say several true things together. Stripe can delete the operational customer object while retaining a legally required record. Resend can expire its copy while the delivered message remains in the recipient's inbox. Neither outcome is mislabeled as universal deletion.

## Evidence, failure and recovery

Facts are scoped to the exchange payload, provider object, regulated record or external copy. A verification failure remains a hold until a later recovery fact for the same scope. Operational deletion failure can be followed by a later success without erasing the failed attempt. Recovery without a prior failure, facts in the wrong scope and contradictory final payload dispositions are invalid.

The evaluator returns bounded completion names that preserve residual truth. `complete` is reserved for obligations with no declared residual or external copy. All results retain `execution_authority: none`.

R62 is a pure evaluator. It does not alter the R49 database candidate or persist facts. The next gate is a dormant append-only persistence candidate tested against local PostgreSQL.

No database connection, provider call, migration, live route edit, deployment, merge or release is performed by R62.
