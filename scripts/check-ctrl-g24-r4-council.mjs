import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const run = 'project-documentation/ctrl-evolution/runs/g24-r4-architecture-council-003'
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = relative => createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const standardPath = `${run}/standard.md`
const briefPath = `${run}/brief.md`
const manifestPath = `${run}/input-manifest.json`
const standardHash = '8e227ccb4c9ad2a7a6b9dfd97df9a9bb24dad3e44e1f9153a75cf11720819e3b'
const submission = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r4.md': 'd4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r4.json': '58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c',
  'project-documentation/ctrl-evolution/g24-product-system-r4-delta.json': '4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85',
}
const dependencies = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint.md': '2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a',
  'project-documentation/ctrl-evolution/g24-product-system-contract.json': '16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba',
  'project-documentation/ctrl-evolution/g24-product-system-qa-record.md': 'e926095bd52560c2a70463ed6441f9f4f2a24dc31ba4fae9e61d743b59919731',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md': '52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r2.json': '1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2',
  'project-documentation/ctrl-evolution/g24-product-system-r2-delta.json': 'd67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2',
  'project-documentation/ctrl-evolution/research/question-and-enrichment-evidence-2026-09-12.md': 'c505b2dad5657a99a7ef8804567290028eda3fcd2ec917bddbaa8b764a72cadb',
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
for (const [path, hash] of Object.entries(dependencies)) check(`dependency hash: ${path}`, sha256(path) === hash)

const manifest = JSON.parse(read(manifestPath))
const brief = read(briefPath)
check('manifest run id', manifest.run_id === 'g24-r4-architecture-council-003')
check('manifest standard hash', manifest.standard?.sha256 === standardHash)
check('manifest exact specialists', JSON.stringify(manifest.specialists) === JSON.stringify(specialists))
check('manifest exact submission', Object.entries(submission).every(([path, hash]) => manifest.submission?.some(item => item.path === path && item.sha256 === hash)))
check('brief excludes R2 council', brief.includes('either earlier G24 council folder'))
check('brief excludes judge history', brief.includes('`judge-history/`'))

if (!process.argv.includes('--pack')) {
  const sealedPath = `${run}/sealed-verdicts.json`
  check('sealed verdict manifest exists', existsSync(join(root, sealedPath)))
  const sealed = existsSync(join(root, sealedPath)) ? JSON.parse(read(sealedPath)) : null
  check('sealed verdict manifest run', sealed?.run_id === 'g24-r4-architecture-council-003')
  check('sealed verdict manifest predates history', sealed?.frozen_before_history_or_cross_examination === true)
  check('sealed verdict manifest exact count', sealed?.verdicts?.length === specialists.length)

  const observedCounts = { pass: 0, pass_with_watchpoints: 0, veto: 0, inconclusive: 0 }
  for (const specialist of specialists) {
    const path = `${run}/${specialist}.md`
    check(`${specialist} verdict exists`, existsSync(join(root, path)))
    if (!existsSync(join(root, path))) continue
    const verdict = read(path)
    const verdictMatch = verdict.match(/\bVERDICT\b[\s\S]{0,120}?\b(PASS_WITH_WATCHPOINTS|PASS|VETO|INCONCLUSIVE)\b/i)
    const verdictValue = verdictMatch?.[1].toUpperCase()
    check(`${specialist} allowed verdict`, Boolean(verdictValue))
    check(`${specialist} records standard hash`, verdict.includes(standardHash))
    for (const hash of Object.values(submission)) check(`${specialist} records submission hash ${hash.slice(0, 8)}`, verdict.includes(hash))
    check(`${specialist} states independence`, /independen/i.test(verdict) && /(did not read|did not open|excluded|exclusion)/i.test(verdict))
    check(`${specialist} challenges strongest part`, /strongest|apparently strong|under attack/i.test(verdict))
    check(`${specialist} separates current and later gate`, /current(?:[- ]gate| G24\.A)/i.test(verdict) && /later(?:[- ]gate| proof)/i.test(verdict))
    check(`${specialist} preserves closed actions`, /external[- ]action/i.test(verdict) && /closed|authori[sz]ed/i.test(verdict))
    check(`${specialist} contains no em dash`, !verdict.includes('—'))
    if (verdictValue === 'VETO') {
      check(`${specialist} veto has exact locator`, /locator|json pointer|section/i.test(verdict))
      check(`${specialist} veto has failure path`, /failure path/i.test(verdict))
      check(`${specialist} veto has smallest repair`, /smallest sufficient repair/i.test(verdict))
      check(`${specialist} veto has resolving test`, /resolving test/i.test(verdict))
    }
    const countKey = verdictValue?.toLowerCase()
    if (countKey && Object.hasOwn(observedCounts, countKey)) observedCounts[countKey] += 1
    const sealedEntry = sealed?.verdicts?.find(item => item.specialist === specialist)
    check(`${specialist} sealed hash`, sealedEntry?.path === path && sealedEntry?.sha256 === sha256(path))
    check(`${specialist} sealed verdict`, sealedEntry?.verdict === verdictValue)
  }
  check('sealed counts', JSON.stringify(sealed?.counts) === JSON.stringify(observedCounts))
}

if (failures.length) {
  console.error(`G24 R4 council failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(process.argv.includes('--pack')
  ? 'ok: G24 R4 sealed Pack A hashes, dependencies, standard, manifest and exclusions verified'
  : 'ok: G24 R4 Pack A and seven sealed specialist verdict envelopes verified')

