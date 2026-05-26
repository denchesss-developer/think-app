import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { sendTelegramMessage, getErrorMessage, getTelegramConfig } from '@/lib/telegram'

function calcVar(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? '+100%' : '0%'
  const perc = Math.round(((curr - prev) / prev) * 100)
  return perc >= 0 ? `+${perc}%` : `${perc}%`
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PERIOD_CONFIG = {
  settimana: { label: 'SETTIMANALE', days: 7, prevDays: 14, emoji: '🗓' },
  mese: { label: 'MENSILE', days: 30, prevDays: 60, emoji: '📅' },
  trimestre: { label: 'TRIMESTRALE', days: 90, prevDays: 180, emoji: '📊' },
  semestre: { label: 'SEMESTRALE', days: 180, prevDays: 360, emoji: '📈' }
} as const

type Periodo = keyof typeof PERIOD_CONFIG

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const periodoRaw = searchParams.get('periodo')
    if (!periodoRaw || !(periodoRaw in PERIOD_CONFIG)) {
      return NextResponse.json({ error: 'Periodo non valido' }, { status: 400 })
    }
    const periodo = periodoRaw as Periodo
    const cfg = PERIOD_CONFIG[periodo]

    const supabaseAdmin = createSupabaseServer()
    getTelegramConfig()

    const now = new Date()
    const startDate = new Date(now.getTime() - cfg.days * 86400000)
    const prevStartDate = new Date(now.getTime() - cfg.prevDays * 86400000)

    const startIso = startDate.toISOString()
    const prevStartIso = prevStartDate.toISOString()

    const getCount = async (table: string, gteDate: string | null, ltDate: string | null) => {
      let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
      if (gteDate) query = query.gte('created_at', gteDate)
      if (ltDate) query = query.lt('created_at', ltDate)
      const { count } = await query
      return count || 0
    }

    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    let totalUsersCount = 0
    let nuoviUtentiPeriodo = 0
    let nuoviUtentiPrev = 0

    if (!usersError && users) {
      totalUsersCount = users.length
      nuoviUtentiPeriodo = users.filter(u => new Date(u.created_at) >= startDate).length
      nuoviUtentiPrev = users.filter(u => new Date(u.created_at) >= prevStartDate && new Date(u.created_at) < startDate).length
    }

    const chatsTotali = await getCount('chats', null, null)
    const chatsPeriodo = await getCount('chats', startIso, null)
    const chatsPrev = await getCount('chats', prevStartIso, startIso)

    const rispPeriodo = await getCount('risposte', startIso, null)
    const rispPrev = await getCount('risposte', prevStartIso, startIso)

    const bookPeriodo = await getCount('bookmarks', startIso, null)
    const bookPrev = await getCount('bookmarks', prevStartIso, startIso)

    const segnPeriodo = await getCount('segnalazioni', startIso, null)
    const segnPrev = await getCount('segnalazioni', prevStartIso, startIso)

    const engagementNow = chatsPeriodo > 0 ? (rispPeriodo / chatsPeriodo).toFixed(1) : '0'
    const engagementPrev = chatsPrev > 0 ? (rispPrev / chatsPrev).toFixed(1) : '0'

    const { data: regionData } = await supabaseAdmin
      .from('chats')
      .select('regione')
      .gte('created_at', startIso)

    let regioneTop = '—'
    if (regionData && regionData.length > 0) {
      const regionCount: Record<string, number> = {}
      regionData.forEach((r: { regione: string | null }) => {
        if (r.regione) regionCount[r.regione] = (regionCount[r.regione] || 0) + 1
      })
      regioneTop = Object.entries(regionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    }

    const { data: orePosts } = await supabaseAdmin
      .from('risposte')
      .select('created_at')
      .gte('created_at', startIso)

    let oraPunta = '—'
    if (orePosts && orePosts.length > 0) {
      const oreCount: Record<number, number> = {}
      orePosts.forEach((r: { created_at: string }) => {
        const h = new Date(r.created_at).getHours()
        oreCount[h] = (oreCount[h] || 0) + 1
      })
      const topHour = Number(Object.entries(oreCount).sort((a, b) => b[1] - a[1])[0]?.[0])
      oraPunta = `${topHour}:00 – ${topHour + 1}:00`
    }

    const { data: topChat } = await supabaseAdmin
      .from('chats')
      .select('titolo, risposte_count')
      .gte('created_at', startIso)
      .order('risposte_count', { ascending: false })
      .limit(1)
      .single<{ titolo: string; risposte_count: number | null }>()

    const pensieroMVP = topChat
      ? `"${topChat.titolo.slice(0, 60)}${topChat.titolo.length > 60 ? '...' : ''}" (${topChat.risposte_count || 0} risposte)`
      : '—'

    const varUtenti = calcVar(nuoviUtentiPeriodo, nuoviUtentiPrev)
    const varChats = calcVar(chatsPeriodo, chatsPrev)
    const varRisp = calcVar(rispPeriodo, rispPrev)
    const varBook = calcVar(bookPeriodo, bookPrev)
    const varSegn = calcVar(segnPeriodo, segnPrev)
    const varEngagement = calcVar(Number(engagementNow), Number(engagementPrev))

    const rangeLabel = `${fmtDate(startDate)} — ${fmtDate(now)}`

    let msg = `${cfg.emoji} <b>REPORT ${cfg.label} — THINK APP</b>\n`
    msg += `<i>📆 Periodo: ${rangeLabel}</i>\n\n`
    msg += `👥 <b>UTENTI REGISTRATI:</b> ${totalUsersCount} totali\n`
    msg += `↳ <i>Nuovi questo periodo:</i> <b>${nuoviUtentiPeriodo}</b> (<i>${varUtenti}</i> rispetto al precedente)\n\n`
    msg += `💭 <b>PENSIERI CREATI:</b> ${chatsPeriodo} (Tot. in DB: ${chatsTotali})\n`
    msg += `↳ <i>Variazione creazione:</i> <b>${varChats}</b>\n\n`
    msg += `💬 <b>INTERAZIONI (Commenti):</b> ${rispPeriodo}\n`
    msg += `↳ <i>Variazione interazioni:</i> <b>${varRisp}</b>\n\n`
    msg += `📊 <b>ENGAGEMENT:</b> ~${engagementNow} risposte per pensiero\n`
    msg += `↳ <i>Variazione engagement:</i> <b>${varEngagement}</b>\n\n`
    msg += `💾 <b>PENSIERI SALVATI:</b> ${bookPeriodo}\n`
    msg += `↳ <i>Interesse generale:</i> <b>${varBook}</b>\n\n`
    msg += `🚩 <b>SEGNALAZIONI RICEVUTE:</b> ${segnPeriodo}\n`
    msg += `↳ <i>Variazione segnalazioni:</i> <b>${varSegn}</b>\n\n`
    msg += `🌍 <b>REGIONE PIÙ ATTIVA:</b> ${regioneTop}\n\n`
    msg += `🌙 <b>ORA DI PUNTA:</b> ${oraPunta} (fascia oraria più vivace)\n\n`
    msg += `🏆 <b>PENSIERO MVP:</b>\n<i>${pensieroMVP}</i>\n`
    msg += `\n<i>Continuiamo a spingere su questa rotta! 🚀</i>`

    await sendTelegramMessage({
      text: msg,
      threadId: process.env.TELEGRAM_THREAD_REPORT
    })

    return NextResponse.json({ success: true, report: 'Inviato' })
  } catch (error: unknown) {
    console.error('Errore Report API:', getErrorMessage(error))
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
