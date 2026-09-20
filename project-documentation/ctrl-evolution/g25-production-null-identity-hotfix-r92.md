# G25 production null-identity hotfix R92

**Status:** The atomic hotfix packet is proved in isolation and current production passes its read-only drift gate. It has not been applied.

## What it repairs

R89 through R91 found six concrete effects across seven functions: public or cross-subject pending-memory reads, role enumeration, verification-state mutation, false dispute events, false reliance signals and decision-pin mutation.

R92 combines only those identity-bound repairs. It does not bundle every advisor cleanup, retire a function or broaden the recovery programme. Before changing anything, the transaction requires all seven live definitions and their current public grants to match the recorded production state. Any drift aborts the whole transaction.

## Evidence

The read-only production preflight resolves all seven functions, matches all seven original definition digests and confirms the seven current anonymous, authenticated and service grants. Production writes remain zero.

The exact combined payload was then applied to the isolated recovery project. Its first rehearsal attempt retained the production preflight by mistake, which correctly rejected the already-hardened definitions and changed nothing. The corrected payload-only rehearsal passed. The reader, memory mutation and signed-in product runtime suites all passed again afterward, leaving no fixture rows.

## Failure behavior

There is deliberately no normal rollback to the vulnerable public state. The prepared emergency control is fail-closed: it removes the affected customer actions while retaining the service routes needed for processing and investigation. It can cause a customer-visible outage and is therefore an emergency control, not a casual undo button.

The remaining prerequisite is an authenticated HTTP transport smoke against the isolated target, followed by explicit authority for the production write. Neither is being implied by database claim simulation.
