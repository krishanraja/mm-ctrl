export type BrainAudience = 'customer_private' | 'operator_private'

export interface BrainSource {
  id: string
  kind: string
  label: string
  observed_at: string
  audience: BrainAudience
  assertion: string
}

export interface BrainItem {
  id: string
  type: string
  cluster: string
  title: string
  statement: string
  standing: string
  confidence: string
  audience: BrainAudience
  version: number
  source_refs: string[]
}

export interface BrainRelationship {
  id: string
  from: string
  to: string
  type: string
  meaning: string
  evidence_refs: string[]
}

export interface DecisionBenchFixture {
  fixture_status: 'synthetic_demo'
  customer: {
    id: string
    display_name: string
    role: string
    organisation: string
    proof_day: number
    proof_length_days: number
    fixture_disclosure: string
  }
  intervention: {
    id: string
    exact_opening: string
    listen_for: string[]
    material_to_bring: { label: string }
  }
  deepen_route: { fallback: string }
  sources: BrainSource[]
  brain_items: BrainItem[]
  relationships: BrainRelationship[]
  private_ask: {
    demo_query: string
    demo_response: {
      answer: string
      next_question: string
      standing: string
      audience: BrainAudience
      evidence_refs: string[]
      durable_effect: string
    }
  }
  customer_preview: {
    headline: string
    body: string
    source_refs: string[]
  }
}

export type BenchPanel = 'compare' | 'evidence' | 'action'
export type BenchState = 'sparse' | 'quiet' | 'loading' | 'stale' | 'error' | 'rejected'
