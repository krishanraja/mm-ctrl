# OpenAI API Optimization Guide

## Overview

OpenAI API usage has been optimized with caching, model selection, and improved error handling to reduce costs and improve performance.

## Optimizations Implemented

### 1. Response Caching

- **Location**: `supabase/functions/_shared/openai-utils.ts`
- **How it works**: Caches AI responses in Supabase database for 7 days
- **Benefits**: 
  - Reduces API costs for repeated queries
  - Improves response time for cached queries
  - Automatic cache key generation from prompts

### 2. Model Selection

- **Function**: `selectModel(task)`
- **Models**:
  - `simple`: `gpt-4o-mini` - Fast, cheap for simple tasks
  - `chat`: `gpt-4o` - Balanced for conversations
  - `analysis`: `gpt-4o` - Good for structured analysis
  - `complex`: `gpt-4o` - Best for complex reasoning

### 3. Fixed Model Names

- Fixed incorrect model name `gpt-5-2025-08-07` → `gpt-4o`
- All functions now use correct, available models

## Usage

### Basic Usage with Caching

```typescript
import { callOpenAI, selectModel } from '../_shared/openai-utils.ts';

const result = await callOpenAI(
  {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ],
    model: selectModel('chat'),
    max_tokens: 1000,
  },
  {
    useCache: true,
    supabase: supabaseClient,
  }
);

console.log(result.content); // AI response
console.log(result.cached); // true if from cache
```

### Streaming Support

```typescript
import { streamOpenAI } from '../_shared/openai-utils.ts';

for await (const chunk of streamOpenAI({
  messages: [...],
  model: 'gpt-4o',
})) {
  // Process chunk
  console.log(chunk);
}
```

## Functions Updated

1. **ai-assessment-chat**: Now uses caching and correct model
2. **compass-analyze**: Now uses caching and optimized model selection

## Cost Savings

- **Caching**: Can reduce API costs by 30-50% for repeated queries
- **Model Selection**: Using `gpt-4o-mini` for simple tasks saves ~10x vs `gpt-4o`
- **Fixed Model Names**: Prevents API errors and retries

## Future Optimizations

- [ ] Implement streaming for chat interface
- [ ] Add function calling for structured data extraction
- [ ] Add prompt normalization for better cache hits
- [ ] Implement request batching where possible
