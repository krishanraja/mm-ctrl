import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const run = 'project-documentation/ctrl-evolution/runs/g24-r3-architecture-council-002'
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = relative => createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const standardPath = `${run}/standard.md`
const briefPath = `${run}/brief.md`
const manifestPath = `${run}/input-manifest.json`
const standardHash = '67848f4787b1732b76e641775d5ce8d47fe705151813cb19dc0785945e06f858'
const submission = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md': '446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r3.json': '5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09',
  'project-documentation/ctrl-evolution/g24-product-system-r3-delta.json': 'c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb',
}
const specialists = [
  'human-agency',
  'epistemic-integrity',
  'subject-audience-lifecycle-safety',
  'consequential-usefulness',
  'living-brain-integrity',
  'human-comprehension-and-access',
  'behavioural-and-implementation-reality',
]

check('standard hash', sha256(standardPath) === standardHash)
for (const [path, hash] of Object.entries(submission)) check(`submission hash: ${path}`, sha256(path) === hash)

const manifest = JSON.parse(read(manifestPath))
const brief = read(briefPath)
check('manifest run id', manifest.run_id === 'g24-r3-architecture-council-002')
check('manifest standard hash', manifest.standard?.sha256 === standardHash)
check('manifest exact specialists', JSON.stringify(manifest.specialists) === JSON.stringify(specialists))
check('manifest exact submission', Object.entries(submission).every(([path, hash]) => manifest.submission?.some(item => item.path === path && item.sha256 === hash)))
check('brief records sealed exclusions', brief.includes('Do not read `runs/g24-r2-architecture-council-001/`') && brief.includes('`judge-history/`'))

if (!process.argv.includes('--pack')) {
  const sealedPath = `${run}/sealed-verdicts.json`
  check('sealed verdict manifest exists', existsSync(join(root, sealedPath)))
  const sealed = existsSync(join(root, sealedPath)) ? JSON.parse(read(sealedPath)) : null
  check('sealed verdict manifest run', sealed?.run_id === 'g24-r3-architecture-council-002')
  check('sealed verdict manifest predates history', sealed?.frozen_before_history_or_cross_examination === true)
  check('sealed verdict manifest exact count', sealed?.verdicts?.length === specialists.length)
  for (const specialist of specialists) {
    const path = `${run}/${specialist}.md`
    check(`${specialist} verdict exists`, existsSync(join(root, path)))
    if (!existsSync(join(root, path))) continue
    const verdict = read(path)
    const verdictMatch = verdict.match(/\bVERDICT\b[\s\S]{0,80}?\b(PASS_WITH_WATCHPOINTS|PASS|VETO|INCONCLUSIVE)\b/i)
    check(`${specialist} allowed verdict`, Boolean(verdictMatch))
    check(`${specialist} records standard hash`, verdict.includes(standardHash))
    for (const hash of Object.values(submission)) check(`${specialist} records submission hash ${hash.slice(0, 8)}`, verdict.includes(hash))
    check(`${specialist} states independence`, /independen/i.test(verdict) && /(did not read|did not open|excluded|exclusion)/i.test(verdict))
    check(`${specialist} challenges strongest part`, /strongest|apparently strong|under attack/i.test(verdict))
    check(`${specialist} separates current and later gate`, /current(?:[- ]gate| G24\.A)/i.test(verdict) && /later(?:[- ]gate| proof)/i.test(verdict))
    check(`${specialist} preserves closed actions`, /external[- ]action/i.test(verdict) && /closed|authori[sz]ed/i.test(verdict))
    check(`${specialist} contains no em dash`, !verdict.includes('—'))
    if (verdictMatch?.[1].toUpperCase() === 'VETO') {
      check(`${specialist} veto has exact locator`, /locator|json pointer|section/i.test(verdict))
      check(`${specialist} veto has failure path`, /failure path/i.test(verdict))
      check(`${specialist} veto has smallest repair`, /smallest sufficient repair/i.test(verdict))
      check(`${specialist} veto has resolving test`, /resolving test/i.test(verdict))
    }
    const sealedEntry = sealed?.verdicts?.find(item => item.specialist === specialist)
    check(`${specialist} sealed hash`, sealedEntry?.path === path && sealedEntry?.sha256 === sha256(path))
    check(`${specialist} sealed verdict`, sealedEntry?.verdict === verdictMatch?.[1].toUpperCase())
  }
  check('sealed counts', sealed?.counts?.pass === 0 && sealed?.counts?.pass_with_watchpoints === 4 && sealed?.counts?.veto === 3 && sealed?.counts?.inconclusive === 0)
}

if (failures.length) {
  console.error(`G24 R3 council failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(process.argv.includes('--pack')
  ? 'ok: G24 R3 sealed Pack A hashes, standard, manifest and exclusions verified'
  : 'ok: G24 R3 Pack A and seven sealed specialist verdict envelopes verified')
