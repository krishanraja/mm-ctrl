import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface MemoryContextOptions {
  includeWarm?: boolean;
  topicFilter?: string;
  maxTokens?: number;
  format?: "markdown" | "chatgpt" | "claude" | "gemini" | "cursor" | "claude-code";
  useCase?: "general" | "meeting" | "decision" | "code" | "email" | "strategy" | "delegation" | "board" | "edge"
    | "writing_persona" | "strength_framework" | "delegation_playbook" | "strategic_advisor" | "decision_journal";
}

export interface MemoryContextResult {
  context: string;
  tokenCount: number;
  factCount: number;
  patternCount: number;
  decisionCount: number;
  lastUpdated: string;
}

interface Fact {
  id: string;
  fact_category: string;
  fact_label: string;
  fact_value: string;
  temperature: string;
  verification_status: string;
  confidence_score: number;
  created_at: string;
}

interface Pattern {
  pattern_type: string;
  pattern_text: string;
  confidence: number;
  evidence_count: number;
  status: string;
}

interface Decision {
  decision_text: string;
  rationale: string | null;
  source: string;
  created_at: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function groupFactsByCategory(facts: Fact[]): Record<string, Fact[]> {
  const groups: Record<string, Fact[]> = {};
  for (const fact of facts) {
    const cat = fact.fact_category || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(fact);
  }
  return groups;
}

function buildMarkdownContext(
  facts: Fact[],
  patterns: Pattern[],
  decisions: Decision[],
  userName: string | null,
): string {
  const sections: string[] = [];
  const grouped = groupFactsByCategory(facts);

  // Identity
  if (grouped.identity?.length) {
    sections.push(`## About ${userName || "Me"}\n${grouped.identity.map(f => `- ${f.fact_value}`).join("\n")}`);
  }

  // Business
  if (grouped.business?.length) {
    sections.push(`## Business Context\n${grouped.business.map(f => `- ${f.fact_value}`).join("\n")}`);
  }

  // Objectives
  if (grouped.objective?.length) {
    sections.push(`## Current Priorities\n${grouped.objective.map(f => `- ${f.fact_value}`).join("\n")}`);
  }

  // Decisions
  if (decisions.length) {
    const decisionLines = decisions.map(d => {
      const line = `- ${d.decision_text}`;
      return d.rationale ? `${line} (${d.rationale})` : line;
    });
    sections.push(`## Active Decisions\n${decisionLines.join("\n")}`);
  }

  // Patterns
  if (patterns.length) {
    const patternLines = patterns.map(p =>
      `- ${p.pattern_text} (${Math.round(p.confidence * 100)}% confidence, ${p.evidence_count} observations)`
    );
    sections.push(`## Known Patterns\n${patternLines.join("\n")}`);
  }

  // Blockers
  if (grouped.blocker?.length) {
    sections.push(`## Blockers & Constraints\n${grouped.blocker.map(f => `- ${f.fact_value}`).join("\n")}`);
  }

  // Preferences
  if (grouped.preference?.length) {
    sections.push(`## Preferences\n${grouped.preference.map(f => `- ${f.fact_value}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

function getUseCasePreamble(useCase: string): { heading: string; instructions: string } | null {
  switch (useCase) {
    case "writing_persona":
      return {
        heading: "My Writing Voice & Communication Style",
        instructions:
          "Use this as my writing voice and communication style. Match my tone, vocabulary, and structure when drafting anything on my behalf. Do not default to generic business language.",
      };
    case "strength_framework":
      return {
        heading: "Framework I Use Instinctively",
        instructions:
          "This is a framework I use instinctively. Help me apply it consistently and suggest where it fits. Reference it when making recommendations.",
      };
    case "delegation_playbook":
      return {
        heading: "My Delegation Style & Team Context",
        instructions:
          "Use this to help me delegate effectively. Reference my team context, priorities, and working style when suggesting how to hand off work.",
      };
    case "strategic_advisor":
      return {
        heading: "Strategic Context for Advisory",
        instructions:
          "Act as a strategic advisor who deeply understands my business context. Reference my objectives, constraints, and patterns when giving advice.",
      };
    case "decision_journal":
      return {
        heading: "Decision Context & Patterns",
        instructions:
          "Use this to help me make better decisions. Reference my past decisions, known patterns, and blind spots. Challenge me when I repeat past mistakes.",
      };
    default:
      return null;
  }
}

function applyFormat(markdown: string, format: string, useCase: string = "general"): string {
  const preamble = getUseCasePreamble(useCase);

  switch (format) {
    case "chatgpt": {
      const heading = preamble?.heading || "What to know about me";
      const instructions = preamble?.instructions
        || "Be direct and specific, not generic\n- Reference my context when relevant\n- Challenge my blind spots when you see them\n- Prioritize actionable advice over theory";
      return `# ${heading}\n\n${markdown}\n\n# How to respond to me\n- ${instructions}`;
    }

    case "claude": {
      const instruction = preamble?.instructions
        || "Use the context above to personalize your responses. Reference specific facts when relevant. Be direct.";
      return `<context>\n${preamble?.heading ? `# ${preamble.heading}\n\n` : ""}${markdown}\n</context>\n\n${instruction}`;
    }

    case "gemini": {
      const prefix = preamble?.heading || "Context about me";
      const instruction = preamble?.instructions
        || "Use this context to give me personalized, specific responses. Don't repeat my context back to me, just use it.";
      return `${prefix}:\n\n${markdown}\n\n${instruction}`;
    }

    case "cursor":
      return `# User Context\n\n${markdown}\n\n# Coding Preferences\n- Follow existing patterns in the codebase\n- Be concise in comments\n- Prefer simple solutions`;

    case "claude-code":
      return `# User Context\n\n${markdown}\n\n# Working Rules\n- Reference this context when making decisions\n- Be direct and specific\n- Don't ask questions you can answer from context`;

    default:
      return preamble ? `# ${preamble.heading}\n\n${markdown}\n\n---\n${preamble.instructions}` : markdown;
  }
}

function filterByUseCase(
  facts: Fact[],
  patterns: Pattern[],
  decisions: Decision[],
  useCase: string,
): { facts: Fact[]; patterns: Pattern[]; decisions: Decision[] } {
  switch (useCase) {
    case "meeting":
      return {
        facts: facts.filter(f => ["identity", "business", "objective", "blocker"].includes(f.fact_category)),
        patterns: patterns.filter(p => ["behavior", "preference"].includes(p.pattern_type)),
        decisions,
      };
    case "decision":
      return {
        facts: facts.filter(f => ["objective", "blocker", "preference"].includes(f.fact_category)),
        patterns,
        decisions,
      };
    case "code":
      return {
        facts: facts.filter(f => ["preference", "business"].includes(f.fact_category)),
        patterns: patterns.filter(p => p.pattern_type === "preference"),
        decisions: [],
      };
    case "email":
      return {
        facts: facts.filter(f => ["identity", "preference"].includes(f.fact_category)),
        patterns: patterns.filter(p => ["preference", "behavior"].includes(p.pattern_type)),
        decisions: [],
      };
    case "strategy":
      return {
        facts: facts.filter(f => ["objective", "blocker", "business"].includes(f.fact_category)),
        patterns,
        decisions,
      };
    case "delegation":
      return {
        facts: facts.filter(f => ["identity", "objective", "business"].includes(f.fact_category)),
        patterns: patterns.filter(p => p.pattern_type === "behavior"),
        decisions,
      };
    case "board":
      return {
        facts: facts.filter(f => ["business", "objective", "blocker"].includes(f.fact_category)),
        patterns: patterns.filter(p => ["strength", "blindspot"].includes(p.pattern_type)),
        decisions,
      };
    case "writing_persona":
      return {
        facts: facts.filter(f => ["identity", "preference"].includes(f.fact_category)),
        patterns: patterns.filter(p => ["preference", "behavior"].includes(p.pattern_type)),
        decisions: [],
      };
    case "strength_framework":
      return {
        facts,
        patterns: patterns.filter(p => ["strength", "behavior"].includes(p.pattern_type)),
        decisions,
      };
    case "delegation_playbook":
      return {
        facts: facts.filter(f => ["identity", "business", "objective"].includes(f.fact_category)),
        patterns: patterns.filter(p => p.pattern_type === "behavior"),
        decisions,
      };
    case "strategic_advisor":
      return {
        facts: facts.filter(f => ["objective", "blocker", "business"].includes(f.fact_category)),
        patterns,
        decisions,
      };
    case "decision_journal":
      return {
        facts: facts.filter(f => ["objective", "blocker"].includes(f.fact_category)),
        patterns,
        decisions,
      };
    case "edge":
      // All data for comprehensive strength/weakness synthesis
      return { facts, patterns, decisions };
    default: // general
      return { facts, patterns, decisions };
  }
}

export async function buildMemoryContext(
  supabase: SupabaseClient,
  userId: string,
  options: MemoryContextOptions = {},
): Promise<MemoryContextResult> {
  const {
    includeWarm = true,
    maxTokens = 4000,
    format = "markdown",
    useCase = "general",
  } = options;

  // Fetch hot facts (always)
  const { data: hotFacts } = await supabase
    .from("user_memory")
    .select("id, fact_category, fact_label, fact_value, temperature, verification_status, confidence_score, created_at")
    .eq("user_id", userId)
    .eq("is_current", true)
    .is("archived_at", null)
    .eq("temperature", "hot")
    .order("last_referenced_at", { ascending: false });

  // Fetch warm facts (if requested)
  let warmFacts: Fact[] = [];
  if (includeWarm) {
    const { data } = await supabase
      .from("user_memory")
      .select("id, fact_category, fact_label, fact_value, temperature, verification_status, confidence_score, created_at")
      .eq("user_id", userId)
      .eq("is_current", true)
      .is("archived_at", null)
      .eq("temperature", "warm")
      .order("last_referenced_at", { ascending: false });
    warmFacts = (data || []) as Fact[];
  }

  const allFacts = [...(hotFacts || []) as Fact[], ...warmFacts];

  // Fetch patterns
  const { data: patternData } = await supabase
    .from("user_patterns")
    .select("pattern_type, pattern_text, confidence, evidence_count, status")
    .eq("user_id", userId)
    .in("status", ["emerging", "confirmed"])
    .order("confidence", { ascending: false });

  const patterns = (patternData || []) as Pattern[];

  // Fetch active decisions
  const { data: decisionData } = await supabase
    .from("user_decisions")
    .select("decision_text, rationale, source, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const decisions = (decisionData || []) as Decision[];

  // Get user name from identity facts
  const nameFact = allFacts.find(f => f.fact_category === "identity" && f.fact_label?.toLowerCase().includes("name"));
  const userName = nameFact?.fact_value || null;

  // Apply use case filter
  const filtered = filterByUseCase(allFacts, patterns, decisions, useCase);

  // Build markdown
  let markdown = buildMarkdownContext(filtered.facts, filtered.patterns, filtered.decisions, userName);

  // Enforce token budget - trim warm facts first
  let tokenCount = estimateTokens(markdown);
  if (tokenCount > maxTokens && warmFacts.length > 0) {
    // Rebuild with fewer warm facts
    const reducedWarm = warmFacts.slice(0, Math.floor(warmFacts.length / 2));
    const reducedFacts = [...(hotFacts || []) as Fact[], ...reducedWarm];
    const reducedFiltered = filterByUseCase(reducedFacts, filtered.patterns, filtered.decisions, useCase);
    markdown = buildMarkdownContext(reducedFiltered.facts, reducedFiltered.patterns, reducedFiltered.decisions, userName);
    tokenCount = estimateTokens(markdown);
  }

  // Apply format template
  const context = applyFormat(markdown, format, useCase);
  const finalTokenCount = estimateTokens(context);

  return {
    context,
    tokenCount: finalTokenCount,
    factCount: filtered.facts.length,
    patternCount: filtered.patterns.length,
    decisionCount: filtered.decisions.length,
    lastUpdated: new Date().toISOString(),
  };
}
