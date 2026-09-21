# G25 consequential-work migration R145 QA record

Date: 21 September 2026

## Exact proof

- Isolated project: `cgkcplcamsijghalintq`
- Production project: `bkyuxvschuwngtcdhsyg`
- Production contacted: `false`
- Migration version: `20260921100000`
- Accepted candidate SHA-256: `ea79b9097abf06e7e51b44248aca3be9d1fcf1ce1cb98b61264ff594118358dd`
- Migration SHA-256: `ea79b9097abf06e7e51b44248aca3be9d1fcf1ce1cb98b61264ff594118358dd`
- Clean applications: `2`
- Intermediate rollback residue: `0`
- Catalogue SHA-256 on replay 1: `228f6d1df1a3b717b29a809212117fcadea0319fcb608bc4649dac17e4eee58d`
- Catalogue SHA-256 on replay 2: `228f6d1df1a3b717b29a809212117fcadea0319fcb608bc4649dac17e4eee58d`
- Final state: `applied_empty`

## Final readback

| Control | Result |
| --- | ---: |
| Candidate tables | 14 |
| Candidate routine signatures | 33 |
| Candidate triggers | 49 |
| RLS-enabled tables | 14 |
| Forced-RLS tables | 14 |
| Candidate rows | 0 |
| Shared scope indexes | 2 |
| Service-role selectable tables | 14 |
| Service-role insertable tables | 12 |
| Ordinary-role table privileges | 0 |
| Authenticated seal execution | false |
| Anonymous seal execution | false |
| Service-role seal execution | true |
| Exact migration-history rows | 1 |
| Preserved R115 tables | 5 |

The complete R142 transactional canary ran after both applications. The first rollback and its migration-history repair completed before the second application. The final catalogue hashes match exactly.

## Containment

No customer data was used. No Edge route was deployed. No production system, Vercel project, merge target or legacy capability changed.
