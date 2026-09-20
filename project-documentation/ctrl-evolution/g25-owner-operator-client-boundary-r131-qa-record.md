# G25 owner and operator client boundary, R131 QA

- Owner adapter calls only `prepare_and_bind_standard_change_operator_projection_v1`.
- Operator adapter calls only `get_operator_pending_standard_change_review_v1`.
- Input validation: UUIDs plus exact lowercase SHA-256 for the owner action; UUID for the operator workspace.
- Response validation: strict, with unknown fields rejected.
- Owner response workspace substitution: rejected.
- Owner packet or other extra material: rejected.
- Operator item: exactly review ID, question, headline, consequence and ready time.
- Operator raw packet or hash: rejected.
- Private operator denial reason: rejected.
- Public unavailable result: accepted only as `not_available`, zero items and no next item.
- Authority fields: constrained to false.
- Targeted tests: 10 passed.
- Typecheck: baseline 94, current 94, new errors zero.
- Customer-facing UI changed: no.
- Production writes: zero.
