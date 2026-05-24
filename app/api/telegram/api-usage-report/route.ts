import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { getUtcDayRange } from '@/lib/apiUsage'
import { sendTelegramMessage } from '@/lib/telegram'

type UsageRow = {
  provider: string
  operation: string
  request_count: number | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  usage_units: number | null
  usage_unit_label: string | null
  success: boolean
  created_at: string
}

const QUOTAS: Record<string, { type: 'monthly' | 'daily' | 'none', metric: 'requests' | 'units', limit: number, label: string }> = {
  deepl: { type: 'monthly', metric: 'units', limit: 500000, label: 'caratteri' },
  gnews: { type: 'daily', metric: 'requests', limit: 100, label: 'richieste' },
  gemini: { type: 'daily', metric: 'requests', limit: 1500, label: 'richieste' },
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const daysAgo = Number(searchParams.get('daysAgo') || '1')
    const { start, end, isoDate } = getUtcDayRange(daysAgo)
    
    // Inizio del mese per calcolare i totali mensili
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))

    const supabase = createSupabaseServer()
    
    // Peschiamo tutti i log del mese corrente
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('provider, operation, request_count, input_tokens, output_tokens, total_tokens, usage_units, usage_unit_label, success, created_at')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', end.toISOString())
      .order('provider', { ascending: true })

    if (error) {
      throw error
    }

    const rows = (data || []) as UsageRow[]
    
    const dailyGrouped = new Map<string, {
      requests: number, ok: number, fail: number,
      inputTokens: number, outputTokens: number, totalTokens: number,
      usageUnits: number, usageUnitLabel: string | null,
      operations: Map<string, number>
    }>()

    const monthlyGrouped = new Map<string, {
      requests: number, totalTokens: number, usageUnits: number
    }>()

    for (const row of rows) {
      const isDailyRow = row.created_at >= start.toISOString() && row.created_at < end.toISOString()
      
      // Calcolo Mensile
      const mStats = monthlyGrouped.get(row.provider) || { requests: 0, totalTokens: 0, usageUnits: 0 }
      mStats.requests += row.request_count || 1
      mStats.totalTokens += row.total_tokens || 0
      mStats.usageUnits += row.usage_units || 0
      monthlyGrouped.set(row.provider, mStats)

      // Calcolo Giornaliero
      if (isDailyRow) {
        const current = dailyGrouped.get(row.provider) || {
          requests: 0, ok: 0, fail: 0,
          inputTokens: 0, outputTokens: 0, totalTokens: 0,
          usageUnits: 0, usageUnitLabel: row.usage_unit_label,
          operations: new Map<string, number>()
        }
  
        current.requests += row.request_count || 1
        current.ok += row.success ? 1 : 0
        current.fail += row.success ? 0 : 1
        current.inputTokens += row.input_tokens || 0
        current.outputTokens += row.output_tokens || 0
        current.totalTokens += row.total_tokens || 0
        current.usageUnits += row.usage_units || 0
        current.usageUnitLabel = current.usageUnitLabel || row.usage_unit_label
        current.operations.set(row.operation, (current.operations.get(row.operation) || 0) + (row.request_count || 1))
  
        dailyGrouped.set(row.provider, current)
      }
    }

    let msg = `🧾 <b>REPORT API CONSUMI</b>\n`
    msg += `<i>Data monitorata: ${isoDate}</i>\n\n`

    const allProviders = Array.from(new Set([...dailyGrouped.keys(), ...monthlyGrouped.keys()])).sort()

    if (allProviders.length === 0) {
      msg += `Nessun consumo API registrato.\n`
    } else {
      for (const provider of allProviders) {
        const dStats = dailyGrouped.get(provider) || { requests: 0, ok: 0, fail: 0, totalTokens: 0, usageUnits: 0, usageUnitLabel: '', operations: new Map() }
        const mStats = monthlyGrouped.get(provider) || { requests: 0, totalTokens: 0, usageUnits: 0 }
        
        msg += `🔹 <b>${provider.toUpperCase()}</b>\n`
        msg += `Oggi: <b>${dStats.requests}</b> chiamate (${dStats.ok} OK / ${dStats.fail} Errori)\n`

        if (dStats.totalTokens > 0 || mStats.totalTokens > 0) {
          msg += `Token Oggi: <b>${dStats.totalTokens}</b>\n`
          msg += `Token Mese: <b>${mStats.totalTokens}</b>\n`
        }

        if (dStats.usageUnits > 0 || mStats.usageUnits > 0) {
          const label = dStats.usageUnitLabel || QUOTAS[provider]?.label || 'unità'
          msg += `Oggi: <b>${dStats.usageUnits}</b> ${label}\n`
          if (QUOTAS[provider]?.type === 'monthly') {
             msg += `Mese: <b>${mStats.usageUnits}</b> ${label}\n`
          }
        }

        // Aggiunta contatori e limiti rimanenti
        const quota = QUOTAS[provider]
        if (quota) {
          if (quota.type === 'monthly') {
            const consumed = quota.metric === 'units' ? mStats.usageUnits : mStats.requests
            const remaining = Math.max(0, quota.limit - consumed)
            msg += `⏳ Consumo Mensile: ${consumed} / ${quota.limit}\n`
            msg += `🟢 Rimanenti: <b>${remaining}</b> ${quota.label}\n`
          } else if (quota.type === 'daily') {
            const consumed = quota.metric === 'units' ? dStats.usageUnits : dStats.requests
            const remaining = Math.max(0, quota.limit - consumed)
            msg += `⏳ Quota Giornaliera: ${consumed} / ${quota.limit}\n`
            msg += `🟢 Rimanenti: <b>${remaining}</b> ${quota.label}\n`
          }
        }

        const topOps = [...dStats.operations.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([op, c]) => `${op}: ${c}`)
          .join(' | ')

        if (topOps) msg += `Top: ${topOps}\n`

        msg += `\n`
      }
    }

    await sendTelegramMessage({
      text: msg.trim(),
      threadId: process.env.TELEGRAM_THREAD_API_CONSUMI || process.env.TELEGRAM_THREAD_REPORT,
      parseMode: 'HTML'
    })

    return NextResponse.json({
      success: true,
      date: isoDate,
      providers: allProviders.length
    })
  } catch (error) {
    console.error('Errore API Usage Report:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

