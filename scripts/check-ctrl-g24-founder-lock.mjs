import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = relative => readFileSync(join(root, relative), 'utf8')
const sha256 = relative => createHash('sha256').update(readFileSync(join(root, relative))).digest('hex')
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const locked = {
  'project-documentation/ctrl-evolution/g24-product-system-blueprint.md': '2d006b3275be4f727c5e507abbc1c355bf3bab6f5565ca4d7e9be48750c24e0a',
  'project-documentation/ctrl-evolution/g24-product-system-contract.json': '16b25ea7448997896cab2b5a6e024c78c97118c5593a87eb67d079f15a8064ba',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r2.md': '52edc77136a68e1a25d647954f62410fa2f638b51dd96ed536b6ee5790f22980',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r2.json': '1a62700f3f7f2b3c5cced1327296dbc00c438961c2c9a2d95a647b301e75cef2',
  'project-documentation/ctrl-evolution/g24-product-system-r2-delta.json': 'd67e4f0af970101d6f9d116e8b162288502c48ea2950394db84e3a7f18b41ad2',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r3.md': '446476044415af172bc63b1ec8f61876460f1068120eded45323f667de2372a5',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r3.json': '5d6109cd8d34a52f9a441d9a5906bbcac0efd10768d5329fac7dfc3f80083f09',
  'project-documentation/ctrl-evolution/g24-product-system-r3-delta.json': 'c4fccebbe147706243196fc771ee2a73079cb6f08843cd7449aa0785dc4b4ceb',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r4.md': 'd4c611ef25094d4dfa08dbcb3c41b756f14cbbf615b5255fb896347d203b266a',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r4.json': '58c056ca26bd45a87bb460240637decdd853894c18b1a8173b9cc3297c7a927c',
  'project-documentation/ctrl-evolution/g24-product-system-r4-delta.json': '4cc685d736e295319c1199ddf521f16adae415e50a03f81459c8ab1c671f8c85',
  'project-documentation/ctrl-evolution/g24-product-system-blueprint-r5.md': '1de9dc033c168134cc3345258633309d6ee52e353e70bfefc140cb8650037940',
  'project-documentation/ctrl-evolution/g24-product-system-contract-r5.json': '68a17a60b0dce06022d83889f932447107e3c548b1d4c808c6e6b32fec517086',
  'project-documentation/ctrl-evolution/g24-product-system-r5-delta.json': 'fcf45209e2d1cb1efef25c3e4c0bef7a512d6f228e3083bf13fce42f8492f443',
  'project-documentation/ctrl-evolution/runs/g24-r5-architecture-council-004/adjudication.md': '006c1816d5bc754792c16fb85d183f4d626b98112f9395e5d6ec964f9be72f1f',
}

for (const [path, hash] of Object.entries(locked)) check(`locked hash: ${path}`, sha256(path) === hash)

const lock = read('project-documentation/ctrl-evolution/g24-founder-architecture-lock.md')
const state = read('project-documentation/ctrl-evolution/README.md')
const designState = read('docs/current/design-state.md')
check('explicit founder call recorded', lock.includes('**Final call:** "yes to both"'))
check('exact source revision recorded', lock.includes('9fdca0aaae479a6c3e0b896f712fca8b54b2e23e'))
check('every locked hash recorded', Object.values(locked).every(hash => lock.includes(hash)))
check('local headless build authorized', lock.includes('local headless Crossing implementation'))
check('UI remains closed', lock.includes('customer-facing UI work'))
check('external actions remain closed', lock.includes('deployment, feature enablement, merge or release'))
check('revisit trigger is observable', lock.includes('credible conforming case') && lock.includes('later named proof gate falsifies'))
check('canonical state records lock', state.includes('[locked the exact R1 through R5 architecture chain](g24-founder-architecture-lock.md)'))
check(
  'canonical next action remains inside the trusted-ingress gate',
  state.includes('**CURRENT_NEXT_ACTION:** Materialize, freeze and independently attack the G24 trusted canonical ingress R19 repair'),
)
check(
  'design state remains inside the trusted-ingress gate',
  designState.includes('materialize, freeze and independently attack the trusted canonical ingress R19 repair'),
)
check('lock contains no em dash', !lock.includes('—'))

if (failures.length) {
  console.error(`G24 founder lock failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: exact G24 R1-R5 founder lock and bounded local headless-build authority verified')
