# G25 memory export hosted proof R103

**Status:** A real authenticated owner can export their own Brain from the reused development project, and cannot receive another synthetic owner's fact.

## Why this proof matters

Portable ownership is part of the approved product spine, not a settings extra. R103 therefore tests a real owner-scoped export before restoring a larger set of functions.

Two disposable Auth users each wrote one unique synthetic fact through normal RLS. User A then requested a Markdown export. The response contained exactly A's fact, excluded B's marker, returned one touched fact and a primary filename, and incremented the reliance counter before returning. Anonymous access was denied.

The function also rejected an unsupported format, an excessive token budget and the wrong HTTP method. Every Auth, profile and Memory fixture was removed after the probe.

## Repairs made before deployment

The inherited route trusted arbitrary body values and the shared builder silently converted database failures into an empty Brain. That is especially dangerous in a portability feature because a broken export could look like a user has no memory. The route now has closed formats, use cases and budgets, while every required Brain query fails explicitly. The reliance write is awaited so the export receipt and learning signal cannot drift apart.

## Boundary

This proves formatted owner-scoped export with one hot fact. It does not yet prove a complete account archive, encrypted legacy rows, large token trimming, multi-format byte stability or GitHub delivery. No customer or production data was touched.
