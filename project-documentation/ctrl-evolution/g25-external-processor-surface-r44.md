# G25 external processor surface, R44

R44 makes the external-copy problem concrete without pretending that every API call sends the same data.

The Edge Function repository contains signatures for 15 provider or configurable downstream surfaces. OpenAI alone appears in 27 source files; Google AI in five; Resend in five; Stripe in six; and the remaining AI, audio, research, enrichment and webhook providers across smaller sets. These are potential transmission surfaces, not a claim that every file sends personal data on every invocation.

The live account deletion path cancels known Stripe subscriptions. It does not delete the Stripe customer. It has no deletion orchestration for AI, audio, email, search, enrichment or configured downstream providers. The repository also has no unified provider request identity or provider deletion receipt vocabulary.

## Why callsite classification matters

A public news query and a full private leadership profile have different erasure consequences even when they use the same provider. Each callsite therefore needs a declared purpose and data-class list, not merely a provider name.

For each provider, CTRL must know which contract and retention mode was in force when the request was made, whether the provider exposes request identity or deletion, and what evidence can honestly close the item. A binding zero-retention mode may mean no later deletion call is needed. That must be proved from the applicable current terms and configuration, not inferred from marketing language.

Email inboxes, downloaded packages, GitHub exports and context copied into another work tool are different again: they may be customer-controlled copies that CTRL cannot recall. The product must say that plainly.

## Next proof

The next registry needs one row per provider and callsite with purpose, data classes, correlation digest, provider request identity where available, contract mode, retention, deletion capability and evidence kind. Current official provider documentation must be verified before those fields are filled.

R44 performs no provider call, deletion request or live runtime edit.
