# G25 non-schema restoration gate R96

**Status:** The secret-free Storage and application Realtime plane is source-controlled and has passed a transactional dry run. It remains unapplied. Schedules, Edge Functions and Vault remain closed where exact source or security authority is missing.

## What can be restored without guessing

R96 captures the five exact bucket configurations and all twelve current Storage policies. It also captures the three application tables in the `supabase_realtime` publication. The seven dated tables in `supabase_realtime_messages_publication` are platform-managed Realtime partitions, not application objects to copy manually.

The prepared transaction preflights a blank target, creates only those five buckets and twelve policies, and adds only the three application tables to Realtime. The verification compares production counts and digests. A transformed copy ran inside the isolated project and ended with `rollback`; all bucket, policy and publication-member counts remained zero afterward.

## The five Storage buckets

| Bucket | Public | Limit | MIME boundary |
|---|---:|---:|---|
| `ctrl-briefings` | no | 10 MiB | current production has no MIME allowlist |
| `documents` | no | 50 MiB | PDF |
| `post-session-qr` | yes | none | none |
| `pre-workshop-qr` | yes | 1 MiB | PNG |
| `skill-packages` | no | 20 MiB | ZIP |

The candidate reproduces current state. It does not claim every current policy is ideal. In particular, duplicate public QR read policies and the absence of a user upload policy for skill packages should be reviewed as improvement work after recovery fidelity is secured.

## The schedule gap

Production has fifteen active schedules. Names, timing and non-secret execution metadata are captured. Nine have executable repository evidence. Six do not:

- `briefing-aggregate-feedback-nightly`
- `decision-watch-hourly`
- `google-sheets-sync-processor`
- `mindmake-aa-price-snapshot-daily`
- `mindmake-brief-retention-daily`
- `mindmake-follow-up-daily`

R96 did not retrieve cron commands because command text can contain credentials or operational values. The six missing definitions need a safe source and security review before a restoration candidate can be exact.

## The Edge Function and Vault gaps

Production has 183 active Edge Functions. The repository has 115 function directories; 68 functions are live-only. Their source was inspected transiently in R80 but not copied into Git. Thirty-one live-only functions have gateway JWT verification disabled and none contains R80’s explicit user-validation marker. That does not prove all are unsafe, but it makes bulk redeployment unacceptable.

The isolated project therefore still has zero functions. Every route needs a source digest, caller map, deployment configuration and route-specific authentication verdict before deployment.

Production has two Vault names. Values were never read. The repository establishes `ctrl_cron_secret` as one required name; the other is not guessed. Release-time injection must come from an approved secure source and must never print or persist a value.

## Honest boundary

R96 makes the safe part executable and the unsafe or unknown part explicit. It does not convert an incomplete backend into a recovery claim.
