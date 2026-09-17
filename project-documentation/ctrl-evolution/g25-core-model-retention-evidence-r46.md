# G25 core model retention evidence R46

## Decision

The five core generative and audio providers remain blocked for new private-Brain runtime until their actual retention mode is evidenced. Public documentation says what each provider can offer. It does not prove what the Mindmaker account, project, workspace or individual request is using.

## Current evidence

| Provider | Current official default or option | What the repository proves | Standing |
| --- | --- | --- | --- |
| OpenAI | Chat Completions and embeddings are not used for training by default, have default abuse-monitoring retention and can be eligible for approved ZDR controls | Endpoint use is visible; project retention mode is not | blocked |
| Anthropic | API inputs and outputs are deleted within 30 days by default, with stated exceptions; contracted ZDR can differ | Messages endpoint use is visible; workspace mode is not | blocked |
| Gemini Developer API | Paid Services are not used to improve products, but limited logging and feature-specific retention remain; UK clients must use Paid Services | API-key route is visible; paid status and retention mode are not | blocked |
| xAI | Default 30-day retention; team-level ZDR is available and exposed in a response header | The caller does not check or preserve that header | blocked |
| ElevenLabs | TTS retains by default; eligible Enterprise calls can request ZRM using `enable_logging=false` | The current request omits the control | blocked |

## Product consequence

The product should never tell a leader that information is private merely because it was removed from the Mindmaker database. The receipt must cover the outbound request too. If the system promises a privacy mode, it must prove the account setting or request flag and fail closed when it cannot.

This creates a better experience, not a more technical one. The customer can see one calm statement such as "used only for this briefing" because the hidden machinery knows the provider, data classes, retention mode and eventual expiry evidence.

## Official sources retrieved 17 September 2026

- [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint)
- [Anthropic commercial and API retention](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)
- [Gemini Developer API zero-data-retention guidance](https://ai.google.dev/gemini-api/docs/zdr)
- [xAI API security and ZDR](https://docs.x.ai/developers/faq/security)
- [ElevenLabs Zero Retention Mode](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode)

## Limits

This is technical product evidence, not legal advice. Account consoles, contracts, DPAs and runtime response headers still need to be inspected before use. No provider was called and no routing was changed.
