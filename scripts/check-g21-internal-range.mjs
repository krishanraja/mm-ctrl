import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-internal-'))
const require = createRequire(import.meta.url)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function includesEvery(values, expected) {
  return expected.every((value) => values.includes(value))
}

try {
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
      join(root, 'src', 'features', 'operator-brain', 'rangeCouncilContract.ts'),
      join(root, 'src', 'features', 'operator-brain', 'g21PublicRowCanary.ts'),
      join(root, 'src', 'features', 'operator-brain', 'g21InternalRangeCanary.ts'),
      '--module',
      'commonjs',
      '--target',
      'ES2022',
      '--moduleResolution',
      'node',
      '--esModuleInterop',
      '--skipLibCheck',
      '--outDir',
      outputDirectory,
    ],
    { cwd: root, stdio: 'inherit' },
  )

  const contract = require(join(outputDirectory, 'g21InternalRangeCanary.js'))
  const profiles = contract.G21_INTERNAL_RANGE_CANARY
  const cases = contract.G21_INTERNAL_RANGE_CASES
  const inputs = contract.buildG21InternalBlindInputs()
  const profileErrors = contract.validateG21InternalRangeCanary(profiles)
  const coordinateErrors = contract.validateG21CompleteCoordinateCoverage()

  assert(profiles.length === 12, 'expected twelve internal-range profiles')
  assert(profileErrors.length === 0, `profile validation failed: ${profileErrors.join(', ')}`)
  assert(coordinateErrors.length === 0, `coordinate validation failed: ${coordinateErrors.join(', ')}`)
  assert(cases.length === 36, 'expected thirty-six internal lifecycle cases')
  assert(inputs.length === 36, 'expected thirty-six oracle-free inputs')
  for (const runtimeState of ['initial', 'contradicted', 'corrected']) {
    assert(
      inputs.filter((input) => input.runtimeState === runtimeState).length === 12,
      `expected twelve ${runtimeState} inputs`,
    )
  }
  assert(
    !inputs.some((input) => {
      const serialised = JSON.stringify(input)
      return (
        serialised.includes('strongestSupportedView') ||
        serialised.includes('expectedDiagnosticBehaviours') ||
        serialised.includes('forbiddenClaims')
      )
    }),
    'oracle leaked into blind input',
  )

  const realCostume = structuredClone(profiles[0])
  realCostume.manifest.realNamedPerson = true
  realCostume.manifest.consentRecordId = 'CONSENT-FICTIONAL-01'
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(realCostume), [
      'real_named_person_wrong_namespace',
      'synthetic_fixture_cannot_name_real_person',
      'synthetic_fixture_cannot_claim_consent',
      'internal_range_cannot_name_real_person',
      'fictional_fixture_cannot_claim_consent',
    ]),
    'real-person costume or fictional consent was not rejected',
  )

  const inflatedBasic = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'basic_intake'),
  )
  inflatedBasic.internalEvidence[0].sourceType = 'work_artifact'
  assert(
    contract
      .validateG21InternalRangeProfile(inflatedBasic)
      .includes('basic_intake_may_only_use_intake_and_reflection'),
    'basic intake depth inflation was not rejected',
  )

  const weakPattern = structuredClone(
    profiles.find((profile) => profile.manifest.internalDepth === 'work_evidence'),
  )
  const patternNotice = weakPattern.oracle.allowedNotices.find(
    (notice) => notice.standing === 'supported_pattern',
  )
  patternNotice.evidenceIds = [patternNotice.evidenceIds[0]]
  assert(
    contract
      .validateG21InternalRangeProfile(weakPattern)
      .includes(`${patternNotice.noticeId}:pattern_requires_distinct_evidence`),
    'single-source pattern was not rejected',
  )

  const brokenLifecycle = structuredClone(profiles[0])
  brokenLifecycle.lifecycleEvidence[1].supersedesEvidenceId =
    brokenLifecycle.internalEvidence[0].evidenceId
  brokenLifecycle.lifecycleEvidence[1].recordedAt =
    brokenLifecycle.lifecycleEvidence[0].recordedAt
  assert(
    includesEvery(contract.validateG21InternalRangeProfile(brokenLifecycle), [
      'lifecycle_correction_must_supersede_conflict',
      'lifecycle_correction_must_follow_conflict',
    ]),
    'broken lifecycle correction was not rejected',
  )

  const changedFamily = structuredClone(profiles)
  changedFamily[1].identity.role = 'Chief Product Officer'
  assert(
    contract
      .validateG21InternalRangeCanary(changedFamily)
      .includes(`${changedFamily[1].familyId}:identity_must_remain_fixed`),
    'matched-family identity drift was not rejected',
  )

  console.log(
    JSON.stringify(
      {
        status: 'passed',
        profiles: profiles.length,
        families: new Set(profiles.map((profile) => profile.familyId)).size,
        cases: cases.length,
        inputs: inputs.length,
        states: {
          initial: inputs.filter((input) => input.runtimeState === 'initial').length,
          contradicted: inputs.filter((input) => input.runtimeState === 'contradicted').length,
          corrected: inputs.filter((input) => input.runtimeState === 'corrected').length,
        },
        oracleLeak: false,
        adversarialMutationsRejected: 5,
      },
      null,
      2,
    ),
  )
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}
