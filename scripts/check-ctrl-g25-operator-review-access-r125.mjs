import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const hash = (path) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex')
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const r124 = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-access-r124.json'))
const contract = JSON.parse(read('project-documentation/ctrl-evolution/g25-operator-review-access-postgres-r125.json'))
const candidate = read('supabase/candidates/g25_operator_review_access_r125.sql')
const runner = read('scripts/run-ctrl-g25-operator-review-access-r125.mjs')

check(contract.depends_on.includes(r124.contract_id), 'R125 does not preserve the R124 authority contract')
check(contract.status === 'local_postgresql_candidate_pass_runtime_unproved', 'R125 overclaims runtime access')
check(contract.not_a_migration === true, 'R125 candidate is mislabeled as a migration')
check(candidate.includes('alter table public.standard_change_review_packets'), 'candidate creates a shadow review packet concept')
check(candidate.includes('operator_projection_audience') && candidate.includes('operator_projection_purpose'), 'candidate lacks projection-specific scope')
check(candidate.includes('standard_change_review_packets_operator_scope_all_or_none'), 'candidate permits partial packet scope')
check(candidate.includes('standard_change_review_packets_workspace_subject_owner_fk'), 'candidate does not bind packet to exact workspace subject and owner')
check(candidate.includes('create table if not exists public.brain_access_receipts'), 'candidate lacks the general access receipt concept')
check(candidate.includes('force row level security') && candidate.includes('revoke all on table public.brain_access_receipts'), 'access receipts are not closed by default')
check(!candidate.match(/update public\.brain_access_receipts|delete from public\.brain_access_receipts/), 'candidate permits receipt mutation')
check(candidate.includes('v_user_id uuid := auth.uid()'), 'operator identity is caller supplied')
check(candidate.includes('private.brain_operator_auth_links') && candidate.includes('private.brain_operator_principals'), 'stable operator identity is not required')
check(candidate.includes("role = 'operator'") && candidate.includes('v_role.granted_by is distinct from v_workspace.owner_id'), 'operator role is not exact and owner-granted')
check(candidate.includes("purpose = 'standard_change_review_preparation'") && candidate.includes("audience = 'delivery_team_private'"), 'audience-purpose access is not exact')
check(candidate.includes('v_grant.revoked_at is not null') && candidate.includes('v_grant.expires_at <= v_now'), 'revocation or expiry is not checked at read time')
check(candidate.includes("'reason', 'not_available'"), 'denial can reveal its private reason')
check(candidate.includes("'review_packet_id', v_review.id") && candidate.includes("v_review.packet->'presentation'->>'question'"), 'safe projection is not derived from the frozen packet')
check(!candidate.includes("'packet', v_review.packet"), 'raw packet can cross the operator boundary')
check(candidate.includes("'decision_authority_granted', false"), 'operator read implies decision authority')
check(candidate.includes("'notification_sent', false"), 'pull-only contract drifted')
check(candidate.indexOf('insert into public.brain_access_receipts') < candidate.lastIndexOf('return v_response'), 'response can return before its receipt is written')
check(candidate.includes('grant execute on function public.get_operator_pending_standard_change_review_v1(uuid)\n  to authenticated'), 'RPC is not restricted to authenticated callers')
check(!candidate.includes('to service_role;\ngrant execute on function public.get_operator_pending'), 'RPC grants blanket service-role execution')
check(runner.includes('denied_case_count: denied.length'), 'runner does not preserve the denial matrix')
check(runner.includes('purpose_predicate_negative_control'), 'runner lacks the exact-purpose negative control')
check(runner.includes('receipt_append_only_for_authenticated: true'), 'runner does not test append-only receipts')
check(!`${candidate}\n${runner}`.includes('\u2014'), 'R125 executable artifacts contain an em dash')

for (const [name, value] of Object.entries(contract.artifacts)) {
  if (!name.endsWith('_sha256')) continue
  const sourceKey = name.slice(0, -7)
  check(contract.artifacts[sourceKey], `R125 contract is missing path for ${sourceKey}`)
  if (contract.artifacts[sourceKey]) {
    check(hash(contract.artifacts[sourceKey]) === value, `R125 artifact hash drift: ${sourceKey}`)
  }
}

if (failures.length) {
  console.error(`[g25-operator-review-access-r125] FAIL: ${failures.length} issue(s)`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[g25-operator-review-access-r125] PASS: the local database admits one exact operator projection, receipts every authenticated outcome and fails closed under fourteen denial routes')
