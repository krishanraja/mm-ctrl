# G24 exact recovery guidance and subscription ownership contract, R93

Status: `candidate_pending_exact_freeze_and_seven_role_review`

Date: 2026-09-16

Decision authority: `DEC-20260916-g24-predicate-authority-r75`

Authority bundle fingerprint: `a77e914b92aa83c55e5930878d081d4e58b16f5acee3c6d011d369c145ea82c1`

Manifest bundle fingerprint: `d20b03e415c00d6146b36c3ac28a9a68c147186ed4eb5d45f1b4aca85347e03e`

Effective-contract SHA-256: `b043b8707f29f29f9d4329cd67464cad4366c7aff2d3a1b2d040402a367c44f2`

## Why R93 exists

R92 genuinely closed every R91 failure. Exact frozen-byte review found two new defects: two valid withdrawals were described as one, making the sole next-step instruction insufficient; and two registrations of the same callback shared removal identity, so one unsubscribe handle could remove the other subscription.

R93 repairs only those faults and retains every R92 guarantee. R92 remains immutable vetoed evidence under the [R92 panel verdict](g24-predicate-authority-r92-panel-verdict.md). R75 remains the governing founder decision.

## Effective contract

1. **Exact replacement work.** `replacement_required` derives from every non-current head across all open challenges, not merely from the first trigger type.
2. **Count and ownership.** Replacement status includes `required_replacements` and canonical `responsible_humans`. The plain-language instruction states the exact minimum number of replacements and who must act.
3. **Truthful progression.** Zero-of-two and one-of-two replacements emit no normal review request. Two-of-two produces one plural review step; signed review then reopens work.
4. **Order independence.** Reversing two signed withdrawals produces the same status, replacement count, owner set, resolution and successor baseline.
5. **Independent subscriptions.** Every listener registration receives a unique subscription record and closure-local active flag. Its unsubscribe handle removes that exact record once, even when another registration uses the same callback function.
6. **Exact delivery proof.** Two registrations of one callback receive two first-transition deliveries; removing one produces one next-transition delivery; the used handle returns false and the untouched handle remains independently removable.

All R92 guarantees remain mandatory: causal review time, state-bound event identity, max-signer durable time, complete observation chains, complete watched baselines, one-to-one authority, replacement-first mixed-state precedence and post-commit listener-failure isolation.

## Independent proof before freeze

The checker reconstructs seven source modules, verifies the signed answer-state and final-authority fixtures plus eighteen valid or hostile signed revalidation specimens, executes all thirteen predicate and final-authority paths, all 212 pinned vectors and 301 generated hostile-input probes.

New decisive sequences are executable:

```text
withdraw answer A; withdraw answer X
→ Two answers need replacing
→ responsible humans are Krish and the leader
→ zero review requests
→ replace A only
→ One answer needs replacing
→ zero review requests
→ replace X
→ plural review step becomes available
→ signed review reopens work
```

```text
register callback f as subscription 1
→ register the same callback f as subscription 2
→ one answer transition delivers twice
→ unsubscribe 1 returns true
→ repeated unsubscribe 1 returns false
→ next answer transition delivers once
→ unsubscribe 2 returns true
```

Run:

```text
npm run brain:g24:predicate-r93-check
```

## Bounded claim

R93 proves deterministic same-process contract semantics only. Subscription records are an executable lifecycle model, not a production event bus. Cross-process concurrency, restart durability, database transactions, delivery semantics, telemetry and shared-consumer atomicity require a separately authorised adapter.

## Still not authorized

R93 does not authorize or implement a production semantic evaluator, lifecycle runtime, live registry, transaction/outbox adapter, database or migration, customer UI, production data, external research or service action, model spend, email, merge, deployment, release, production promotion, legacy-backend deletion or cross-venture decision-ledger write.

## Next gate

Freeze the exact R93 commit and submit that immutable commit and tree to all seven durable judge roles. Every R92 counterexample must be reproduced, and reviewers may add fresh attacks. One valid veto repairs forward. Only a unanimous pass may create a founder-ready machine-contract receipt.
