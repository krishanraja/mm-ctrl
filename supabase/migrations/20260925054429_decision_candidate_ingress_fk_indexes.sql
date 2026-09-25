-- R146 hosted readback correction.
-- Cover every composite foreign key introduced by decision candidate ingress.

create index brain_decision_answer_candidates_question_scope_idx
  on public.brain_decision_answer_candidates (
    question_id, decision_version_id, workspace_id, subject_id
  );

create index brain_decision_answer_candidates_version_scope_idx
  on public.brain_decision_answer_candidates (
    decision_version_id, decision_id, workspace_id, subject_id
  );

create index brain_decision_answer_candidates_assertion_scope_idx
  on public.brain_decision_answer_candidates (
    source_assertion_id, workspace_id, subject_id
  );

create index brain_decision_answer_candidates_atom_scope_idx
  on public.brain_decision_answer_candidates (
    source_evidence_atom_id, source_assertion_id, workspace_id, subject_id
  );

create index brain_decision_candidate_reviews_candidate_scope_idx
  on public.brain_decision_candidate_reviews (
    candidate_id, question_id, decision_version_id, workspace_id, subject_id
  );
