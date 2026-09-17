# G25 erasure tombstone policy R35 QA record

Status: provisional pre-migration policy aligned to current candidate SQL. No legal or runtime claim.

## Evidence

- R30 contains no tombstone expiry field or clearing operation.
- Tombstones are unique by workspace and subject.
- Workspace and custody closure cascade to the tombstone.
- Stable subject deletion remains restricted while the workspace scope exists.
- R10 and R25 both call the shared erased-subject guard before creating a receipt.
- R31 returns explicit `erased` standing with zero protected items.
- Anonymous and authenticated roles receive no tombstone access.
- Service role access to the tombstone table is read-only.
- Current ICO and EDPB guidance was reviewed on 17 September 2026 and is linked in the machine contract.

## Residuals

- A new explicit subject-consent receipt does not exist.
- New-scope creation after reconsent has not been specified or tested.
- Full workspace closure and restored-backup ordering have not been exercised in the R33 harness.
- The final lawful basis, privacy notice and retention register require controller and legal validation.

No tombstone clearing, reconsent, migration, linked database use, runtime integration, deployment, merge, release or external action is authorised.
