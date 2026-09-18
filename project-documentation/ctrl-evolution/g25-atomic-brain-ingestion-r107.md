# G25 atomic Brain ingestion R107

**Status:** The model-free `ingest-brain` route now passes a hosted, two-person proof on the founder-authorized isolated `legibility` project. Production was not targeted.

## What changed

The previous route wrote a source, its evidence and its candidate constructs in three separate network operations. A construct failure could leave half an ingestion behind, and a retry duplicated the whole result. It also contained the live production project reference in source.

The route now:

- requires the exact configured project reference rather than naming production in code;
- authenticates the caller and reads only their current memory facts and decision cases through RLS;
- accepts only an empty, bounded JSON command, with no target-person field;
- composes exact quotes without a model and verifies every JavaScript offset before writing;
- asks one database function to recheck each fact and decision against current owner data;
- writes the source, evidence, candidate constructs and receipt in one database transaction;
- returns the same receipt without writes when the same Brain snapshot is retried;
- supersedes the old receipt when current Brain material changes;
- retires only the previous ingestion's still-candidate constructs, while preserving anything already elicited or compiled.

The database stores no raw copy in the receipt. The source remains in `evidence_sources`, the evidence stays traceable to its owner source row, and the receipt stores identifiers, counts and a deterministic fingerprint.

## The defect the proof found

The first correction run exposed a contradiction in the older construct schema. `retired` was an allowed status, but the constraints required every non-candidate construct to already have a contrast pole and two evidence rows. That made it impossible to retire an unfinished candidate after its source fact was corrected.

R107 changes the two constraints so an unfinished candidate may be retired. Elicited and compiled constructs still require the full pole and evidence conditions. This is the correction-safe behavior the product needs: obsolete hypotheses stop steering new work, while accepted learning is not erased.

## Hosted evidence

The proof used two transient authenticated people. It covered:

- anonymous, wrong-method, wrong-media, extra-field and oversized-request rejection;
- an honest `422` for an empty Brain;
- two verified facts, one rejected fact and one live decision;
- three evidence rows grouped into two candidate constructs;
- a stable receipt, source and fingerprint on retry;
- a second person's independent ingestion and zero cross-person receipt visibility;
- a corrected fact producing a new fingerprint and one new active receipt;
- forward and backward supersession links;
- retirement of the stale candidate and preservation of an already elicited construct;
- exact stored offsets for text containing an emoji;
- denial of direct authenticated receipt insertion.

A transient trigger deliberately failed the construct insert after the source and evidence operations had begun. The function returned `500`, and readback found zero source, evidence, construct or receipt rows. The trigger and its function were then removed. All people and application fixtures were removed at the end, with nine zero-count readbacks.

## Boundary

This proves current-Brain staging, not a complete historical archive. It does not prove the model-spend `build-sort` route, construct quality after generation, production cutover or legacy retirement. The next route remains closed until its hard-coded project binding, background service-role writes and model-spend controls are repaired and proved separately.

