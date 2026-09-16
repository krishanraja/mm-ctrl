import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const directory = 'project-documentation/ctrl-evolution/g24-predicate-authority-r80'
const sourceFiles = [
  '01-effective-resolution.json',
  '02-owner-registry.json',
  '03-authority-binding-program.json',
  '04-interaction-program.json',
  '05-predicate-program.json',
  '06-correction-program.json',
  '07-external-program.json',
  '08-executable-vectors.json'
]
const manifestPath = `${directory}/00-manifest.json`
const effectivePath = `${directory}/09-effective-contract.json`
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const canonicalValue = value => Array.isArray(value)
  ? value.map(canonicalValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]))
    : value
const canonical = value => `${JSON.stringify(canonicalValue(value))}\n`
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const gitJson = (commit, path) => JSON.parse(execFileSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8' }))
const resolvePointer = (value, pointer) => pointer.split('/').slice(1).reduce((cursor, token) => cursor[token.replaceAll('~1', '/').replaceAll('~0', '~')], value)

function buildEffective(modules) {
  const resolution = modules.effective_resolution
  const imports = Object.fromEntries(resolution.imported_exact_sections.map(record => [
    record.effective_section,
    resolvePointer(gitJson(resolution.semantic_base.commit, record.path), record.json_pointer)
  ]))
  return {
    schema_version: 'ctrl.g24.predicate-authority.r80.effective-contract.v1',
    ...imports,
    owner_registry: modules.owner_registry,
    authority_binding_program: modules.authority_binding_program,
    interaction_program: modules.interaction_program,
    predicate_program: modules.predicate_program,
    correction_program: modules.correction_program,
    external_program: modules.external_program,
    executable_vectors: modules.executable_vectors,
    authority_still_closed: resolution.authority_still_closed
  }
}

function build() {
  const moduleRecords = sourceFiles.map(file => {
    const path = `${directory}/${file}`
    const bytes = readFileSync(join(root, path))
    const parsed = JSON.parse(bytes.toString('utf8'))
    return { path, module_id: parsed.module_id, schema_version: parsed.schema_version, bytes: bytes.length, sha256: sha256(bytes), parsed }
  })
  const modules = Object.fromEntries(moduleRecords.map(record => [record.module_id, record.parsed]))
  const effectiveBytes = Buffer.from(canonical(buildEffective(modules)), 'utf8')
  const records = moduleRecords.map(({ parsed: _parsed, ...record }) => record)
  const withoutFingerprint = {
    schema_version: 'ctrl.g24.predicate-authority.r80.manifest.v1',
    standing: 'coherent_local_contract_candidate_no_runtime_authority',
    decision_id: 'DEC-20260916-g24-predicate-authority-r75',
    semantic_base: modules.effective_resolution.semantic_base,
    resolution_rule: modules.effective_resolution.inheritance_rule,
    modules: records,
    effective_contract: { path: effectivePath, bytes: effectiveBytes.length, sha256: sha256(effectiveBytes) },
    authority_still_closed: modules.effective_resolution.authority_still_closed
  }
  return { effectiveBytes, manifestBytes: Buffer.from(canonical({ ...withoutFingerprint, bundle_fingerprint: sha256(Buffer.from(canonical(withoutFingerprint), 'utf8')) }), 'utf8') }
}

function main() {
  const mode = process.argv[2]
  if (!['--write', '--check'].includes(mode)) {
    console.error('usage: node scripts/materialize-ctrl-g24-predicate-authority-r80.mjs --write|--check')
    process.exit(2)
  }
  const built = build()
  if (mode === '--write') {
    writeFileSync(join(root, effectivePath), built.effectiveBytes)
    writeFileSync(join(root, manifestPath), built.manifestBytes)
    console.log(`wrote ${effectivePath} and ${manifestPath}`)
    return
  }
  if (!readFileSync(join(root, effectivePath)).equals(built.effectiveBytes) || !readFileSync(join(root, manifestPath)).equals(built.manifestBytes)) {
    console.error('R80 materialized bytes are stale')
    process.exit(1)
  }
  const manifest = JSON.parse(built.manifestBytes)
  console.log(`ok: ${manifest.modules.length} R80 source modules; ${manifest.bundle_fingerprint}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
