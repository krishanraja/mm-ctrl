# G25 cron recovery manifest R101

**Status:** Eight target-neutral job definitions are ready as a fail-closed candidate. Nothing has been scheduled.

## What the old system actually contains

Production has fifteen jobs by fingerprint. Repository migrations name ten unique jobs. Nine of those have their called function or database routine in source. `kit-nudges-email` does not, because `send-kit-nudges` is absent. Five more production jobs remain fingerprint-only. The unresolved total is therefore six, and all six stay preserved rather than guessed.

Of the nine source-backed jobs, `detect-trends-weekly` is deliberately held. Its function is currently a contained read-only empty response and its legacy caller would be rejected by gateway JWT. Restoring it would produce theatre, not intelligence.

## The packet

The candidate schedules the eight useful, source-backed jobs only after all dependencies exist. Six call Edge Functions. Two call database routines. The Edge jobs read a target base URL and a dedicated cron credential from Vault at runtime, so no project URL or service-role credential is copied into `cron.job`.

The sequence preserves the intended living Brain loop:

1. 03:00 memory lifecycle and synthesis sweep.
2. 03:30 outcome credit flows back into the Brain.
3. 04:00 expired data is removed after the learning sequence, rather than overlapping it at 03:15.
4. 06:00 the flywheel snapshot is recorded.
5. 10:30 live news is prepared.
6. 12:00 the daily briefing is sent to eligible leaders.
7. 13:00 carefully capped reactivation is evaluated.
8. Sunday 20:00 the weekly judgement-capture pass runs.

## Why it is not applied yet

The replacement project has no Edge Functions or approved Vault values. Scheduling now would create a broken-looking system and repeated failed calls. Each email-capable route also needs a no-recipient or dry transport proof before its job can exist.

No production job, Vault value or function was changed.
