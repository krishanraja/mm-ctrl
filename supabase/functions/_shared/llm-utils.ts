/**
 * Unified LLM Utility — Multi-Provider Router with Retry, Fallback, Caching & Logging
 *
 * Replaces openai-utils.ts with a provider-agnostic interface.
 * Supports: Anthropic (Claude), OpenAI (GPT), Google (Gemini)
 *
 * Task routing:
 *   simple   → claude-haiku-4-5-20251001 (Anthropic) — fast/cheap
 *   chat     → gpt-4.1 (OpenAI) — strong conversational quality
 *   analysis → claude-sonnet-4-6 (Anthropic) — best structured JSON
 *   complex  → claude-opus-4-6 (Anthropic) — deepest reasoning
 */

import {
  hashPrompt,
  normalizePromptForCache,
  getCachedResponse,
  setCachedResponse,
} from "./ai-cache.ts";

// ─── Types ───────────────────────────────────────────────────────────

export type TaskTier = "simple" | "chat" | "analysis" | "complex";

export type Provider = "anthropic" | "openai" | "gemini";

export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  task?: TaskTier;
  /** Override the default model for this task tier */
  model?: string;
  /** Override the default provider */
  provider?: Provider;
  temperature?: number;
  max_tokens?: number;
  /** Request JSON output — instructs the model accordingly */
  json_output?: boolean;
  /** For OpenAI streaming (preserved for backward compat) */
  stream?: boolean;
  /** Legacy field — mapped to json_output internally */
  response_format?: { type: string };
}

export interface LLMCacheOptions {
  useCache?: boolean;
  cacheKey?: string;
  supabase?: any;
  cacheTtlMs?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: Provider;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cached?: boolean;
  latency_ms?: number;
}

// ─── Provider / Model Routing ────────────────────────────────────────

interface ProviderConfig {
  provider: Provider;
  model: string;
}

const TASK_ROUTING: Record<TaskTier, ProviderConfig> = {
  simple:   { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
  chat:     { provider: "openai",    model: "gpt-4.1" },
  analysis: { provider: "anthropic", model: "claude-sonnet-4-6" },
  complex:  { provider: "anthropic", model: "claude-opus-4-6" },
};

const FALLBACK_CHAINS: Record<Provider, Provider[]> = {
  anthropic: ["openai", "gemini"],
  openai:    ["anthropic", "gemini"],
  gemini:    ["anthropic", "openai"],
};

export function selectProvider(task: TaskTier): ProviderConfig {
  return TASK_ROUTING[task] || TASK_ROUTING.chat;
}

/** Backward-compat: returns just the model name */
export function selectModel(task: TaskTier | "chat" | "analysis" | "simple" | "complex"): string {
  return selectProvider(task as TaskTier).model;
}

// ─── Retry Logic ─────────────────────────────────────────────────────

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
        return response;
      }
      // Retryable status — wait and try again
      lastError = new Error(`HTTP ${response.status}`);
      if (attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`LLM API returned ${response.status}, retrying in ${backoff}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(backoff);
      } else {
        // Last attempt — return the response so caller gets the error
        return response;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`LLM API network error, retrying in ${backoff}ms (attempt ${attempt + 1}/${retries}):`, lastError.message);
        await sleep(backoff);
      }
    }
  }

  throw lastError || new Error("fetchWithRetry exhausted all retries");
}

// ─── Provider Adapters ───────────────────────────────────────────────

async function callAnthropic(
  request: LLMRequest,
  model: string,
): Promise<LLMResponse> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Separate system message from user/assistant messages
  const systemMessage = request.messages.find(m => m.role === "system");
  const nonSystemMessages = request.messages.filter(m => m.role !== "system");

  const body: Record<string, any> = {
    model,
    max_tokens: request.max_tokens ?? 2000,
    messages: nonSystemMessages.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  };

  if (systemMessage) {
    body.system = systemMessage.content;
  }

  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }

  const start = Date.now();
  const response = await fetchWithRetry(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const latency = Date.now() - start;

  const content = data.content?.[0]?.type === "text" ? data.content[0].text : "";

  return {
    content,
    model: data.model || model,
    provider: "anthropic",
    usage: data.usage ? {
      prompt_tokens: data.usage.input_tokens || 0,
      completion_tokens: data.usage.output_tokens || 0,
      total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
    } : undefined,
    latency_ms: latency,
  };
}

async function callOpenAIProvider(
  request: LLMRequest,
  model: string,
): Promise<LLMResponse> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const jsonOutput = request.json_output || request.response_format?.type === "json_object";

  const body: Record<string, any> = {
    model,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.max_tokens ?? 2000,
  };

  if (jsonOutput) {
    body.response_format = { type: "json_object" };
  }

  const start = Date.now();
  const response = await fetchWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const latency = Date.now() - start;

  return {
    content: data.choices?.[0]?.message?.content || "",
    model: data.model || model,
    provider: "openai",
    usage: data.usage ? {
      prompt_tokens: data.usage.prompt_tokens || 0,
      completion_tokens: data.usage.completion_tokens || 0,
      total_tokens: data.usage.total_tokens || 0,
    } : undefined,
    latency_ms: latency,
  };
}

async function callGemini(
  request: LLMRequest,
  model: string,
): Promise<LLMResponse> {
  // Try Gemini API key first, then Vertex AI service account
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (geminiApiKey) {
    return callGeminiDirect(request, model, geminiApiKey);
  }

  throw new Error("GEMINI_API_KEY not configured");
}

async function callGeminiDirect(
  request: LLMRequest,
  _model: string,
  apiKey: string,
): Promise<LLMResponse> {
  const geminiModel = "gemini-2.0-flash-exp";

  // Combine system + user messages for Gemini
  const systemMsg = request.messages.find(m => m.role === "system");
  const userMsgs = request.messages.filter(m => m.role !== "system");
  const combinedText = [
    systemMsg?.content,
    ...userMsgs.map(m => m.content),
  ].filter(Boolean).join("\n\n");

  const jsonOutput = request.json_output || request.response_format?.type === "json_object";

  const start = Date.now();
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedText }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.max_tokens ?? 2000,
          ...(jsonOutput && { responseMimeType: "application/json" }),
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const latency = Date.now() - start;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    content,
    model: geminiModel,
    provider: "gemini",
    latency_ms: latency,
  };
}

// ─── Provider Dispatcher ─────────────────────────────────────────────

const PROVIDER_CALLERS: Record<Provider, (req: LLMRequest, model: string) => Promise<LLMResponse>> = {
  anthropic: callAnthropic,
  openai: callOpenAIProvider,
  gemini: callGemini,
};

function getModelForProvider(provider: Provider): string {
  // Default models per provider for fallback
  const defaults: Record<Provider, string> = {
    anthropic: "claude-sonnet-4-6",
    openai: "gpt-4.1",
    gemini: "gemini-2.0-flash-exp",
  };
  return defaults[provider];
}

// ─── LLM Call Logging ────────────────────────────────────────────────

async function logLLMCall(
  supabase: any,
  params: {
    function_name?: string;
    model: string;
    provider: Provider;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    latency_ms?: number;
    cached: boolean;
    error?: string;
    user_id?: string;
  },
): Promise<void> {
  if (!supabase) return;

  try {
    // Estimate cost (rough per-model pricing in USD per 1K tokens)
    const costPer1KInput: Record<string, number> = {
      "claude-haiku-4-5-20251001": 0.0008,
      "claude-sonnet-4-6": 0.003,
      "claude-opus-4-6": 0.015,
      "gpt-4.1": 0.002,
      "gpt-4o": 0.0025,
      "gpt-4o-mini": 0.00015,
      "gemini-2.0-flash-exp": 0.0001,
    };
    const costPer1KOutput: Record<string, number> = {
      "claude-haiku-4-5-20251001": 0.004,
      "claude-sonnet-4-6": 0.015,
      "claude-opus-4-6": 0.075,
      "gpt-4.1": 0.008,
      "gpt-4o": 0.01,
      "gpt-4o-mini": 0.0006,
      "gemini-2.0-flash-exp": 0.0004,
    };

    const inputCost = ((params.prompt_tokens || 0) / 1000) * (costPer1KInput[params.model] || 0.003);
    const outputCost = ((params.completion_tokens || 0) / 1000) * (costPer1KOutput[params.model] || 0.015);

    await supabase.from("llm_call_log").insert({
      function_name: params.function_name || "unknown",
      model: params.model,
      provider: params.provider,
      prompt_tokens: params.prompt_tokens || null,
      completion_tokens: params.completion_tokens || null,
      total_tokens: params.total_tokens || null,
      latency_ms: params.latency_ms || null,
      cached: params.cached,
      error: params.error || null,
      user_id: params.user_id || null,
      estimated_cost_usd: inputCost + outputCost,
    });
  } catch (err) {
    // Non-blocking — logging failure should never break the request
    console.warn("LLM call logging failed:", err);
  }
}

// ─── Main API ────────────────────────────────────────────────────────

export interface CallLLMOptions extends LLMCacheOptions {
  /** Name of the calling edge function — used for logging */
  functionName?: string;
  /** User ID — used for logging */
  userId?: string;
  /** Skip the fallback chain — only try primary provider */
  skipFallback?: boolean;
}

/**
 * Call an LLM with automatic provider routing, retry, fallback, caching, and logging.
 */
export async function callLLM(
  request: LLMRequest,
  options: CallLLMOptions = {},
): Promise<LLMResponse> {
  const {
    useCache = false,
    supabase,
    cacheTtlMs = 24 * 60 * 60 * 1000,
    functionName,
    userId,
    skipFallback = false,
  } = options;

  // Resolve provider + model
  const task = request.task || "chat";
  const routing = request.provider && request.model
    ? { provider: request.provider, model: request.model }
    : request.model
      ? { provider: TASK_ROUTING[task].provider, model: request.model }
      : selectProvider(task);

  const primaryProvider = routing.provider;
  const primaryModel = routing.model;

  // Map legacy response_format to json_output
  if (request.response_format?.type === "json_object" && !request.json_output) {
    request.json_output = true;
  }

  // ─── Cache Check ───
  if (useCache && supabase) {
    try {
      const normalized = normalizePromptForCache(
        request.messages.map(m => `${m.role}:${m.content}`).join("|"),
      );
      const promptHash = hashPrompt(normalized);
      const cached = await getCachedResponse(supabase, promptHash, primaryModel, cacheTtlMs);
      if (cached) {
        console.log(`✅ Cache hit [${functionName || "unknown"}]`);
        // Log cache hit
        logLLMCall(supabase, {
          function_name: functionName,
          model: primaryModel,
          provider: primaryProvider,
          cached: true,
          user_id: userId,
        });
        return {
          content: typeof cached === "string" ? cached : JSON.stringify(cached),
          model: primaryModel,
          provider: primaryProvider,
          cached: true,
        };
      }
    } catch (err) {
      console.warn("Cache lookup failed:", err);
    }
  }

  // ─── Build Provider Chain ───
  const providerChain: Array<{ provider: Provider; model: string }> = [
    { provider: primaryProvider, model: primaryModel },
  ];

  if (!skipFallback) {
    const fallbacks = FALLBACK_CHAINS[primaryProvider] || [];
    for (const fb of fallbacks) {
      providerChain.push({ provider: fb, model: getModelForProvider(fb) });
    }
  }

  // ─── Try Each Provider ───
  let lastError: Error | null = null;

  for (const { provider, model } of providerChain) {
    try {
      const caller = PROVIDER_CALLERS[provider];
      if (!caller) continue;

      const result = await caller(request, model);

      // ─── Cache Store ───
      if (useCache && supabase && result.content) {
        try {
          const normalized = normalizePromptForCache(
            request.messages.map(m => `${m.role}:${m.content}`).join("|"),
          );
          const promptHash = hashPrompt(normalized);
          await setCachedResponse(supabase, promptHash, model, result.content, cacheTtlMs);
        } catch (err) {
          console.warn("Cache store failed:", err);
        }
      }

      // ─── Log Success ───
      logLLMCall(supabase, {
        function_name: functionName,
        model: result.model,
        provider: result.provider,
        prompt_tokens: result.usage?.prompt_tokens,
        completion_tokens: result.usage?.completion_tokens,
        total_tokens: result.usage?.total_tokens,
        latency_ms: result.latency_ms,
        cached: false,
        user_id: userId,
      });

      if (provider !== primaryProvider) {
        console.log(`[LLM-FALLBACK] ${primaryProvider} failed, succeeded with ${provider}`);
      }

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[LLM] ${provider}/${model} failed:`, lastError.message);

      // Log failure
      logLLMCall(supabase, {
        function_name: functionName,
        model,
        provider,
        cached: false,
        error: lastError.message,
        user_id: userId,
      });
    }
  }

  throw lastError || new Error("All LLM providers failed");
}

// ─── Backward-Compatible Wrapper ─────────────────────────────────────

/** Drop-in replacement for the old callOpenAI function */
export async function callOpenAI(
  request: {
    messages: Array<{ role: string; content: string }>;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    response_format?: { type: string };
  },
  options: {
    useCache?: boolean;
    cacheKey?: string;
    supabase?: any;
  } = {},
): Promise<{
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  cached?: boolean;
}> {
  const result = await callLLM(
    {
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      json_output: request.response_format?.type === "json_object",
      stream: request.stream,
    },
    {
      useCache: options.useCache,
      cacheKey: options.cacheKey,
      supabase: options.supabase,
    },
  );

  return {
    content: result.content,
    model: result.model,
    usage: result.usage,
    cached: result.cached,
  };
}

// ─── Streaming (OpenAI only, preserved for backward compat) ──────────

export async function* streamOpenAI(
  request: LLMRequest,
  options: { model?: string } = {},
): AsyncGenerator<string, void, unknown> {
  const model = options.model || request.model || selectModel("chat");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI streaming error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices[0]?.delta?.content;
          if (delta) yield delta;
        } catch (_) {
          // Skip invalid JSON
        }
      }
    }
  }
}
