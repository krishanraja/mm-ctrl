import { readFileSync } from 'node:fs'

const source = readFileSync('supabase/functions/_shared/decision-reconstruction-openai.ts', 'utf8').replaceAll('\r\n', '\n')
const required = [
  'gpt-5.6-sol',
  'https://api.openai.com/v1/responses',
  'store: false',
  'reasoning: { effort: "high" }',
  'type: "json_schema"',
  'strict: true',
  'provider_response_incomplete',
  'provider_refused',
  'parseDecisionReconstructionOutput',
  'estimatedCostMicrousd',
]
for (const token of required) {
  if (!source.includes(token)) throw new Error(`R150 provider token missing: ${token}`)
}
for (const forbidden of ['gpt-4o', 'json_object', 'fallback', 'Promise.any']) {
  if (source.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`R150 forbidden provider pattern present: ${forbidden}`)
  }
}
process.stdout.write(`${JSON.stringify({
  status: 'passed',
  provider: 'openai',
  model: 'gpt-5.6-sol',
  api: 'responses',
  stored_by_provider: false,
  schema: 'strict_json_schema_plus_local_semantic_gate',
  fallback: 'none',
  cost_receipt: 'input_output_tokens_plus_versioned_estimate',
}, null, 2)}\n`)
