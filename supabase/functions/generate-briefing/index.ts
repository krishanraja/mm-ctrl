/**
 * generate-briefing Edge Function
 *
 * Generates a personalised AI news briefing for a leader.
 * Pipeline:
 *   1. Pull user context (memory, edge profile, missions)
 *   2. Fetch news (Perplexity -> Brave+OpenAI -> static fallback)
 *   3. Personalise curation via GPT-4o
 *   4. Generate conversational script
 *   5. Store briefing row
 *   6. Trigger audio synthesis
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ──────────────────────────────────────────────────────────

interface NewsHeadline {
  title: string;
  source: string;
}

type BriefingType = 'default' | 'macro_trends' | 'vendor_landscape' | 'competitive_intel' | 'boardroom_prep' | 'team_update' | 'custom_voice';

const PRO_ONLY_TYPES: BriefingType[] = ['vendor_landscape', 'competitive_intel', 'boardroom_prep', 'custom_voice'];

interface UserContext {
  name: string;
  role: string;
  company: string;
  industry: string;
  teamSize: string;
  strengths: string[];
  weaknesses: string[];
  activeMissions: string[];
  recentDecisions: string[];
  confirmedPatterns: string[];
  watchingCompanies: string[];
  objectives: string[];
  blockers: string[];
  preferences: string[];
  newsProfileLine: string;
  learningStyle: string;
  feedbackPreferences: { preferredTags: string[]; preferredSources: string[] };
}

interface BriefingSegment {
  headline: string;
  analysis: string;
  framework_tag: string;
  source: string;
  relevance_reason: string;
}

// ── News Fetching ──────────────────────────────────────────────────

function buildPerplexityPrompt(userCtx: UserContext, briefingType: BriefingType, customContext?: string): string {
  const parts = [
    `You are an elite news curator. You find the stories that make busy leaders stop scrolling.`,
  ];

  // Use the news profile line as the primary frame when available
  if (userCtx.newsProfileLine) {
    parts.push(`NEWS PROFILE: ${userCtx.newsProfileLine}`);
  } else {
    // Fallback to piecemeal context
    if (userCtx.role && userCtx.company) {
      parts.push(`This person is the ${userCtx.role} of ${userCtx.company}.`);
    } else if (userCtx.role) {
      parts.push(`This person is a ${userCtx.role}.`);
    }
    if (userCtx.industry) {
      parts.push(`Their industry: ${userCtx.industry}.`);
    }
    if (userCtx.activeMissions.length > 0) {
      parts.push(`Active priorities: ${userCtx.activeMissions.slice(0, 3).join("; ")}.`);
    }
  }
  if (userCtx.watchingCompanies.length > 0) {
    parts.push(`Companies they track: ${userCtx.watchingCompanies.join(", ")}.`);
  }

  // Type-specific search shaping
  const typeInstructions = buildTypeSearchInstructions(briefingType, customContext, userCtx);

  parts.push(`
${typeInstructions}

QUALITY BAR: Only include stories where this specific leader would say "I'm glad someone told me this." Prefer last-48-hour news. Every headline must pass this test: does it change a decision, reveal a competitive shift, or surface a number worth knowing FOR THEM specifically?

Prioritize: their industry developments, what peers in similar roles are doing, tools and trends disrupting businesses their size, competitor moves, growth opportunities. Include AI news only when it concretely affects their world.

For each headline, assign ONE tag:
SIGNAL: Changes the math on a decision this leader faces.
DECISION TRIGGER: Something shifted that demands action or reassessment.
KRISH'S TAKE: A sharp, slightly cynical observation that reframes conventional wisdom.

Do NOT include NOISE items. Do NOT include: governance fluff, workforce surveys, geopolitics, AGI speculation, celebrity AI, funding rounds (unless they shift competitive dynamics for THIS leader).

8-18 words per headline. Present tense. Specific numbers when available.

Return ONLY a JSON array of 8-10 items:
[{"title": "[SIGNAL] headline here", "source": "Publication Name"}]`);

  return parts.join(" ");
}

function buildTypeSearchInstructions(briefingType: BriefingType, customContext: string | undefined, userCtx: UserContext): string {
  switch (briefingType) {
    case 'macro_trends':
      return `Focus on: macro-economic shifts affecting AI adoption, analyst reports on market sizing, regulatory changes with real business impact, industry-wide adoption milestones with real numbers. Think board-level trends, not product launches.`;
    case 'vendor_landscape':
      return `Focus on: AI product launches and pricing changes, vendor comparison data, feature releases from major platforms, API pricing shifts, new entrants worth evaluating. Frame through the lens of build-vs-buy decisions in ${userCtx.industry || 'their industry'}.`;
    case 'competitive_intel':
      return `Focus heavily on: ${userCtx.watchingCompanies.length > 0 ? userCtx.watchingCompanies.join(', ') : 'major players in ' + (userCtx.industry || 'AI')}. Find their latest moves, hiring patterns, product launches, partnerships, and strategic pivots. Also surface moves by their direct competitors.`;
    case 'boardroom_prep':
      return `Focus on: stories a board member would ask about. Macro AI trends with hard numbers, industry benchmarks, leadership moves at major companies, regulatory shifts, and data points that support strategic narratives. Everything should be quotable in a presentation.`;
    case 'team_update':
      return `Focus on: practical AI developments that affect day-to-day operations. New tools, workflow improvements, productivity gains with real numbers, team-level adoption stories, and training/upskilling developments.`;
    case 'custom_voice':
      return customContext
        ? `The leader specifically asked for: "${customContext}". Tailor your search to find news and insights directly relevant to this request. Interpret their intent and find the most useful stories for their specific situation.`
        : `Search for high-impact AI and business news relevant to this leader's role and industry.`;
    default: {
      const parts: string[] = [];
      if (userCtx.industry && userCtx.role) {
        parts.push(`Search for news that a ${userCtx.role} in ${userCtx.industry} needs to know from the past 48 hours.`);
      } else if (userCtx.industry) {
        parts.push(`Search for the most important ${userCtx.industry} industry news from the past 48 hours.`);
      } else {
        parts.push(`Search for the most important business and technology news from the past 48 hours.`);
      }
      if (userCtx.company) {
        parts.push(`Include news affecting ${userCtx.company} and its competitive landscape.`);
      }
      if (userCtx.objectives?.length > 0) {
        parts.push(`Their strategic goals: ${userCtx.objectives.slice(0, 2).join("; ")}. Prioritize news that advances or threatens these.`);
      }
      if (userCtx.activeMissions.length > 0) {
        parts.push(`Active priorities: ${userCtx.activeMissions.slice(0, 2).join("; ")}. Flag news that affects these.`);
      }
      parts.push(`Prioritize: ${userCtx.industry || 'sector'} developments, competitive shifts${userCtx.company ? ` affecting ${userCtx.company}` : ''}, technology that changes how ${userCtx.role || 'leader'}s operate, and deals or launches with real numbers.`);
      parts.push(`Also include significant AI developments, but only when they concretely affect this leader's world.`);
      return parts.join(" ");
    }
  }
}

async function fetchWithPerplexity(apiKey: string, userCtx: UserContext, briefingType: BriefingType = 'default', customContext?: string): Promise<NewsHeadline[]> {
  const today = new Date().toISOString().split("T")[0];

  const contextParts: string[] = [];
  if (userCtx.newsProfileLine) {
    contextParts.push(`Find news specifically for: ${userCtx.newsProfileLine}`);
  }
  if (userCtx.watchingCompanies.length > 0) {
    contextParts.push(`Also search for recent news about: ${userCtx.watchingCompanies.join(", ")}.`);
  }
  if (userCtx.recentDecisions.length > 0) {
    contextParts.push(`Decisions on their desk: ${userCtx.recentDecisions.slice(0, 2).join("; ")}. Surface news that informs these.`);
  }
  if (!userCtx.newsProfileLine) {
    // Fallback context when no profile line exists
    if (userCtx.industry) {
      contextParts.push(`Focus heavily on the ${userCtx.industry} industry.`);
    }
    if (userCtx.activeMissions.length > 0) {
      contextParts.push(`Their current priorities: ${userCtx.activeMissions.slice(0, 2).join("; ")}.`);
    }
    if (userCtx.role) {
      contextParts.push(`Frame news through the lens of a ${userCtx.role}.`);
    }
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: buildPerplexityPrompt(userCtx, briefingType, customContext) },
        {
          role: "user",
          content: `Today is ${today}. Find 8-10 high-signal headlines from the past 48 hours (fall back to 7 days if needed). ${contextParts.join(" ")} Tag each [SIGNAL], [DECISION TRIGGER], or [KRISH'S TAKE]. No filler. Only stories worth interrupting someone for.`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`Perplexity error: ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from Perplexity");
  return parseLLMJson(content);
}

async function fetchWithTavily(apiKey: string, userCtx: UserContext): Promise<NewsHeadline[]> {
  const queries: string[] = [];

  // Use profile line as primary search query when available
  if (userCtx.newsProfileLine) {
    // Extract key terms for search (first ~60 chars or first sentence)
    const profileQuery = userCtx.newsProfileLine.substring(0, 80);
    queries.push(profileQuery);
  }

  // Industry-specific queries
  if (userCtx.industry) {
    queries.push(`${userCtx.industry} industry news trends`);
  }

  // Watched companies
  if (userCtx.watchingCompanies.length > 0) {
    queries.push(userCtx.watchingCompanies.slice(0, 3).join(" OR ") + " news");
  }

  // Mission-relevant
  for (const mission of userCtx.activeMissions.slice(0, 2)) {
    const keywords = mission.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(" ");
    if (keywords) queries.push(keywords);
  }

  // Fallback general query
  if (queries.length === 0) {
    queries.push(`${userCtx.industry || 'business'} ${userCtx.role || 'leadership'} news trends`);
  }

  const allResults: Array<{ title: string; url: string; content: string }> = [];

  for (const query of queries) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "advanced",
          topic: "news",
          days: 7,
          max_results: 10,
          include_answer: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results) allResults.push(...data.results);
      }
    } catch (e) {
      console.warn(`Tavily query failed: ${query}`, e);
    }
  }

  if (allResults.length === 0) throw new Error("No Tavily results");

  // Deduplicate and format as NewsHeadline[]
  const seen = new Set<string>();
  const headlines: NewsHeadline[] = [];

  for (const r of allResults) {
    if (!r.title || !r.url) continue;
    const key = r.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);

    let source = "Web";
    try {
      const hostname = new URL(r.url).hostname.replace(/^www\./, "");
      source = formatSource(hostname);
    } catch { /* use default */ }

    headlines.push({ title: r.title, source });
    if (headlines.length >= 25) break;
  }

  return headlines;
}

const SOURCE_MAP: Record<string, string> = {
  "bloomberg.com": "Bloomberg",
  "ft.com": "Financial Times",
  "wsj.com": "WSJ",
  "nytimes.com": "NYT",
  "reuters.com": "Reuters",
  "cnbc.com": "CNBC",
  "techcrunch.com": "TechCrunch",
  "theverge.com": "The Verge",
  "wired.com": "Wired",
  "hbr.org": "HBR",
  "technologyreview.com": "MIT Tech Review",
  "forbes.com": "Forbes",
  "axios.com": "Axios",
  "venturebeat.com": "VentureBeat",
};

function formatSource(hostname: string): string {
  const clean = hostname.replace(/^www\./, "");
  return (
    SOURCE_MAP[clean] ||
    clean.split(".")[0].charAt(0).toUpperCase() + clean.split(".")[0].slice(1)
  );
}

async function fetchBraveNews(apiKey: string, userCtx: UserContext): Promise<string[]> {
  const queries: string[] = [];

  // Use profile line as first query when available
  if (userCtx.newsProfileLine) {
    queries.push(userCtx.newsProfileLine.substring(0, 80));
  }

  // Industry-specific queries (highest relevance)
  if (userCtx.industry) {
    queries.push(`"${userCtx.industry}" AND ("trend" OR "growth" OR "disruption" OR "news")`);
  }

  // Watched companies (high relevance)
  if (userCtx.watchingCompanies.length > 0) {
    queries.push(userCtx.watchingCompanies.slice(0, 3).map(c => `"${c}"`).join(" OR "));
  }

  // Mission-relevant queries
  for (const mission of userCtx.activeMissions.slice(0, 2)) {
    const keywords = mission.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(" ");
    if (keywords) queries.push(keywords);
  }

  // Objective-derived queries
  for (const obj of (userCtx.objectives || []).slice(0, 2)) {
    const keywords = obj.split(/\s+/).filter(w => w.length > 3).slice(0, 3).join(" ");
    if (keywords) queries.push(keywords);
  }

  // General AI queries (only if we lack user-specific queries, and contextualized to industry)
  if (queries.length < 3) {
    if (userCtx.industry) {
      queries.push(`"AI" AND "${userCtx.industry}" AND ("pricing" OR "launch" OR "release")`);
    } else {
      queries.push('"AI" AND ("pricing" OR "API" OR "launch" OR "release")');
    }
  }

  // Role-specific query (contextualized with industry)
  if (userCtx.role) {
    queries.push(`"${userCtx.role}" AND "${userCtx.industry || 'business'}" AND ("trends" OR "strategy" OR "innovation")`);
  }

  const allResults: Array<{
    title: string;
    meta_url?: { hostname: string };
  }> = [];

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        q: query,
        freshness: "pw",
        count: "10",
        country: "US",
        search_lang: "en",
      });
      const response = await fetch(
        `https://api.search.brave.com/res/v1/news/search?${params}`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": apiKey,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results) allResults.push(...data.results);
      }
    } catch (e) {
      console.warn(`Brave query failed: ${query}`, e);
    }
  }

  if (allResults.length === 0) throw new Error("No Brave results");

  const seen = new Set<string>();
  const titles: string[] = [];
  for (const r of allResults) {
    if (!r.title || !r.meta_url?.hostname) continue;
    const key = r.title.toLowerCase().substring(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);
    const title = r.title.replace(/\s*[-|]\s*[^-|]+$/, "").trim();
    if (title.length > 15) {
      titles.push(`${title} (${formatSource(r.meta_url.hostname)})`);
    }
    if (titles.length >= 25) break;
  }
  return titles;
}

async function curateWithOpenAI(
  rawTitles: string[],
  apiKey: string,
  userCtx: UserContext
): Promise<NewsHeadline[]> {
  const today = new Date().toISOString().split("T")[0];

  const contextLines: string[] = [];
  if (userCtx.newsProfileLine) {
    contextLines.push(`NEWS PROFILE: ${userCtx.newsProfileLine}`);
  } else {
    if (userCtx.role) contextLines.push(`Role: ${userCtx.role}`);
    if (userCtx.company) contextLines.push(`Company: ${userCtx.company}`);
    if (userCtx.industry) contextLines.push(`Industry: ${userCtx.industry}`);
    if (userCtx.activeMissions.length > 0) contextLines.push(`Current priorities: ${userCtx.activeMissions.slice(0, 3).join("; ")}`);
  }
  if (userCtx.recentDecisions.length > 0) contextLines.push(`Decisions on their desk: ${userCtx.recentDecisions.slice(0, 2).join("; ")}`);

  const leaderDesc = userCtx.newsProfileLine || `${userCtx.role || 'executive'}${userCtx.industry ? ` in ${userCtx.industry}` : ''}${userCtx.company ? ` at ${userCtx.company}` : ''}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a news curator for a specific leader.
${contextLines.join("\n")}

Rewrite raw headlines through a cynical, experienced operator's lens. Assign each: SIGNAL, DECISION TRIGGER, or KRISH'S TAKE.
PRIORITIZE stories that directly affect their industry, role, or active priorities.
DEPRIORITIZE generic AI news unless it specifically changes something for this leader.
Return JSON: [{"title": "[TAG] headline", "source": "Source"}]. Select 10-15. Skip governance, geopolitics.`,
        },
        {
          role: "user",
          content: `Today: ${today}. Pick 10-15 most relevant for this ${leaderDesc}. Rank by direct relevance to their situation.\n\n${rawTitles.map((h, i) => `${i + 1}. ${h}`).join("\n")}`,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI curation error: ${response.status}`);
  const data = await response.json();
  return parseLLMJson(data?.choices?.[0]?.message?.content || "");
}

function parseLLMJson(content: string): NewsHeadline[] {
  let cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  let parsed: unknown[];

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start !== -1 && end > start) {
      try {
        parsed = JSON.parse(cleaned.substring(start, end + 1));
      } catch {
        const lastComplete = cleaned.lastIndexOf("},");
        if (lastComplete > 0) {
          try {
            parsed = JSON.parse(
              cleaned.substring(start, lastComplete + 1) + "]"
            );
          } catch {
            throw new Error("Could not parse LLM JSON");
          }
        } else {
          throw new Error("Could not parse LLM JSON");
        }
      }
    } else {
      throw new Error("No JSON array in response");
    }
  }

  return (Array.isArray(parsed) ? parsed : [])
    .filter(
      (h: unknown): h is { title: string; source: string } =>
        typeof h === "object" &&
        h !== null &&
        "title" in h &&
        "source" in h &&
        typeof (h as Record<string, unknown>).title === "string" &&
        ((h as Record<string, unknown>).title as string).length > 15
    )
    .map((h) => ({ title: h.title, source: h.source }))
    .slice(0, 15);
}

const STATIC_FALLBACK: NewsHeadline[] = [
  { title: "[SIGNAL] Claude 4 outperforms GPT-5 on coding benchmarks, build-vs-buy math shifts again", source: "The Verge" },
  { title: "[DECISION TRIGGER] OpenAI cuts API pricing 40%, time to reevaluate your LLM vendor costs", source: "TechCrunch" },
  { title: "[KRISH'S TAKE] 80% of companies using AI does not equal 80% using it well. Most run demos, not systems", source: "Analysis" },
  { title: "[SIGNAL] AI agents now handle 60% of tier-1 support tickets at companies that deployed them", source: "Forbes" },
  { title: "[NOISE] Another AI startup raises $200M to build the future of work. Wake me when they ship", source: "TechCrunch" },
  { title: "[DECISION TRIGGER] Google drops Gemini API prices by 35%, your vendor spreadsheet needs updating", source: "Bloomberg" },
  { title: "[SIGNAL] One-person businesses generating $1M+ revenue using AI for sales, support, and fulfilment", source: "WSJ" },
  { title: "[KRISH'S TAKE] If your AI strategy is a slide deck, it is not a strategy. Ship something this week", source: "Analysis" },
];

// ── Second-Pass Curation ──────────────────────────────────────────

async function curateHeadlines(
  headlines: NewsHeadline[],
  userCtx: UserContext,
  openaiKey: string,
  briefingType: BriefingType,
  customContext?: string,
): Promise<NewsHeadline[]> {
  if (headlines.length <= 8) return headlines;

  const typeHint = briefingType !== 'default'
    ? `This is a "${briefingType}" briefing${customContext ? `: "${customContext}"` : ''}. Prioritize stories that serve this specific angle.`
    : '';

  const feedbackHint = userCtx.feedbackPreferences.preferredTags.length > 0
    ? `This leader tends to find ${userCtx.feedbackPreferences.preferredTags.join(', ')} stories most useful.${userCtx.feedbackPreferences.preferredSources.length > 0 ? ` Stories from ${userCtx.feedbackPreferences.preferredSources.join(', ')} resonate.` : ''} Lean toward these.`
    : '';

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a ruthless news editor curating for a specific leader.
${userCtx.newsProfileLine ? `NEWS PROFILE: ${userCtx.newsProfileLine}` : `Role: ${userCtx.role || 'executive'}${userCtx.industry ? `, Industry: ${userCtx.industry}` : ''}${userCtx.company ? `, Company: ${userCtx.company}` : ''}`}
Your job: cut the weak stories and keep only what would make THIS person stop what they are doing to listen. ${typeHint} ${feedbackHint}
${userCtx.recentDecisions.length > 0 ? `Decisions on their desk: ${userCtx.recentDecisions.slice(0, 2).join('; ')}. News informing these decisions is high-priority.` : ''}

Rules:
- Deduplicate similar stories (keep the strongest angle)
- Kill anything incremental ("Company X hires Y" unless Y is a massive name)
- Kill anything that is just commentary without new information
- Kill generic AI news that does not concretely affect this leader's industry or decisions
- Rank by: does this change a decision, reveal a shift, or surface a must-know number for THIS specific leader?
- Return the top 6-8, ordered by impact to this leader

Return ONLY a JSON array: [{"title": "headline", "source": "Source"}]`,
        },
        {
          role: "user",
          content: headlines.map((h, i) => `${i + 1}. ${h.title} (${h.source})`).join("\n"),
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    console.warn("Second-pass curation failed, using original headlines");
    return headlines.slice(0, 8);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return headlines.slice(0, 8);

  try {
    return parseLLMJson(content);
  } catch {
    return headlines.slice(0, 8);
  }
}

// ── News Profile Line ─────────────────────────────────────────────

async function getOrBuildNewsProfileLine(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  ctx: UserContext,
  openaiKey: string,
): Promise<string> {
  // Check for existing fresh profile line
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("user_memory")
      .select("fact_value, created_at")
      .eq("user_id", userId)
      .eq("fact_key", "news_profile_line")
      .eq("is_current", true)
      .maybeSingle();

    if (existing?.fact_value && existing.created_at > twentyFourHoursAgo) {
      console.log("Using cached news profile line");
      return existing.fact_value;
    }
  } catch (e) {
    console.warn("Failed to check existing profile line:", e);
  }

  // Build facts summary for LLM
  const bullets: string[] = [];
  if (ctx.role && ctx.role !== "executive") bullets.push(`Role: ${ctx.role}`);
  if (ctx.company) bullets.push(`Company: ${ctx.company}`);
  if (ctx.industry) bullets.push(`Industry: ${ctx.industry}`);
  if (ctx.teamSize) bullets.push(`Team size: ${ctx.teamSize}`);
  if (ctx.activeMissions.length > 0) bullets.push(`Working on: ${ctx.activeMissions.join("; ")}`);
  if (ctx.objectives.length > 0) bullets.push(`Goals: ${ctx.objectives.join("; ")}`);
  if (ctx.blockers.length > 0) bullets.push(`Challenges: ${ctx.blockers.join("; ")}`);
  if (ctx.watchingCompanies.length > 0) bullets.push(`Watching: ${ctx.watchingCompanies.join(", ")}`);
  if (ctx.recentDecisions.length > 0) bullets.push(`Decisions: ${ctx.recentDecisions.slice(0, 3).join("; ")}`);
  if (ctx.strengths.length > 0) bullets.push(`Strengths: ${ctx.strengths.join(", ")}`);

  // Not enough data to build a meaningful profile
  if (bullets.length < 2) {
    console.log("Insufficient data for news profile line");
    return "";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You build search profiles for a news curation system. Given facts about a business leader, write ONE dense sentence (max 40 words) that captures WHO they are for news relevance.

Include when available: exact role, company name and stage/size, specific industry vertical, team size, what they are actively building or working on, companies they track, key challenges.

Optimize for search relevance. Be hyper-specific. "CEO" is useless; "Series B healthtech CEO scaling AI scheduling for mid-market hospitals" drives targeted results.

Return ONLY the sentence, nothing else.`,
          },
          {
            role: "user",
            content: bullets.map(b => `- ${b}`).join("\n"),
          },
        ],
        temperature: 0.2,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.warn("Profile line generation failed:", response.status);
      return "";
    }

    const data = await response.json();
    const line = (data?.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");

    if (!line || line.length < 10) return "";

    console.log("Generated news profile line:", line);

    // Store it: mark old ones as not current, insert new
    try {
      await supabase
        .from("user_memory")
        .update({ is_current: false })
        .eq("user_id", userId)
        .eq("fact_key", "news_profile_line")
        .eq("is_current", true);

      await supabase
        .from("user_memory")
        .insert({
          user_id: userId,
          fact_key: "news_profile_line",
          fact_category: "preference",
          fact_label: "News Profile",
          fact_value: line,
          confidence_score: 0.9,
          source_type: "enrichment",
          is_current: true,
        });
    } catch (e) {
      console.warn("Failed to store profile line:", e);
    }

    return line;
  } catch (e) {
    console.warn("Profile line computation failed:", e);
    return "";
  }
}

// ── User Context ───────────────────────────────────────────────────

async function getUserContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  openaiKey: string,
): Promise<UserContext> {
  const ctx: UserContext = {
    name: "there",
    role: "executive",
    company: "",
    industry: "",
    teamSize: "",
    strengths: [],
    weaknesses: [],
    activeMissions: [],
    recentDecisions: [],
    confirmedPatterns: [],
    watchingCompanies: [],
    objectives: [],
    blockers: [],
    preferences: [],
    newsProfileLine: "",
    learningStyle: "",
    feedbackPreferences: { preferredTags: [], preferredSources: [] },
  };

  // User memory facts
  try {
    const { data: facts } = await supabase
      .from("user_memory")
      .select("fact_key, fact_value, fact_category")
      .eq("user_id", userId)
      .eq("is_current", true)
      .in("fact_category", ["identity", "business", "objective", "blocker", "preference"])
      .order("confidence_score", { ascending: false })
      .limit(40);

    if (facts) {
      for (const f of facts) {
        if (
          f.fact_key === "name" ||
          f.fact_key === "first_name" ||
          f.fact_key === "preferred_name"
        )
          ctx.name = f.fact_value;
        if (
          f.fact_key === "role" ||
          f.fact_key === "title" ||
          f.fact_key === "job_title"
        )
          ctx.role = f.fact_value;
        if (f.fact_key === "company_name" || f.fact_key === "company")
          ctx.company = f.fact_value;
        if (f.fact_key === "industry" || f.fact_key === "vertical")
          ctx.industry = f.fact_value;
        if (f.fact_key === "team_size") ctx.teamSize = f.fact_value;
        if (f.fact_category === "objective") ctx.objectives.push(f.fact_value);
        if (f.fact_category === "blocker") ctx.blockers.push(f.fact_value);
        if (f.fact_category === "preference") ctx.preferences.push(f.fact_value);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch user memory:", e);
  }

  // Edge profile
  try {
    const { data: profile } = await supabase
      .from("edge_profiles")
      .select("strengths, weaknesses")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profile) {
      ctx.strengths = (profile.strengths || [])
        .slice(0, 3)
        .map((s: { label: string }) => s.label);
      ctx.weaknesses = (profile.weaknesses || [])
        .slice(0, 3)
        .map((w: { label: string }) => w.label);
    }
  } catch (e) {
    console.warn("Failed to fetch edge profile:", e);
  }

  // Active missions
  try {
    const { data: missions } = await supabase
      .from("user_missions")
      .select("title")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(3);

    if (missions) {
      ctx.activeMissions = missions.map(
        (m: { title: string }) => m.title
      );
    }
  } catch (e) {
    console.warn("Failed to fetch missions:", e);
  }

  // Watching companies (watchlist)
  try {
    const { data: watchlist } = await supabase
      .from("user_memory")
      .select("fact_value")
      .eq("user_id", userId)
      .eq("fact_key", "watching_company")
      .eq("is_current", true);

    if (watchlist) {
      ctx.watchingCompanies = watchlist.map(
        (w: { fact_value: string }) => w.fact_value
      );
    }
  } catch (e) {
    console.warn("Failed to fetch watchlist:", e);
  }

  // Active decisions on their desk
  try {
    const { data: decisions } = await supabase
      .from("user_decisions")
      .select("decision_text")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    if (decisions) {
      ctx.recentDecisions = decisions.map(
        (d: { decision_text: string }) => d.decision_text
      );
    }
  } catch (e) {
    console.warn("Failed to fetch decisions:", e);
  }

  // Confirmed behavioral patterns and blind spots
  try {
    const { data: patterns } = await supabase
      .from("user_patterns")
      .select("pattern_type, pattern_text")
      .eq("user_id", userId)
      .in("status", ["confirmed", "emerging"])
      .gte("confidence", 0.6)
      .order("confidence", { ascending: false })
      .limit(5);

    if (patterns) {
      ctx.confirmedPatterns = patterns.map(
        (p: { pattern_type: string; pattern_text: string }) =>
          `[${p.pattern_type}] ${p.pattern_text}`
      );
    }
  } catch (e) {
    console.warn("Failed to fetch patterns:", e);
  }

  // Learning style (for cohort-specific tone)
  try {
    const { data: session } = await supabase
      .from("voice_sessions")
      .select("compass_tier")
      .eq("user_id", userId)
      .not("compass_tier", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session?.compass_tier) {
      ctx.learningStyle = session.compass_tier;
    }
  } catch (e) {
    console.warn("Failed to fetch learning style:", e);
  }

  // Feedback loop: what stories has this leader found useful?
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: feedback } = await supabase
      .from("briefing_feedback")
      .select("reaction, briefing_id")
      .gte("created_at", sevenDaysAgo)
      .eq("reaction", "useful");

    if (feedback && feedback.length > 0) {
      // Get the briefing IDs for this user's feedback
      const briefingIds = [...new Set(feedback.map((f: { briefing_id: string }) => f.briefing_id))];
      const { data: briefings } = await supabase
        .from("briefings")
        .select("id, segments")
        .eq("user_id", userId)
        .in("id", briefingIds);

      if (briefings) {
        const tagCounts: Record<string, number> = {};
        const sourceCounts: Record<string, number> = {};

        for (const b of briefings) {
          const segments = b.segments as Array<{ framework_tag: string; source: string }>;
          if (!Array.isArray(segments)) continue;
          for (const seg of segments) {
            tagCounts[seg.framework_tag] = (tagCounts[seg.framework_tag] || 0) + 1;
            sourceCounts[seg.source] = (sourceCounts[seg.source] || 0) + 1;
          }
        }

        ctx.feedbackPreferences.preferredTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag]) => tag);
        ctx.feedbackPreferences.preferredSources = Object.entries(sourceCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([source]) => source);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch feedback preferences:", e);
  }

  // Build or fetch cached news profile line
  ctx.newsProfileLine = await getOrBuildNewsProfileLine(supabase, userId, ctx, openaiKey);

  return ctx;
}

// ── Personalisation + Script Generation ────────────────────────────

function buildCohortToneDirective(learningStyle: string): string {
  switch (learningStyle.toLowerCase()) {
    case 'leading':
    case 'strategic_visionary':
      return 'This leader thinks in market maps and competitive dynamics. Lead with implications, not descriptions. "This shifts the calculus on..." works better than "This happened."';
    case 'advancing':
    case 'pragmatic_executor':
      return 'This leader wants to know what changed and what to do about it. Be concrete. "Your move: ..." or "This means your team should..." Hit the action before the analysis.';
    case 'establishing':
    case 'analytical_optimizer':
      return 'This leader responds to numbers. Lead with the data point. "40% drop", "$2B market", "3x faster". Then explain what the number means for their specific situation.';
    case 'emerging':
    case 'collaborative_builder':
      return 'This leader thinks about team and organizational impact. Frame through "this affects how your team...", "your org should watch...", "the people implication is..."';
    default:
      return 'Lead with what changed, then why it matters to them specifically.';
  }
}

function buildBriefingPurposeBlock(briefingType: BriefingType, customContext?: string): string {
  switch (briefingType) {
    case 'macro_trends':
      return 'PURPOSE: This briefing is for big-picture strategic thinking. Frame everything as: what trend is shifting, how fast, and what it means for their positioning. Think quarterly strategy review, not daily news.';
    case 'vendor_landscape':
      return 'PURPOSE: This briefing prepares the leader for vendor conversations. Frame everything as: what changed in the tool/platform landscape, pricing shifts, capability gaps closing, and build-vs-buy implications.';
    case 'competitive_intel':
      return 'PURPOSE: This briefing is competitive intelligence. Frame everything as: what did their competitors or watchlist companies do, what does it signal about market direction, and where does it create an opening or threat.';
    case 'boardroom_prep':
      return 'PURPOSE: This briefing prepares the leader for a board or executive presentation. Frame everything as: what would a board member ask about, what data points tell the story, and what is the "so what" for the business.';
    case 'team_update':
      return 'PURPOSE: This briefing is for team communication. Frame everything as: what does the team need to know, what practical tools or changes affect their work, and what should they start/stop doing.';
    case 'custom_voice':
      return customContext
        ? `PURPOSE: The leader specifically asked for: "${customContext}". Shape every story through this lens. Make every insight directly useful for their stated need.`
        : '';
    default:
      return '';
  }
}

async function generateBriefingScript(
  headlines: NewsHeadline[],
  userCtx: UserContext,
  openaiKey: string,
  briefingType: BriefingType = 'default',
  customContext?: string,
): Promise<{ segments: BriefingSegment[]; script: string }> {
  const contextBlock = [
    `Name: ${userCtx.name}`,
    userCtx.newsProfileLine ? `News profile: ${userCtx.newsProfileLine}` : null,
    `Role: ${userCtx.role}`,
    userCtx.company ? `Company: ${userCtx.company}` : null,
    userCtx.industry ? `Industry: ${userCtx.industry}` : null,
    userCtx.teamSize ? `Team size: ${userCtx.teamSize}` : null,
    userCtx.strengths.length
      ? `Strengths: ${userCtx.strengths.join(", ")}`
      : null,
    userCtx.weaknesses.length
      ? `Blind spots: ${userCtx.weaknesses.join(", ")}`
      : null,
    userCtx.activeMissions.length
      ? `Currently working on: ${userCtx.activeMissions.join("; ")}`
      : null,
    userCtx.recentDecisions.length
      ? `Active decisions on their desk: ${userCtx.recentDecisions.join("; ")}`
      : null,
    userCtx.confirmedPatterns.length
      ? `Behavioral patterns: ${userCtx.confirmedPatterns.join("; ")}`
      : null,
    userCtx.watchingCompanies.length
      ? `Companies they watch: ${userCtx.watchingCompanies.join(", ")}`
      : null,
    userCtx.objectives?.length
      ? `Strategic goals: ${userCtx.objectives.join("; ")}`
      : null,
    userCtx.blockers?.length
      ? `Challenges they face: ${userCtx.blockers.join("; ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const headlinesBlock = headlines
    .map((h, i) => `${i + 1}. ${h.title} (${h.source})`)
    .join("\n");

  const cohortDirective = buildCohortToneDirective(userCtx.learningStyle);
  const purposeBlock = buildBriefingPurposeBlock(briefingType, customContext);
  const firstName = userCtx.name.split(" ")[0];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are briefing a peer, not presenting to an audience. Think: sharp friend who read everything so they don't have to.

YOUR VOICE:
- Short sentences. Vary rhythm. One long, then two short, then a half-sentence opinion.
- Drop opinions between stories, not just at the end. "That is a bigger deal than it sounds." or "Worth watching, but not worth panicking over."
- Transitions ARE insights, not connectors. Never say "moving on to", "in other news", "additionally", "furthermore", "let's dive in", or "let's take a look at".
- The bridge between stories should be a thought: "Which brings up something related..." or just jump straight in.

${cohortDirective}

${purposeBlock}

CRITICAL RULES:
- Never mention "Mindmaker", "CTRL", or any platform/product name. You are a trusted advisor.
- Use first name only: "${firstName}". Never "as a Mindmaker user" or similar.
- No em dashes. Use commas, semicolons, or periods instead.
- No filler phrases: "it's worth noting", "interestingly", "it remains to be seen", "this is significant because"
- Show, don't tell. Instead of "This is important because...", just explain the impact directly.

YOU WILL:
1. Select 3-5 headlines (NOT 5-8) that are MOST impactful for this specific leader
2. REWRITE each headline through their lens. Not generic news. Frame from THEIR perspective:
   - Generic: "OpenAI cuts API pricing 40%"
   - For a SaaS CEO: "Your LLM costs just dropped 40%"
   - For a marketing VP: "Your AI content pipeline just got cheaper"
3. For each story, explain impact in 2-3 sentences. Reference their decisions, missions, or blind spots.
4. Apply framework nudges naturally (never name the framework):
   - "Worth pressure-testing this against..."
   - "The question is whether this changes your assumptions about..."
   - "Before your next [meeting/quarter], consider..."

OUTPUT JSON:
{
  "segments": [
    {
      "headline": "Rewritten headline, under 15 words, from THEIR perspective",
      "analysis": "2-3 sentences: specific impact on THEM + one framework nudge",
      "framework_tag": "signal|decision_trigger|krishs_take",
      "source": "Source Name",
      "relevance_reason": "One sentence: why this was selected for THIS leader"
    }
  ],
  "script": "The audio script. 500-600 words max. Structure below."
}

SCRIPT STRUCTURE (this is what they hear):
1. COLD OPEN (1 sentence, no greeting): "${firstName}, [one punchy hook]." Examples: "${firstName}, three things before your first meeting." or "${firstName}, one number to know this morning: [stat]."
2. 3-5 STORIES: Each gets 80-120 words. One sentence: what happened. Two sentences: why it changes something for THEM. One sentence: reframe or decision nudge.
3. CLOSER (1-2 sentences): "The one thing from today worth acting on: [specific action tied to their active decision or mission]."

Total: 500-600 words. 3-4 minutes spoken. Every sentence earns its place.`,
        },
        {
          role: "user",
          content: `LEADER CONTEXT:\n${contextBlock}\n\nTODAY'S HEADLINES:\n${headlinesBlock}\n\nBuild a ${briefingType === 'default' ? 'daily' : briefingType.replace(/_/g, ' ')} briefing. Select 3-5 stories. Write the script as if you are personally briefing this leader. Tight, sharp, zero filler.`,
        },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`GPT-4o error: ${response.status} ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content from GPT-4o");

  const parsed = JSON.parse(content);

  // Post-process: strip em dashes and forbidden filler
  let script = parsed.script || "";
  script = script.replace(/\u2014/g, ";").replace(/\u2013/g, "-");
  script = script.replace(/\b(Additionally|Furthermore|Moreover|Interestingly|It's worth noting|It remains to be seen)\b/gi, "");
  script = script.replace(/\s{2,}/g, " ").trim();

  return {
    segments: parsed.segments || [],
    script,
  };
}

// ── Main Handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    const braveKey = Deno.env.get("BRAVE_SEARCH_API");
    const tavilyKey = Deno.env.get("TAVILY_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Parse request body for briefing type
    let briefingType: BriefingType = 'default';
    let customContext: string | undefined;
    let voiceNoteUrl: string | undefined;

    try {
      const body = await req.json();
      if (body.briefing_type && typeof body.briefing_type === 'string') {
        briefingType = body.briefing_type as BriefingType;
      }
      if (body.custom_context && typeof body.custom_context === 'string') {
        customContext = body.custom_context;
      }
      if (body.voice_note_url && typeof body.voice_note_url === 'string') {
        voiceNoteUrl = body.voice_note_url;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    const isProOnly = PRO_ONLY_TYPES.includes(briefingType);

    // Server-side subscription check for pro-only types
    if (isProOnly) {
      const { data: sub } = await supabase
        .from("edge_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!sub) {
        return new Response(
          JSON.stringify({ error: "Edge Pro subscription required for this briefing type" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if this specific briefing type already exists today
    // (custom_voice allows multiples, others are one per day)
    if (briefingType !== 'custom_voice') {
      const { data: existing } = await supabase
        .from("briefings")
        .select("id, audio_url")
        .eq("user_id", user.id)
        .eq("briefing_date", today)
        .eq("briefing_type", briefingType)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            briefing_id: existing.id,
            already_exists: true,
            has_audio: !!existing.audio_url,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 1. Get user context
    console.log("Fetching user context...");
    const userCtx = await getUserContext(supabase, user.id, openaiKey);

    console.log("User context populated:", {
      hasName: userCtx.name !== "there",
      hasRole: userCtx.role !== "executive",
      hasCompany: !!userCtx.company,
      hasIndustry: !!userCtx.industry,
      strengths: userCtx.strengths.length,
      missions: userCtx.activeMissions.length,
      watchlist: userCtx.watchingCompanies.length,
      decisions: userCtx.recentDecisions.length,
      patterns: userCtx.confirmedPatterns.length,
      newsProfileLine: userCtx.newsProfileLine ? userCtx.newsProfileLine.substring(0, 80) : "(none)",
      learningStyle: userCtx.learningStyle,
      briefingType,
    });

    // 2. Fetch news (shaped by briefing type)
    console.log(`Fetching news for ${briefingType} briefing...`);
    let headlines: NewsHeadline[] = [];

    if (perplexityKey) {
      try {
        headlines = await fetchWithPerplexity(perplexityKey, userCtx, briefingType, customContext);
        console.log(`Perplexity: ${headlines.length} headlines`);
      } catch (e) {
        console.error("Perplexity failed:", e);
      }
    }

    if (headlines.length === 0 && tavilyKey) {
      try {
        const tavilyRaw = await fetchWithTavily(tavilyKey, userCtx);
        if (tavilyRaw.length > 0 && openaiKey) {
          headlines = await curateWithOpenAI(
            tavilyRaw.map(h => `${h.title} (${h.source})`),
            openaiKey,
            userCtx
          );
          console.log(`Tavily+OpenAI: ${headlines.length} headlines`);
        }
      } catch (e) {
        console.error("Tavily failed:", e);
      }
    }

    if (headlines.length === 0 && braveKey && openaiKey) {
      try {
        const raw = await fetchBraveNews(braveKey, userCtx);
        if (raw.length > 0) {
          headlines = await curateWithOpenAI(raw, openaiKey, userCtx);
          console.log(`Brave+OpenAI: ${headlines.length} headlines`);
        }
      } catch (e) {
        console.error("Brave+OpenAI failed:", e);
      }
    }

    if (headlines.length === 0) {
      console.log("Using static fallback");
      headlines = STATIC_FALLBACK;
    }

    // 2.5 Second-pass curation: deduplicate, rank, keep top 6-8
    console.log("Running second-pass curation...");
    headlines = await curateHeadlines(headlines, userCtx, openaiKey, briefingType, customContext);
    console.log(`After curation: ${headlines.length} headlines`);

    // 3. Generate personalised briefing
    console.log("Generating personalised briefing...");
    const { segments, script } = await generateBriefingScript(
      headlines,
      userCtx,
      openaiKey,
      briefingType,
      customContext,
    );

    if (!script || segments.length === 0) {
      throw new Error("Failed to generate briefing content");
    }

    // 4. Store briefing
    const { data: briefing, error: insertError } = await supabase
      .from("briefings")
      .insert({
        user_id: user.id,
        briefing_date: today,
        briefing_type: briefingType,
        script_text: script,
        segments,
        context_snapshot: userCtx,
        news_sources: headlines,
        generation_model: "gpt-4o",
        custom_context: customContext || null,
        voice_note_url: voiceNoteUrl || null,
        is_pro_only: isProOnly,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    console.log(`Briefing created: ${briefing.id} (type: ${briefingType})`);

    // 5. Return immediately - client triggers audio synthesis separately
    return new Response(
      JSON.stringify({
        briefing_id: briefing.id,
        already_exists: false,
        has_audio: false,
        segment_count: segments.length,
        briefing_type: briefingType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-briefing error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
