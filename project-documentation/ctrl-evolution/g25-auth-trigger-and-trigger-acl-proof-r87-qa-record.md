# G25 Auth hook and trigger ACL proof R87 QA record

## Auth hook

- Isolated trigger migration: applied.
- Trigger count: 1.
- Enabled count: 1.
- Correct function target: 1.
- Function definition unchanged: 1.
- Trigger definition digest matches production: yes.

## Runtime smoke chronology

- Read-only inspection attempt: blocked before insert, no effect.
- Self-cleaning pre-ACL smoke: pass.
- Profile assertion: pass.
- Default-role assertion: pass.
- Auth fixture after smoke: 0.
- Profile fixture after smoke: 0.
- Role fixture after smoke: 0.
- Self-cleaning post-ACL smoke: pass with the same zero-fixture result.

## Trigger ACL

- Targets resolved: 15 of 15.
- Anonymous denied: 15 of 15.
- Authenticated denied: 15 of 15.
- Service allowed: 15 of 15.
- Owner allowed: 15 of 15.
- Definitions unchanged: 15 of 15.
- Enabled attachments: 23.
- Internal function callers: 1.
- ACL verification digest: `85e20aed33ba6b1317789f1c30b7c45a`.

## Independent advisor readback

- Anonymous privileged-function warnings: 41 to 17 across R84 and R87.
- Authenticated privileged-function warnings: 45 to 21 across R84 and R87.
- RLS-without-policy: unchanged at 24.
- extension-in-public: unchanged at 2.

## Production postcheck

- Original trigger-function anonymous grants: 15 of 15 still present.
- Original trigger-function authenticated grants: 15 of 15 still present.
- Service grants: 15 of 15 still present.
- Production writes: zero.

## Verdict

`AUTH_HOOK_AND_TRIGGER_ACL_RUNTIME_PROVED_PRODUCTION_BLOCKED`
