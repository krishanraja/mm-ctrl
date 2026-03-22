/**
 * Embeddings Utility
 *
 * Generates text embeddings using OpenAI's text-embedding-3-small model.
 * Used for semantic memory retrieval (pgvector) in the Memory Web.
 *
 * Cost: ~$0.02 per 1M tokens — negligible for fact-level embeddings.
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  embedding: number[];
  tokens_used: number;
}

/**
 * Generate an embedding for a single text string.
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const results = await generateEmbeddings([text]);
  return results[0];
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * More efficient than calling one at a time.
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured (needed for embeddings)");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embeddings API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return data.data.map((item: { embedding: number[]; index: number }) => ({
    embedding: item.embedding,
    tokens_used: data.usage?.total_tokens || 0,
  }));
}

/**
 * Generate an embedding for a user_memory fact.
 * Combines category + label + value for richer semantic representation.
 */
export function buildFactEmbeddingText(fact: {
  fact_category: string;
  fact_label: string;
  fact_value: string;
}): string {
  return `${fact.fact_category}: ${fact.fact_label} = ${fact.fact_value}`;
}

/**
 * Store an embedding in the user_memory table for a given fact ID.
 */
export async function storeFactEmbedding(
  supabase: any,
  factId: string,
  embedding: number[],
): Promise<void> {
  const { error } = await supabase
    .from("user_memory")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", factId);

  if (error) {
    console.warn(`Failed to store embedding for fact ${factId}:`, error);
  }
}

/**
 * Generate and store embeddings for one or more facts.
 * Intended to be called after fact creation/update.
 */
export async function embedFacts(
  supabase: any,
  facts: Array<{ id: string; fact_category: string; fact_label: string; fact_value: string }>,
): Promise<number> {
  if (facts.length === 0) return 0;

  try {
    const texts = facts.map(buildFactEmbeddingText);
    const results = await generateEmbeddings(texts);

    let stored = 0;
    for (let i = 0; i < facts.length; i++) {
      await storeFactEmbedding(supabase, facts[i].id, results[i].embedding);
      stored++;
    }

    console.log(`✅ Embedded ${stored} facts`);
    return stored;
  } catch (err) {
    console.warn("Embedding generation failed (non-blocking):", err);
    return 0;
  }
}

/**
 * Perform semantic search on user memory using an embedding.
 */
export async function searchMemoryByEmbedding(
  supabase: any,
  userId: string,
  queryText: string,
  matchCount = 10,
  minSimilarity = 0.5,
): Promise<Array<{
  id: string;
  fact_category: string;
  fact_label: string;
  fact_value: string;
  temperature: string;
  confidence_score: number;
  similarity: number;
}>> {
  try {
    const { embedding } = await generateEmbedding(queryText);

    const { data, error } = await supabase.rpc("match_user_memory", {
      query_embedding: JSON.stringify(embedding),
      match_count: matchCount,
      user_uuid: userId,
      min_similarity: minSimilarity,
    });

    if (error) {
      console.warn("Semantic memory search error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn("Semantic memory search failed:", err);
    return [];
  }
}
