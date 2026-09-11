import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-council-'))
const require = createRequire(import.meta.url)
const typescript = require(join(root, 'node_modules', 'typescript'))
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

function readGitFile(commit, path) {
  return execFileSync('git', ['show', `${commit}:${path}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 20 * 1024 * 1024,
  })
}

function readFrozenFile(commit, path) {
  return commit ? readGitFile(commit, path) : readFileSync(join(root, path))
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function composite(entries) {
  return sha256(entries.map((entry) => `${entry.path}:${entry.sha256}`).join('\n'))
}

function frozenFileExists(commit, path) {
  try {
    readFrozenFile(commit, path)
    return true
  } catch {
    return false
  }
}

function repoOwnedTypeScriptClosure(commit, entryPoints) {
  const seen = new Set()
  const queue = [...entryPoints]
  while (queue.length > 0) {
    const path = queue.shift()
    if (seen.has(path)) continue
    seen.add(path)
    const source = readFrozenFile(commit, path).toString('utf8')
    const imports = typescript.preProcessFile(source, true, true).importedFiles
    for (const imported of imports) {
      if (!imported.fileName.startsWith('.')) continue
      const unresolved = posix.normalize(posix.join(posix.dirname(path), imported.fileName))
      const candidates = unresolved.endsWith('.ts')
        ? [unresolved]
        : [`${unresolved}.ts`, posix.join(unresolved, 'index.ts')]
      const resolvedImport = candidates.find((candidate) => frozenFileExists(commit, candidate))
      assert(resolvedImport, `local TypeScript import cannot be resolved: ${path}:${imported.fileName}`)
      queue.push(resolvedImport)
    }
  }
  return [...seen].sort()
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
  const selfRunVersion = Number(requestedRunId.slice(-3))
  const criterionVersions = Object.fromEntries(
    council.COUNCIL_JUDGES.map((judge) => [
      judge,
      `${judge.replaceAll('_', '-')}:g21-internal-range-freeze-v${selfRunVersion}`,
    ]),
  )
  const selfContract = {
    runId: requestedRunId,
    artifactCompositeSha256: 'self-test-artifact-composite',
    criterionVersions,
    ...(selfRunVersion >= 4
      ? {
          reviewBoundary: {
            protocolVersion: 'history-free-semantic-allowlist:v1',
            semanticReviewCompositeSha256: 'a'.repeat(64),
          },
        }
      : {}),
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
    ...(selfRunVersion >= 4
      ? {
          reviewBoundaryAttestation: {
            semanticReviewCompositeSha256:
              selfContract.reviewBoundary.semanticReviewCompositeSha256,
            excludedHistoryEncountered: false,
          },
        }
      : {}),
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

  const passWithGap = structuredClone(passRulings)
  passWithGap[0].missingEvidence = ['The evidence needed to decide the criterion.']
  assert(
    council
      .validateFrozenRangeCouncil(passWithGap, selfContract)
      .includes('human_agency:frozen_pass_cannot_claim_missing_evidence'),
    'pass with unresolved evidence was not rejected',
  )

  const inconclusiveVeto = structuredClone(passRulings)
  inconclusiveVeto[1].verdict = 'inconclusive'
  inconclusiveVeto[1].missingEvidence = ['A source capable of resolving the claim.']
  inconclusiveVeto[1].resolvingTest = 'Acquire that source and rerun the frozen criterion.'
  inconclusiveVeto[1].veto = {
    ruleId: 'EPISTEMIC-RANGE-INVALID',
    failure: 'A veto cannot be issued before the missing evidence exists.',
    resolvingTest: inconclusiveVeto[1].resolvingTest,
  }
  assert(
    council
      .validateFrozenRangeCouncil(inconclusiveVeto, selfContract)
      .includes('epistemic_integrity:frozen_inconclusive_cannot_veto'),
    'inconclusive ruling with veto was not rejected',
  )

  const malformedArrays = structuredClone(passRulings)
  malformedArrays[0].claims = [{ prose: 'Not a string claim.' }]
  malformedArrays[0].evidenceLocators = [42]
  malformedArrays[0].missingEvidence = { gap: 'Not an array.' }
  const malformedArrayErrors = council.validateFrozenRangeCouncil(malformedArrays, selfContract)
  assert(
    malformedArrayErrors.includes('human_agency:frozen_claims_invalid') &&
      malformedArrayErrors.includes('human_agency:frozen_evidence_invalid') &&
      malformedArrayErrors.includes('human_agency:frozen_missing_evidence_invalid'),
    'malformed nested ruling arrays were not rejected',
  )

  const sparseRulingArray = structuredClone(passRulings)
  sparseRulingArray[0].claims = new Array(1)
  assert(
    council
      .validateFrozenRangeCouncil(sparseRulingArray, selfContract)
      .includes('human_agency:frozen_claims_invalid'),
    'sparse ruling claims were not rejected',
  )

  const malformedVeto = structuredClone(passRulings)
  malformedVeto[0].verdict = 'fail'
  malformedVeto[0].veto = {
    ruleId: 'AGENCY-RANGE-INVALID',
    failure: 'The veto envelope contains an unrecognised field.',
    resolvingTest: 'Reject this malformed veto.',
    severity: 'critical',
  }
  malformedVeto[0].resolvingTest = malformedVeto[0].veto.resolvingTest
  assert(
    council
      .validateFrozenRangeCouncil(malformedVeto, selfContract)
      .includes('human_agency:frozen_veto_invalid'),
    'malformed veto envelope was not rejected',
  )

  const incompleteContract = structuredClone(selfContract)
  delete incompleteContract.criterionVersions.human_agency
  assert(
    council
      .validateFrozenRangeCouncil(passRulings, incompleteContract)
      .includes('frozen_range_criterion_versions_invalid'),
    'incomplete criterion map was not rejected',
  )

  if (selfRunVersion >= 4) {
    const contaminatedReview = structuredClone(passRulings)
    contaminatedReview[0].reviewBoundaryAttestation.excludedHistoryEncountered = true
    assert(
      council
        .validateFrozenRangeCouncil(contaminatedReview, selfContract)
        .includes('human_agency:frozen_review_boundary_attestation_invalid'),
      'v4 ruling that encountered excluded history was not rejected',
    )
    const semanticPaths = [
      'src/features/operator-brain/g21InternalRangeCanary.ts',
      'src/features/operator-brain/g21InternalRangeCanary.test.ts',
      'scripts/check-g21-internal-range.mjs',
      `project-documentation/ctrl-evolution/runs/${requestedRunId.toLowerCase()}/council-brief.md`,
      `project-documentation/ctrl-evolution/runs/${requestedRunId.toLowerCase()}/question-pack.json`,
    ]
    const provenancePaths = [
      'project-documentation/ctrl-evolution/g21-internal-range-canary.md',
      'project-documentation/ctrl-evolution/runs/g21-internal-range-freeze-003/adjudication.json',
    ]
    assert(
      council.validateG21SemanticReviewAllowlist(semanticPaths, provenancePaths).length === 0,
      'valid v4 semantic review boundary was rejected',
    )
    assert(
      council
        .validateG21SemanticReviewAllowlist(
          [...semanticPaths, 'project-documentation/ctrl-evolution/judge-history/human-agency.md'],
          provenancePaths,
        )
        .some((error) => error.startsWith('history_bearing_semantic_path_forbidden_')),
      'history-bearing judge material entered the semantic allowlist',
    )
    assert(
      council
        .validateG21SemanticReviewAllowlist(
          [
            ...semanticPaths,
            `project-documentation/ctrl-evolution/runs/${requestedRunId.toLowerCase()}/judges/human_agency.json`,
          ],
          provenancePaths,
        )
        .some((error) => error.startsWith('history_bearing_semantic_path_forbidden_')),
      'current-run ruling material entered the semantic allowlist',
    )
    assert(
      council
        .validateG21SemanticReviewAllowlist(new Array(1), provenancePaths)
        .includes('semantic_review_allowlist_required'),
      'sparse semantic allowlist was not rejected',
    )
  }

  if (selfOnly) {
    console.log(
      JSON.stringify(
        { status: 'passed', contractSelfTests: selfRunVersion >= 4 ? 14 : 10 },
        null,
        2,
      ),
    )
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
    const freezeAnchor = readJson(join(runDirectory, 'freeze-anchor.json'))
    assert(freezeAnchor.runId === requestedRunId, 'freeze anchor run ID mismatch')
    assert(typeof freezeAnchor.artifactCommit === 'string', 'freeze anchor commit missing')
    const artifactCommit = freezeAnchor.artifactCommit
    assert(inputManifest.runId === requestedRunId, 'input manifest run ID mismatch')
    assert(
      Object.keys(inputManifest.criterionVersions).length === council.COUNCIL_JUDGES.length,
      'input manifest must freeze exactly seven criterion versions',
    )
    const runVersion = Number(requestedRunId.slice(-3))
    assert(Number.isInteger(runVersion) && runVersion > 0, 'run version is invalid')
    assert(
      council.COUNCIL_JUDGES.every(
        (judge) =>
          inputManifest.criterionVersions[judge] ===
          `${judge.replaceAll('_', '-')}:g21-internal-range-freeze-v${runVersion}`,
      ),
      `input manifest criterion versions do not match the v${runVersion} council contract`,
    )

    if (runVersion >= 4) {
      assert(
        Array.isArray(inputManifest.semanticReviewFiles) &&
          inputManifest.semanticReviewFiles.length > 0,
        'v4 manifest requires semantic review files',
      )
      assert(
        Array.isArray(inputManifest.provenanceOnlyFiles),
        'v4 manifest requires provenance-only files',
      )
      const semanticPaths = inputManifest.semanticReviewFiles.map((entry) => entry.path)
      const provenancePaths = inputManifest.provenanceOnlyFiles.map((entry) => entry.path)
      const boundaryErrors = council.validateG21SemanticReviewAllowlist(
        semanticPaths,
        provenancePaths,
      )
      assert(
        boundaryErrors.length === 0,
        `v4 semantic review boundary invalid: ${boundaryErrors.join(', ')}`,
      )
      assert(
        JSON.stringify(inputManifest.files) ===
          JSON.stringify([
            ...inputManifest.semanticReviewFiles,
            ...inputManifest.provenanceOnlyFiles,
          ]),
        'v4 artifact files must be the ordered semantic and provenance files',
      )
      assert(
        inputManifest.reviewBoundary?.protocolVersion ===
          'history-free-semantic-allowlist:v1',
        'v4 review boundary protocol is invalid',
      )
      assert(
        composite(inputManifest.semanticReviewFiles) ===
          inputManifest.reviewBoundary?.semanticReviewCompositeSha256,
        'v4 semantic review composite hash mismatch',
      )
      const contaminatedSemanticContent = inputManifest.semanticReviewFiles.flatMap((entry) => {
        const content = readFrozenFile(artifactCommit, entry.path).toString('utf8')
        return Array.from({ length: runVersion - 1 }, (_, index) =>
          String(index + 1).padStart(3, '0')
        ).flatMap((priorVersion) => [
          `G21-INTERNAL-RANGE-FREEZE-${priorVersion}`,
          `g21-internal-range-freeze-${priorVersion}`,
        ])
          .filter((marker) => content.includes(marker))
          .map((marker) => `${entry.path}:${marker}`)
      })
      assert(
        contaminatedSemanticContent.length === 0,
        `v4 semantic review content names prior frozen runs: ${contaminatedSemanticContent.join(', ')}`,
      )

      if (runVersion >= 5) {
        const compileClosure = inputManifest.compileClosure
        assert(
          compileClosure?.protocolVersion === 'repo-local-typescript-import-closure:v1',
          'v5 compile closure protocol is invalid',
        )
        assert(
          Array.isArray(compileClosure.entryPoints) && compileClosure.entryPoints.length > 0,
          'v5 compile closure entry points are missing',
        )
        assert(Array.isArray(compileClosure.files), 'v5 compile closure files are missing')
        const computedClosure = repoOwnedTypeScriptClosure(
          artifactCommit,
          compileClosure.entryPoints,
        )
        assert(
          JSON.stringify(compileClosure.files.map((entry) => entry.path)) ===
            JSON.stringify(computedClosure),
          'v5 compile closure does not match repo-owned local imports',
        )
        for (const entry of compileClosure.files) {
          assert(
            sha256(readFrozenFile(artifactCommit, entry.path)) === entry.sha256,
            `v5 compile closure hash mismatch: ${entry.path}`,
          )
          assert(
            semanticPaths.includes(entry.path),
            `v5 compile dependency is absent from semantic review files: ${entry.path}`,
          )
        }
        assert(
          composite(compileClosure.files) === compileClosure.compositeSha256,
          'v5 compile closure composite hash mismatch',
        )
        assert(
          compileClosure.nodeVersion === process.version,
          `v5 Node version mismatch: expected ${compileClosure.nodeVersion}, received ${process.version}`,
        )
        assert(
          compileClosure.typescriptVersion === typescript.version,
          `v5 TypeScript version mismatch: expected ${compileClosure.typescriptVersion}, received ${typescript.version}`,
        )
      }
    }

    for (const entry of inputManifest.files) {
      assert(
        sha256(readFrozenFile(artifactCommit, entry.path)) === entry.sha256,
        `artifact hash mismatch: ${entry.path}`,
      )
    }
    assert(
      composite(inputManifest.files) === inputManifest.artifactCompositeSha256,
      'artifact composite hash mismatch',
    )

    const questionPack = JSON.parse(
      readFrozenFile(
        artifactCommit,
        `project-documentation/ctrl-evolution/runs/${requestedRunId.toLowerCase()}/question-pack.json`,
      ).toString('utf8'),
    )
    assert(questionPack.runId === requestedRunId, 'question pack run ID mismatch')

    const frozenSourceDirectory = join(outputDirectory, 'frozen-source')
    const frozenOutputDirectory = join(outputDirectory, 'frozen-output')
    mkdirSync(frozenSourceDirectory, { recursive: true })
    for (const sourceFile of [
      'rangeCouncilContract.ts',
      'g21PublicRowCanary.ts',
      'g21InternalRangeCanary.ts',
    ]) {
      writeFileSync(
        join(frozenSourceDirectory, sourceFile),
        readFrozenFile(artifactCommit, `src/features/operator-brain/${sourceFile}`),
      )
    }
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
        join(frozenSourceDirectory, 'rangeCouncilContract.ts'),
        join(frozenSourceDirectory, 'g21PublicRowCanary.ts'),
        join(frozenSourceDirectory, 'g21InternalRangeCanary.ts'),
        '--module',
        'commonjs',
        '--target',
        'ES2022',
        '--moduleResolution',
        'node',
        '--esModuleInterop',
        '--skipLibCheck',
        '--outDir',
        frozenOutputDirectory,
      ],
      { cwd: root, stdio: 'inherit' },
    )
    const frozenInternalRange = require(join(frozenOutputDirectory, 'g21InternalRangeCanary.js'))
    const expectedQuestions = frozenInternalRange.G21_INTERNAL_RANGE_CANARY.map((profile) => ({
      profileId: profile.manifest.profileId,
      fictionalSubject: profile.identity.displayName,
      fictionalCompany: profile.identity.organisation,
      internalDepth: profile.manifest.internalDepth,
      decisionFocus: profile.oracle.decisionFocus,
      question: profile.oracle.routeChangingQuestion,
      expectedAnswerShape: profile.oracle.expectedAnswerShape,
      ...(runVersion >= 3 ? { answerContract: profile.oracle.answerContract } : {}),
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
      ...(runVersion >= 4
        ? {
            reviewBoundary: inputManifest.reviewBoundary,
          }
        : {}),
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
          contractSelfTests: runVersion >= 4 ? 14 : 10,
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
