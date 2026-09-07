import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const fixtureRel = 'project-documentation/ctrl-evolution/phase-2-evaluation-fixtures.json';
const contractRel = 'project-documentation/ctrl-evolution/phase-2-evaluation-fixture-contract.md';
const expectedSource = 'project-documentation/ctrl-evolution/phase-2-decision-brain-vertical-slice-contract.md';

const expectedGlobalFailures = [
  'cross_subject_or_cross_audience_context_use',
  'off_record_persistence',
  'ai_recommendation_before_human_prior',
  'invented_or_distorted_decision_bearing_evidence',
  'durable_memory_without_human_authority',
  'incomplete_correction_propagation',
  'duplicate_committed_effect_after_retry',
  'stale_or_superseded_context_presented_as_current',
  'nonhuman_authorship_of_owned_call',
  'export_audience_violation',
  'nonreproducible_or_nonimportable_release',
  'named_person_employment_recommendation',
];

const expectedArms = [
  'ordinary_chat',
  'static_package',
  'current_ctrl',
  'new_without_brain',
  'new_with_brain',
];

const expectedCriteria = [
  'frame_fidelity',
  'causal_sharpness',
  'evidence_integrity',
  'numerical_integrity',
  'independent_challenge',
  'meaningful_diversity',
  'personal_standard_use',
  'uncertainty_and_abstention',
  'human_agency',
  'practical_movement',
  'voice_sovereignty',
  'cognitive_economy',
];

const expectedFixtureIds = Array.from({ length: 12 }, (_, index) => `F${String(index + 1).padStart(2, '0')}`);
const secretPattern = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sbp_[A-Za-z0-9]{20,}|vcp_[A-Za-z0-9]{20,}|sk_(?:live|test)_[A-Za-z0-9]{16,})/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

function exactKeys(value, expected) {
  return isObject(value) && sameMembers(Object.keys(value), expected);
}

function uniqueNonemptyStrings(value) {
  return Array.isArray(value)
    && value.length > 0
    && value.every((item) => typeof item === 'string' && item.trim().length > 0)
    && new Set(value).size === value.length;
}

function validatePack(pack, raw = null) {
  const failures = [];
  const fail = (message) => failures.push(message);

  if (!isObject(pack)) return ['root must be an object'];
  if (pack.schema_version !== 'ctrl.phase2.evaluation-fixtures.v1') fail('schema_version must remain v1');
  if (pack.status !== 'provisional') fail('status must remain provisional until the founder gate is recorded');
  if (pack.authority !== 'agent_synthesis_not_founder_approval') fail('authority must not imply founder approval');
  if (pack.source_contract !== expectedSource) fail('source_contract does not match the canonical slice contract');
  if (pack.data_classification !== 'synthetic_or_sanitised_internal') fail('fixture data classification changed');

  if (!sameMembers(pack.global_blocking_failures, expectedGlobalFailures)) fail('global blocking failures changed or duplicated');
  if (!sameMembers(pack.comparator_arms, expectedArms)) fail('comparator arms changed or duplicated');

  if (!isObject(pack.qualitative_scale)) fail('qualitative_scale must be an object');
  else {
    if (pack.qualitative_scale.minimum !== 0 || pack.qualitative_scale.maximum !== 4) fail('qualitative scale must remain 0 to 4');
    if (!sameMembers(pack.qualitative_scale.criteria, expectedCriteria)) fail('qualitative criteria changed or duplicated');
  }

  const fixtures = Array.isArray(pack.fixtures) ? pack.fixtures : [];
  if (!sameMembers(fixtures.map((fixture) => fixture?.fixture_id), expectedFixtureIds)) fail('fixtures must contain unique F01 through F12');
  const fixtureIds = new Set(fixtures.map((fixture) => fixture?.fixture_id));

  if (!isObject(pack.global_invariant_fixture_map)) fail('global_invariant_fixture_map must be an object');
  else {
    if (!sameMembers(Object.keys(pack.global_invariant_fixture_map), expectedGlobalFailures)) fail('invariant map must cover exactly the global failures');
    for (const [invariant, mappedIds] of Object.entries(pack.global_invariant_fixture_map)) {
      if (!uniqueNonemptyStrings(mappedIds)) fail(`${invariant}: fixture map must contain unique fixture ids`);
      for (const id of mappedIds ?? []) if (!fixtureIds.has(id)) fail(`${invariant}: unknown fixture ${id}`);
    }
  }

  const allowedPrivacy = new Set(['synthetic', 'sanitised_founder_case']);
  const visibleKeys = ['decision', 'human_prior', 'settledness', 'change_condition', 'evidence', 'eligible_brain_context'];
  const expectedKeys = ['primary_criteria', 'required_properties', 'allowed_end_states', 'memory_result', 'blocking_failures'];
  const sourceKeys = ['id', 'claim', 'status'];
  const brainKeys = new Set(['id', 'state', 'audience', 'content', 'age', 'applicability']);

  for (const fixture of fixtures) {
    const id = fixture?.fixture_id ?? '<unknown>';
    if (!exactKeys(fixture, ['fixture_id', 'title', 'fixture_class', 'privacy', 'visible_to_candidate', 'hidden_expected'])) {
      fail(`${id}: fixture fields changed or hidden material leaked into the visible envelope`);
    }
    for (const field of ['title', 'fixture_class']) {
      if (typeof fixture?.[field] !== 'string' || fixture[field].trim().length === 0) fail(`${id}: ${field} must be a nonempty string`);
    }
    if (!allowedPrivacy.has(fixture?.privacy)) fail(`${id}: unapproved privacy class`);

    const visible = fixture?.visible_to_candidate;
    if (!exactKeys(visible, visibleKeys)) fail(`${id}: visible_to_candidate fields changed`);
    for (const field of ['decision', 'human_prior', 'settledness', 'change_condition']) {
      if (typeof visible?.[field] !== 'string' || visible[field].trim().length === 0) fail(`${id}: visible ${field} must be a nonempty string`);
    }
    if (!Array.isArray(visible?.evidence) || visible.evidence.length === 0) fail(`${id}: evidence must be nonempty`);
    else {
      const evidenceIds = [];
      for (const source of visible.evidence) {
        if (!exactKeys(source, sourceKeys)) fail(`${id}: evidence source fields changed`);
        for (const field of sourceKeys) if (typeof source?.[field] !== 'string' || source[field].trim().length === 0) fail(`${id}: evidence ${field} must be nonempty`);
        evidenceIds.push(source?.id);
      }
      if (new Set(evidenceIds).size !== evidenceIds.length) fail(`${id}: duplicate evidence id`);
    }

    if (!Array.isArray(visible?.eligible_brain_context)) fail(`${id}: eligible_brain_context must be an array`);
    else {
      const brainIds = [];
      for (const item of visible.eligible_brain_context) {
        if (!isObject(item) || Object.keys(item).some((key) => !brainKeys.has(key))) fail(`${id}: Brain context fields changed`);
        for (const field of ['id', 'state', 'audience', 'content']) {
          if (typeof item?.[field] !== 'string' || item[field].trim().length === 0) fail(`${id}: Brain ${field} must be nonempty`);
        }
        brainIds.push(item?.id);
      }
      if (new Set(brainIds).size !== brainIds.length) fail(`${id}: duplicate Brain context id`);
    }

    const expected = fixture?.hidden_expected;
    if (!exactKeys(expected, expectedKeys)) fail(`${id}: hidden_expected fields changed`);
    if (!uniqueNonemptyStrings(expected?.primary_criteria)) fail(`${id}: primary_criteria must be unique and nonempty`);
    else for (const criterion of expected.primary_criteria) if (!expectedCriteria.includes(criterion)) fail(`${id}: unknown criterion ${criterion}`);
    for (const field of ['required_properties', 'allowed_end_states', 'blocking_failures']) {
      if (!uniqueNonemptyStrings(expected?.[field])) fail(`${id}: ${field} must contain unique nonempty strings`);
    }
    if (typeof expected?.memory_result !== 'string' || expected.memory_result.trim().length === 0) fail(`${id}: memory_result must be nonempty`);
  }

  const serialized = JSON.stringify(pack);
  if (secretPattern.test(serialized)) fail('credential-shaped content detected');
  if (/\u2014/.test(serialized)) fail('em dash detected');
  if (/"(?:generated_at|exported_at|current_timestamp|run_timestamp)"\s*:/.test(serialized)) fail('volatile timestamp field detected');
  if (raw !== null && raw !== `${JSON.stringify(pack, null, 2)}\n`) fail('fixture file must be canonical two-space JSON with one trailing newline');

  return failures;
}

function runNegativeProbes(pack) {
  const probes = [
    ['missing fixture', (copy) => copy.fixtures.pop()],
    ['unmapped invariant', (copy) => { copy.global_invariant_fixture_map.off_record_persistence = []; }],
    ['visible hidden field', (copy) => { copy.fixtures[0].visible_to_candidate.hidden_expected = {}; }],
    ['credential shape', (copy) => { copy.fixtures[0].title = `ghp_${'A'.repeat(24)}`; }],
    ['em dash', (copy) => { copy.fixtures[0].title = 'invalid\u2014title'; }],
    ['duplicate evidence id', (copy) => { copy.fixtures[0].visible_to_candidate.evidence[1].id = copy.fixtures[0].visible_to_candidate.evidence[0].id; }],
    ['unknown criterion', (copy) => { copy.fixtures[0].hidden_expected.primary_criteria[0] = 'agree_with_user'; }],
    ['fabricated approval', (copy) => { copy.status = 'final'; copy.authority = 'founder_approved'; }],
  ];

  const failures = [];
  for (const [name, mutate] of probes) {
    const copy = structuredClone(pack);
    mutate(copy);
    if (validatePack(copy).length === 0) failures.push(`negative probe escaped validation: ${name}`);
  }
  return { failures, count: probes.length };
}

const fixturePath = join(root, fixtureRel);
const contractPath = join(root, contractRel);
const sourcePath = join(root, expectedSource);
const failures = [];

for (const [label, path] of [['fixture pack', fixturePath], ['evaluation contract', contractPath], ['source contract', sourcePath]]) {
  if (!existsSync(path)) failures.push(`${label} is missing`);
}

let raw = '';
let pack = null;
if (existsSync(fixturePath)) {
  raw = readFileSync(fixturePath, 'utf8');
  try {
    pack = JSON.parse(raw);
  } catch (error) {
    failures.push(`fixture JSON parse failed: ${error.message}`);
  }
}

if (pack) {
  failures.push(...validatePack(pack, raw));
  const probes = runNegativeProbes(pack);
  failures.push(...probes.failures);

  if (existsSync(contractPath)) {
    const contract = readFileSync(contractPath, 'utf8');
    for (const id of expectedFixtureIds) if (!contract.includes(`\`${id}\``)) failures.push(`evaluation contract does not reference ${id}`);
    if (!contract.includes('Passing twelve designed fixtures')) failures.push('evaluation contract is missing the synthetic-evidence limit');
    if (contract.includes('\u2014')) failures.push('evaluation contract contains an em dash');
  }

  if (!failures.length) {
    const hash = createHash('sha256').update(raw, 'utf8').digest('hex');
    console.log(`ok: CTRL Phase 2 fixture pack ${pack.fixtures.length} fixtures, ${pack.global_blocking_failures.length} blocking invariants`);
    console.log(`ok: ${probes.count} negative mutation probes rejected`);
    console.log(`ok: canonical fixture SHA-256 ${hash}`);
  }
}

if (failures.length) {
  console.error(`CTRL Phase 2 evaluation check failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
