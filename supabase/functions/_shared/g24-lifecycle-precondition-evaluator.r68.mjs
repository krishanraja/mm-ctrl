const INPUT_SCHEMA_VERSION = 'ctrl.g24.executable-input.evaluate-lifecycle-preconditions.r68.v1'
const OUTPUT_SCHEMA_VERSION = 'ctrl.g24.executable-output.evaluate-lifecycle-preconditions.r68.v1'
const RESULT_SCHEMA_VERSION = 'ctrl.g24.result.evaluate-lifecycle-preconditions.r63.v1'
const OPERATION_CLASS = 'evaluate_lifecycle_preconditions'
const UNAVAILABLE = 'UNAVAILABLE'

const TRANSITION_IDS = [
  'open_preparation',
  'accept_intensive_proof',
  'close_preparation',
  'continue_after_intensive_proof',
  'renew_continuing_period',
  'pause_intensive_proof',
  'pause_continuing',
  'resume_continuing',
  'close_intensive_proof',
  'close_continuing',
  'close_paused',
  'complete_close',
  'open_new_preparation_after_close',
]

const INPUT_KEYS = [
  'case_ref',
  'evaluated_at',
  'intent',
  'operation_class',
  'operation_id',
  'schema_version',
  'selected_result_schema_version',
  'semantic_predicate_authority',
  'snapshot_fingerprint',
  'subject_ref',
  'workspace_ref',
]

const INTENT_KEYS = [
  'evidence_input_set_seal',
  'predecessor_lifecycle_version_ref',
  'transition_id',
]

const makeDispatch = status => ({
  schema_version: OUTPUT_SCHEMA_VERSION,
  status,
  hold_code: 'evaluator_artifact_hold',
  writes: [],
  result: null,
  evidence_rows: [],
})

const isPlainObject = value => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const hasExactDataKeys = (value, expectedKeys) => {
  if (!isPlainObject(value)) return false
  let keys
  try {
    keys = Reflect.ownKeys(value)
  } catch {
    return false
  }
  if (keys.length !== expectedKeys.length || keys.some(key => typeof key !== 'string')) return false
  const sorted = keys.slice().sort()
  for (let index = 0; index < expectedKeys.length; index += 1) {
    if (sorted[index] !== expectedKeys[index]) return false
    let descriptor
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, sorted[index])
    } catch {
      return false
    }
    if (!descriptor || descriptor.get || descriptor.set || descriptor.enumerable !== true) return false
  }
  return true
}

const isIdentifier = value =>
  typeof value === 'string' &&
  value.length >= 1 &&
  value.length <= 256 &&
  value === value.trim() &&
  !/[\u0000-\u001f\u007f]/u.test(value)

const isSha256 = value => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value)

const isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)

const isCanonicalTimestamp = value => {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/u.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] && hour <= 23 && minute <= 59 && second <= 59
}

const snapshotPlainData = input => {
  const seen = new WeakSet()
  let nodes = 0
  let strings = 0

  const visit = (value, depth) => {
    nodes += 1
    if (nodes > 256 || depth > 8) throw new Error('bounded_input')
    if (value === null || typeof value === 'boolean') return value
    if (typeof value === 'string') {
      strings += value.length
      if (value.length > 16384 || strings > 32768) throw new Error('bounded_input')
      return value
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error('unsupported_number')
      return value
    }
    if (typeof value !== 'object' || seen.has(value)) throw new Error('unsupported_value')
    seen.add(value)

    if (Array.isArray(value)) {
      if (value.length > 128) throw new Error('bounded_array')
      const keys = Reflect.ownKeys(value)
      if (keys.length !== value.length + 1 || !keys.includes('length')) throw new Error('array_shape')
      const output = []
      for (let index = 0; index < value.length; index += 1) {
        const key = String(index)
        const descriptor = Object.getOwnPropertyDescriptor(value, key)
        if (!descriptor || descriptor.get || descriptor.set || descriptor.enumerable !== true) throw new Error('array_descriptor')
        Object.defineProperty(output, key, {
          value: visit(descriptor.value, depth + 1),
          enumerable: true,
          configurable: false,
          writable: false,
        })
      }
      Object.freeze(output)
      return output
    }

    if (!isPlainObject(value)) throw new Error('object_prototype')
    const keys = Reflect.ownKeys(value)
    if (keys.length > 64 || keys.some(key => typeof key !== 'string')) throw new Error('object_keys')
    const output = Object.create(null)
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || descriptor.get || descriptor.set || descriptor.enumerable !== true) throw new Error('object_descriptor')
      Object.defineProperty(output, key, {
        value: visit(descriptor.value, depth + 1),
        enumerable: true,
        configurable: false,
        writable: false,
      })
    }
    Object.freeze(output)
    return output
  }

  return visit(input, 0)
}

const isValidStructuralInput = input => {
  if (!hasExactDataKeys(input, INPUT_KEYS)) return false
  if (input.schema_version !== INPUT_SCHEMA_VERSION) return false
  if (input.operation_class !== OPERATION_CLASS) return false
  if (input.selected_result_schema_version !== RESULT_SCHEMA_VERSION) return false
  if (input.semantic_predicate_authority !== UNAVAILABLE) return false
  if (!isIdentifier(input.operation_id) || !isIdentifier(input.workspace_ref)) return false
  if (!isIdentifier(input.subject_ref) || !isIdentifier(input.case_ref)) return false
  if (!isSha256(input.snapshot_fingerprint) || !isCanonicalTimestamp(input.evaluated_at)) return false
  if (!hasExactDataKeys(input.intent, INTENT_KEYS)) return false
  if (!TRANSITION_IDS.includes(input.intent.transition_id)) return false
  if (input.intent.predecessor_lifecycle_version_ref !== null && !isIdentifier(input.intent.predecessor_lifecycle_version_ref)) return false
  return isSha256(input.intent.evidence_input_set_seal)
}

export function dispatchEvaluateLifecyclePreconditionsStructuralR68(input) {
  try {
    const snapshot = snapshotPlainData(input)
    return makeDispatch(isValidStructuralInput(snapshot) ? 'verified_not_runnable' : 'hold')
  } catch {
    return makeDispatch('hold')
  }
}
