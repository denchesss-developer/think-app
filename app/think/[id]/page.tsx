import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env'
import { JsonLd, debateSchema, breadcrumbSchema } from '@/components/seo/JsonLd'
import { DebateRedirect } from '@/components/seo/DebateRedirect'

const BASE_URL = 'https://thethink.space'

export const revalidate = 300 // ISR: ricarica ogni 5 minuti

// Client pubblico (anon key) — le chats non hanno RLS abilitato
function createPublicClient() {
  return createClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  )
}

interface Chat {
  id: number
  titolo: string | null
  autore: string | null
  regione: string | null
  risposte_count: number
  ultima_attivita: string | null
  created_at: string
  tipo: 'utente' | 'domanda_notizia' | 'domanda_trending'
  blog_slug: string | null
  categoria: string | null
  country_code: string | null
}

interface Risposta {
  id: number
  testo: string | null
  autore: string | null
  regione: string | null
  created_at: string
  parent_id: number | null
}

interface Props {
  params: Promise<{ id: string }>
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'adesso'
  if (mins < 60) return `${mins}m fa`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}g fa`
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function tipoLabel(tipo: string) {
  switch (tipo) {
    case 'domanda_notizia': return { label: 'News', color: 'text-blue-600 bg-blue-50 border-blue-200' }
    case 'domanda_trending': return { label: 'Trending', color: 'text-purple-600 bg-purple-50 border-purple-200' }
    default: return { label: 'Community', color: 'text-amber-600 bg-amber-50 border-amber-200' }
  }
}

function getFlagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  const codePoints = countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const chatId = parseInt(id, 10)
  if (isNaN(chatId)) return { title: 'Think — Pensiero non trovato' }

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('chats')
    .select('id, titolo, autore, regione, risposte_count, tipo, created_at')
    .eq('id', chatId)
    .single()

  if (!data) return { title: 'Think — Pensiero non trovato' }

  const titolo = data.titolo || `Pensiero #${chatId}`
  const description = `${data.risposte_count || 0} opinioni dal mondo su: "${titolo}". Partecipa al dibattito su Think, la mappa globale 3D delle opinioni.`
  const canonicalUrl = `${BASE_URL}/think/${chatId}`
  const ogImage = `${BASE_URL}/api/og/thought?title=${encodeURIComponent(titolo)}&author=${encodeURIComponent(data.autore || 'Thinker')}&responses=${data.risposte_count || 0}`

  return {
    title: `${titolo} — Think`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: titolo,
      description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'Think',
      publishedTime: new Date(data.created_at).toISOString(),
      images: [{ url: ogImage, width: 1200, height: 630, alt: titolo }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titolo,
      description,
      images: [ogImage],
    },
  }
}

export default async function ThinkPage({ params }: Props) {
  const { id } = await params
  const chatId = parseInt(id, 10)
  if (isNaN(chatId)) notFound()

  const supabase = createPublicClient()

  const { data: chatData, error } = await supabase
    .from('chats')
    .select('id, titolo, autore, regione, risposte_count, ultima_attivita, created_at, tipo, blog_slug, categoria, country_code')
    .eq('id', chatId)
    .not('titolo', 'is', null)
    .single()

  if (error || !chatData) notFound()

  const chat = chatData as Chat

  const { data: risposteData } = await supabase
    .from('risposte')
    .select('id, testo, autore, regione, created_at, parent_id')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(100)

  const risposte: Risposta[] = risposteData || []
  const titolo = chat.titolo || `Pensiero #${chatId}`
  const { label: tipoTag, color: tipoColor } = tipoLabel(chat.tipo || 'utente')
  const canonicalUrl = `${BASE_URL}/think/${chatId}`

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-amber-100 selection:text-amber-900">

      {/* Deep-link: per utenti reali → apre l'app sul pensiero */}
      <DebateRedirect chatId={chat.id} />

      {/* Structured Data */}
      <JsonLd data={debateSchema({
        id: chat.id,
        titolo,
        autore: chat.autore || 'Thinker',
        regione: chat.regione,
        createdAt: chat.created_at,
        risposteCount: chat.risposte_count || 0,
        risposte: risposte.map(r => ({
          testo: r.testo || '',
          autore: r.autore || 'Thinker',
          regione: r.regione,
          createdAt: r.created_at,
        })),
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Think', url: BASE_URL },
        { name: titolo, url: canonicalUrl },
      ])} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-zinc-900 hover:opacity-70 transition-opacity">
            Think.
          </Link>
          <Link
            href={`/?news_id=${chat.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            🌍 Apri nel Globo
          </Link>
        </div>
      </header>

      {/* Main */}
      <article className="max-w-3xl mx-auto px-6 pt-12 pb-8">

        {/* Badges */}
        <div className="flex items-center flex-wrap gap-2 mb-6">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${tipoColor}`}>
            {tipoTag}
          </span>
          {chat.regione && (
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              {getFlagEmoji(chat.country_code)} {chat.regione}
            </span>
          )}
          {chat.categoria && (
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded-full">
              {chat.categoria}
            </span>
          )}
        </div>

        {/* Titolo */}
        <h1 className="text-4xl sm:text-5xl font-black leading-[1.15] mb-6 text-zinc-900 tracking-tight">
          {titolo}
        </h1>

        {/* Meta */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-10">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-black text-[10px]">
              {(chat.autore || 'T')[0].toUpperCase()}
            </span>
            {chat.autore || 'Thinker'}
          </span>
          <span>·</span>
          <time dateTime={chat.created_at}>{timeAgo(chat.created_at)}</time>
          <span>·</span>
          <span className="text-amber-600">{chat.risposte_count || 0} opinioni</span>
          {chat.blog_slug && (
            <>
              <span>·</span>
              <Link href={`/blog/${chat.blog_slug}`} className="text-blue-500 hover:text-blue-700 transition-colors">
                Articolo correlato →
              </Link>
            </>
          )}
        </div>

        <div className="border-t border-zinc-100 mb-10" />

        {/* Risposte */}
        <section>
          <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-zinc-900 tracking-tight">
            💬 Opinioni dal Mondo
            <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold text-zinc-500">
              {risposte.length}
            </span>
          </h2>

          {risposte.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 border border-zinc-100 rounded-3xl bg-zinc-50/50">
              <p className="text-lg font-medium mb-1">Nessuna opinione ancora</p>
              <p className="text-sm">Sii il primo a condividere il tuo punto di vista.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {risposte.map((r) => (
                <div
                  key={r.id}
                  className={`flex gap-4 p-5 rounded-2xl border ${
                    r.parent_id ? 'bg-zinc-50 border-zinc-100 ml-8' : 'bg-white border-zinc-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center flex-shrink-0 border border-amber-200">
                    <span className="text-xs font-black text-amber-800">
                      {(r.autore || 'T')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-zinc-900">{r.autore || 'Thinker'}</span>
                      {r.regione && (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                          {getFlagEmoji(null)} {r.regione}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-zinc-300 ml-auto">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-[15px] text-zinc-700 leading-relaxed">{r.testo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-10 text-center">
          <h3 className="text-2xl font-black mb-2 text-zinc-900 tracking-tight">
            Hai un&apos;opinione?
          </h3>
          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
            Condividi il tuo punto di vista sul globo 3D interattivo. Sarai geo-localizzato sulla mappa mondiale.
          </p>
          <Link
            href={`/?news_id=${chat.id}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 text-white font-bold hover:bg-zinc-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-zinc-900/10"
          >
            🌍 Apri il Globo e Rispondi
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

      <footer className="max-w-3xl mx-auto px-6 pb-12 text-center text-xs text-zinc-300 font-bold uppercase tracking-widest">
        <Link href="/blog" className="hover:text-zinc-500 transition-colors mr-6">Blog</Link>
        <Link href="/privacy-policy" className="hover:text-zinc-500 transition-colors mr-6">Privacy</Link>
        <Link href="/" className="hover:text-zinc-500 transition-colors">Think. · thethink.space</Link>
      </footer>
    </div>
  )
}
