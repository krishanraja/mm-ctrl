---
repo: krishanraja/mm-ctrl
product: CTRL by Mindmake
as_of: 2026-09-21
head: 618bf91
head_scope: G17 to G20 Brain-adapter, synthetic-population and Claude-bridge contract work; G16 (860dea0) remains the exact verified application release
lifecycle: live
production_url: https://makeyourmindup.ai
state_doc: docs/current/release-state.md
history_log: docs/history/LOG.md
truth_files: [public/.well-known/product.json]
authority_order: [executable code, database readback, deployment readback, src/router.tsx, public/.well-known/product.json, docs/current/README.md, docs/current/commercial.md, project-documentation/DECISIONS_LOG.md, subsystem references and compliance records and runbooks, dated delivery notes and prototypes and roadmaps and Git history]
steward: https://github.com/krishanraja/control-center/blob/main/docs/steward/RUNBOOK.md
never_publish: [any login or credential or the address of the test account, the Supabase project id, secret names such as the cron secret and the video studio export token, the old $9 and $29 prices and any annual price or discount or bundle, customer counts or revenue or conversion or retention or ROI figures, any Personal Memory or briefing or decision or Blind Spot content, a security certification not named in the compliance records]
---
# CTRL by Mindmake: where it is right now

## What it is

CTRL is a calm AI briefing and decision partner for founders and small-team CEOs building the AI-native version of their business, live at `makeyourmindup.ai` with a Free tier and a $49 a month Edge Pro tier. Make Your Mind Up is its public intake, one question at a time. Four surfaces do the work: Today (a small set of corroborated AI signals ranked against the leader's real priorities, as a short read or listen), Decide (a real call weighed against live evidence, with the judgement left to the leader), Blind Spot (one private, evidence-anchored read and one small experiment) and Memory (owner-scoped, correctable, portable context the leader can export to any AI tool). It is a Vite React app on Vercel with Supabase behind it, sharing one Supabase project with other Mindmake surfaces. The product contract is one person, one account: no seats, no admin console, no SSO, no meeting recording (`project-documentation/DECISIONS_LOG.md`, Decision 82). The repository's own docs still carry the earlier "Mindmaker" name; see "What is waiting on Krish".

## Who it is for and why it matters for Mindmake

CTRL's own buyer is the AI-active founder or small-team CEO (`public/.well-known/product.json`, `icp`). For the room_face buyer in `control-center/docs/ICP.md`, a senior leader at a PE or VC backed media, adtech, publishing or data business who is quietly behind on what is coming, CTRL is not the pitch: the `mm_ctrl_buyer` lane is parked (ICP.md, 2026-09-07). CTRL is the proof. It shows that the person offering to help them run a business on AI has built, shipped and operates a paid AI product alone, holds other people's data carefully, and writes down what broke.

Angles a writer can use without asking Krish, each with its pointer:

- **The dry run was the point.** On 2026-08-21 a backfill over 196 memory rows wanted to change exactly two, and both changes were wrong: "VP Eng" would have lost "Eng" as a surname, and the account holder's own name would have been deleted from a sentence about him. The same transform ran on the live path, so the fix went there first. After it, the applied run rewrote nothing (`CHANGELOG.md`, 2026-08-21; commit `bac02d3`).
- **A control recorded as dormant was broken.** Applying the retention schedule on 2026-08-20 exposed that production had never received the `retention_expires_at` column, so a leader changing their retention window got a database error instead of a saved setting (`docs/current/release-state.md`, "The partial migration this readback uncovered").
- **Enterprise exposure comes from the data, so the frame is held structurally.** The moment a leader voices an unannounced deal or a judgement about a colleague, the product holds confidential information. The answer was product contract, not positioning: no seats, no SSO, nothing an IT administrator has to approve (commit `962d0e8`, Decision 82).
- **The trust page names what is missing.** `/trust` lists controls in place, in progress and absent, and says there is no SOC 2 report and no ISO 27001 certificate (PR #370).

Objection it answers: "He talks about AI. Has he shipped anything a customer pays for and kept it honest?" Here is the product, with its failures in the changelog.

## Where it is right now (as of 2026-09-21)

- **Live** at `makeyourmindup.ai`. The exact verified application release remains G16, `860dea0`, Vercel `dpl_2JFRfmZRzUvxbdwXqLunG3eubTgc`, READY and PROMOTED from that SHA (`docs/current/release-state.md`). Everything merged since (`618bf91`) is answer-only publishing, documentation, or Brain contract and gated-preview work; none of it has its own recorded deployment readback.
- **Edge Functions:** 115 directories in the tree. 114 confirmed deployed and ACTIVE by management API readback on 2026-08-21. `live-headlines` version 48 deployed and verified against cache readback on 2026-09-02 (476 items, 473 classified, 12 `damage` dropped). Three changes have no deployment readback recorded here: `video-radar-export` (PR #371, 2026-08-28), the rolling-window merge (PR #375, `edd9045`), and the new `_shared` Brain-crypto and Brain-ingest-core modules (PR #385), which no runtime path calls yet.
- **Tests:** production `main` passes 1,019 tests in 64 files at `618bf91`, with zero new type errors against the 94-error legacy baseline, verified locally 2026-09-21. CI runs docs, standards, tests, typecheck, build and changed-file lint on every push.
- **Living Brain substrate:** 11 additive production tables are live, empty and disconnected from customer paths. Forced RLS, non-anonymous workspace membership, exact-audience grants and authenticated read-only ACLs protect them. The write-adapter primitives, row-bound AES-GCM encryption and idempotent ingest, are built and pass 13 focused tests but are called by no runtime path; the isolated Supabase development branch needed to exercise them is founder-approved but not created, blocked on the GitHub `workflow` scope (`project-documentation/ctrl-evolution/g17-service-adapter-contract.md`). A 48-account, 1,672-event synthetic population and an unlinked, flag-gated operator lab route (`/operator/lab/synthetic-population/:accountId`) exist as deterministic test oracles, not live data (`g18-synthetic-population-lab.md`, `docs/current/features.md`). The writable multi-identity behavioural test remains pending a non-customer connection.
- **Claude bridge:** a founder-confirmed contract for one-gesture private-staging capture and a read-only Claude context-capsule handoff is locked as architecture; it authorises no connector, write path or UI (`project-documentation/ctrl-evolution/g20-universal-capture-claude-bridge-contract.md`).
- **Scheduled work:** twelve pg_cron jobs active at the 2026-08-20 readback, including the nightly `retention-cleanup` added that day (release state, "Scheduled work actually running").
- **Pricing:** Free, and Edge Pro at $49 monthly. Canonical in `supabase/functions/_shared/edge-pricing.ts`; `public/.well-known/product.json` mirrors it and `npm run docs:check` fails if they disagree.
- **Compliance:** controls in place are listed at `/trust` and in `project-documentation/compliance/`; no SOC 2 report, no ISO 27001 certificate, HIPAA out of scope.
- **Documentation:** 64 files uploaded on 2026-09-04 without headers were classed Historical and moved to `docs/history/` on 2026-09-07; nine reconciled docs the upload overwrote were restored (`docs/history/LOG.md`, 2026-09-07).
- **Waiting on evidence, not code:** deployment readback for `video-radar-export`, the PR #375 change, and whether the G19 gated preview route shipped in a Vercel build reachable only behind its flag.

## What changed recently

- 2026-09-08 **G20 capture and Claude bridge locked as contract.** Krish confirmed frictionless capture and Claude-side work as first-class requirements: "We need to make this really easy for me to work in and in Claude, really quick and easy." The governing contract locks two gestures, Add to Brain and Use in Claude, over a read-only capsule handoff, and authorises no connector, write path or UI (`g20-universal-capture-claude-bridge-contract.md`).
- 2026-09-08 **G19 synthetic Brain range lab shipped, gated.** An unlinked `/operator/lab/synthetic-population/:accountId` route renders the 48-account G18 population against no-scroll desktop, mobile disclosure, Arabic and mixed-direction evidence, and inert script-shaped input. Krish approved it as his internal cross-customer dashboard only, not the product surface, subject to a locked scrollbar correction applied the same day (PRs #389, #391).
- 2026-09-08 **G18 synthetic population built as test oracle, not demo.** 48 fictional leaders and 1,672 deterministic input events cover every current Brain source type, audience and processing outcome, plus correction, erasure, identity collision, prompt injection and privacy stress. No account, row or model run exists; it is ready for branch-only seeding once the G16 transactional and RLS gates pass (PR #388).
- 2026-09-08 **G17 write-adapter primitives built, not wired.** Strict row-bound AES-GCM encryption and idempotent retry primitives pass 13 focused tests; no runtime calls them. The founder-approved isolated Supabase development branch needed to exercise them has not been created because the session lacks the GitHub `workflow` scope to publish its creation workflow (PR #385).
- 2026-09-08 **Three public Answer pages published.** "The sites answering this today treat trust as governance and compliance... it requires the tool to hold the leader's own judgement history" (trustworthy AI decision tool, PR #380); "Every site answering this today is a newsletter ranking... the filter itself has to know the specific leader" (AI news noise, PR #381); "Every vendor answering this question grades itself on volume moved" (tasks done versus decisions improved, PR #384).
- 2026-09-08 **Fail-closed Living Brain substrate.** Three additive migrations created the dormant workspace, audience, encrypted source, versioned item, typed relationship and evidence kernel. Live readback found zero rows and no Brain security-advisor findings. The management SQL connection is read-only, so the committed rollback-only multi-identity behavioural suite remains pending a writable non-customer test connection.
- 2026-09-08 **G16 merged and production-verified.** PR #374 merged at `860dea0`; Vercel production `dpl_2JFRfmZRzUvxbdwXqLunG3eubTgc` is READY and PROMOTED from the exact SHA. The canonical host and prerendered public routes passed smoke checks, while the synthetic Decision Bench remained closed and rendered the standard 404.
- 2026-09-07 **Radar evidence survives the rolling window** (PR #375, `edd9045`). Why: the studio export read one cached day, so a story that ran on several days arrived several times, each copy citing one link. It now reads four days and merges repeated sightings into one candidate carrying every distinct public URL. The code's own words: "The rolling window is evidence coverage, not permission to show the same event several times." No deployment readback yet.
- 2026-09-07 **Docs steward adopted.** Why: the 2026-09-04 upload (`8174677`, 76 files, 19,720 lines) put six untitled dumps, twelve June surface maps and a production login and password into a public repo, and overwrote nine reconciled documents. All 64 loose files moved to history with banners, the nine restored, the credential removed. `docs/history/LOG.md`.
- 2026-09-02 **Audience axis and stance on the headline pool** (PRs #372, #373). Why: `category` records only a story's subject, and the subject always wins, so only 23 of 488 cached items carried `org` and the audience a story lands on was never recorded. Each card gained `affects` and `stance`; a `damage` item (harm with no move in it for the reader) is dropped before caching. Backfill readback: 476 items, 473 classified, 12 dropped (`CHANGELOG.md`).
- 2026-08-28 **Cached radar signals exported for the video studio** (PR #371). Why: the local Mindmake video studio needed the corroborated pool without a user JWT or the service role, so a dedicated GET-only function checks its own bearer token, rate limits, and "never returns service credentials" (`supabase/config.toml`). Directory count 114 to 115.

## What is next and what is waiting on Krish

- Next engineering gate: publish the G17 branch-creation workflow once the GitHub `workflow` scope is approved, apply the G16 migrations on that isolated branch, run the committed multi-identity behavioural suite there, then seed the G18 synthetic population before wiring the built-but-unwired write adapter to any customer path.
- Waiting on Krish: approval of the GitHub `workflow` scope needed to publish and run the G17 Supabase branch-creation workflow (`project-documentation/ctrl-evolution/g17-service-adapter-contract.md`, `NEXT_ACTION`).
- Waiting on Krish: a deployment readback for `video-radar-export` and the PR #375 change, then a line in `docs/current/release-state.md`.
- Waiting on Krish: the product name. The fleet calls this "CTRL by Mindmake"; the repo's README title, `product.json` (`legal_entity`, `parent` link) and compliance pack say "Mindmaker". The steward does not change names or commercial claims.
- Waiting on Krish: whether the corpus and course material archived 2026-09-07 (the `doc-*`, syllabus and `DECISIONING CORPUS` files) belongs in another repository, and whether `docs/CTRL-BRAIN-ARCHITECTURE.md` (now in history) should be re-headed as a Reference for the brain migrations that cite it.
- Waiting on Krish: three uploaded files outside the steward allowlist, `docs/_INTERROGATION_RESULTS.json`, `docs/check-standards.mjs` and `docs/ctrl-wordmark.png`.

## Read next

1. `docs/current/README.md`: the index and the authority order. Every current and reference document is listed there.
2. `docs/current/release-state.md`: the exact production baseline, what is deployed, what is only merged, and the live cron schedule.
3. `docs/current/commercial.md` and `public/.well-known/product.json`: buyer, offer, proof, claims and their machine-readable twin. The only sources for a price or a claim.
4. `docs/current/product.md` and `docs/current/features.md`: the user, the promise, the experience laws, and every live route.
5. `docs/current/architecture.md`: boundaries, data flows, the shared Supabase project, provider routing.
6. `project-documentation/DECISIONS_LOG.md`: accepted decisions with unique IDs. Decision 82 is the personal frame.
7. `CHANGELOG.md`: how it got here, newest first.
8. `CLAUDE.md` and `docs/agent-instructions/`: rules for coding agents in this repo.

## Do not trust

- Anything under `docs/history/2026-09-07-*` (64 files): the 2026-09-04 upload, classed Historical today. Surface maps (`app-*`), intelligence distillations (`intel-*`, `_INTELLIGENCE-LAYER`), Phase 0 specs and Phase 1 dead-code manifests describe the June 2026 app on the retired `ctrl.themindmaker.ai` host and are replaced by `docs/current/`. `GTM-PLAN` and `doc-icp` carry retired positioning and prices; `docs/current/commercial.md` wins. `CTRL-BUILD-ROADMAP` and `CTRL-CORPUS` were unlabelled copies of the Historical files in `project-documentation/`. `LLM_CRITICAL_THINKING_TRAINING` duplicates the manual that ships with `ai-generate`. The six `md*.md` files were untitled research dumps. The banner on each names its replacement.
- The revisions of `docs/AGENTIC_UI_TESTING.md`, `BRIEFING_GENERATION_HISTORY.md`, `CTRL-SYSTEM-SPEC.md`, `CURATION-SYSTEM-SPEC.md`, `ENRICHMENT-CONVERGENCE.md`, `HARNESS-CHAIN-STATE.md`, `KIT-REDESIGN-SPEC.md`, `MAIN-APP-POLISH-SPEC.md` and `PORTFOLIO-HIVE-MIND.md` at commit `8174677`: headers stripped, overlay restored. The 2026-08-20 revisions are back in place since 2026-09-07.
- `docs/current/architecture.md` before 2026-09-07: it said `backfill-pseudonymise` was undeployed and counted 177 functions; both were superseded by the 2026-08-21 release. `CHANGELOG.md` before 2026-09-07 had no entry for PRs #371 and #375.
- The test-account table in `docs/AGENTIC_UI_TESTING.md`: `example.com` placeholders, not accounts.
- `project-documentation/CTRL-BUILD-ROADMAP.md`, `CTRL-CORPUS.md`, `HISTORY.md`, `APP-DELIVERY-STATE.md` and the commercial files listed as historical in `docs/current/README.md`: labelled Historical and left in place by Krish's 2026-08-20 reconciliation.
- Any document naming `ctrl.themindmaker.ai` as the host: retired, a permanent redirect only.
