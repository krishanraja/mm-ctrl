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
  watchingCompanies: string[];
}

interface BriefingSegment {
  headline: string;
  analysis: string;
  framework_tag: string;
  source: string;
  relevance_reason: string;
}

// ── News Fetching ──────────────────────────────────────────────────

const PERPLEXITY_SYSTEM_PROMPT = `You are an AI news curator for busy executives. Search for today's most important AI and business news.

For each headline, assign ONE category:
SIGNAL: Actually matters for business leaders. Real impact, real decisions.
NOISE: Hype to ignore. Include 1-2 to show you're filtering.
DECISION TRIGGER: Something changed that requires action or a decision.
KRISH'S TAKE: Sharp, slightly cynical opinion/analysis.

Focus on: model releases, pricing changes, deployment stories, tool launches, competitive moves.
Skip: governance fluff, workforce surveys, geopolitics, AGI speculation, celebrity AI, funding rounds (unless major).

Format each as: "[CATEGORY] headline text"
8-18 words per headline. Present tense. Specific.

Return ONLY a JSON array of 12-15 items:
[{"title": "[SIGNAL] headline here", "source": "Publication Name"}]`;

async function fetchWithPerplexity(apiKey: string, watchingCompanies: string[] = []): Promise<NewsHeadline[]> {
  const today = new Date().toISOString().split("T")[0];
  const watchExtra = watchingCompanies.length > 0
    ? ` Also specifically search for recent news about: ${watchingCompanies.join(", ")}.`
    : "";
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: PERPLEXITY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Search for the most important AI and business news from the past 7 days (today is ${today}). Find 12-15 headlines a business leader would care about. Curate with [SIGNAL], [NOISE], [DECISION TRIGGER], and [KRISH'S TAKE] tags.${watchExtra}`,
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

async function fetchBraveNews(apiKey: string): Promise<string[]> {
  const queries = [
    '"AI" AND ("pricing" OR "API" OR "launch" OR "release")',
    '"AI" AND ("enterprise" OR "business" OR "CEO" OR "CTO")',
    '"AI agent" OR "AI workflow" OR "AI automation"',
    '"GPT" OR "Claude" OR "Gemini" OR "Llama"',
    '"AI" AND ("deploy" OR "production" OR "ROI" OR "cost")',
  ];

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
  apiKey: string
): Promise<NewsHeadline[]> {
  const today = new Date().toISOString().split("T")[0];
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
          content: `You are an AI news curator. Rewrite raw headlines through a cynical, experienced operator's lens. Assign each: SIGNAL, NOISE, DECISION TRIGGER, or KRISH'S TAKE. Return JSON: [{"title": "[TAG] headline", "source": "Source"}]. Select 10-15. Skip governance, geopolitics.`,
        },
        {
          role: "user",
          content: `Today: ${today}. Pick 10-15 most relevant for a business leader.\n\n${rawTitles.map((h, i) => `${i + 1}. ${h}`).join("\n")}`,
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
  { title: "[KRISH'S TAKE] 80% of companies using AI does not equal 80% using it well. Most run demos, not systems", source: "Mindmaker" },
  { title: "[SIGNAL] AI agents now handle 60% of tier-1 support tickets at companies that deployed them", source: "Forbes" },
  { title: "[NOISE] Another AI startup raises $200M to build the future of work. Wake me when they ship", source: "TechCrunch" },
  { title: "[DECISION TRIGGER] Google drops Gemini API prices by 35%, your vendor spreadsheet needs updating", source: "Bloomberg" },
  { title: "[SIGNAL] One-person businesses generating $1M+ revenue using AI for sales, support, and fulfilment", source: "WSJ" },
  { title: "[KRISH'S TAKE] If your AI strategy is a slide deck, it is not a strategy. Ship something this week", source: "Mindmaker" },
];

// ── User Context ───────────────────────────────────────────────────

async function getUserContext(
  supabase: ReturnType<typeof createClient>,
  userId: string
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
    watchingCompanies: [],
  };

  // User memory facts
  try {
    const { data: facts } = await supabase
      .from("user_memory")
      .select("fact_key, fact_value")
      .eq("user_id", userId)
      .eq("is_current", true)
      .in("fact_category", ["identity", "business"])
      .order("confidence_score", { ascending: false })
      .limit(20);

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

  return ctx;
}

// ── Personalisation + Script Generation ────────────────────────────

async function generateBriefingScript(
  headlines: NewsHeadline[],
  userCtx: UserContext,
  openaiKey: string
): Promise<{ segments: BriefingSegment[]; script: string }> {
  const contextBlock = [
    `Name: ${userCtx.name}`,
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
    userCtx.watchingCompanies.length
      ? `Companies they are watching closely (prioritise news about these): ${userCtx.watchingCompanies.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const headlinesBlock = headlines
    .map((h, i) => `${i + 1}. ${h.title} (${h.source})`)
    .join("\n");

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
          content: `You are a sharp, knowledgeable AI advisor creating a personalised daily news briefing for a business leader. Your tone is conversational, warm but direct. Like a trusted friend who works in AI every day.

You will:
1. Select 5-8 headlines from the list that are MOST relevant to this specific leader's context
2. For each, explain WHY it matters to them specifically (not generic "this is important")
3. Apply framework nudges naturally:
   - "Worth pressure-testing this against..." (dialectical tension)
   - "The question is whether this changes your assumptions about..." (first-principles)
   - "Before your next [meeting/quarter/decision], consider..." (mental contrasting)
   Never name frameworks explicitly. Just apply the thinking.
4. Generate a conversational briefing script they'll hear as audio

Output JSON:
{
  "segments": [
    {
      "headline": "Clean headline without [TAG]",
      "analysis": "2-4 sentences: why this matters to THEM + framework nudge",
      "framework_tag": "signal|noise|decision_trigger|krishs_take",
      "source": "Source Name",
      "relevance_reason": "One sentence: why selected for this leader"
    }
  ],
  "script": "The full audio script, conversational, ~800 words, 3-5 min spoken. Start with 'Good morning, [name].' End with a single actionable takeaway."
}`,
        },
        {
          role: "user",
          content: `LEADER CONTEXT:\n${contextBlock}\n\nTODAY'S HEADLINES:\n${headlinesBlock}\n\nGenerate a personalised briefing. Select 5-8 most relevant headlines. Write the script as if you're personally briefing this leader over coffee.`,
        },
      ],
      temperature: 0.4,
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
  return {
    segments: parsed.segments || [],
    script: parsed.script || "",
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

    const today = new Date().toISOString().split("T")[0];

    // Check if briefing already exists today
    const { data: existing } = await supabase
      .from("briefings")
      .select("id, audio_url")
      .eq("user_id", user.id)
      .eq("briefing_date", today)
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

    // 1. Get user context
    console.log("Fetching user context...");
    const userCtx = await getUserContext(supabase, user.id);

    // 2. Fetch news
    console.log("Fetching news...");
    let headlines: NewsHeadline[] = [];

    if (perplexityKey) {
      try {
        headlines = await fetchWithPerplexity(perplexityKey, userCtx.watchingCompanies);
        console.log(`Perplexity: ${headlines.length} headlines`);
      } catch (e) {
        console.error("Perplexity failed:", e);
      }
    }

    if (headlines.length === 0 && braveKey && openaiKey) {
      try {
        const raw = await fetchBraveNews(braveKey);
        if (raw.length > 0) {
          headlines = await curateWithOpenAI(raw, openaiKey);
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

    // 3. Generate personalised briefing
    console.log("Generating personalised briefing...");
    const { segments, script } = await generateBriefingScript(
      headlines,
      userCtx,
      openaiKey
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
        script_text: script,
        segments,
        context_snapshot: userCtx,
        news_sources: headlines,
        generation_model: "gpt-4o",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    console.log(`Briefing created: ${briefing.id}`);

    // 5. Trigger audio synthesis (awaited so client gets audio URL)
    let audioUrl: string | null = null;
    let audioDuration: number | null = null;
    try {
      const synthUrl = `${supabaseUrl}/functions/v1/synthesize-briefing`;
      const synthResp = await fetch(synthUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ briefing_id: briefing.id }),
      });
      if (synthResp.ok) {
        const synthData = await synthResp.json();
        audioUrl = synthData.audio_url || null;
        audioDuration = synthData.duration_seconds || null;
        console.log("Audio synthesized:", audioUrl ? "OK" : "no URL");
      } else {
        console.error("Synthesis returned:", synthResp.status);
      }
    } catch (e) {
      console.warn("Could not synthesize audio:", e);
    }

    return new Response(
      JSON.stringify({
        briefing_id: briefing.id,
        already_exists: false,
        has_audio: !!audioUrl,
        audio_url: audioUrl,
        audio_duration_seconds: audioDuration,
        segment_count: segments.length,
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
