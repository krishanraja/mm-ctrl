# G25 non-FK erasure review plan R59

Status: exhaustive zero-write review plan proved. Execution held.

R59 turns R57 discovery and R58 semantics into a deterministic review artifact. Every current high-risk anchor must be present exactly once. The compiler emits an abstract draft step only for semantically classified targets and an explicit blocker for everything that still needs policy, schema or aggregate behavior.

The current result contains 36 dispositions: 18 draft steps and 18 blockers. The plan is still held even if the blockers are later resolved because this compiler has no execution authority.

## What a draft step means

A draft step contains only:

- a table-and-column target key;
- its approved semantic action;
- a symbolic selector such as `subject.auth_user_id`, `subject.verified_email` or `authorized_parent_row`;
- required proof such as zero rows, revoked access or aggregate recomputation.

The compiler receives no UUID, email, phone number or other personal value. It emits no SQL and imports no database or network client. A phone number remains an attribute erased with an already-authorized booking row, never an independent selector.

## Fail-closed behavior

The compiler rejects missing, stale or duplicate discovery coverage. It rejects an unknown standing and refuses to draft shared-record redaction or retained-audit pseudonymization when either is mislabeled as implementation-ready. Blocking targets remain named in the output rather than disappearing from an optimistic plan.

This closes the planning gap only. Catalog reconciliation, policy decisions, exact query design, transactional ordering and database proofs remain separate gates.

No live deletion code, database, migration, provider, deployment, merge or release is changed by R59.
