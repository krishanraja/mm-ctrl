-- Enable pgvector extension for semantic memory retrieval
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to user_memory
ALTER TABLE public.user_memory ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create IVFFlat index for fast similarity search
-- Note: lists=100 is appropriate for up to ~100K rows. Adjust if dataset grows significantly.
CREATE INDEX IF NOT EXISTS idx_user_memory_embedding
  ON public.user_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RPC function for semantic memory search
CREATE OR REPLACE FUNCTION match_user_memory(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  user_uuid uuid DEFAULT NULL,
  min_similarity float DEFAULT 0.5
)
RETURNS TABLE(
  id uuid,
  fact_category text,
  fact_label text,
  fact_value text,
  temperature text,
  confidence_score float,
  similarity float
)
AS $$
  SELECT
    um.id,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.temperature,
    um.confidence_score::float,
    1 - (um.embedding <=> query_embedding) as similarity
  FROM public.user_memory um
  WHERE
    um.user_id = user_uuid
    AND um.is_current = true
    AND um.archived_at IS NULL
    AND um.embedding IS NOT NULL
    AND (1 - (um.embedding <=> query_embedding)) >= min_similarity
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
