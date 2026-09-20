# G25 principal-removal planner, R20

R20 converts the R19 founder rule into one fail-closed local planner. Its job is narrow: distinguish the person a Brain is about from the person who operates it before any deletion plan can be called safe.

## What it proves

- Subject erasure can target only workspaces whose `subject_id` is the erased person.
- Operator removal can revoke access but cannot emit a Brain-erasure action.
- If the removed operator owns a different subject's Brain, authentication deletion remains blocked until authorised transfer or explicit customer closure.
- If an operator is also a Brain subject, operator removal preserves that Brain behind a separate subject decision.
- A partial or unverified relationship inventory cannot produce a ready plan.

Eight deterministic scenarios cover the ordinary and mixed-role cases, ownership without subject authority, duplicated workspace evidence and an unverified inventory.

## What it does not prove

R20 is a pure local planner. It does not revoke access, transfer ownership, delete a user, erase a Brain or close a workspace. The current candidate schema still has cascading owner references to `auth.users`, so auth-user deletion remains unsafe until a non-cascading custody design and multi-identity database canary pass.

The [machine contract](g25-principal-removal-planner-r20.json) pins the source and test hashes. The R19 [founder lock](g25-owner-subject-separation-founder-lock-r19.md) remains the human policy authority.
