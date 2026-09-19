# G25 compile-standard authority R110 QA record

**Observed:** 18 September 2026  
**Target:** founder-authorized isolated `legibility` project  
**Production writes:** zero

## Frozen implementation

- Route SHA-256: `628e3bcac3f3f4afabaa46c55154204408f89fd890800b1577bd2a2542d51da0`
- Prompt SHA-256: `06b1abb433986e66e1cc78596b289eb14fe8e61b01f3446bb766c4ed43e085ef`
- Authority migration SHA-256: `52e4cde31883af4e75a6bd2a6892f9f9011b120fd4f05e417ae47dfd39c42c98`
- Client hook SHA-256: `4e646a95b06ec07c24791efd9c11e450587d125938e84fb167adce0b35ec44db`
- Hosted probe SHA-256: `300e327ad50b6910ed11f8dc62bb16e267c750525121b123a6165d8b04986bba`
- Containment manifest SHA-256: `34922f1cbbadf2cb114175615f68fdc61ce8b24506937767f15a78cc38923f82`
- Function config SHA-256: `d694cdc16d1f7814adf2b7169d2ae4604997b82dad1b24c80c2e981094a0ecce`
- Hosted bundle SHA-256: `7799de28b28dad9140e1ea726179a61e72dd612f57b5d714cfa7268f21c0c8f3`
- Hosted version: 3, active, JWT verification enabled

## Deterministic and hosted checks

- Compile arithmetic, standard rendering, release-label, sort composition and request-boundary tests: 154 passed before freeze.
- Anonymous: `401`.
- Wrong method: `405`.
- Wrong media: `415`.
- Oversized body: `413`.
- Extra field, missing request ID and invalid run ID: `400`.
- Cross-person route: hidden `404`.
- Cross-person direct RPC: `403`.
- Same-owner direct RPC without compiler capability: `403`.
- Direct criterion insert: `403`.
- Incomplete grades: `409 grades_incomplete`.
- Complete but unreceipted grades: `409 grades_unreceipted`.
- Unfinished sort: `409`.
- First compile: `202`.
- Same-input retry: `200`, same run, idempotent.
- Changed-input replay: `409 request_id_conflict`.
- Primary terminal state: `done / ready`.
- Current advisory criteria: one, version one, exact run provenance.
- Standard artifacts: one, non-empty.
- Paid-call usage rows: one.
- Stale grade snapshot: terminal failure, zero criteria and artifacts.
- Forced artifact insert failure: terminal failure, zero criteria and artifacts, construct unchanged.
- Confounded pairs: `halted`, zero usage.
- Repeat disagreement: `template_and_voice`, zero usage.
- Sixth daily compile: `429 daily_run_limit`.
- Recorded-spend gate: `429 daily_spend_limit`.

## Database and secret-name readback

- Migration `20260918170000`: recorded.
- Edge capability name: present.
- Database Vault capability name: present.
- Authenticated reservation and finalization execution: granted, but a matching private capability is still required.
- Anonymous reservation and finalization execution: denied.
- Authenticated direct criterion insertion: denied.
- Authenticated direct grade insertion: denied.
- Reservation overloads: exactly one.
- Finalization overloads: exactly one.

## Cleanup

Auth users, identities, profiles, runs, items, grades, receipts, criteria, artifacts, usage rows, evidence, constructs and both transient triggers all read back as zero.

The management credential and generated compiler capability were used only in process memory. No credential value was emitted, written to an artifact or committed.
