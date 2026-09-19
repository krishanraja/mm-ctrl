# G25 whole-Brain deletion coverage, R14

Status: `repository_coverage_map_complete_execution_closed`

Machine record: [g25-whole-brain-deletion-coverage-r14.json](g25-whole-brain-deletion-coverage-r14.json)

## The honest result

R13 proves erasure for the new prepared-intelligence derivative store. It does not prove that a person has been erased from CTRL.

The repository currently has at least nine distinct data planes: the canonical Brain, prepared derivatives, legacy memory and decisions, briefings/news/audio, exports and skills, MCP access, logs and caches, external processors, and backups or user-controlled copies. Each needs a different deletion rule and a different kind of evidence.

## What already works

The current account-deletion function does useful work. It authenticates the person, cancels active Stripe subscriptions where possible, deletes many user-owned database rows, purges two storage buckets and deletes the auth identity last. Canonical Brain tables also have cascading workspace ownership paths from `auth.users`.

Those are assets to preserve. They are not yet a complete proof.

## The gaps that matter most

The current function returns `success: true` even when individual deletions failed. The E2E test correctly treats any populated error list as failure, but the suite is skipped and checks only a small subset of tables.

Skill ZIPs are uploaded to `skill-packages`, while account deletion purges only `ctrl-briefings` and `documents`. Storage listing is capped at one page of 1000 objects and recursive folder coverage is unproved.

The function retains audit evidence but writes the person's email into that retained metadata. That conflicts with data minimisation unless a precise legal and retention basis is defined and the identifier is redacted or pseudonymised.

The product also sends material to AI, search, audio, email, billing and spreadsheet providers. There is no common processing receipt that says what was sent, under which purpose, how long the provider retains it, whether deletion is possible and what evidence came back.

## The required product truth

“Deleted from CTRL” must mean something exact. It cannot imply recall from a downloaded ZIP, a private GitHub repository, Claude, a recipient's inbox or a provider backup when CTRL has no such power.

The future experience should make three states legible without legal theatre:

1. deleted now from systems CTRL controls;
2. scheduled to disappear under a known retention window;
3. copied somewhere the customer controls, with a clear action they must take.

## Next safe step

Build a schema-derived erasure plan and receipt rather than expanding the manual list. It should revoke access first, traverse exact ownership, handle storage recursively, call supported provider deletion APIs, redact retained audit evidence, record every result and refuse to call partial completion success.

The live delete path remains untouched until retention exceptions, external-copy language and failure semantics are approved.
