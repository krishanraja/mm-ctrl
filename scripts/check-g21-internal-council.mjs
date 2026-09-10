import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-council-'))
const require = createRequire(import.meta.url)
const selfOnly = process.argv.includes('--self-only')
const requestedRunId =
  process.argv.find((argument) => /^G21-INTERNAL-RANGE-FREEZE-\d{3}$/.test(argument)) ??
  'G21-INTERNAL-RANGE-FREEZE-002'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function sha256File(path) {
  return sha256(readFileSync(path))
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function composite(entries) {
  return sha256(entries.map((entry) => `${entry.path}:${entry.sha256}`).join('\n'))
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

  const council = require(join(outputDirectory, 'rangeCouncilContract.js'))
  const internalRange = require(join(outputDirectory, 'g21InternalRangeCanary.js'))
  const criterionVersions = Object.fromEntries(
    council.COUNCIL_JUDGES.map((judge) => [
      judge,
      `${judge.replaceAll('_', '-')}:g21-internal-range-freeze-v2`,
    ]),
  )
  const selfContract = {
    runId: requestedRunId,
    artifactCompositeSha256: 'self-test-artifact-composite',
    criterionVersions,
  }
  const passRulings = council.COUNCIL_JUDGES.map((judge) => ({
    runId: requestedRunId,
    judge,
    criterionVersion: criterionVersions[judge],
    artifactCompositeSha256: selfContract.artifactCompositeSha256,
    verdict: 'pass',
    claims: ['The owned criterion passed the executable self-test.'],
    evidenceLocators: ['self-test://frozen-range'],
    veto: null,
    missingEvidence: [],
    resolvingTest: null,
    recordedAt: '2026-09-10T19:00:00.000Z',
  }))

  assert(
    council.validateFrozenRangeCouncil(passRulings, selfContract).length === 0,
    'valid frozen range council failed schema validation',
  )
  assert(
    JSON.stringify(council.adjudicateFrozenRangeCouncil(passRulings, selfContract)) ===
      JSON.stringify({ status: 'passed' }),
    'valid frozen range council did not pass',
  )

  const hiddenVeto = structuredClone(passRulings)
  hiddenVeto[0].veto = {
    ruleId: 'AGENCY-RANGE-SELF-TEST',
    failure: 'A pass attempted to conceal a veto.',
    resolvingTest: 'Reject the malformed pass.',
  }
  assert(
    council
      .validateFrozenRangeCouncil(hiddenVeto, selfContract)
      .includes('human_agency:frozen_pass_cannot_veto'),
    'pass with a hidden veto was not rejected',
  )

  const mismatchedTest = structuredClone(passRulings)
  mismatchedTest[1].verdict = 'fail'
  mismatchedTest[1].veto = {
    ruleId: 'EPISTEMIC-RANGE-SELF-TEST',
    failure: 'A resolving test was rewritten during adjudication.',
    resolvingTest: 'Keep this exact resolving test.',
  }
  mismatchedTest[1].resolvingTest = 'A different resolving test.'
  assert(
    council
      .validateFrozenRangeCouncil(mismatchedTest, selfContract)
      .includes('epistemic_integrity:frozen_resolving_test_must_match_veto'),
    'rewritten veto test was not rejected',
  )

  const exactVeto = structuredClone(passRulings)
  exactVeto[1].verdict = 'fail'
  exactVeto[1].veto = {
    ruleId: 'EPISTEMIC-RANGE-SELF-TEST',
    failure: 'Future evidence passed the self-test.',
    resolvingTest: 'Reject future evidence and rerun the frozen artifact.',
  }
  exactVeto[1].resolvingTest = exactVeto[1].veto.resolvingTest
  assert(
    JSON.stringify(council.adjudicateFrozenRangeCouncil(exactVeto, selfContract)) ===
      JSON.stringify({ status: 'blocked', vetoes: [exactVeto[1].veto] }),
    'adjudicator did not preserve the raw veto exactly',
  )

  if (selfOnly) {
    console.log(JSON.stringify({ status: 'passed', contractSelfTests: 4 }, null, 2))
  } else {
    const runDirectory = join(
      root,
      'project-documentation',
      'ctrl-evolution',
      'runs',
      requestedRunId.toLowerCase(),
    )
    assert(existsSync(runDirectory), `frozen run does not exist: ${requestedRunId}`)

    const inputManifest = readJson(join(runDirectory, 'input-manifest.json'))
    assert(inputManifest.runId === requestedRunId, 'input manifest run ID mismatch')
    assert(
      Object.keys(inputManifest.criterionVersions).length === council.COUNCIL_JUDGES.length,
      'input manifest must freeze exactly seven criterion versions',
    )
    assert(
      council.COUNCIL_JUDGES.every(
        (judge) =>
          inputManifest.criterionVersions[judge] ===
          `${judge.replaceAll('_', '-')}:g21-internal-range-freeze-v2`,
      ),
      'input manifest criterion versions do not match the v2 council contract',
    )

    for (const entry of inputManifest.files) {
      assert(
        sha256File(join(root, entry.path)) === entry.sha256,
        `artifact hash mismatch: ${entry.path}`,
      )
    }
    assert(
      composite(inputManifest.files) === inputManifest.artifactCompositeSha256,
      'artifact composite hash mismatch',
    )

    const questionPack = readJson(join(runDirectory, 'question-pack.json'))
    assert(questionPack.runId === requestedRunId, 'question pack run ID mismatch')
    const expectedQuestions = internalRange.G21_INTERNAL_RANGE_CANARY.map((profile) => ({
      profileId: profile.manifest.profileId,
      fictionalSubject: profile.identity.displayName,
      fictionalCompany: profile.identity.organisation,
      internalDepth: profile.manifest.internalDepth,
      decisionFocus: profile.oracle.decisionFocus,
      question: profile.oracle.routeChangingQuestion,
      expectedAnswerShape: profile.oracle.expectedAnswerShape,
    }))
    assert(
      JSON.stringify(questionPack.questions) === JSON.stringify(expectedQuestions),
      'question pack does not exactly match the frozen source',
    )

    const rulingsManifest = readJson(join(runDirectory, 'rulings-manifest.json'))
    assert(rulingsManifest.runId === requestedRunId, 'rulings manifest run ID mismatch')
    assert(
      rulingsManifest.artifactCompositeSha256 === inputManifest.artifactCompositeSha256,
      'rulings manifest points to a different artifact',
    )
    assert(
      rulingsManifest.rulings.length === council.COUNCIL_JUDGES.length,
      'rulings manifest must contain exactly seven rulings',
    )
    for (const entry of rulingsManifest.rulings) {
      assert(sha256File(join(root, entry.path)) === entry.sha256, `ruling hash mismatch: ${entry.path}`)
    }
    assert(
      composite(rulingsManifest.rulings) === rulingsManifest.rulingsCompositeSha256,
      'rulings composite hash mismatch',
    )

    const rulings = rulingsManifest.rulings.map((entry) => readJson(join(root, entry.path)))
    const contract = {
      runId: requestedRunId,
      artifactCompositeSha256: inputManifest.artifactCompositeSha256,
      criterionVersions: inputManifest.criterionVersions,
    }
    const schemaErrors = council.validateFrozenRangeCouncil(rulings, contract)
    assert(schemaErrors.length === 0, `frozen ruling validation failed: ${schemaErrors.join(', ')}`)

    const expectedResult = council.adjudicateFrozenRangeCouncil(rulings, contract)
    const adjudication = readJson(join(runDirectory, 'adjudication.json'))
    assert(adjudication.runId === requestedRunId, 'adjudication run ID mismatch')
    assert(
      adjudication.artifactCompositeSha256 === inputManifest.artifactCompositeSha256,
      'adjudication artifact hash mismatch',
    )
    assert(
      adjudication.rulingsCompositeSha256 === rulingsManifest.rulingsCompositeSha256,
      'adjudication rulings hash mismatch',
    )
    assert(
      JSON.stringify(adjudication.result) === JSON.stringify(expectedResult),
      'adjudication does not preserve the deterministic raw result',
    )

    const expectedSummary = rulingsManifest.rulings.map((entry, index) => ({
      file: basename(entry.path),
      sha256: entry.sha256,
      judge: rulings[index].judge,
      verdict: rulings[index].verdict,
      vetoRuleId: rulings[index].veto?.ruleId ?? null,
    }))
    assert(
      JSON.stringify(adjudication.rulings) === JSON.stringify(expectedSummary),
      'adjudication ruling summary does not match the frozen raw rulings',
    )

    console.log(
      JSON.stringify(
        {
          status: 'passed',
          runId: requestedRunId,
          contractSelfTests: 4,
          artifacts: inputManifest.files.length,
          rulings: rulings.length,
          result: expectedResult.status,
        },
        null,
        2,
      ),
    )
  }
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}
