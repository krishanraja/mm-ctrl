# G25 decision candidate projection, R147

Status: `isolated_hosted_and_rendered_pass`

Date: 25 September 2026

## Product problem

R146 created the first honest decision-archaeology writer. The next risk was turning that machinery into another dense dashboard or letting a browser read the private candidate tables directly. The leader needs a small interruption that feels like a thoughtful human checking one important understanding, while the deep provenance remains available when useful.

## Implemented boundary

R147 adds a separate authenticated reader for exactly one provisional candidate.

By default it returns only:

- candidate identity and standing;
- one decrypted proposed belief;
- proposal time;
- the sealed question identity it belongs to.

The evidence basis is decrypted only when the caller explicitly asks for it. The reader never writes, confirms, corrects or rejects. The existing R146 writer remains the only review path.

## Leader interaction

The rendered moment presents:

1. one current CTRL read;
2. one plain authority question, `Does that sound right?`;
3. three working choices: confirm, use the leader's wording or reject;
4. one optional route to the evidence basis.

No dashboard, confidence theatre, progress score, disabled future control or repeated custody copy appears. Confirmation never sends the model wording back from the browser. Correction requires the leader's exact words. Rejection creates no answer. A failed save states that nothing was saved and reuses the same idempotency key on retry.

## Trust and operational controls

- The projection Edge Function requires a verified user JWT and exact isolated-project host binding.
- The database reader repeats the exact subject, owner or operator authority check used by the writer.
- Candidate, source and assertion tables remain hidden from browser roles.
- Candidate, source and assertion ciphertext is decrypted only inside the JWT-protected Edge Function with record-bound AES-GCM context.
- The minimum response cannot accidentally include evidence text.
- The basis response cannot omit its declared basis.
- The leader interaction calls the existing R146 review route, keeping read and write authority separate.
- Production project `bkyuxvschuwngtcdhsyg` is not contacted.

## Files

- `supabase/migrations/20260925061613_decision_candidate_projection_context.sql`
- `supabase/functions/decision-candidate-projection-v1/index.ts`
- `supabase/functions/_shared/decision-candidate-projection-core.ts`
- `src/features/operator-brain/decisionCandidateProjectionGateway.ts`
- `src/features/operator-brain/decisionCandidateReviewGateway.ts`
- `src/features/operator-brain/DecisionCandidateMoment.tsx`
- `src/features/operator-brain/DecisionCandidateMomentPreviewPage.tsx`
- `src/__tests__/e2e/g25-decision-candidate-moment-r147.spec.ts`
- `project-documentation/ctrl-evolution/g25-decision-candidate-projection-r147-qa-record.md`

## Honest boundary

The database reader and Edge Function are live only in isolated Supabase project `cgkcplcamsijghalintq`. The rendered route is synthetic, unlinked, non-indexable and does not persist. No customer data was used. Insight quality is not proven by this slice. Operator reconstruction and complete authorised application binding remain the next product work.

