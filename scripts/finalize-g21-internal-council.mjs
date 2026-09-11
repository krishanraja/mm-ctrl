import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runId = process.argv.find((argument) => /^G21-INTERNAL-RANGE-FREEZE-\d{3}$/.test(argument))
const recordedAtArgument = process.argv.find((argument) => argument.startsWith('--recorded-at='))

if (!runId) {
  throw new Error('usage: node scripts/finalize-g21-internal-council.mjs G21-INTERNAL-RANGE-FREEZE-NNN --recorded-at=ISO')
}
if (!recordedAtArgument) throw new Error('--recorded-at is required for reproducible output')
const recordedAt = recordedAtArgument.slice('--recorded-at='.length)
if (new Date(recordedAt).toISOString() !== recordedAt) {
  throw new Error('--recorded-at must be an exact ISO timestamp')
}

const runDirectory = join(
  root,
  'project-documentation',
  'ctrl-evolution',
  'runs',
  runId.toLowerCase(),
)
const inputManifest = readJson(join(runDirectory, 'input-manifest.json'))
const freezeAnchor = readJson(join(runDirectory, 'freeze-anchor.json'))
const outputDirectory = mkdtempSync(join(tmpdir(), 'mm-ctrl-g21-adjudicate-'))
const require = createRequire(import.meta.url)

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function fileEntry(path) {
  const absolutePath = join(root, ...path.split('/'))
  if (!existsSync(absolutePath)) throw new Error(`required ruling is missing: ${path}`)
  return { path, sha256: sha256(readFileSync(absolutePath)) }
}

function composite(entries) {
  return sha256(entries.map((entry) => `${entry.path}:${entry.sha256}`).join('\n'))
}

function frozenFile(commit, path) {
  return execFileSync('git', ['show', `${commit}:${path}`], {
    cwd: root,
    encoding: null,
    maxBuffer: 20 * 1024 * 1024,
  })
}

try {
  if (inputManifest.runId !== runId || freezeAnchor.runId !== runId) {
    throw new Error('run identity mismatch')
  }
  if (typeof freezeAnchor.artifactCommit !== 'string') {
    throw new Error('artifact commit is missing')
  }

  const frozenContractPath = join(outputDirectory, 'rangeCouncilContract.ts')
  writeFileSync(
    frozenContractPath,
    frozenFile(
      freezeAnchor.artifactCommit,
      'src/features/operator-brain/rangeCouncilContract.ts',
    ),
  )
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
      frozenContractPath,
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
  const rulingEntries = council.COUNCIL_JUDGES.map((judge) =>
    fileEntry(
      `project-documentation/ctrl-evolution/runs/${runId.toLowerCase()}/judges/${judge}.json`,
    ),
  )
  const rulings = rulingEntries.map((entry) => readJson(join(root, ...entry.path.split('/'))))
  const contract = {
    runId,
    artifactCompositeSha256: inputManifest.artifactCompositeSha256,
    criterionVersions: inputManifest.criterionVersions,
    reviewBoundary: inputManifest.reviewBoundary,
  }
  const errors = council.validateFrozenRangeCouncil(rulings, contract)
  if (errors.length > 0) {
    throw new Error(`sealed council validation failed: ${errors.join(', ')}`)
  }

  const rulingsCompositeSha256 = composite(rulingEntries)
  const rulingsManifest = {
    runId,
    artifactCompositeSha256: inputManifest.artifactCompositeSha256,
    semanticReviewCompositeSha256:
      inputManifest.reviewBoundary.semanticReviewCompositeSha256,
    rulingsCompositeSha256,
    rulings: rulingEntries,
  }
  const adjudication = {
    runId,
    phase: 'adjudication',
    artifactCompositeSha256: inputManifest.artifactCompositeSha256,
    semanticReviewCompositeSha256:
      inputManifest.reviewBoundary.semanticReviewCompositeSha256,
    rulingsCompositeSha256,
    rulings: rulings.map((ruling, index) => ({
      file: `${ruling.judge}.json`,
      sha256: rulingEntries[index].sha256,
      judge: ruling.judge,
      verdict: ruling.verdict,
      vetoRuleId: ruling.veto?.ruleId ?? null,
    })),
    result: council.adjudicateFrozenRangeCouncil(rulings, contract),
    protocolStanding: 'valid_history_free_independent_review',
    recordedAt,
  }

  writeFileSync(
    join(runDirectory, 'rulings-manifest.json'),
    `${JSON.stringify(rulingsManifest, null, 2)}\n`,
    'utf8',
  )
  writeFileSync(
    join(runDirectory, 'adjudication.json'),
    `${JSON.stringify(adjudication, null, 2)}\n`,
    'utf8',
  )
  process.stdout.write(`${JSON.stringify({
    runId,
    rulingsCompositeSha256,
    result: adjudication.result,
  }, null, 2)}\n`)
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}
