import { describe, expect, it, vi } from 'vitest'
import { createSupabaseStandardReviewInvoker } from './supabaseInvoker'

describe('createSupabaseStandardReviewInvoker', () => {
  it('passes a successful function response through unchanged', async () => {
    const response = { action: 'prepare', result: { state: 'ready' } }
    const invoke = vi.fn().mockResolvedValue({ data: response, error: null })
    const adapter = createSupabaseStandardReviewInvoker({ functions: { invoke } })

    await expect(adapter.invoke('review-standard-change-v2', {
      body: { action: 'prepare' },
    })).resolves.toEqual({ data: response, error: null })
  })

  it('preserves a hosted 409 as a state conflict', async () => {
    const context = new Response(JSON.stringify({ error: 'state_conflict' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    })
    const adapter = createSupabaseStandardReviewInvoker({
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Edge Function returned a non-2xx status code', context },
        }),
      },
    })

    await expect(adapter.invoke('review-standard-change-v2', {
      body: { action: 'decide' },
    })).resolves.toEqual({
      data: null,
      error: { message: 'state_conflict', code: 'state_conflict' },
    })
  })

  it('keeps an ordinary transport failure distinct', async () => {
    const adapter = createSupabaseStandardReviewInvoker({
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to send a request to the Edge Function' },
        }),
      },
    })

    await expect(adapter.invoke('review-standard-change-v2', {
      body: { action: 'prepare' },
    })).resolves.toEqual({
      data: null,
      error: { message: 'Failed to send a request to the Edge Function' },
    })
  })
})
