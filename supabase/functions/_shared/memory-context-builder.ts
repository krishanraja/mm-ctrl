import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface MemoryContextOptions {
  includeWarm?: boolean;
  topicFilter?: string;
  maxTokens?: number;
  format?: "markdown" | "chatgpt" | "claude" | "gemini" | "cursor" | "claude-code";
  useCase?: "general" | "meeting" | "decision" | "code" | "email" | "strategy" | "delegation" | "board";
  /** Optional query text for semantic ranking of facts via pgvector */
  queryText?: string;
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

function applyFormat(markdown: string, format: string): string {
  switch (format) {
    case "chatgpt":
      return `# What to know about me\n\n${markdown}\n\n# How to respond to me\n- Be direct and specific, not generic\n- Reference my context when relevant\n- Challenge my blind spots when you see them\n- Prioritize actionable advice over theory`;

    case "claude":
      return `<context>\n${markdown}\n</context>\n\nUse the context above to personalize your responses. Reference specific facts when relevant. Be direct.`;

    case "gemini":
      return `Context about me:\n\n${markdown}\n\nUse this context to give me personalized, specific responses. Don't repeat my context back to me — just use it.`;

    case "cursor":
      return `# User Context\n\n${markdown}\n\n# Coding Preferences\n- Follow existing patterns in the codebase\n- Be concise in comments\n- Prefer simple solutions`;

    case "claude-code":
      return `# User Context\n\n${markdown}\n\n# Working Rules\n- Reference this context when making decisions\n- Be direct and specific\n- Don't ask questions you can answer from context`;

    default:
      return markdown;
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
  let filtered = filterByUseCase(allFacts, patterns, decisions, useCase);

  // Semantic ranking: if queryText is provided and pgvector is available,
  // re-rank facts by relevance to the query
  if (options.queryText && filtered.facts.length > 5) {
    try {
      const { searchMemoryByEmbedding } = await import("./embeddings.ts");
      const semanticResults = await searchMemoryByEmbedding(
        supabase,
        userId,
        options.queryText,
        filtered.facts.length, // get all, we just want the ranking
        0.3, // low threshold — we still want category-filtered facts
      );

      if (semanticResults.length > 0) {
        // Build a similarity map from semantic results
        const similarityMap = new Map<string, number>();
        for (const r of semanticResults) {
          similarityMap.set(r.id, r.similarity);
        }

        // Re-sort facts: semantically relevant first, then unranked
        filtered.facts.sort((a, b) => {
          const simA = similarityMap.get(a.id) ?? 0;
          const simB = similarityMap.get(b.id) ?? 0;
          return simB - simA;
        });
      }
    } catch (_err) {
      // pgvector not available or embeddings not generated — fall through to default ordering
    }
  }

  // Build markdown
  let markdown = buildMarkdownContext(filtered.facts, filtered.patterns, filtered.decisions, userName);

  // Enforce token budget — trim least-relevant facts (end of list after semantic ranking)
  let tokenCount = estimateTokens(markdown);
  if (tokenCount > maxTokens && filtered.facts.length > 5) {
    // Trim the bottom half of facts (least relevant after semantic ranking, or warm facts)
    const trimmedFacts = filtered.facts.slice(0, Math.ceil(filtered.facts.length / 2));
    const trimmedFiltered = { facts: trimmedFacts, patterns: filtered.patterns, decisions: filtered.decisions };
    markdown = buildMarkdownContext(trimmedFiltered.facts, trimmedFiltered.patterns, trimmedFiltered.decisions, userName);
    tokenCount = estimateTokens(markdown);
  }

  // Apply format template
  const context = applyFormat(markdown, format);
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
