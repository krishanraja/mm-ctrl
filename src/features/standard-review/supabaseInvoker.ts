import type { StandardReviewFunctionInvoker } from './gateway'

interface SupabaseFunctionErrorLike {
  message?: string
  context?: unknown
}

interface SupabaseFunctionsLike {
  functions: {
    invoke(
      functionName: string,
      options: { body: Record<string, unknown> },
    ): Promise<{ data: unknown; error: unknown }>
  }
}

interface ErrorContextLike {
  status?: number
  clone?: () => ErrorContextLike
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}

function errorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('error' in body)) return undefined
  const value = (body as { error?: unknown }).error
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'code' in value) {
    const code = (value as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

async function readErrorContext(error: SupabaseFunctionErrorLike): Promise<{
  status?: number
  code?: string
}> {
  const context = error.context as ErrorContextLike | undefined
  if (!context) return {}

  const readable = typeof context.clone === 'function' ? context.clone() : context
  let body: unknown
  try {
    if (typeof readable.json === 'function') body = await readable.json()
    else if (typeof readable.text === 'function') {
      const raw = await readable.text()
      body = raw ? JSON.parse(raw) : undefined
    }
  } catch {
    body = undefined
  }
  return { status: context.status, code: errorCode(body) }
}

export function createSupabaseStandardReviewInvoker(
  client: SupabaseFunctionsLike,
): StandardReviewFunctionInvoker {
  return {
    async invoke(functionName, options) {
      const { data, error } = await client.functions.invoke(functionName, options)
      if (!error) return { data, error: null }

      const functionError = error as SupabaseFunctionErrorLike
      const context = await readErrorContext(functionError)
      const code = context.status === 409 || context.code === 'state_conflict'
        ? 'state_conflict'
        : context.code
      return {
        data: null,
        error: {
          message: code ?? functionError.message ?? 'function_invocation_failed',
          ...(code ? { code } : {}),
        },
      }
    },
  }
}
