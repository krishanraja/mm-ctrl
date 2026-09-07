import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const contractPath = resolve('project-documentation/ctrl-evolution/g15-judgement-resolution-contract.json');
const fixturePath = resolve('project-documentation/ctrl-evolution/design/g15-judgement-resolution-fixture.json');
const contract = JSON.parse(await readFile(contractPath, 'utf8'));
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

let failures = 0;
const pass = message => console.log(`PASS ${message}`);
const fail = message => { failures += 1; console.error(`FAIL ${message}`); };
const expect = (message, condition) => condition ? pass(message) : fail(message);

const dimensionIds = contract.dimensions.map(dimension => dimension.id);
const territoryIds = new Set(fixture.territories.map(territory => territory.id));
const sourceIds = new Set(fixture.sources.map(source => source.id));
const holdoutIds = new Set(fixture.holdouts.map(holdout => holdout.id));
const transferIds = new Set(fixture.transfers.map(transfer => transfer.id));
const correctionIds = new Set(fixture.corrections.map(correction => correction.id));

expect('contract: construct remains explicitly provisional', contract.construct.status === 'research_construct_not_validated_in_product');
expect('contract: human surface does not default to a percentage', contract.aggregation.visible_percentage_default === false);
expect('contract: all five dimensions are present exactly once', dimensionIds.length === 5 && new Set(dimensionIds).size === 5 && ['grounding', 'discrimination', 'calibration', 'transfer', 'adaptation'].every(id => dimensionIds.includes(id)));
expect('contract: territory aggregation is weakest-link', contract.aggregation.territory_operator === 'minimum_dimension');
expect('contract: activity and competition are prohibited from the surface', ['completion_percentage', 'leaderboard', 'streak', 'files_added', 'memories_added', 'cross_person_rank'].every(field => contract.surface_prohibited_fields.includes(field)));
expect('contract: holdout and baseline anti-gaming rules are required', contract.anti_gaming.brain_version_frozen_before_holdout && contract.anti_gaming.same_model_no_brain_baseline_required && contract.anti_gaming.handcrafted_context_baseline_required_before_moat_claim);

expect('fixture: all people, events and values are explicitly synthetic', fixture.fixture_status === 'synthetic_demo' && fixture.disclosure.includes('all evaluation events and all values are synthetic'));
expect('fixture: product validity is not implied', fixture.construct.validated_in_product === false);
expect('fixture: visible percentage remains off', fixture.construct.visible_percentage_default === false);
expect('fixture: territory ids are unique', territoryIds.size === fixture.territories.length);
expect('fixture: source, holdout, transfer and correction ids are unique', sourceIds.size === fixture.sources.length && holdoutIds.size === fixture.holdouts.length && transferIds.size === fixture.transfers.length && correctionIds.size === fixture.corrections.length);
expect('fixture: every reference resolves', fixture.territories.every(territory => territory.source_refs.every(id => sourceIds.has(id)) && territory.holdout_refs.every(id => holdoutIds.has(id)) && territory.transfer_refs.every(id => transferIds.has(id)) && territory.correction_refs.every(id => correctionIds.has(id))));
expect('fixture: eligible territories meet minimum evidence and holdout gates', fixture.territories.filter(territory => territory.eligibility === 'eligible').every(territory => territory.scope_status === 'subject_approved' && territory.source_refs.length >= 2 && territory.holdout_refs.length >= 3));
expect('fixture: every eligible score is the weakest dimension', fixture.territories.filter(territory => territory.eligibility === 'eligible').every(territory => Math.abs(territory.score_internal - Math.min(...dimensionIds.map(id => territory.dimensions[id]))) < 1e-9));
expect('fixture: ineligible territories cannot carry a score', fixture.territories.filter(territory => territory.eligibility !== 'eligible').every(territory => territory.score_internal === null));
expect('fixture: holdouts were frozen before the evaluated Brain version', fixture.holdouts.every(holdout => holdout.frozen_before_brain_version === 3 && territoryIds.has(holdout.territory_ref)));
expect('fixture: appropriate refusal is represented', fixture.holdouts.some(holdout => holdout.brain_action === 'defer' && holdout.confidence < 0.5));
expect('fixture: healthy correction uncertainty is represented', fixture.territories.some(territory => territory.state === 'revising' && territory.change_direction === 'softened' && territory.score_internal === null));
expect('fixture: intentional privacy is not treated as missing work', fixture.territories.some(territory => territory.scope_status === 'intentionally_out_of_scope' && territory.state === 'private' && territory.source_refs.length === 0));
expect('fixture: no efficacy claim is inferred from the synthetic transfer', fixture.transfers.every(transfer => transfer.claim_status === 'single_synthetic_attempt_not_efficacy_evidence'));
expect('fixture: strong handcrafted context baseline remains visibly unrun', fixture.baselines.some(baseline => baseline.name === 'strong handcrafted context' && baseline.status === 'not_yet_run'));
expect('fixture: overall internal value reflects the lower eligible territory', fixture.construct.overall_internal_value === Math.min(...fixture.territories.filter(territory => territory.eligibility === 'eligible').map(territory => territory.score_internal)));

if (failures) {
  console.error(`G15 Judgement Resolution contract failed ${failures} check(s).`);
  process.exit(1);
}
console.log('G15 Judgement Resolution contract and fixture passed.');
