# G25 owner and subject separation founder lock, R19

Decision: `DEC-20260917-g25-owner-subject-separation-r19`

Founder response: “agreed completely!” to the exact plain-language rule preserved in the [machine decision record](g25-owner-subject-separation-founder-lock-r19.json).

## The rule

- A Brain belongs to the person it is about, not to whichever operator currently manages it.
- If that subject asks to be erased, their Brain can enter the subject-erasure path.
- If a Mindmake owner or operator is removed, their access is revoked immediately.
- Ownership alone never authorises deletion of a different person's Brain.
- Any differently-subjected Brain they own must be transferred to an authorised successor or explicitly closed by the customer.
- If neither is authorised yet, the operation stays pending. The system does not invent a successor or delete the Brain.

## The important mixed case

One person may own their personal Brain and operate customer Brains. Their subject request can erase their own Brain. It cannot erase the customer Brains. Those remain held for transfer or explicit customer closure.

## What this does not yet prove

The existing candidate schema still contains owner foreign keys with cascade behavior. This decision therefore opens a local fail-closed planner and registry repair, not auth deletion or a database migration. A later multi-identity database canary must prove that access revocation, transfer and subject erasure cannot cross those boundaries.

## Durable-memory boundary

The CTRL repository is the verified project authority for this lock. The generic cross-venture Supabase decision ledger remains `STORE_UNAVAILABLE` because its configured live status, migration, grants, server-side adapter and authoritative readback are not verified. No ad hoc cloud row was created.

This lock authorises local implementation, tests, documentation and commits only. It does not authorise a migration, linked database use, auth-user deletion, customer closure, deployment, merge or release.
