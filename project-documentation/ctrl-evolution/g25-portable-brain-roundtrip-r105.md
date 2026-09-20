# G25 portable Brain round trip R105

**Status:** A leader's current Brain can now leave the isolated system as a deterministic, readable JSON package and be imported into another account without cross-subject writes, duplicate rows or false standing.

## What the package preserves

The package contains current, unarchived facts; emerging or confirmed patterns; and active decisions. It omits the source user's Auth identifier, database row IDs, embeddings, encrypted columns and raw source bytes. Every record has a deterministic content key. The full package has a deterministic content fingerprint, strict schema and closed size limits.

Two exports over unchanged data produced identical package bytes and the same fingerprint. This is the basis for a Git repository or ZIP release later, but R105 does not yet create or update either.

## What safe re-import means

The importer has no target-user field. It always writes to `auth.uid()`. The database performs the entire import and receipt write in one transaction. A receipt unique to the authenticated user and the database's own fingerprint makes a retry return `already_imported` without adding rows.

Portability is not treated as proof of origin. A fact that was verified in the source arrives as inferred, with its original source and standing retained only as import metadata. A confirmed pattern arrives as emerging, with confidence capped at 0.5 and one unit of evidence. A decision arrives as manual with a receipt in its context. This preserves useful meaning without laundering a user-editable file into trusted evidence.

## Hosted proof

Two temporary users were created on the reused isolated project. The source user held one fact, one confirmed pattern and one active decision. The destination user held an unrelated guard fact.

- Anonymous export was denied.
- The source package contained three records and no source user ID.
- A changed fact with the old record key was rejected.
- Wrong media and wrong method requests were rejected.
- The first destination import created one fact, pattern and decision.
- The destination guard fact remained present.
- A repeated import created nothing.
- The source stayed unchanged and received no import receipt.
- The two exports produced two genuine reliance touches on the source fact.
- Every Auth, identity, profile, fact, pattern, decision and receipt fixture was removed.

## Honest limit

This is a portable current-Brain package, not a complete account archive. It does not yet carry supersession chains, rejected or archived history, raw source evidence, encrypted legacy content, correction receipts, full standing provenance or signatures proving which CTRL instance produced it. Those are separate requirements for historical fidelity and sovereign handoff.

No email, payment, model, research or external-write capability was enabled. Production remains unchanged and no legacy path is retired.
