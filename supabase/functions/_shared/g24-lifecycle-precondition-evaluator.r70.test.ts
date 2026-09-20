import { describe, expect, it } from 'vitest'
// The MJS file is the canonical executable artifact. Keeping the test import on
// that exact file proves the authored bytes, not a parallel TypeScript rewrite.
// @ts-expect-error The locked MJS artifact deliberately has no second declaration source.
import { dispatchEvaluateLifecyclePreconditionsStructuralR70 } from './g24-lifecycle-precondition-evaluator.r70.mjs'

const validInput = () => ({
  schema_version: 'ctrl.g24.executable-input.evaluate-lifecycle-preconditions.r70.v1',
  operation_class: 'evaluate_lifecycle_preconditions',
  operation_id: 'r70_structural_probe_001',
  workspace_ref: 'r70_workspace',
  subject_ref: 'r70_subject',
  case_ref: 'r70_case',
  snapshot_fingerprint: '1'.repeat(64),
  evaluated_at: '2031-01-01T00:00:00.000Z',
  intent: {
    transition_id: 'open_preparation',
    predecessor_lifecycle_version_ref: null,
    evidence_input_set_seal: '2'.repeat(64),
  },
  selected_result_schema_version: 'ctrl.g24.result.evaluate-lifecycle-preconditions.r63.v1',
  semantic_predicate_authority: 'UNAVAILABLE',
})
const expected = (status: 'verified_not_runnable' | 'hold') => ({
  schema_version: 'ctrl.g24.executable-output.evaluate-lifecycle-preconditions.r70.v1',
  status,
  hold_code: 'evaluator_artifact_hold',
  writes: [],
  result: null,
  evidence_rows: [],
})

describe('G24 R70 lifecycle evaluator structural artifact', () => {
  it('has one closed no-write output and no semantic success branch', () => {
    expect(dispatchEvaluateLifecyclePreconditionsStructuralR70(validInput())).toEqual(expected('verified_not_runnable'))
  })

  it('accepts every R63 transition only as structurally verified and not runnable', () => {
    const transitions = [
      'open_preparation', 'accept_intensive_proof', 'close_preparation',
      'continue_after_intensive_proof', 'renew_continuing_period', 'pause_intensive_proof',
      'pause_continuing', 'resume_continuing', 'close_intensive_proof',
      'close_continuing', 'close_paused', 'complete_close', 'open_new_preparation_after_close',
    ]
    for (const transition_id of transitions) {
      const input = validInput()
      input.intent.transition_id = transition_id
      expect(dispatchEvaluateLifecyclePreconditionsStructuralR70(input)).toEqual(expected('verified_not_runnable'))
    }
  })

  it('holds unknown fields, wrong versions, invented predicate authority and malformed intent', () => {
    const attacks: unknown[] = [
      { ...validInput(), extra: true },
      { ...validInput(), selected_result_schema_version: 'ctrl.g24.result.evaluate-lifecycle-preconditions.r13.v1' },
      { ...validInput(), semantic_predicate_authority: 'caller_asserted' },
      { ...validInput(), intent: { ...validInput().intent, transition_id: 'unknown' } },
      { ...validInput(), intent: { ...validInput().intent, evidence_input_set_seal: 'bad' } },
      { ...validInput(), evaluated_at: '2031-02-29T00:00:00.000Z' },
    ]
    for (const input of attacks) {
      expect(dispatchEvaluateLifecyclePreconditionsStructuralR70(input)).toEqual(expected('hold'))
    }
  })

  it('enforces the inherited NFC, UTF-8 byte and invisible-control identifier policy', () => {
    const accepted = [
      'a'.repeat(256),
      'é'.repeat(128),
      '😀'.repeat(64),
    ]
    for (const operation_id of accepted) {
      expect(dispatchEvaluateLifecyclePreconditionsStructuralR70({ ...validInput(), operation_id })).toEqual(expected('verified_not_runnable'))
    }

    const rejected = [
      'a'.repeat(257),
      'é'.repeat(129),
      '😀'.repeat(65),
      'e\u0301',
      'id\u0085',
      'id\u061c',
      'id\u200b',
      'id\u202e',
      'id\u2060',
      'id\u2066',
      'id\ufeff',
      'id\ud800',
    ]
    for (const operation_id of rejected) {
      expect(dispatchEvaluateLifecyclePreconditionsStructuralR70({ ...validInput(), operation_id })).toEqual(expected('hold'))
    }
  })

  it('holds hostile accessors, cycles and non-plain prototypes without invoking accessors', () => {
    let getterCalls = 0
    const accessor = validInput()
    Object.defineProperty(accessor, 'operation_id', {
      enumerable: true,
      get() { getterCalls += 1; return 'forged' },
    })
    expect(dispatchEvaluateLifecyclePreconditionsStructuralR70(accessor)).toEqual(expected('hold'))
    expect(getterCalls).toBe(0)

    const cyclic = validInput()
    ;(cyclic.intent as unknown as Record<string, unknown>).predecessor_lifecycle_version_ref = cyclic.intent
    expect(dispatchEvaluateLifecyclePreconditionsStructuralR70(cyclic)).toEqual(expected('hold'))

    const inherited = Object.assign(Object.create({ caller_authority: true }), validInput())
    expect(dispatchEvaluateLifecyclePreconditionsStructuralR70(inherited)).toEqual(expected('hold'))
  })

  it('is byte-stable across repeated calls and cannot accumulate writes', () => {
    const first = JSON.stringify(dispatchEvaluateLifecyclePreconditionsStructuralR70(validInput()))
    for (let index = 0; index < 10; index += 1) {
      expect(JSON.stringify(dispatchEvaluateLifecyclePreconditionsStructuralR70(validInput()))).toBe(first)
    }
  })
})
