-- TTS Quality Monitoring tables for Artificial Analysis API integration
-- Stores daily TTS model quality snapshots and configurable TTS provider settings

CREATE TABLE IF NOT EXISTS tts_quality_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  provider_rankings JSONB NOT NULL,
  current_provider TEXT NOT NULL DEFAULT 'elevenlabs',
  current_elo INTEGER,
  top_provider TEXT,
  top_elo INTEGER,
  alert_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tts_snapshots_date ON tts_quality_snapshots(snapshot_date DESC);

CREATE TABLE IF NOT EXISTS tts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'elevenlabs',
  model_id TEXT NOT NULL DEFAULT 'eleven_multilingual_v2',
  voice_id TEXT NOT NULL DEFAULT '7ApmIXLoWa0cKUtJqfHc',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default ElevenLabs config
INSERT INTO tts_config (provider, model_id, voice_id)
SELECT 'elevenlabs', 'eleven_multilingual_v2', '7ApmIXLoWa0cKUtJqfHc'
WHERE NOT EXISTS (SELECT 1 FROM tts_config LIMIT 1);
