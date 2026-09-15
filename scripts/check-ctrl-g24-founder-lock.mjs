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
const r68 = JSON.parse(read('project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r68.json'))
const r69 = JSON.parse(read('project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r69.json'))
const r70 = JSON.parse(read('project-documentation/ctrl-evolution/g24-lifecycle-precondition-evaluator-r70.json'))
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
  state.includes('**CURRENT_NEXT_ACTION:** Founder approve or reject the [R75 predicate-authority decision]'),
)
check(
  'design state remains inside the trusted-ingress gate',
  designState.includes('founder approve or reject the R75 predicate-authority decision') && designState.includes('No machine contract, result-producing evaluation, runtime integration'),
)
check('R68 source bytes founder-locked', sha256(r68.executable_artifact.source_path) === 'fc2a93586fdbe42aa9f15e3a1990142403edb0a7df512881ffd9d5e18fad9104')
check('R68 founder-lock identity exact', r68.executable_artifact.founder_lock.founder_lock_identity === '4ccc949ac84ab2ab7ce357088230170a7be8348d8162e4d69ab5738c73d03b06')
check('R68 semantic success remains closed', r68.semantic_boundary.satisfied_or_success_branch === 'forbidden' && r68.open_founder_decision.status === 'open_not_decided_or_implemented')
check('R69 source bytes founder-locked', sha256(r69.executable_artifact.source_path) === '6d47389ea5cadcfc8e1c3da9dd8d594ed72323ad994e353b5d94e5886316bdb9')
check('R69 founder-lock identity exact', r69.executable_artifact.founder_lock.founder_lock_identity === '0461357500373c0956c7db887718256b1f3e014500194be009059a0ce1a66ca1')
check('R69 preserves R68 veto and semantic closure', r69.rejected_predecessor.review_status === 'vetoed_preserved_not_authority' && r69.semantic_boundary.satisfied_or_success_branch === 'forbidden' && r69.open_founder_decision.status === 'open_not_decided_or_implemented')
check('R70 source bytes founder-locked', sha256(r70.executable_artifact.source_path) === 'e7b70f3816b38fa3744c1a86e627e835b770765745e370e569a350ddb1df05c9')
check('R70 founder-lock identity exact', r70.executable_artifact.founder_lock.founder_lock_identity === '8ee0ef4dd286e7f13f54f2d80d26ea341783d2dc89bb858e91b865fa2ce77fbf')
check('R70 preserves R69 veto and semantic closure', r70.rejected_predecessor.commit === '70055728953f8eec4c30a2876b6169378d883682' && r70.rejected_predecessor.review_status === 'vetoed_preserved_not_authority' && r70.semantic_boundary.satisfied_or_success_branch === 'forbidden')
check('R71 acceptance receipt routed', state.includes('[R71 acceptance receipt](g24-lifecycle-precondition-evaluator-r70-acceptance-receipt-r71.md)'))
check('R72 founder decision routed', state.includes('[R72 predicate-authority decision](g24-predicate-authority-founder-decision-r72.md)'))
check('R72 veto preserved', state.includes('[R72 verdict](g24-predicate-authority-r72-panel-verdict.md)'))
check('R73 founder decision routed', state.includes('[R73 predicate-authority decision](g24-predicate-authority-founder-decision-r73.md)'))
check('R73 veto preserved', state.includes('[R73 verdict](g24-predicate-authority-r73-panel-verdict.md)'))
check('R74 founder decision routed', state.includes('[R74 predicate-authority decision](g24-predicate-authority-founder-decision-r74.md)'))
check('R74 PASS preserved', state.includes('[R74 PASS](g24-predicate-authority-r74-panel-verdict.md)'))
check('R75 founder-ready decision routed', state.includes('[R75 founder-ready decision](g24-predicate-authority-founder-decision-r75.md)'))
check('R76 founder-ready receipt routed', state.includes('[R76 founder-ready receipt](g24-predicate-authority-r75-founder-ready-receipt-r76.md)'))
check('lock contains no em dash', !lock.includes('—'))

if (failures.length) {
  console.error(`G24 founder lock failed ${failures.length} check(s):`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok: exact G24 R1-R5 founder lock and bounded local headless-build authority verified')
