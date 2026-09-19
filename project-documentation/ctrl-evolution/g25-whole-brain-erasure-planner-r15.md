# G25 whole-Brain erasure planner, R15

Status: `local_erasure_planner_proved_policy_unbound`

Machine record: [g25-whole-brain-erasure-planner-r15.json](g25-whole-brain-erasure-planner-r15.json)

## What changed

R15 turns the R14 deletion map into a content-free plan and completion state machine. It does not receive memories, decisions, source text, audio or generated work. It knows only the subject scope, control plane, controller, required action and proof reference.

The planner refuses to become ready unless all nine deletion planes are represented. It puts access revocation first. Missing, duplicate or unknown results invalidate the receipt. A target cannot be marked proved without evidence. Pending or failed work cannot become complete.

Most importantly, it does not pretend that CTRL can recall a downloaded ZIP, a GitHub repository, a Claude conversation, a device copy or an email. It can report `ctrl_erased_customer_action_required` and name the remaining customer-controlled targets.

## What remains deliberately unbound

Three policy choices are consequential enough that code must not invent them:

1. whether a content-free pseudonymous deletion receipt is retained, and for exactly how long;
2. the exact plain-language promise about copies the customer exported elsewhere;
3. whether incomplete deletion is a hard failure or a resumable pending state.

The recommended third choice is resumable pending: revoke access immediately, retry safely, show exactly what remains and never return success early. The current best-effort pattern, success plus an error list, is rejected.

Current ICO guidance does not prescribe a universal retention duration. It requires the controller to justify and document the period from the purpose. A keyed pseudonym is still personal data, so a content-free deletion receipt cannot be kept indefinitely merely because it omits the original content. The exact period therefore remains a founder and legal-policy gate, not an engineering guess.

## Boundary

This is local, pure planning logic with unit tests. It performs no deletion and does not modify the current account-deletion function. It proves no live database, provider, backup or customer-facing behavior.
