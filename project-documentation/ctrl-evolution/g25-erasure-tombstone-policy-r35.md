# G25 erasure tombstone policy, R35

R35 gives the anti-revival tombstone one precise job: keep an erased Brain scope erased.

It is not a shadow profile, a permanent ban on the person, a marketing suppression list or evidence for model use. It is the smallest state needed to stop retries, delayed jobs and surviving writers from silently recreating protected prepared intelligence after erasure.

## Retention

Retention is bound to the continuing Brain scope, not an arbitrary number of days.

- While the workspace Brain scope exists, the tombstone has no expiry. Expiry would eventually turn a successful erasure into permission for an old job to recreate the data.
- When the complete workspace scope is validly closed, the tombstone is removed by the same workspace or custody cascade. A separate operational or legal receipt, if required, needs its own minimal schema, stated lawful basis and retention schedule.
- Necessity must be reviewed at least annually and whenever the privacy policy or deletion flow changes.

This follows the ICO principle that identifiable data must be retained only for a necessary stated purpose, with a documented period or criterion and review. It also follows the EDPB recommendation to track erasure so restored systems cannot revive deleted data.

## Reconsent

Erasure is irreversible inside the erased scope.

If the subject later chooses to build a Brain again, the system must receive a new explicit subject-consent receipt and create a new workspace and custody scope. The old tombstone is never cleared, rewritten or treated as consent. The old reader continues to return `erased` with zero items.

This distinction preserves both human agency and technical truth: the person can begin again, but the system cannot pretend the deletion never happened.

## Minimal retained fields

The tombstone may keep only scope identifiers, an erasure identity, request and erasure fingerprints, timestamps and per-generation counts. It must not keep payload bytes, keys, authority dependencies, source excerpts, email addresses, login identifiers, inferences or judgement content.

The row remains personal data where it can still be linked to a subject. Pseudonymous hashes do not make it anonymous. It therefore remains service-only, declared in the information-asset and retention records, and unavailable to product surfaces or models.

## Backup and restoration

A restored database must reapply erasure state before any prepared-intelligence reader or writer is enabled. Backup data that cannot be immediately overwritten must remain beyond use and expire under the documented backup schedule. A restore that brings content back before the tombstone is active fails the erasure contract.

## Current candidate alignment

R30 already has no tombstone expiry, scopes one tombstone to workspace plus subject, cascades workspace and custody closure, restricts subject deletion while the scope exists and grants the service role read-only tombstone access. R10 and R25 both consult the same erased-subject seam, and R31 returns explicit erased standing with no items.

The missing mechanism is the new explicit consent receipt. Until it exists and is tested, reconsent and new-scope creation remain closed.

## Boundary

This is a provisional technical and product policy for pre-migration design. It is not legal advice, a final lawful-basis assessment, a privacy-notice change or production authorization. Counsel and the data controller must validate the final policy before migration or customer use.

Current sources reviewed on 17 September 2026: [ICO storage limitation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/), [ICO right to erasure](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/) and the [EDPB coordinated enforcement report](https://www.edpb.europa.eu/system/files/2026-02/edpb_cef-report_2025_right-to-erasure_en.pdf).
