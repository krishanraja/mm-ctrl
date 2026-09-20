# G25 non-cascading owner guard, R22

R22 proves the smallest safe database correction implied by R19 through R21: an authentication-user deletion must not be able to cascade through an owner relationship and destroy another person's Brain.

## Verified locally

The four owner foreign keys use `ON DELETE RESTRICT` in a non-migration candidate. In a PostgreSQL canary:

- deleting the operator who owns Maya's Brain is blocked and leaves the user, role, workspace, receipt, correction and tombstone intact;
- transferring only the workspace owner is still insufficient because historical prepared custody remains bound to the former operator;
- deleting a role-only operator removes the role while preserving the Brain;
- deleting the actual subject after workspace transfer removes only that subject and subject-scoped Brain data;
- weakening the four constraints back to cascade makes the negative control fail.

## What the proof revealed

`RESTRICT` is the correct catastrophe guard, not the finished custody model. Prepared receipts bind `owner_id` into compound scope and encryption context. Silently rewriting it during transfer could break decryption or rewrite history. Keeping it tied to `auth.users` indefinitely can also prevent legitimate operator deletion.

The next design must separate three things that the candidate schema currently conflates:

1. current access;
2. current customer-authorised custody;
3. immutable historical and cryptographic identity.

R22 is not a migration and authorises no linked database, auth-user deletion, transfer, closure, runtime integration, deployment, merge or release.
