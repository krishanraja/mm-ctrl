# G25 storage erasure surface, R43

R43 converts the storage warning in R14 into an executable repository finding.

The product has three private, user-owned storage buckets: `ctrl-briefings`, `documents` and `skill-packages`. The live account-deletion function and its skipped E2E test name only the first two. Both paid and free skill-export functions write ZIP files into `skill-packages`, so those packages can survive account deletion even after the corresponding database rows disappear.

The current purge also lists one page of at most 1,000 objects directly under the user's prefix. It has no pagination, no recursive traversal and no zero-object verification. A storage failure is appended to an errors array, but the endpoint still returns HTTP 200 with `success: true`.

This is not a theoretical cleanliness issue. An exported package is a portable concentration of the person's standards, judgement and Brain structure. It is among the most sensitive objects the system produces.

## Required future mechanism

Deletion needs a schema-derived bucket registry, recursive paginated enumeration, batched removal, a resumable receipt and a final zero-object check for every registered prefix. Tests must include nested paths and more than 1,000 objects. Any incomplete bucket must leave the overall erasure in pending or failed standing.

R43 does not edit the live deletion function or delete an object. It freezes the exact gap before a later, separately approved implementation.
