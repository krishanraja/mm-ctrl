import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
export const contractDirectory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r78'
export const manifestPath = `${contractDirectory}/00-manifest.json`

export const lineage = Object.freeze({
  decision_id: 'DEC-20260916-g24-predicate-authority-r75',
  r75: {
    commit: 'e6494cda6fba4ce8209f99f1611ba3803de34370',
    tree: '3e53f7ca69a0f01192f3e255471a17b81f05f313',
    parent: '37d0b7602265d52306b352cdab2a44d5642c0518',
    document_blob: 'ee48e4b29d787ef3bbb17c9bf2e558cf7c2aebc6',
    document_sha256: '83d2bc6fd6c1042e1fff83f29904abcc7d74bc130f388aa36933e19e40293410'
  },
  r77: {
    commit: '4ab418d7815c914eef155fd017ef362f1983b9a7',
    tree: '06733dcc7292583cad3463030e076a03a7a1bfb1',
    parent: 'e79e076c7bdd86b95748672fde6f9b0636e69618',
    json_blob: '00a485fe6de9cb70e05ddf6a08096726bbd30b82',
    markdown_blob: '102c6f9496e87c9559a259773b00505f8f6dc492'
  }
})

export const authorityStillClosed = Object.freeze([
  'semantic evaluator implementation',
  'result-producing success branch',
  'runtime integration or registry wiring',
  'database schema migration or production data change',
  'customer-facing UI',
  'external research model spend email or service mutation',
  'merge deployment release or production promotion',
  'legacy backend deletion',
  'cross-venture Supabase decision-ledger write'
])

export const allowedModuleFlow = Object.freeze([
  'source_adapters->set_completeness_verifier',
  'source_adapters->semantic_authority_verifier',
  'set_completeness_verifier->transition_assemblers',
  'semantic_authority_verifier->transition_assemblers',
  'transition_assemblers->deterministic_predicates',
  'deterministic_predicates->transaction_coordinator',
  'deterministic_predicates->gap_prioritizer',
  'human_authority_verifier->transaction_coordinator',
  'gap_prioritizer->gap_explainer',
  'external_authority_coordinator->source_adapters',
  'external_authority_coordinator->transaction_coordinator',
  'transaction_coordinator->correction_invalidator'
])

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

const canonicalValue = value => {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]))
  }
  return value
}

export const canonicalStringify = value => `${JSON.stringify(canonicalValue(value), null, 2)}\n`

export function sourceModulePaths() {
  return readdirSync(join(root, contractDirectory), { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json') && entry.name !== basename(manifestPath))
    .map(entry => `${contractDirectory}/${entry.name}`)
    .sort((a, b) => Buffer.from(a).compare(Buffer.from(b)))
}

export function buildManifest(paths = sourceModulePaths()) {
  const modules = [...paths]
    .sort((a, b) => Buffer.from(a).compare(Buffer.from(b)))
    .map(path => {
      const bytes = readFileSync(join(root, path))
      const parsed = JSON.parse(bytes.toString('utf8'))
      return {
        path,
        module_id: parsed.module_id,
        schema_version: parsed.schema_version,
        bytes: bytes.length,
        sha256: sha256(bytes)
      }
    })
  const fingerprintInput = {
    schema_version: 'ctrl.g24.predicate-authority.r78.bundle-fingerprint.v1',
    governing_decision: lineage.decision_id,
    modules
  }
  return {
    schema_version: 'ctrl.g24.predicate-authority.r78.manifest.v1',
    standing: 'frozen_contract_candidate_no_runtime_authority',
    governing_decision: lineage,
    inherited_transition_catalogue: 'g24_product_system_r4_exact_thirteen',
    inherited_structural_boundaries: [
      'r66_hardened_worker_boundary',
      'r70_closed_caller_authority_loader',
      'r71_archive_safe_acceptance'
    ],
    modules,
    allowed_module_flow: allowedModuleFlow,
    authority_still_closed: authorityStillClosed,
    bundle_fingerprint: sha256(Buffer.from(canonicalStringify(fingerprintInput), 'utf8'))
  }
}

function main() {
  const mode = process.argv[2]
  if (!['--write', '--check'].includes(mode)) {
    console.error('usage: node scripts/materialize-ctrl-g24-predicate-authority-r78.mjs --write|--check')
    process.exit(2)
  }
  const expected = canonicalStringify(buildManifest())
  if (mode === '--write') {
    writeFileSync(join(root, manifestPath), expected, 'utf8')
    console.log(`wrote ${manifestPath}`)
    return
  }
  const current = readFileSync(join(root, manifestPath), 'utf8')
  if (current !== expected) {
    console.error('R78 manifest does not match the exact current module bytes')
    process.exit(1)
  }
  console.log(`ok: ${buildManifest().modules.length} R78 modules; ${buildManifest().bundle_fingerprint}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
