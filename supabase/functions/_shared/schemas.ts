import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Phase 2: Structured output schemas with validation

export const PersonalizedInsightsSchema = z.object({
  // Strategic summary (not recap)
  summary: z.string()
    .min(100, "Summary must be at least 100 characters")
    .max(500, "Summary must not exceed 500 characters")
    .describe("Strategic synthesis revealing patterns, not a recap of inputs"),
  
  // Concrete actions tied to data
  key_actions: z.array(z.object({
    action: z.string().min(20),
    why_now: z.string().min(30).describe("Must tie to specific data from assessment"),
    metric_to_track: z.string().min(10),
    evidence: z.string().describe("Quote or reference to specific answer")
  })).min(3).max(5),
  
  // Tension or surprise
  surprise_or_tension: z.object({
    observation: z.string().min(50).describe("Contradiction, blind spot, or unexpected pattern"),
    evidence: z.array(z.string()).min(1).describe("Specific quotes or answer references"),
    implication: z.string().min(30)
  }),
  
  // Dimension scores with evidence
  scores: z.record(z.object({
    score: z.number().min(0).max(100),
    tier: z.enum(['emerging', 'establishing', 'advancing', 'leading']),
    evidence: z.string().describe("What specific answer led to this score"),
    trajectory: z.string().optional().describe("Compared to previous assessments if available")
  })),
  
  // Proposed DB updates
  data_updates: z.object({
    update_leader: z.record(z.any()).optional(),
    create_risk_signals: z.array(z.object({
      risk_key: z.string(),
      level: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      evidence: z.string()
    })).optional(),
    create_tensions: z.array(z.object({
      dimension_key: z.string(),
      summary_line: z.string(),
      evidence: z.string()
    })).optional()
  }).optional(),
  
  // Metadata
  generation_metadata: z.object({
    confidence_level: z.enum(['high', 'medium', 'low']),
    data_completeness: z.number().min(0).max(100),
    requires_followup: z.boolean().optional(),
    missing_signals: z.array(z.string()).optional()
  }).optional()
});

export const PromptLibrarySchema = z.object({
  prompt_sets: z.array(z.object({
    category_key: z.string(),
    title: z.string().min(10).max(100),
    description: z.string().min(50).max(300),
    what_its_for: z.string().min(30),
    when_to_use: z.string().min(30),
    how_to_use: z.string().min(30),
    prompts: z.array(z.object({
      prompt_text: z.string().min(50),
      use_case: z.string(),
      expected_output: z.string(),
      dimension_tags: z.array(z.string()).optional()
    })).min(2).max(5),
    evidence: z.string().describe("What specific assessment data led to these prompts")
  })).min(3).max(8),
  
  generation_metadata: z.object({
    personalization_level: z.enum(['high', 'medium', 'generic']),
    data_points_used: z.number(),
    confidence: z.number().min(0).max(100)
  }).optional()
});

export type PersonalizedInsights = z.infer<typeof PersonalizedInsightsSchema>;
export type PromptLibrary = z.infer<typeof PromptLibrarySchema>;
