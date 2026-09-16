import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r79'
const manifestPath = `${directory}/00-manifest.json`

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalValue = value => Array.isArray(value)
  ? value.map(canonicalValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]))
    : value
const canonical = value => `${JSON.stringify(canonicalValue(value), null, 2)}\n`

const base = Object.freeze({
  commit: 'a645f13e11139b15596cd73f7b26eafb2a28a4a0',
  tree: '74b6ed7be00ce959690dafa74c25d6393041a01d',
  bundle_fingerprint: '424f6eca0fd5707f15e59ce721834c334d4e910d5e1603a03a039dec7764e72f',
  standing: 'vetoed_design_catalogue_not_authority'
})

const allowedFlow = Object.freeze([
  'lineage_and_owner_policy->closed_schemas',
  'lineage_and_owner_policy->transition_catalogue',
  'closed_schemas->executable_vectors',
  'transition_catalogue->predicate_grammar',
  'transition_catalogue->human_interaction_contract',
  'transition_catalogue->external_finality_contract',
  'predicate_grammar->executable_vectors',
  'human_interaction_contract->executable_vectors',
  'external_finality_contract->executable_vectors',
  'correction_closure_contract->executable_vectors'
])

const authorityStillClosed = Object.freeze([
  'semantic evaluator implementation',
  'result-producing lifecycle success branch',
  'runtime integration or live registry wiring',
  'database schema migration or production data change',
  'customer-facing UI',
  'external research model spend email or service mutation',
  'merge deployment release or production promotion',
  'legacy backend deletion',
  'cross-venture Supabase decision-ledger write'
])

function modulePaths() {
  return readdirSync(join(root, directory), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json') && entry.name !== basename(manifestPath))
    .map(entry => `${directory}/${entry.name}`)
    .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)))
}

function buildManifest(paths = modulePaths()) {
  const modules = [...paths].sort((left, right) => Buffer.from(left).compare(Buffer.from(right))).map(path => {
    const bytes = readFileSync(join(root, path))
    const parsed = JSON.parse(bytes.toString('utf8'))
    return { path, module_id: parsed.module_id, schema_version: parsed.schema_version, bytes: bytes.length, sha256: sha256(bytes) }
  })
  const withoutFingerprint = {
    schema_version: 'ctrl.g24.predicate-authority.r79.manifest.v1',
    standing: 'repaired_contract_candidate_no_runtime_authority',
    decision_id: 'DEC-20260916-g24-predicate-authority-r75',
    base,
    effective_precedence: 'r79_overlay_supersedes_only_named_r78_sections_all_other_r78_constraints_remain_in_force',
    modules,
    allowed_module_flow: allowedFlow,
    authority_still_closed: authorityStillClosed
  }
  return { ...withoutFingerprint, bundle_fingerprint: sha256(Buffer.from(canonical(withoutFingerprint), 'utf8')) }
}

function main() {
  const mode = process.argv[2]
  if (!['--write', '--check'].includes(mode)) {
    console.error('usage: node scripts/materialize-ctrl-g24-predicate-authority-r79.mjs --write|--check')
    process.exit(2)
  }
  const expected = canonical(buildManifest())
  if (mode === '--write') {
    writeFileSync(join(root, manifestPath), expected, 'utf8')
    console.log(`wrote ${manifestPath}`)
    return
  }
  const current = readFileSync(join(root, manifestPath), 'utf8')
  if (current !== expected) {
    console.error('R79 manifest does not match current overlay bytes')
    process.exit(1)
  }
  console.log(`ok: ${buildManifest().modules.length} R79 repair modules; ${buildManifest().bundle_fingerprint}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
