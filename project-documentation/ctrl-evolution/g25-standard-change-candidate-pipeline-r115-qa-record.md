# G25 candidate standard-change pipeline R115 QA

- Isolated project: `cgkcplcamsijghalintq` (`legibility`)
- Production project: untouched
- Recorded migrations: thirteen exact R115 versions from `20260918203434` through `20260919100000`
- Hosted functions: `compile-standard-change`, `build-standard-change`, `check-standard-change`; version 1 after clean restore; ACTIVE; gateway JWT enabled
- Deployed bundle identity: three exact `ezbr_sha256` digests frozen; five downloaded runtime files per function matched the reviewed local bytes before and after each hosted exercise, including after restore
- Active isolated functions: 16
- Candidate tables: five; RLS enabled; owner select only; zero rows after cleanup
- Trigger-only helper functions callable by ordinary roles after repair: zero
- Focused tests: 16 passed across two files
- Full Vitest suite: 114 files and 1,689 tests passed
- Trust containment: 62 contracts and four service-auth tests passed
- Typecheck: current 94, baseline 94, new 0
- Direct Vite development build: passed, 2,812 modules transformed
- Complete documentation gate: passed, including 703 linked Markdown files and every R1-R47 trusted-ingress materialization
- Complete historical postdocs gate: passed in one direct run and again through the `docs:check` lifecycle hook

Hosted proof facts:

- all three Capture proposal types inserted through the real database trigger: `false_positive`, `uncovered` and `drift`;
- uncovered and drift proposals each created an immutable candidate change request;
- request boundary statuses: 401, 405, 415, 413 and 400;
- cross-owner request: 404;
- all seven direct capability RPCs without the capability: 403;
- two simultaneous Compile calls with different idempotency keys: one 200 and one 409, with one durable compilation;
- false-positive Compile, Build and Check: 200;
- drift Compile, Build and Check: 200, with `no_change`, a passing verdict and provenance `holds`;
- changed retry: 409;
- exact retries: idempotent at all three stages;
- Check verdict: `passed` with ten criterion-level findings;
- held-out material: one sealed database item, zero intersections with the actual runtime and one durable exclusion receipt;
- aggregate score: absent;
- active standard and current criteria: byte hashes unchanged;
- stale source: 409 with zero compilations;
- cross-tenant visible rows: zero across all five candidate tables; and
- synthetic users, proposals and candidate rows after cleanup: zero.

Advisor readback found zero ordinary-role execution for trigger-only helpers and zero performance warnings on the five new candidate tables. Seven security warnings remain intentionally visible for capability-gated stage RPCs; all seven direct-call denials are in the hosted proof. Three inherited R114 policy-performance notices remain outside this change.

## Independent-review correction cycle

The first fresh independent review returned `BLOCKED`. It confirmed that the authority hold, active-standard boundary and deterministic build were real, then rejected the candidate for six concrete reasons: evidence IDs were not bound to exact lines, criteria and surfaces; later stages could reload mutable proposal data; different idempotency keys could race the same stage; the holdout assertion was not backed by a runtime intersection receipt; cross-tenant and direct-RPC probes were incomplete; and rollback did not cover Edge routes, secrets and migration history. It also rejected the probe's broad production guard.

The corrected candidate freezes proposal, decision and source snapshots at acceptance; validates exact evidence bindings; makes one running worker per request stage a database invariant; derives a sealed holdout-intersection receipt from the actual runtime; probes all five tables and seven RPCs; hard-pins the isolated project ref; and includes complete rollback and restore operators. The post-correction hosted proof passed after a real clean rollback and restore.

## Rollback and restore evidence

- complete rollback: three Edge routes removed, Edge and Vault capabilities removed, five tables removed, candidate functions removed and thirteen history rows reverted;
- rollback residue: zero routes, tables, candidate functions, capability secrets and migration-history rows;
- complete restore: thirteen exact files reapplied, a fresh unprinted capability generated, seven RPCs and five tables restored, and three JWT-enabled routes deployed; and
- post-restore proof: Compile, Build and Check passed again, concurrency returned 200/409, holdout intersection remained zero, active standard bytes remained unchanged and fixtures cleaned to zero.

The first rollback rehearsal also found ordering, JSON-wrapper and Windows PowerShell 5.1 compatibility defects. Those were corrected before the recorded clean rollback and restore cycle. This is why the final scripts are executable evidence rather than an untested rollback description.

## Exhaustive regression corrections

The complete historical gate found four stale assumptions outside the R115 runtime. Two archived PostgreSQL fixtures, R23 and R28, created records at the wall clock and then applied an earlier fixed transfer or revocation time; their test fixtures now use fixed earlier creation times, with production SQL unchanged. The R44 static checker scanned theory modules for provider-receipt vocabulary even when those modules made no provider call; it now limits that assertion to detected callsites while preserving the fifteen-provider gap. R57-R60 correctly expanded from 77 to 94 migration-only candidates and from 193 to 210 catalog targets because the R115 tables add seventeen identity-bearing JSON surfaces. R79 now distinguishes 115 functions observed both live and local from six later local-only routes, rather than inventing deployment status for the current 121-function repository.

## Fresh independent correction

The first final independent review correctly blocked R115 because the frozen proposal trigger treated all proposal types as though they cited the same evidence shape. It only proved the hosted false-positive fixture. Real drift proposals intentionally have no cited lines because they ask about an absence across applicable reviews, while uncovered proposals carry source lines but no existing criterion ID. The old trigger therefore rejected every real drift and uncovered proposal before Compile.

The correction keeps the gate strict and makes it type-aware. False positives now require an exact current criterion plus rejected `breaks` lines. Uncovered gaps require exact `uncovered` source lines and no invented current criterion. Drift requires zero cited lines, an exact current criterion, no firing for that criterion, and an opportunity count equal to the frozen applicable-review manifest. Every evidence-bearing proposal also requires a true one-to-one source-ID-to-line binding, including the actual locator, week, surface, criterion name, verdict and disposition. The hosted proof now inserts all three types, accepts an uncovered and a drift proposal into immutable change requests, and repeats the full proof after an exact rollback and thirteen-migration restore.

After those narrow corrections, the complete documentation gate and all 117 postdocs stages passed without suppressing any unresolved risk or opening any execution boundary.

## Final deployment-provenance correction

The next fresh independent review returned `BLOCKED` for one remaining reason. The contract pinned local route hashes and the receipts proved live behaviour, but neither receipt contained the live Edge bundle digests or a downloaded-source comparison. Function names, versions and ACTIVE status were insufficient to prove that the hosted conveyor had executed the reviewed bytes.

The correction adds a frozen deployment manifest and a fail-closed verifier. It pins all three `ezbr_sha256` values, inventories the live functions before and after source download, downloads every deployed closure through the Supabase management API, and requires the exact five-file set, byte count and SHA-256 for each route to match the reviewed repository source. The hosted probe runs only after this gate. The restore operator runs the same gate before it can report success. The complete rollback, restore and hosted proof were then executed again; the bundle digests reproduced exactly, all fifteen downloaded source files matched, and production remained untouched.

## Final end-to-end provenance correction

The next fresh review found two narrower gaps. The immutable request packet carried evidence bindings but omitted drift opportunity bindings, so a real drift candidate could be accepted by the database and then fail Compile because absence had no frozen denominator. The deployment verifier also ran before the hosted calls, leaving a small interval in which a route could theoretically be redeployed before the proof completed.

The final correction carries the exact applicable-review run IDs through the request packet, compiled amendment and independent Check. Drift now proves zero firing evidence against that frozen opportunity set instead of pretending an absence is a conventional citation. A real drift request completed Compile, Build and Check with provenance `holds` and candidate status `no_change`. The probe also downloads and verifies all three live source closures again after the final Edge call and requires the complete function inventory, bundle digests and downloaded bytes to be identical before and after the exercise. The clean thirteen-migration rollback and restore were repeated after these changes.

## Final rollback-readback correction

The next fresh judge found one last mismatch between action and proof. The rollback command reverted all thirteen migration versions, but its final history query listed only the first twelve. A stale `20260919100000` ledger row could therefore have survived while the receipt still reported a clean rollback.

The readback now derives its SQL array from the same canonical `$migrationVersions` list used by the repair command, and the static checker refuses a second handwritten list. The isolated project was rolled back again: three routes, five candidate tables, all candidate functions, the capability secret and all thirteen history rows read back at zero. The exact thirteen-file restore then returned five tables, seven RPCs, one hidden capability, thirteen history rows and three source-verified routes. The complete hosted proof passed again with stable before-and-after deployment identity and zero fixture residue.

A different fresh reviewer then returned `PASS`. It independently reproduced the contract and receipt hashes, the derived thirteen-version readback, the live five-table and seven-RPC restore state, all thirteen migration rows, the three exact Edge bundle digests and their five-file source closures. It found no remaining defect in proposal typing, drift opportunity provenance, candidate-only authority, concurrency, deterministic Build, held-out Check, tenancy, stale-source refusal, cleanup or rollback. The PASS is bounded to R115 and does not authorize apply, merge, deployment, release, production, cutover or retirement.

## Migration-baseline incident

A generic `supabase db push --include-all` was attempted against the isolated target and exposed an inherited repository-baseline mismatch. It stopped on an existing policy conflict after ten unrelated historical migrations had been applied. The exact delta was empty, compared against the production catalog, and was removed by exact object identity. The ten unrelated migration-history rows were reverted. Final readback found zero unexpected tables, functions, policies, columns, constraints or history entries. Production was read for catalog comparison only and received zero writes. Do not use `db push --include-all` for this project until the historical migration baseline is reconciled; R115 restore uses an exact thirteen-file allowlist.

Apply, release, production, merge, cutover and legacy retirement remain separate gates.
