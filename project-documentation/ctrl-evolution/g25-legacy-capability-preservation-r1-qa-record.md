# G25 legacy capability preservation register R1 QA record

Status: `verified_for_local_preimplementation_gate`

Date: 2026-09-17

## Scope

This record verifies the structure, repository evidence links and authority boundary of:

- [R99 founder lock](g24-predicate-authority-r97-founder-lock-r99.md)
- [R99 machine-readable project record](g24-predicate-authority-r97-founder-lock-r99.json)
- [G25 human-readable register](g25-legacy-capability-preservation-register-r1.md)
- [G25 machine-readable register](g25-legacy-capability-preservation-register-r1.json)
- `scripts/check-ctrl-g25-preservation-register.mjs`

It does not prove behavioral parity, production readiness or customer value. Every capability remains `protected_pending_characterization`.

## Pass definition set before verification

- The exact R97 candidate and founder call are pinned.
- News curation, personalised audio briefing and useful Brain controls are mandatory.
- At least twenty protected capability systems have unique IDs.
- Every record names current owners, callers, data contracts, evidence, target treatment, characterization proof and retirement conditions.
- Every referenced repository path exists.
- No capability is marked retired or deleted.
- R75 and R97 authority boundaries remain closed around runtime, database, UI, external action, merge, deployment, release and legacy retirement.
- All historical predicate contracts through R97 still pass their deterministic checks.

## Evidence

### G25 structural checker

Command:

`npm.cmd run brain:g25:preservation-check`

Result:

`PASS: 22 protected capability systems, 12 mandatory IDs, all repository evidence paths present`

The checker also verifies the exact founder call, R97 commit, tree, authority bundle, manifest bundle and preservation quote in R99.

### R75 and R97 boundary replay

- R77 founder-lock check: pass.
- R78 through R97 materialization and contract checks: pass.
- Each R78 through R97 gate retained thirteen predicate and final-transition paths.
- R97 passed 212 executable vectors and 301 generated totality probes.
- R97 manifest bundle remained `f65d8afa7c5cd54b740b330a6ae0e7615237a7e231976a5b02bd9237b68f7a3e`.

### Adjacent documentation and archive checks

The documentation chain passed through G13, the Brain canary, G24 R1 through R5, the founder architecture lock, trusted-ingress R1 through R47, accepted R66, R70 and R76. The stale next-action assertions in the G24 and R77 state checkers were repaired to require the new G25 preservation boundary and its still-closed runtime authority.

`git diff --check` passed.

### Known repository standards debt

`npm.cmd run standards:check` remains failed by nine pre-existing em-dash findings in frozen or historical G24 and council artifacts. None is in an R99 or G25 file, the canonical state update, the updated checkers or `package.json`. Those frozen artifacts were not rewritten because doing so would invalidate exact historical identities. This is disclosed debt, not a G25 pass claim.

## Verdict

`VERIFIED_FOR_LOCAL_PREIMPLEMENTATION_GATE`

R99 accurately records founder acceptance of R97. G25 makes legacy-capability preservation inspectable and machine checked. It does not yet prove that any new adapter preserves the behavior of a protected system.

## Next gate

Characterize one prepared-intelligence seam behind an adapter:

`qualified news and decision signals -> one governed prepared object -> read and audio projections`

Required first proof: same-object parity, source provenance, reason for inclusion, Brain context selection, feedback control, honest sparse behavior and read/audio consistency. Production and retirement remain closed.
