import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`[g25-core-model-retention-evidence-r46] ${message}`);
};

const contract = JSON.parse(read("project-documentation/ctrl-evolution/g25-core-model-retention-evidence-r46.json"));
const llm = read("supabase/functions/decision-engine/llm.ts");
const tts = read("supabase/functions/_shared/tts.ts");
const allFunctions = [
  llm,
  tts,
  read("supabase/functions/extract-user-context/index.ts"),
  read("supabase/functions/_shared/briefing-scoring.ts"),
].join("\n");

assert(contract.retrieved_at === "2026-09-17", "official evidence retrieval date changed");
assert(Object.keys(contract.providers).length === 5, "core provider set changed");
for (const [provider, evidence] of Object.entries(contract.providers)) {
  assert(evidence.official_source.startsWith("https://"), `${provider} source is not HTTPS`);
  assert(evidence.route_standing.startsWith("blocked_"), `${provider} route standing weakened`);
  assert(evidence.repository_verification.length > 20, `${provider} repository verification missing`);
}

assert(allFunctions.includes("api.openai.com/v1/chat/completions"), "OpenAI chat endpoint disappeared");
assert(allFunctions.includes("api.openai.com/v1/embeddings"), "OpenAI embeddings endpoint disappeared");
assert(llm.includes("api.anthropic.com/v1/messages"), "Anthropic messages endpoint disappeared");
assert(llm.includes("generativelanguage.googleapis.com"), "Gemini Developer API endpoint disappeared");
assert(llm.includes("api.x.ai/v1/chat/completions"), "xAI chat endpoint disappeared");
assert(!llm.includes("x-zero-data-retention"), "xAI ZDR response verification unexpectedly appeared");
assert(tts.includes("api.elevenlabs.io/v1/text-to-speech"), "ElevenLabs TTS endpoint disappeared");
assert(!tts.includes("enable_logging"), "ElevenLabs logging control unexpectedly appeared");
assert(contract.required_before_runtime.includes("a fail-closed route when the promised privacy mode cannot be proved"),
  "fail-closed provider gate disappeared");

console.log(JSON.stringify({
  status: contract.status,
  providers: Object.keys(contract.providers),
  repository_findings: {
    openai_project_mode_receipt: false,
    anthropic_workspace_mode_receipt: false,
    google_paid_or_zdr_attestation: false,
    xai_zdr_response_header_checked: false,
    elevenlabs_enable_logging_false: false,
  },
  standing: "private Brain context remains blocked for unverified core-provider routes",
}, null, 2));
