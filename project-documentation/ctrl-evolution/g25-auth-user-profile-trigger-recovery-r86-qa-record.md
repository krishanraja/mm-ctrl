# G25 Auth signup hook recovery R86 QA record

## Gap evidence

- Production trigger count: 1.
- Production enabled count: 1.
- Production trigger: `auth.users:on_auth_user_created`.
- Production function: `public.handle_new_user_profile()`.
- Recovery preflight trigger count: 0.
- Recovery function body: present with the production digest.
- Production writes: zero.

## Candidate constraints

- Creates only the missing named trigger.
- Does nothing when the named trigger already exists.
- Does not drop or replace an object.
- Does not alter the trigger function.
- Does not touch production.

## Runtime-smoke constraints

- Uses one fixed synthetic UUID.
- Uses an `example.invalid` email.
- Inserts directly into the isolated `auth.users` table.
- Requires the expected public profile and default role.
- Rolls back the fixture and all trigger side effects.
- Calls no external Auth or email API.

## Verdict

`AUTH_TRIGGER_GAP_PROVED_ISOLATED_REPAIR_READY`
