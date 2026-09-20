# G25 operator projection source plan, R141 strategy

## Decision

Do not turn the R140 projection into a server query until every slice names its canonical owner and every tempting compatibility shortcut is explicit.

## Why this is the next gate

The isolated project contains both the legacy decision engine and the newer Brain substrate. Their coexistence does not make them one authority. `decision_cases` is person-scoped by `user_id`; it has no Brain workspace, subject, purpose-bound grant or immutable decision snapshot. Joining it to a Brain workspace because the user matches would manufacture authority.

## Method

1. Read the linked isolated catalogue through generated PostgREST types.
2. Map every R140 projection family to a canonical source, derived reader or missing target record.
3. Record prohibited fallbacks, especially `user_id` inference, fixture identity, raw source leakage and thin Claude prompts.
4. Keep the projection closed until every required family is canonical.

No UI, route, database write, production action, merge or release is authorised.
