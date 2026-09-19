# G25 principal-removal planner R20 QA record

Status: local deterministic pass, no runtime or database claim.

## Pass signals

- The R19 founder-lock checker preserves exact finality, subject authority, operator protection and the external authority boundary.
- Eight R20 Vitest scenarios pass.
- The contract checker verifies the exact source and test hashes, required relationship-inventory gate, mixed-role protections and blocked external actions.
- The R13 through R18 adjacent erasure checks remain green.

## Deliberately unverified

- Live or linked Supabase behavior.
- Auth-user deletion and foreign-key behavior under the new policy.
- Ownership transfer, customer closure or custody recovery.
- Concurrent transfer and erasure requests.
- PostgREST, Edge Function or customer-facing behavior.

No migration, database call, runtime integration, deployment, merge, release or destructive action is authorised by this record.
