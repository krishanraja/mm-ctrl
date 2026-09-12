import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const run = 'project-documentation/ctrl-evolution/runs/g24-r5-architecture-council-004'
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = relative => createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const manifestPath = `${run}/input-manifest.json`
const manifest = JSON.parse(read(manifestPath))
const specialists = [
  'human-agency',
  'epistemic-integrity',
  'subject-audience-lifecycle-safety',
  'consequential-usefulness',
  'living-brain-integrity',
  'human-comprehension-and-access',
  'behavioural-and-implementation-reality',
]

check('manifest run id', manifest.run_id === 'g24-r5-architecture-council-004')
check('manifest schema', manifest.schema_version === 'ctrl.council.pack-a.v1')
check('manifest exact specialists', JSON.stringify(manifest.specialists) === JSON.stringify(specialists))
check('standard hash', sha256(manifest.standard.path) === manifest.standard.sha256)
check('standard version', manifest.standard.version === 'g24-r5-dependent-release-watermark-recheck-v1')
check('exact three submission artifacts', manifest.submission?.length === 3)
check('submission is R5 only', manifest.submission?.every(item => /g24-product-system-(blueprint-r5\.md|contract-r5\.json|r5-delta\.json)$/.test(item.path)))
for (const item of [...manifest.submission, ...manifest.dependencies]) {
  check(`frozen hash: ${item.path}`, existsSync(join(root, item.path)) && sha256(item.path) === item.sha256)
}
for (const excluded of [
  'project-documentation/ctrl-evolution/runs/g24-r2-architecture-council-001',
  'project-documentation/ctrl-evolution/runs/g24-r3-architecture-council-002',
  'project-documentation/ctrl-evolution/runs/g24-r4-architecture-council-003',
  'project-documentation/ctrl-evolution/judge-history',
  'other_specialist_outputs',
  'conversation_history',
]) {
  check(`sealed exclusion: ${excluded}`, manifest.sealed_exclusions?.includes(excluded))
}

if (!process.argv.includes('--pack')) {
  const sealedPath = `${run}/sealed-verdicts.json`
  check('sealed verdict manifest exists', existsSync(join(root, sealedPath)))
  const sealed = existsSync(join(root, sealedPath)) ? JSON.parse(read(sealedPath)) : null
  check('sealed verdict manifest run', sealed?.run_id === manifest.run_id)
  check('sealed before history', sealed?.frozen_before_history_or_cross_examination === true)
  check('sealed exact count', sealed?.verdicts?.length === specialists.length)

  const observedCounts = { pass: 0, pass_with_watchpoints: 0, veto: 0, inconclusive: 0 }
  for (const specialist of specialists) {
    const path = `${run}/${specialist}.md`
    check(`${specialist} verdict exists`, existsSync(join(root, path)))
    if (!existsSync(join(root, path))) continue
    const verdict = read(path)
    const match = verdict.match(/\bVERDICT\b[\s\S]{0,160}?\b(PASS_WITH_WATCHPOINTS|PASS|VETO|INCONCLUSIVE)\b/i)
    const value = match?.[1].toUpperCase()
    check(`${specialist} allowed verdict`, Boolean(value))
    check(`${specialist} standard hash`, verdict.includes(manifest.standard.sha256))
    for (const item of manifest.submission) check(`${specialist} submission hash ${item.sha256.slice(0, 8)}`, verdict.includes(item.sha256))
    check(`${specialist} independence`, /independen/i.test(verdict) && /(did not read|did not open|not\W{0,8}read|excluded|exclusion)/i.test(verdict))
    check(`${specialist} strongest attack`, /strongest|under attack|failure.*tried|attempted failure/i.test(verdict))
    check(`${specialist} gate separation`, /current(?:[- ]gate| G24\.A)/i.test(verdict) && /later(?:[- ]gate| proof)/i.test(verdict))
    check(`${specialist} closed actions`, /external[- ]action/i.test(verdict) && /closed|authori[sz]ed/i.test(verdict))
    check(`${specialist} no em dash`, !verdict.includes('—'))
    if (value === 'VETO') {
      check(`${specialist} veto locator`, /locator|json pointer|section/i.test(verdict))
      check(`${specialist} veto failure path`, /failure path/i.test(verdict))
      check(`${specialist} veto smallest repair`, /smallest sufficient repair/i.test(verdict))
      check(`${specialist} veto resolving test`, /resolving test/i.test(verdict))
    }
    const key = value?.toLowerCase()
    if (key && Object.hasOwn(observedCounts, key)) observedCounts[key] += 1
    const sealedEntry = sealed?.verdicts?.find(item => item.specialist === specialist)
    check(`${specialist} sealed hash`, sealedEntry?.path === path && sealedEntry?.sha256 === sha256(path))
    check(`${specialist} sealed verdict`, sealedEntry?.verdict === value)
  }
  check('sealed counts', JSON.stringify(sealed?.counts) === JSON.stringify(observedCounts))

  const crossFreezePath = `${run}/cross-examination-freeze.json`
  const adjudicationPath = `${run}/adjudication.md`
  const crossFreezeHash = 'd6a0f224233a97557d6fed78f22e3737302ce7135ea82d1357503b1b653c5025'
  const adjudicationHash = '006c1816d5bc754792c16fb85d183f4d626b98112f9395e5d6ec964f9be72f1f'
  check('cross-examination freeze hash', sha256(crossFreezePath) === crossFreezeHash)
  const crossFreeze = JSON.parse(read(crossFreezePath))
  check('cross-examination uses sealed first pass', crossFreeze.first_pass_seal_sha256 === sha256(sealedPath))
  check('cross-examination opens no external action', Array.isArray(crossFreeze.external_actions_opened) && crossFreeze.external_actions_opened.length === 0)
  for (const record of crossFreeze.records || []) {
    check(`cross-examination hash: ${record.role}`, sha256(record.path) === record.sha256)
  }
  check('adjudication hash', sha256(adjudicationPath) === adjudicationHash)
  const adjudication = read(adjudicationPath)
  check('adjudication clears only for founder lock', adjudication.includes('**Final status:** `CLEAR_FOR_FOUNDER_LOCK`'))
  check('adjudication keeps implementation closed', adjudication.includes('Implementation is also closed by this adjudication.'))
  check('adjudication preserves exact founder prompt', adjudication.includes('Lock these exact R1 through R5 architecture bytes as the G24 architecture'))
  check('adjudication has no em dash', !adjudication.includes('—'))
}

if (failures.length) {
  console.error(`G24 R5 council failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(process.argv.includes('--pack')
  ? 'ok: G24 R5 sealed Pack A hashes, dependencies, standard, manifest and exclusions verified'
  : 'ok: G24 R5 Pack A and seven sealed specialist verdict envelopes verified')
