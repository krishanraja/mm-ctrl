# G25 high-risk privileged callers R83

**Status:** Caller evidence is complete enough to test a narrow ACL candidate in the blank recovery project. Production remains unchanged.

## What changed in our understanding

The nine highest-risk functions are not one homogeneous pile of dead code.

- Two are active daily jobs. `snapshot_north_star()` and `sp_aggregate_briefing_feedback(integer,integer)` each ran nine times in the available statement window. Both cron jobs run as `postgres`.
- `sync_lead_to_sheets(uuid,uuid,text)` is called by eleven database functions that support trigger-driven lead capture. It is an internal dependency even though current application code does not call it directly.
- Six functions had no top-level calls in the available statement window. That is useful evidence, but not permission to delete them.

The original live caller scan incorrectly reported zero target references. The durable R88 literal-RPC index found one: deployed `send-results-email` calls `sync_lead_to_sheets` through a client built with the service-role symbol. The R83 ACL remains correctly shaped because it retained explicit `service_role` execution, but the earlier caller claim was wrong. No raw deployed source was committed.

## The narrow hardening move

All nine functions currently allow both anonymous and authenticated execution. Seven also inherit `PUBLIC` execution. None contains a verified ordinary-user authorization contract.

The candidate therefore removes `PUBLIC`, `anon` and `authenticated` execution from exactly these nine functions and retains `service_role` execution. It changes no function body.

That keeps the known trusted paths intact:

- cron continues as the `postgres` owner;
- owner-executed database functions can continue calling `sync_lead_to_sheets` internally;
- trusted workers retain an explicit `service_role` route.
- deployed `send-results-email` retains its service-role RPC route to `sync_lead_to_sheets`.

It closes the accidental PostgREST RPC surface in the isolated target so we can prove the effect before considering production.

## What the candidate does not decide

`track_referral_conversion` may represent an old public product flow. It has no current repository, deployed Edge Function, cron or observed top-level caller, but that is not enough to erase the capability. If referral conversion still matters, it should return behind a deliberately authenticated or rate-limited edge with an idempotent contract, not remain a privileged anonymous database function.

`get_or_create_profile` and `increment_automator_usage` are also retirement candidates, not approved deletions. Historical clients and third-party integrations remain outside the evidence boundary.

## Next proof

Apply the candidate only to the approved blank recovery project. Verify all nine deny anonymous and authenticated execution, retain owner and service execution, keep their definition digests unchanged and preserve the eleven internal sync callers. Do not invoke a target function to test permissions.
