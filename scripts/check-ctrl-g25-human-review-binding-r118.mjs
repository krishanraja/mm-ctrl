import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const failures = []
const check = (name, condition) => {
  if (!condition) failures.push(name)
}

const migration = read('supabase/migrations/20260920090000_standard_change_human_projection.sql')
const presentationCore = read('supabase/functions/_shared/standard-change-owner-presentation-core.ts')
const edge = read('supabase/functions/review-standard-change-v2/index.ts')
const config = read('supabase/config.toml')
const contract = read('src/features/standard-review/contract.ts')
const gateway = read('src/features/standard-review/gateway.ts')
const experience = read('src/features/standard-review/StandardReviewExperience.tsx')
const experienceCss = read('src/features/standard-review/StandardReviewExperience.css')
const preview = read('src/features/standard-review/StandardReviewPreviewPage.tsx')
const router = read('src/router.tsx')
const probe = read('scripts/probe-ctrl-g25-human-review-binding-r118.sql')
const staticPreview = read('public/g25-human-review-r118/index.html')
const staticAssets = readdirSync(join(root, 'public/g25-human-review-r118/assets'))

for (const marker of [
  'build_standard_change_review_presentation',
  'prepare_standard_change_review_v2',
  'standard_change_presentation_evidence_incomplete',
  'standard_change_presentation_copy_incomplete',
  "'presentation', v_presentation",
  'v_packet_sha := public.standard_change_json_sha256(v_packet)',
  'grant execute on function public.prepare_standard_change_review_v2(uuid, text) to authenticated',
]) check(`migration marker: ${marker}`, migration.includes(marker))

check(
  'projection requires two resolved evidence rows',
  migration.includes('v_expected_count < 2') && migration.includes('v_resolved_count <> v_expected_count'),
)
check(
  'projection freezes an explicit countercase and validation plan',
  migration.includes("'alternative_explanations', v_alternatives") && migration.includes("'validation', v_validation"),
)
check(
  'legacy packets cannot be silently upgraded after a decision',
  migration.includes("v_review.state <> 'ready'") && migration.includes('standard_change_presentation_locked'),
)
check(
  'presentation helper is not directly exposed',
  migration.includes('revoke all on function public.build_standard_change_review_presentation') &&
    !migration.includes('grant execute on function public.build_standard_change_review_presentation'),
)

check('prepare maps only to the V2 projection-binding RPC', presentationCore.includes("name: 'prepare_standard_change_review_v2'"))
check('decision and reversal preserve the R116 authority implementation', presentationCore.includes('return ownerStandardChangeRpc(input)'))
check('Edge route requires an authenticated user', edge.includes("withSupabase({ auth: 'user' }"))
check('Edge route keeps no-store responses', edge.includes("'Cache-Control': 'no-store'"))
check('V2 function is JWT protected in config', config.includes('[functions.review-standard-change-v2]') && config.includes('entrypoint = "./functions/review-standard-change-v2/index.ts"'))

check('product parser requires the presentation schema', contract.includes("z.literal('ctrl.standard-change.owner-review.presentation.v1')"))
check('product parser requires at least two evidence rows', contract.includes('z.array(standardReviewEvidenceSchema).min(2).max(12)'))
check('product parser rejects deployment and release authority', contract.includes('deploy_authorized: z.literal(false)') && contract.includes('release_authorized: z.literal(false)'))
check('product parser has one honest failure message', contract.includes('This change is not ready for a trustworthy review.'))
check('gateway calls only the V2 owner route', gateway.includes("invoke('review-standard-change-v2'"))
check('gateway binds decision to both reviewed hashes', gateway.includes('expected_packet_sha256: review.reviewPacketSha256') && gateway.includes('expected_standard_sha256: review.plannedStandardSha256'))
check('gateway validates the actual reversal receipt', gateway.includes('restored: z.literal(true)') && !gateway.includes('result.reversed'))
check('product keeps exact evidence behind one disclosure', experience.includes('Why this came up') && experience.includes('review.evidence.map'))
check('product confirms before reversal', experience.includes("kind: 'reverse-confirm'") && experience.includes('Restore the previous rule'))
check('product uses the governed Mindmaker icon', experience.includes('<BrandLockup className="sr-brand" />'))
check('product actions share a centred treatment', experienceCss.includes('.sr-primary,\n.sr-secondary') && experienceCss.includes('text-align: center'))
check('synthetic preview has no persistence adapter', preview.includes('StandardReviewGateway(previewInvoker(state))') && !preview.includes('supabase'))
check('synthetic preview is exact-id and flag gated', router.includes("reviewId === 'SYN-REVIEW-118'") && router.includes("VITE_ENABLE_SYNTHETIC_DECISION_BENCH === '1'"))
check('standalone preview is built for cross-device review', staticPreview.includes('noindex,nofollow,noarchive') && staticAssets.some((name) => name.endsWith('.js')) && staticAssets.some((name) => name.endsWith('.css')))
check('standalone preview carries the governed icon asset', staticAssets.some((name) => name.startsWith('mindmaker-icon-') && name.endsWith('.png')))

check('hosted SQL probe is transactional', probe.startsWith('begin;') && probe.trimEnd().endsWith('rollback;'))
check('hosted SQL probe tests missing evidence rejection', probe.includes('r118_missing_evidence_was_accepted') && probe.includes('standard_change_presentation_evidence_incomplete'))

for (const [path, body] of [
  ['migration', migration],
  ['presentation core', presentationCore],
  ['Edge route', edge],
  ['product contract', contract],
  ['product gateway', gateway],
  ['product experience', experience],
  ['preview route', preview],
  ['probe', probe],
]) check(`${path} contains no em dash`, !body.includes('\u2014'))

if (failures.length) {
  console.error(`[g25-human-review-binding-r118] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-human-review-binding-r118] PASS: exact human meaning is packet-bound, evidence-complete and product-projected without opening production authority')
