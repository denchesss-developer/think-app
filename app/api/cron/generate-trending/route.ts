import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { recordApiUsage } from '@/lib/apiUsage'
import { callGeminiText, extractJsonObject, isWeakDebateQuestion } from '@/lib/gemini'

/**
 * Cron Job: Genera "Trending Questions" da Google Trends RSS + Gemini AI
 *
 * Flusso per ogni paese supportato:
 * 1. Fetch Google Trends RSS (geo=IT/US/FR/ES/DE) — nessuna API key richiesta
 * 2. Parsing XML → top 5 trending terms
 * 3. Per ogni term → Gemini genera domanda aperta nella lingua locale + categoria
 * 4. Insert in `chats` con tipo='domanda_trending', country_code, categoria
 *
 * Schedulazione: ogni 12 ore (vercel.json)
 * Sicurezza: protetto dal CRON_SECRET header
 */

const CRON_SECRET = process.env.CRON_SECRET

// ─── Paesi supportati ─────────────────────────────────────────────────────────
const PAESI = [
  { code: 'IT', lingua: 'italiano',         langLabel: 'Italian'  },
  { code: 'US', lingua: 'american english', langLabel: 'English'  },
  { code: 'FR', lingua: 'français',         langLabel: 'French'   },
  { code: 'ES', lingua: 'español',          langLabel: 'Spanish'  },
  { code: 'DE', lingua: 'Deutsch',          langLabel: 'German'   },
]

// ─── Coordinate di fallback per paese ────────────────────────────────────────
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  IT: { lat: 41.9028, lng: 12.4964, city: 'Roma' },
  US: { lat: 38.9072, lng: -77.0369, city: 'Washington D.C.' },
  FR: { lat: 48.8566, lng: 2.3522, city: 'Paris' },
  ES: { lat: 40.4168, lng: -3.7038, city: 'Madrid' },
  DE: { lat: 52.5200, lng: 13.4050, city: 'Berlino' },
}

// ─── Fetch Google Trends RSS ──────────────────────────────────────────────────
async function fetchTrendingTerms(countryCode: string): Promise<string[]> {
  const url = `https://trends.google.com/trending/rss?geo=${countryCode}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ThinkApp/1.0)' },
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      console.warn(`[Trending] Trends RSS ${countryCode} error: ${res.status}`)
      return []
    }

    const xml = await res.text()

    // Parsing XML manuale — estrae contenuto dei tag <title> dentro gli <item>
    // Gestisce sia <title>Terme</title> che <title><![CDATA[Terme]]></title>
    const titleMatches = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
    const terms = titleMatches
      .map(m => m[1]?.trim())
      .filter(Boolean)
      .slice(0, 5) // Massimo 5 trending per paese

    await recordApiUsage({
      provider: 'gnews',
      operation: `google_trends_rss_${countryCode.toLowerCase()}`,
      usageUnits: terms.length,
      usageUnitLabel: 'trend_terms'
    })
    console.log(`[Trending] ${countryCode}: trovati ${terms.length} trending terms`)
    return terms
  } catch (err) {
    console.error(`[Trending] Fetch RSS ${countryCode} failed:`, err)
    return []
  }
}

// ─── Genera domanda con Gemini ────────────────────────────────────────────────
interface TrendingResult {
  domanda: string
  categoria: string
  luogo: string
  lat: number
  lng: number
  tag: string
}

async function processWithGemini(
  term: string,
  countryCode: string,
  lingua: string
): Promise<TrendingResult | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null
  }

  const fallback = COUNTRY_COORDS[countryCode] || COUNTRY_COORDS['IT']

  const prompt = `You are the lead question writer for Think, a viral global debate platform where millions of people share opinions on a 3D world map. Your job is to write ONE electrifying debate question that makes people STOP scrolling and feel compelled to answer.

The trending search term is: "${term}" (trending in ${countryCode})

Generate ONLY valid JSON — no markdown, no code blocks, no extra text:
{
  "domanda": "The debate question in ${lingua}, max 120 characters",
  "categoria": "ONE of: sport|economia|politica|tech|ambiente|salute|cultura|intrattenimento|mondo",
  "luogo": "Most relevant city or region for this trend (in ${lingua})",
  "lat": ${fallback.lat},
  "lng": ${fallback.lng},
  "tag": "${term}"
}

━━━ STEP 1: CLASSIFY THE TREND ━━━
- TRAGEDY/DEATH → EMPATHY archetype (mandatory, no exceptions)
- POLITICS/ELECTIONS/LAW → PARADOX or DILEMMA archetype
- ECONOMY/MARKETS/LAYOFFS → POWER or TENSION archetype
- TECH/AI/INNOVATION → FUTURE or REVERSAL archetype
- SPORT → VERDICT or COMPARISON archetype
- CULTURE/SOCIETY/GENDER → IMPACT or PROVOCATION archetype
- CELEBRITY/ENTERTAINMENT → REVEAL or COMPARISON archetype
- ENVIRONMENT/CLIMATE → RESPONSIBILITY or FUTURE archetype

━━━ STEP 2: APPLY THE ARCHETYPE ━━━
Pick ONE and use SPECIFIC details from the trend (names, numbers, places — never generic):

[EMPATHY]       "If you were [specific person/role in this situation], what would you do first?"
[PARADOX]       "How can [specific element A] and [specific element B] coexist in [specific context]?"
[DILEMMA]       "[Concrete option A] or [concrete option B] — which would YOU choose, and why does it matter?"
[POWER]         "Who is really winning from [specific dynamic of this trend] — and at whose expense?"
[TENSION]       "Is [specific actor] protecting us or controlling us with [specific action]?"
[FUTURE]        "In 5 years, will [key element] be seen as visionary or catastrophic?"
[REVERSAL]      "What if [expected outcome] turns out to be the opposite of what everyone thinks?"
[VERDICT]       "Was [specific decision/action] the right call — or a historic mistake?"
[COMPARISON]    "[Approach A] vs [Approach B]: which actually delivers [specific desired result]?"
[IMPACT]        "Has [trend topic] changed how YOU [specific everyday behavior or belief]?"
[PROVOCATION]   "Is [widespread assumption about trend] actually wrong — or just convenient?"
[RESPONSIBILITY] "Who should be held accountable for [specific consequence of the trend]?"
[REVEAL]        "What does [person/company/institution]'s reaction to [trend] really tell us about them?"

━━━ ANTI-SIMILARITY RULES (CRITICAL) ━━━
- NEVER start with: "Cosa pensi", "Sei d'accordo", "Ti piace", "What do you think", "Do you agree"
- NEVER use vague words: "importante", "interessante", "significativo", "grande", "importante"
- NEVER ask a yes/no question — force a choice or a perspective
- NEVER write a question similar to these overused formats:
  ✗ "Come ti senti riguardo a [X]?"
  ✗ "È giusto o sbagliato [X]?"  
  ✗ "Qual è la tua opinione su [X]?"
- EVERY question must be UNIQUE in structure from typical trending questions

━━━ GREAT QUESTION EXAMPLES (calibrate your output here) ━━━
✓ "Se dovessi scegliere tra salvare l'economia o il clima, cosa sacrificheresti davvero?"
✓ "Chi protegge davvero i lavoratori Amazon: il sindacato, lo Stato, o nessuno dei due?"
✓ "L'IA sostituirà i medici entro il 2030 — speranza o incubo?"
✓ "Elon Musk: visionario o pericolo pubblico? Non esiste risposta di mezzo."
✓ "Se fossi il sindaco di [città colpita], quale sarebbe il tuo primo provvedimento?"

━━━ FINAL RULES ━━━
- Write in ${lingua}
- Max 120 characters (count them!)
- For tragedies: zero controversy, pure human empathy
- Use "tu" / second person to create direct emotional connection
- Include a SPECIFIC detail from "${term}" — not a generic version of the topic
- The question must feel URGENT, like something that matters TODAY

IMPORTANT: lat/lng must be real float coordinates for the most relevant location for this trend.`

  try {
    const { text } = await callGeminiText({
      prompt,
      operation: 'generate_trending_question',
      temperature: 0.85,
      topP: 0.92,
      maxOutputTokens: 700
    })
    const parsed = extractJsonObject<TrendingResult>(text)
    if (!parsed.domanda || !parsed.categoria) {
      return null
    }

    if (isWeakDebateQuestion(parsed.domanda)) {
      const retry = await callGeminiText({
        prompt: `The following debate question for the trending term "${term}" is too weak or generic. Rewrite it to be electrifying and unique.

WEAK QUESTION:
${parsed.domanda}

Return ONLY valid JSON:
{
  "domanda": "rewritten question in ${lingua}, max 120 characters",
  "categoria": "sport|economia|politica|tech|ambiente|salute|cultura|intrattenimento|mondo"
}

RULES FOR THE REWRITE:
- Pick a completely DIFFERENT structure/archetype than the weak version
- Include a SPECIFIC element from "${term}" (name, number, place)
- NEVER start with "Cosa pensi", "Sei d'accordo", "What do you think", "Do you agree"
- Force a real choice, comparison, verdict, or provocative angle
- For tragedies: pure empathy, zero controversy
- The question must feel urgent and personal — use "tu"
- Max 120 characters`,
        operation: 'regenerate_trending_question',
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 220
      })
      const improved = extractJsonObject<Pick<TrendingResult, 'domanda' | 'categoria'>>(retry.text)
      if (improved.domanda) parsed.domanda = improved.domanda
      if (improved.categoria) parsed.categoria = improved.categoria
    }

    return parsed
  } catch (err) {
    console.error(`[Trending] Gemini error for "${term}":`, err)
    return null
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Opzione: ?country=IT per forzare un singolo paese (comodo per test)
  const url = new URL(req.url)
  const forceCountry = url.searchParams.get('country')?.toUpperCase()
  const paesiDaProcessare = forceCountry
    ? PAESI.filter(p => p.code === forceCountry)
    : PAESI

  const supabase = createSupabaseServer()
  const results: string[] = []
  let totalCreated = 0

  for (const paese of paesiDaProcessare) {
    console.log(`[Trending] Elaboro paese: ${paese.code}`)

    const terms = await fetchTrendingTerms(paese.code)

    if (terms.length === 0) {
      results.push(`⚠️ ${paese.code}: nessun trending trovato`)
      continue
    }

    // Processa max 3 trending term per paese per non saturare Gemini
    const termsDaProcessare = terms.slice(0, 3)

    for (const term of termsDaProcessare) {
      try {
        const fallback = COUNTRY_COORDS[paese.code] || COUNTRY_COORDS['IT']

        let geminiData = await processWithGemini(term, paese.code, paese.lingua)

        if (!geminiData) {
          // Fallback minimo se Gemini fallisce
          const isTragico = term.toLowerCase().includes('mort') || term.toLowerCase().includes('ferit') || term.toLowerCase().includes('incident')
          const questionText = isTragico 
              ? `Una triste notizia in tendenza per "${term}". Quali sono le tue riflessioni?`
              : `Trend del momento: "${term}"! Aperti i commenti, dite la vostra.`

          geminiData = {
            domanda: questionText,
            categoria: 'mondo',
            luogo: fallback.city,
            lat: fallback.lat + (Math.random() - 0.5) * 2,
            lng: fallback.lng + (Math.random() - 0.5) * 2,
            tag: term
          }
        }

        // Controlla duplicati: se esiste già un trending con lo stesso tag+paese nelle ultime 24h non lo reinserisce
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: existing } = await supabase
          .from('chats')
          .select('id')
          .eq('tipo', 'domanda_trending')
          .eq('country_code', paese.code)
          .eq('news_id', `trending_${term.toLowerCase().replace(/\s/g, '_')}`)
          .gte('created_at', twentyFourHoursAgo)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`[Trending] Skip duplicato: "${term}" (${paese.code})`)
          results.push(`⏭️ ${paese.code}: skip duplicato "${term.substring(0, 30)}"`)
          continue
        }

        const { error: insertError } = await supabase
          .from('chats')
          .insert({
            titolo: geminiData.domanda,
            lat: geminiData.lat,
            lng: geminiData.lng,
            regione: geminiData.luogo,
            lat_originale: geminiData.lat,
            lng_originale: geminiData.lng,
            regione_originale: geminiData.luogo,
            km_viaggiati: 0,
            risposte_count: 0,
            autore: 'Think Trends',
            user_id: null,
            ultima_attivita: new Date().toISOString(),
            tipo: 'domanda_trending',
            country_code: paese.code,
            categoria: geminiData.categoria || 'mondo',
            // Usiamo news_id come identificatore univoco del term per dedup
            news_id: `trending_${term.toLowerCase().replace(/\s/g, '_')}`,
            blog_slug: null
          })

        if (insertError) {
          console.error(`[Trending] Insert error (${paese.code}):`, insertError)
          results.push(`❌ ${paese.code}: errore insert "${term.substring(0, 30)}"`)
          continue
        }

        totalCreated++
        results.push(`✅ ${paese.code} [${geminiData.categoria}]: "${geminiData.domanda.substring(0, 50)}..."`)

        // Piccolo delay per non martellare Gemini
        await new Promise(r => setTimeout(r, 800))

      } catch (err) {
        console.error(`[Trending] Error processing term "${term}":`, err)
        results.push(`❌ ${paese.code}: eccezione su "${term.substring(0, 30)}"`)
      }
    }

    // Delay tra un paese e l'altro
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`[Trending] Completato: ${totalCreated} domande create`)

  return NextResponse.json({
    success: true,
    totalCreated,
    results,
    timestamp: new Date().toISOString()
  })
}

// Permette trigger manuale via POST
export const POST = GET
