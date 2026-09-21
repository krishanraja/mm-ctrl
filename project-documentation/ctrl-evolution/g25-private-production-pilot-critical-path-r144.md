# G25 private production pilot critical path, R144

Status: `execution_active_day_1`

Date: 21 September 2026

## Release definition

“Production” for this critical path means a private, monitored Mindmake pilot used by Krish and one invited leader on real work. It is not public self-service, general availability or permission to remove legacy systems.

The pilot must carry one consequential decision all the way through:

`authorised work arrives → Brain forms a source-grounded view → the system pursues the highest-value unknown → Krish and the leader make the call → the outcome and correction improve later help → the leader can inspect and export what they own`

Anything that does not make that loop safer, more useful or easier before pilot is deferred.

## Honest current state

| Layer | Current evidence | What is still missing for the private pilot |
| --- | --- | --- |
| Product direction | Founder-approved product spine, desktop instrument and radically minimal phone interaction | One implemented, connected end-to-end journey rather than separate proofs |
| Canonical decision data | R142 local candidate passes 94 mutation controls; R143 is proving 22 isolated PostgreSQL races | Frozen review pass, persistent migration packet, clean replay and service boundary |
| Brain intelligence | Extensive contracts, question grammar, research routing, judges and synthetic range | Production model orchestration, grounded outputs, cost/latency controls and real-work evaluation |
| Ingress | Capture, email, transcript, upload and research requirements are specified | One dependable real intake path plus transparent source processing and correction |
| Operator experience | Approved rich desktop direction and multiple implemented slices | Real authenticated data, working navigation, useful empty/loading/error states and no synthetic theatre |
| Leader experience | Approved one-turn phone model | Authenticated delivery, answer/voice persistence, Krish-controlled timing and humane notifications |
| Portability | GitHub/customer-owned export architecture is locked | Working export package, readable Claude handoff and deterministic provenance links |
| Operations | Isolated Supabase and preview discipline exist | Production observability, alerts, backup/restore, rollback, support and a cutover rehearsal |

## Timebox

Target: **8–12 focused working days** from the R142/R143 freeze to a private production pilot.

Remaining estimate after the Day 0 gate and R145 migration replay closed on 21 September 2026: **7–10 focused working days**.

This assumes one release team works the critical path without opening new concept rounds, broad self-service, billing, public onboarding or speculative integrations. A broadly self-service production release is a separate **4–6 week** programme after the private pilot produces real evidence.

## Working-day plan

### Day 0 — close the database gate

- **Complete (21 September 2026):** the full R143 hosted proof passed all 22 schedules with zero residue.
- **Complete:** candidate, test, runner, probe and documentation hashes were frozen.
- **Complete:** a fresh independent architecture/security review returned `PASS` on those exact bytes.
- **Complete:** the R142/R143 revision family is closed. Further architecture revision requires a reproduced release blocker.

### Days 1–2 — make the data spine deployable

- **Complete (21 September 2026):** convert the frozen candidate byte-for-byte into an ordered, reversible migration packet.
- **Complete:** apply it, run the complete canary, roll it back to zero residue and apply it cleanly a second time in the isolated project. Both catalogues are identical.
- **Active:** add narrow authenticated service entrypoints; keep raw tables closed. The application-side AES-256-GCM helper now matches the live database AAD digest exactly and passes its focused encryption tests; the authenticated transaction and route remain to be built.
- Prove idempotency, concurrency, backup/restore and rollback before any production change.

### Days 2–4 — connect one real intake and diagnostic loop

- Ship one fast operator intake path supporting paste, file/transcript and source attribution.
- Enrich only through permissioned research with visible provenance and freshness.
- Run the specialist diagnostic pipeline: evidence extraction, contradictions, missing information, routes, countercase, question selection and abstention.
- Measure usefulness on real or founder-authorised representative work; reject generic business-horoscope output.

### Days 4–6 — connect the approved experiences

- Bind the rich operator desktop instrument to canonical data.
- Bind the approved one-turn phone experience to the exact highest-value outstanding question.
- Make every deeper layer optional and full-screen; keep the first phone view radically minimal.
- Preserve leader authority: answers inform the recommendation but never silently record the call.

### Days 6–8 — close the working loop

- Record the leader-owned call, later outcome, correction and downstream repair.
- Produce a useful Claude context package with no fake references.
- Produce a deterministic customer-owned export with source standing, history and portable Brain files.
- Verify that retained news, audio briefing and useful Brain-control mechanics still work or are deliberately routed behind the new Brain rather than lost.

### Days 8–10 — rehearse the real service

- Run the complete journey with adversarial sparse, rich, contradictory, stale and malformed inputs.
- Verify phone and desktop across the supported device matrix.
- Add tracing, cost/latency budgets, failure alerts, audit receipts and operator recovery controls.
- Rehearse production migration, feature gating and rollback against a clean snapshot.

### Days 10–12 — private production pilot

- Deploy dark, with no public navigation and one explicit pilot allowlist.
- Run one founder-observed real decision from intake to later-use plan.
- Fix only release-blocking defects.
- Open the pilot to one invited leader after Krish reviews the complete journey, not another isolated page.

## Non-negotiable release gates

The private pilot does not open unless all are true:

1. No unresolved P0 or P1 security, privacy, data-integrity or human-authority defect.
2. Exact production migration and rollback have succeeded in a production-like rehearsal.
3. Every consequential output exposes its source standing, material uncertainty and human decision boundary.
4. The diagnostic asks a concrete, business-specific question or abstains; it never fills gaps with generic confidence.
5. The leader can complete the essential phone turn without scrolling through the desktop instrument.
6. Krish can paste or upload work, inspect why the Brain thinks what it thinks, prepare a live session and export useful Claude context without technical ceremony.
7. One complete real-work rehearsal produces a materially useful decision change or sharper falsifiable test.
8. Observability, rate limits, cost ceilings, backup, support and rollback are live before the first customer.
9. Legacy news, audio and Brain-control value is preserved until its replacement is demonstrably better.
10. Production remains reversible and private; public self-service is not smuggled into this gate.

## Scope control

Until the private pilot is live:

- no new visual concept round unless the connected journey fails a founder comprehension gate;
- no new architecture revision without a reproduced release blocker;
- no broad integration catalogue, billing, public onboarding or speculative autonomous feature;
- no production legacy deletion;
- no status report led by revision numbers.

Progress is reported as: `days to private pilot`, completed critical-path stage, current blocker and proof required to clear it.
