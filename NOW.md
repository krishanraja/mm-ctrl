---
repo: krishanraja/mm-ctrl
product: CTRL by Mindmake
as_of: 2026-09-26
head: 83ce7c48
head_scope: keep every article the gather sees, merged to main
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

- **A pipeline had been throwing away its own evidence.** `live-headlines` fetches several hundred AI stories a day and has always served twenty. Until 2026-09-22 the rejected majority never existed as data, so volume, share of voice, publisher lead and lag, and any audit of the product's own filters were unanswerable by construction. Three append-only, trigger-enforced tables now keep every article, every cache version and the daily model-price board (`CHANGELOG.md`, 2026-09-22; commit `a6ce832a`).
- **A cleanup job had deleted nothing since it was written.** `cleanup-expired-data` targeted `ai_cache`, a table no migration creates; the real table, `ai_response_cache`, had accumulated every cached response the system had ever produced. The fix ships the delete off by default so a person, not a one-word patch, decides when it runs (`CHANGELOG.md`, 2026-09-22).
- **The dry run was the point.** On 2026-08-21 a backfill over 196 memory rows wanted to change exactly two, and both changes were wrong: "VP Eng" would have lost "Eng" as a surname, and the account holder's own name would have been deleted from a sentence about him. The same transform ran on the live path, so the fix went there first. After it, the applied run rewrote nothing (`CHANGELOG.md`, 2026-08-21; commit `bac02d3`).
- **Enterprise exposure comes from the data, so the frame is held structurally.** The moment a leader voices an unannounced deal or a judgement about a colleague, the product holds confidential information. The answer was product contract, not positioning: no seats, no SSO, nothing an IT administrator has to approve (commit `962d0e8`, Decision 82).
- **The trust page names what is missing.** `/trust` lists controls in place, in progress and absent, and says there is no SOC 2 report and no ISO 27001 certificate (PR #370).

Objection it answers: "He talks about AI. Has he shipped anything a customer pays for and kept it honest?" Here is the product, with its failures in the changelog.

## Where it is right now (as of 2026-09-26)

- **Live** at `makeyourmindup.ai`. The exact application release verified in production is still the G16 baseline at `860dea0`, Vercel `dpl_2JFRfmZRzUvxbdwXqLunG3eubTgc`, READY and PROMOTED from that SHA (`docs/current/release-state.md`). Everything below `860dea0` on `main` is merged; none of it carries its own deployment or production readback yet.
- **Merged since the G16 receipt, not yet deployment-verified:** the G17 to G20 Brain-substrate contracts and their code, and the 2026-09-22 gather-retention change. See "What changed recently".
- **Edge Functions:** 115 directories in the tree, unchanged in count this run. 114 confirmed deployed and ACTIVE by management API readback on 2026-08-21; `live-headlines` version 48 verified against cache readback on 2026-09-02. `video-radar-export` (PR #371) and the rolling-window merge (PR #375) still have no deployment readback recorded here, and neither does the 2026-09-22 gather-retention Edge Function code.
- **SQL migrations:** 171 files in the source tree (`docs/current/architecture.md`, `docs/current/release-state.md`, reconciled 2026-09-22 with the new `20260922100000_ctrl_keeps_what_it_gathered.sql`). No migration from this file has been applied to the shared Supabase project.
- **Tests:** the last verified count in `docs/current/release-state.md` is 945 tests in 60 files, read back against the G16 baseline on 2026-09-08. G17, G18 and G19 added new unit, component and end-to-end test files after that count was taken (`brain-crypto.test.ts`, `brain-ingest-core.test.ts`, `trend-memory.test.ts`, `syntheticPopulation.test.ts`, `SyntheticPopulationLabPage.test.tsx`, `synthetic-population-lab.spec.ts`); the total was not re-run this cycle, so the 945 figure is stale and unverified rather than corrected. See "What is next".
- **Living Brain substrate:** 11 additive production tables are live, empty and disconnected from customer paths, as at the 2026-09-08 canary (`project-documentation/ctrl-evolution/g16-workspace-audience-canary.md`). G17 adds strict row-bound AES-GCM crypto and ingest-core primitives that no runtime path calls yet; the approved isolated Supabase development branch has not been created because the delivery session lacks the `workflow` GitHub scope it needs.
- **Synthetic Brain range lab:** an unlinked, preview-gated operator route (`/operator/lab/synthetic-population/:accountId`) renders the 48-account G18 synthetic population; Krish approved it 2026-09-08 as his internal cross-customer dashboard only, not as the customer product.
- **G20 Claude bridge:** a founder-confirmed contract only. No connector, capsule endpoint or write path exists yet (`project-documentation/ctrl-evolution/g20-universal-capture-claude-bridge-contract.md`).
- **Pricing:** Free, and Edge Pro at $49 monthly. Canonical in `supabase/functions/_shared/edge-pricing.ts`; `public/.well-known/product.json` mirrors it and `npm run docs:check` fails if they disagree.
- **Compliance:** controls in place are listed at `/trust` and in `project-documentation/compliance/`; no SOC 2 report, no ISO 27001 certificate, HIPAA out of scope.
- **Waiting on evidence, not code:** deployment readback for `video-radar-export`, the PR #375 rolling-window change, and the 2026-09-22 gather-retention migration and Edge Function changes.

## What changed recently

- 2026-09-22 **Keep every article the gather sees, not only the twenty it serves** (commit `a6ce832a`, merged to `main` at `83ce7c48` on 2026-09-23). Why: the rejected majority of each day's several hundred fetched stories never existed as data, so volume, share of voice, publisher lead and lag, and any audit of the product's own filters were unanswerable by construction. Three append-only tables enforced by trigger now hold every article with its verdict, every cache version, and the Artificial Analysis model board daily; a source that stops producing now reads as a zero instead of a slightly thinner feed. The shared pool went dark for about four weeks to 2026-08-05 and nothing had reported it. Also fixed `cleanup-expired-data`, which had deleted nothing since it was written because it targeted `ai_cache`, a table no migration creates; the delete is off by default behind `CLEANUP_PRUNE_AI_CACHE`. The feed itself is unchanged. Not yet applied to the shared project (`CHANGELOG.md`).
- 2026-09-08 **G20 universal capture and Claude bridge contract locked** (PR #392). Why: Krish asked directly for it to be easy to paste material in and to prompt out to Claude, "the Claude UI is often where I do things." The contract locks two gestures, private-staging capture and a read-only, purpose-bound, expiring context capsule for Claude, and rejects whole-Brain dumps and unsupported prompt injection. Contract only; no connector or write path exists (`project-documentation/ctrl-evolution/g20-universal-capture-claude-bridge-contract.md`).
- 2026-09-08 **G19 synthetic Brain range lab approved as Krish's internal dashboard** (PRs #389, #391). 61 deterministic and React checks plus eight local and eight protected-preview Chromium acceptance tests passed across no-scroll desktop, mobile disclosure, Arabic and mixed-direction evidence, and inert script-shaped input. Krish approved it 8 September 2026 specifically as his own cross-customer view, not as the customer product.
- 2026-09-08 **G18 synthetic Brain population added as a test oracle** (PR #388). 48 fictional leaders and exactly 1,672 deterministic input events, each recording what a diagnostic must notice, must not infer, and the smallest defensible next move; not testimonials or efficacy evidence. No database row or auth account created.
- 2026-09-08 **G17 strict Brain adapter primitives added** (PR #385). Row-bound AES-GCM encryption and idempotent ingest-core primitives, with thirteen focused tests passing; no runtime path calls the new modules yet. The founder-approved isolated Supabase development branch has not been created because the session cannot publish the guarded workflow without a separately approved `workflow` GitHub scope.
- 2026-09-08 **Fail-closed Living Brain substrate.** Three additive migrations created the dormant workspace, audience, encrypted source, versioned item, typed relationship and evidence kernel. Live readback found zero rows and no Brain security-advisor findings. The management SQL connection is read-only, so the committed rollback-only multi-identity behavioural suite remains pending a writable non-customer test connection.
- 2026-09-08 **G16 merged and production-verified.** PR #374 merged at `860dea0`; Vercel production `dpl_2JFRfmZRzUvxbdwXqLunG3eubTgc` is READY and PROMOTED from the exact SHA. The canonical host and prerendered public routes passed smoke checks, while the synthetic Decision Bench remained closed and rendered the standard 404.
- 2026-09-07 **Radar evidence survives the rolling window** (PR #375, `edd9045`). Why: the studio export read one cached day, so a story that ran on several days arrived several times, each copy citing one link. It now reads four days and merges repeated sightings into one candidate carrying every distinct public URL. No deployment readback yet.
- 2026-09-07 **Docs steward adopted.** Why: the 2026-09-04 upload (`8174677`, 76 files, 19,720 lines) put six untitled dumps, twelve June surface maps and a production login and password into a public repo, and overwrote nine reconciled documents. All 64 loose files moved to history with banners, the nine restored, the credential removed. `docs/history/LOG.md`.
- 2026-09-02 **Audience axis and stance on the headline pool** (PRs #372, #373). Why: `category` records only a story's subject, and the subject always wins, so only 23 of 488 cached items carried `org` and the audience a story lands on was never recorded. Each card gained `affects` and `stance`; a `damage` item is dropped before caching. Backfill readback: 476 items, 473 classified, 12 dropped.
- 2026-08-28 **Cached radar signals exported for the video studio** (PR #371). Why: the local Mindmake video studio needed the corroborated pool without a user JWT or the service role, so a dedicated GET-only function checks its own bearer token, rate limits, and "never returns service credentials." Directory count 114 to 115.

## What is next and what is waiting on Krish

- Next engineering gate: create the founder-approved isolated Supabase development branch once the delivery session holds the `workflow` GitHub scope, apply the existing G16 migrations there, run the committed multi-identity behavioural suite, then seed the G18 synthetic population before any service-side Brain write function is authored.
- Waiting on Krish: a deployment readback for `video-radar-export`, the PR #375 change, and the 2026-09-22 gather-retention migration and Edge Function changes, then a line in `docs/current/release-state.md`.
- Waiting on Krish: re-running the full test suite against `83ce7c48` so `docs/current/release-state.md`'s 945-test baseline (taken 2026-09-08, before the G17 to G19 test files landed) can be corrected from a real run rather than estimated.
- Waiting on Krish: the product name. The fleet calls this "CTRL by Mindmake"; the repo's README title, `product.json` (`legal_entity`, `parent` link) and compliance pack say "Mindmaker". The steward does not change names or commercial claims.
- Waiting on Krish: whether the corpus and course material archived on 2026-09-07 belongs in another repository, and the three uploaded files outside the steward allowlist, `docs/_INTERROGATION_RESULTS.json`, `docs/check-standards.mjs` and `docs/ctrl-wordmark.png`.
- Waiting on Krish: the first rendered G20 vertical slice (paste through universal capture, receive a receipt, open Use in Claude, review a capsule disclosure) remains synthetic-only and ungated by a founder review of the rendered interaction.

## Read next

1. `docs/current/README.md`: the index and the authority order. Every current and reference document is listed there.
2. `docs/current/release-state.md`: the exact production baseline, what is deployed, what is only merged, and the live cron schedule.
3. `docs/current/commercial.md` and `public/.well-known/product.json`: buyer, offer, proof, claims and their machine-readable twin. The only sources for a price or a claim.
4. `docs/current/product.md` and `docs/current/features.md`: the user, the promise, the experience laws, and every live route.
5. `docs/current/architecture.md`: boundaries, data flows, the shared Supabase project, provider routing.
6. `project-documentation/ctrl-evolution/README.md`: the resumable G13 to G20 discovery ledger, including the still-open G17 branch gate and the G20 contract.
7. `project-documentation/DECISIONS_LOG.md`: accepted decisions with unique IDs. Decision 82 is the personal frame.
8. `CHANGELOG.md`: how it got here, newest first.
9. `CLAUDE.md` and `docs/agent-instructions/`: rules for coding agents in this repo.

## Do not trust

- Anything under `docs/history/2026-09-07-*` (64 files): the 2026-09-04 upload, classed Historical. Surface maps, intelligence distillations, Phase 0 specs and Phase 1 dead-code manifests describe the June 2026 app on the retired `ctrl.themindmaker.ai` host and are replaced by `docs/current/`. The banner on each names its replacement.
- `docs/current/architecture.md` and `docs/current/release-state.md` before 2026-09-22: both quoted 170 SQL migration files; the tree now holds 171 with the gather-retention migration added, not yet applied to the shared project.
- The 945-test count in `docs/current/release-state.md`: taken 2026-09-08, before the G17, G18 and G19 test files were added. It is a stale baseline, not a corrected one; see "What is next".
- `project-documentation/CTRL-BUILD-ROADMAP.md`, `CTRL-CORPUS.md`, `HISTORY.md`, `APP-DELIVERY-STATE.md` and the commercial files listed as historical in `docs/current/README.md`: labelled Historical and left in place by Krish's 2026-08-20 reconciliation.
- Any document naming `ctrl.themindmaker.ai` as the host: retired, a permanent redirect only.
