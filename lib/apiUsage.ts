import { createSupabaseServer } from '@/lib/supabaseServer'

export type ApiProvider = 'gemini' | 'gnews' | 'deepl' | 'telegram'

interface RecordApiUsageParams {
  provider: ApiProvider
  operation: string
  model?: string | null
  requestCount?: number
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  usageUnits?: number | null
  usageUnitLabel?: string | null
  success?: boolean
  statusCode?: number | null
  errorMessage?: string | null
  metadata?: Record<string, unknown> | null
}

export async function recordApiUsage(params: RecordApiUsageParams) {
  try {
    const supabase = createSupabaseServer()

    await supabase.from('api_usage_logs').insert({
      provider: params.provider,
      operation: params.operation,
      model: params.model || null,
      request_count: params.requestCount ?? 1,
      input_tokens: params.inputTokens ?? null,
      output_tokens: params.outputTokens ?? null,
      total_tokens: params.totalTokens ?? null,
      usage_units: params.usageUnits ?? null,
      usage_unit_label: params.usageUnitLabel || null,
      success: params.success ?? true,
      status_code: params.statusCode ?? null,
      error_message: params.errorMessage || null,
      metadata: params.metadata || {}
    })
  } catch (error) {
    console.error('[API Usage] Failed to record usage:', error)
  }
}

export function getUtcDayRange(daysAgo = 0) {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo + 1, 0, 0, 0, 0))

  return {
    start,
    end,
    isoDate: start.toISOString().slice(0, 10)
  }
}
