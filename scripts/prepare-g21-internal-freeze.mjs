import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runId = process.argv.find((argument) => /^G21-INTERNAL-RANGE-FREEZE-\d{3}$/.test(argument))
const recordedAtArgument = process.argv.find((argument) => argument.startsWith('--recorded-at='))

if (!runId) {
  throw new Error('usage: node scripts/prepare-g21-internal-freeze.mjs G21-INTERNAL-RANGE-FREEZE-NNN --recorded-at=ISO')
}

const runVersion = Number(runId.slice(-3))
if (!Number.isInteger(runVersion) || runVersion < 5) {
  throw new Error('this generator requires freeze version 005 or later')
}

if (!recordedAtArgument) throw new Error('--recorded-at is required for reproducible output')
const recordedAt = recordedAtArgument.slice('--recorded-at='.length)
if (new Date(recordedAt).toISOString() !== recordedAt) {
  throw new Error('--recorded-at must be an exact ISO timestamp')
}

const require = createRequire(import.meta.url)
const typescript = require(join(root, 'node_modules', 'typescript'))
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-freeze-'))
const runRelativeDirectory = posix.join(
  'project-documentation',
  'ctrl-evolution',
  'runs',
  runId.toLowerCase(),
)
const runDirectory = join(root, ...runRelativeDirectory.split('/'))

const semanticPaths = [
  'src/features/operator-brain/g21InternalRangeCanary.ts',
  'src/features/operator-brain/g21InternalRangeCanary.test.ts',
  'src/features/operator-brain/rangeCouncilContract.ts',
  'src/features/operator-brain/g21PublicRowCanary.ts',
  'scripts/check-g21-internal-range.mjs',
  'project-documentation/ctrl-evolution/g21-v5-evidence-contract.md',
  `${runRelativeDirectory}/council-brief.md`,
  `${runRelativeDirectory}/question-pack.json`,
  `${runRelativeDirectory}/reader-brief.md`,
]

const provenancePaths = [
  'src/features/operator-brain/rangeCouncilContract.test.ts',
  'scripts/check-g21-internal-council.mjs',
  'scripts/prepare-g21-internal-freeze.mjs',
  'project-documentation/ctrl-evolution/g21-internal-range-canary.md',
  'project-documentation/ctrl-evolution/g21-evidence-range-council-contract.md',
  'project-documentation/ctrl-evolution/g21-v4-contract-separation.md',
  'project-documentation/ctrl-evolution/session-method-learning-log.md',
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function fileEntry(path) {
  const absolutePath = join(root, ...path.split('/'))
  if (!existsSync(absolutePath)) throw new Error(`freeze file is missing: ${path}`)
  return { path, sha256: sha256(readFileSync(absolutePath)) }
}

function composite(entries) {
  return sha256(entries.map((entry) => `${entry.path}:${entry.sha256}`).join('\n'))
}

function repoOwnedTypeScriptClosure(entryPoints) {
  const seen = new Set()
  const queue = [...entryPoints]
  while (queue.length > 0) {
    const path = queue.shift()
    if (seen.has(path)) continue
    seen.add(path)
    const source = readFileSync(join(root, ...path.split('/')), 'utf8')
    const imports = typescript.preProcessFile(source, true, true).importedFiles
    for (const imported of imports) {
      if (!imported.fileName.startsWith('.')) continue
      const unresolved = posix.normalize(posix.join(posix.dirname(path), imported.fileName))
      const candidates = unresolved.endsWith('.ts')
        ? [unresolved]
        : [`${unresolved}.ts`, posix.join(unresolved, 'index.ts')]
      const resolvedImport = candidates.find((candidate) =>
        existsSync(join(root, ...candidate.split('/'))),
      )
      if (!resolvedImport) {
        throw new Error(`local TypeScript import cannot be resolved: ${path}:${imported.fileName}`)
      }
      queue.push(resolvedImport)
    }
  }
  return [...seen].sort()
}

try {
  mkdirSync(runDirectory, { recursive: true })
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

  const internalRange = require(join(outputDirectory, 'g21InternalRangeCanary.js'))
  const questionPack = {
    runId,
    purpose: 'Question-only adult ambiguity and answerability screen. These are fictional test cases, not customer facts.',
    reviewBoundary: 'Judge whether each immediate question contains one understandable, answerable ask and whether every permitted answer, including unknown, has a visible route effect. Do not judge hidden oracle material or infer product efficacy.',
    questions: internalRange.G21_INTERNAL_RANGE_CANARY.map((profile) => ({
      profileId: profile.manifest.profileId,
      fictionalSubject: profile.identity.displayName,
      fictionalCompany: profile.identity.organisation,
      internalDepth: profile.manifest.internalDepth,
      decisionFocus: profile.oracle.decisionFocus,
      question: profile.oracle.routeChangingQuestion,
      expectedAnswerShape: profile.oracle.expectedAnswerShape,
      answerContract: profile.oracle.answerContract,
    })),
  }
  writeFileSync(
    join(runDirectory, 'question-pack.json'),
    `${JSON.stringify(questionPack, null, 2)}\n`,
    'utf8',
  )

  const semanticReviewFiles = semanticPaths.map(fileEntry)
  const provenanceOnlyFiles = provenancePaths.map(fileEntry)
  const files = [...semanticReviewFiles, ...provenanceOnlyFiles]
  const compileEntryPoints = ['src/features/operator-brain/g21InternalRangeCanary.ts']
  const compileFiles = repoOwnedTypeScriptClosure(compileEntryPoints).map(fileEntry)
  const judges = [
    'human_agency',
    'epistemic_integrity',
    'subject_audience_lifecycle_safety',
    'consequential_usefulness',
    'living_brain_integrity',
    'human_comprehension_and_access',
    'behavioural_and_implementation_reality',
  ]

  for (const compileFile of compileFiles) {
    if (!semanticPaths.includes(compileFile.path)) {
      throw new Error(`compile dependency is outside semantic review: ${compileFile.path}`)
    }
  }

  const inputManifest = {
    runId,
    recordedAt,
    artifactCompositeSha256: composite(files),
    compositeRecipe: 'SHA-256 of UTF-8 path:sha256 lines joined with LF in the listed order, with no trailing LF.',
    reviewBoundary: {
      protocolVersion: 'history-free-semantic-allowlist:v1',
      semanticReviewCompositeSha256: composite(semanticReviewFiles),
    },
    compileClosure: {
      protocolVersion: 'repo-local-typescript-import-closure:v1',
      entryPoints: compileEntryPoints,
      nodeVersion: process.version,
      typescriptVersion: typescript.version,
      compositeSha256: composite(compileFiles),
      files: compileFiles,
    },
    criterionVersions: Object.fromEntries(
      judges.map((judge) => [
        judge,
        `${judge.replaceAll('_', '-')}:g21-internal-range-freeze-v${runVersion}`,
      ]),
    ),
    semanticReviewFiles,
    provenanceOnlyFiles,
    files,
    frozenCounts: {
      profiles: internalRange.G21_INTERNAL_RANGE_CANARY.length,
      matchedFamilies: new Set(
        internalRange.G21_INTERNAL_RANGE_CANARY.map((profile) => profile.manifest.familyId),
      ).size,
      lifecycleCases: internalRange.G21_INTERNAL_RANGE_CASES.length,
      oracleFreeInputs: internalRange.buildG21InternalBlindInputs(runId).length,
      initialInputs: internalRange.G21_INTERNAL_RANGE_CANARY.length,
      contradictedInputs: internalRange.G21_INTERNAL_RANGE_CANARY.length,
      correctedInputs: internalRange.G21_INTERNAL_RANGE_CANARY.length,
      malformedJsonSamples: 128,
      adversarialMutationsRejected: 249,
      councilContractSelfTests: 14,
      questions: questionPack.questions.length,
    },
    authority: {
      allowed: [
        'Review the frozen local evidence-range fixture',
        'Return one sealed ruling against one owned criterion',
        'Return one sealed adult answerability proxy review',
      ],
      prohibited: [
        'Change the artifact while reviewing it',
        'Read provenance-only material during first-pass semantic review',
        'Infer approval from another judge',
        'Average away a valid veto',
        'Treat fictional evidence as real research or consent',
        'Represent an adult proxy review as a child usability test',
        'Recommend deployment, database writes or production use',
      ],
    },
  }

  writeFileSync(
    join(runDirectory, 'input-manifest.json'),
    `${JSON.stringify(inputManifest, null, 2)}\n`,
    'utf8',
  )
  process.stdout.write(`${JSON.stringify({
    runId,
    questionPackSha256: fileEntry(`${runRelativeDirectory}/question-pack.json`).sha256,
    artifactCompositeSha256: inputManifest.artifactCompositeSha256,
    semanticReviewCompositeSha256: inputManifest.reviewBoundary.semanticReviewCompositeSha256,
    compileClosureCompositeSha256: inputManifest.compileClosure.compositeSha256,
    compileClosureFiles: compileFiles.map((entry) => entry.path),
  }, null, 2)}\n`)
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}
