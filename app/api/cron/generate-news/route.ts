import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { recordApiUsage } from '@/lib/apiUsage'
import { callGeminiText, extractJsonObject, isWeakDebateQuestion } from '@/lib/gemini'

/**
 * Cron Job: Genera notizie/domande quotidiane usando GNews + Gemini API
 * 
 * Flusso:
 * 1. Chiama GNews API per scaricare notizie di tendenza
 * 2. Per ogni notizia, chiama Gemini per generare: articolo SEO, domanda breve, coordinate
 * 3. Inserisce in `news_articles` e in `chats` (come Pin Domanda sul globo)
 * 4. Crea notifiche per tutti gli utenti registrati
 * 
 * Sicurezza: protetto dal CRON_SECRET header
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GNEWS_API_KEY = process.env.GNEWS_API_KEY
const CRON_SECRET = process.env.CRON_SECRET

interface GNewsArticle {
  title: string
  description: string
  content: string
  url: string
  image?: string
  publishedAt: string
  source: { name: string; url: string }
}

interface GeminiResult {
  titolo_seo: string
  articolo_completo: string
  domanda_breve: string
  luogo: string
  lat: number
  lng: number
  slug: string
  categoria: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

async function fetchNewsFromGNews(): Promise<GNewsArticle[]> {
  if (!GNEWS_API_KEY) {
    console.warn('[Cron] GNEWS_API_KEY non configurata, uso notizie di fallback')
    return []
  }

  const url = `https://gnews.io/api/v4/top-headlines?lang=it&country=it&max=5&apikey=${GNEWS_API_KEY}`
  
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) {
    const errorText = await res.text()
    await recordApiUsage({
      provider: 'gnews',
      operation: 'top_headlines_it',
      success: false,
      statusCode: res.status,
      errorMessage: errorText.slice(0, 500)
    })
    console.error('[Cron] GNews API error:', res.status, errorText)
    return []
  }

  const data = await res.json()
  await recordApiUsage({
    provider: 'gnews',
    operation: 'top_headlines_it',
    usageUnits: Array.isArray(data.articles) ? data.articles.length : 0,
    usageUnitLabel: 'articles_returned'
  })
  return data.articles || []
}

async function processWithGemini(article: GNewsArticle): Promise<GeminiResult | null> {
  if (!GEMINI_API_KEY) {
    console.warn('[Cron] GEMINI_API_KEY non configurata')
    return null
  }

  const prompt = `Sei un editor senior di Think, piattaforma italiana di dibattito civile.
Analizza questa notizia e rispondi SOLO con JSON valido (nessun testo extra, nessun markdown, nessun blocco di codice).

NOTIZIA:
Titolo: ${article.title}
Descrizione: ${article.description}
Contenuto: ${article.content || article.description}
Fonte: ${article.source.name}

Genera UN JSON con esattamente questi campi:
{
  "titolo_seo": "Titolo SEO in italiano, max 80 caratteri, non clickbait",
  "articolo_completo": "Editoriale italiano: 3 brevi paragrafi (max 180 parole totali) separati da doppio a-capo. Solo testo piano senza markdown. Struttura: 1) fatto, 2) contesto, 3) implicazione.",
  "domanda_breve": "Domanda in italiano, max 120 caratteri",
  "luogo": "Città o paese principale in italiano",
  "lat": 0.0,
  "lng": 0.0,
  "slug": "slug-url-unico-lowercase",
  "categoria": "una sola parola tra: sport|economia|politica|tech|ambiente|salute|cultura|intrattenimento|mondo"
}

COME COSTRUIRE LA DOMANDA:

Passo 1 - Classifica la notizia:
- TRAGEDIA/MORTE/INCIDENTE → usa SOLO archetipo EMPATIA
- POLITICA/LEGGE/ISTITUZIONE → archetipo PARADOSSO o SCELTA
- ECONOMIA/LAVORO/MERCATI → archetipo TENSIONE o IMPATTO
- TECH/AI/INNOVAZIONE → archetipo FUTURO o PARADOSSO
- SPORT → archetipo CONFRONTO o OPINIONE
- CULTURA/SOCIETÀ/COSTUME → archetipo IMPATTO o CONFRONTO
- CRONACA/GOSSIP → archetipo CONFRONTO o TENSIONE

Passo 2 - Usa UNO di questi archetipi, adattandolo agli elementi SPECIFICI della notizia:

[EMPATIA] → "Se ti trovassi nella situazione di [persona/gruppo nella notizia], come reagiresti?"
[PARADOSSO] → "Come mai [elemento A della notizia] e [elemento B] sembrano andare nella direzione opposta?"
[SCELTA] → "Tra [opzione concreta A] e [opzione concreta B], quale rispetta meglio [valore specifico]?"
[TENSIONE] → "Chi trae davvero vantaggio da [dinamica specifica della notizia]?"
[IMPATTO] → "Hai già vissuto qualcosa di simile a [scenario della notizia]? Come l'hai affrontato?"
[FUTURO] → "Tra 10 anni, [elemento chiave della notizia] sarà ricordato come un errore o una svolta?"
[OPINIONE] → "Cosa cambieresti tu in [decisione/azione della notizia] se potessi?"
[CONFRONTO] → "[Approccio A] vs [Approccio B]: quale funziona davvero meglio per [obiettivo specifico]?"

REGOLE ASSOLUTE:
- MAI iniziare con: "Cosa ne pensi", "Sei d'accordo", "Ti piace", "Pensi che"
- MAI essere generici: cita elementi SPECIFICI della notizia (nomi, luoghi, numeri, eventi)
- Per le tragedie: zero polemiche, domanda umana e rispettosa
- Usa il "tu" per creare connessione diretta con l'utente
- Max 120 caratteri inclusi spazi

IMPORTANTE: lat e lng = coordinate geografiche reali (float) del luogo della notizia. Il slug deve essere unico, basato sul titolo, senza caratteri speciali.`

  try {
    const geminiRes = await callGeminiText({
      prompt,
      operation: 'generate_news_article',
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 3000
    })
    const parsed = extractJsonObject<GeminiResult>(geminiRes.text)

    if (isWeakDebateQuestion(parsed.domanda_breve || '')) {
      const retryPrompt = `La domanda generata era troppo generica o debole.

Notizia:
Titolo: ${article.title}
Descrizione: ${article.description}

Domanda precedente:
${parsed.domanda_breve}

Rigenera SOLO un JSON valido con questi campi:
{
  "domanda_breve": "domanda migliorata, concreta, specifica, max 120 caratteri",
  "categoria": "sport|economia|politica|tech|ambiente|salute|cultura|intrattenimento|mondo"
}

Regole:
- MAI USARE "Cosa ne pensi" o formule simili.
- La domanda non deve MAI essere cinica se si tratta di notizie tragiche, incidenti o fatti di sangue. In quei casi sii empatico e chiedi riflessioni costruttive.
- Cerca di estrarre un elemento di discussione sano e maturo.
- Deve essere specifica a questa notizia, non generica.`

      const retry = await callGeminiText({
        prompt: retryPrompt,
        operation: 'regenerate_news_question',
        temperature: 0.35,
        topP: 0.7,
        maxOutputTokens: 300
      })
      const improved = extractJsonObject<Pick<GeminiResult, 'domanda_breve' | 'categoria'>>(retry.text)
      if (improved.domanda_breve) parsed.domanda_breve = improved.domanda_breve
      if (improved.categoria) parsed.categoria = improved.categoria
    }

    if (!parsed.titolo_seo || !parsed.articolo_completo || !parsed.domanda_breve) {
      console.error('[Cron] Gemini JSON mancante di campi obbligatori')
      return null
    }
    return parsed
  } catch (e) {
    console.error('[Cron] JSON parse error:', e)
    return null
  }
}

async function createNotificationsForAllUsers(supabase: ReturnType<typeof createSupabaseServer>, chatId: number, domanda: string, lat: number, lng: number) {
  // Fetch all registered users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1000)

  if (!profiles || profiles.length === 0) return

  const notifications = profiles.map((p: { id: string }) => ({
    user_id: p.id,
    type: 'news_question',
    content: { text: `New blog post pinned: ${domanda.substring(0, 80)}${domanda.length > 80 ? '...' : ''}` },
    thought_id: chatId,
    latitude: lat,
    longitude: lng,
    is_read: false
  }))

  // Insert in batches of 100
  for (let i = 0; i < notifications.length; i += 100) {
    await supabase.from('notifications').insert(notifications.slice(i, i + 100))
  }
  
  console.log(`[Cron] Create ${notifications.length} notifiche`)
}

export async function GET(req: NextRequest) {
  // Security check
  const authHeader = req.headers.get('Authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServer()
  const results: string[] = []
  let articlesCreated = 0

  try {
    // Step A: Fetch news
    const newsArticles = await fetchNewsFromGNews()

    if (newsArticles.length === 0) {
      // Use fallback demo article if no API key or API fails
      console.log('[Cron] Using fallback demo article')
      const demoArticle = {
        title: 'Il futuro dell\'intelligenza artificiale e il suo impatto sul lavoro',
        description: 'Gli esperti si dividono sull\'impatto dell\'AI sul mercato del lavoro nei prossimi anni.',
        content: 'Il dibattito sull\'intelligenza artificiale continua a crescere mentre sempre più aziende adottano queste tecnologie nelle loro operazioni quotidiane.',
        url: 'https://example.com/articolo-demo',
        publishedAt: new Date().toISOString(),
        source: { name: 'Think Demo', url: 'https://thethink.space' }
      }
      newsArticles.push(demoArticle)
    }

    // Process max 3 articles per run to stay within free tier limits
    const articlesToProcess = newsArticles.slice(0, 3)

    for (const newsItem of articlesToProcess) {
      try {
        // Step B: Process with Gemini
        let geminiData: GeminiResult | null = await processWithGemini(newsItem)
        
        // If Gemini fails, create a basic fallback
        if (!geminiData) {
          const baseSlug = slugify(newsItem.title) + '-' + Date.now()
          // Rendo il fallback molto più naturale e meno ripetitivo
          const isTragico = newsItem.title.toLowerCase().includes('mort') || newsItem.title.toLowerCase().includes('ferit') || newsItem.title.toLowerCase().includes('incident')
          const questionText = isTragico 
              ? `Una notizia che lascia senza parole: "${newsItem.title.substring(0, 68)}". Che riflessioni ti suscita?`
              : `Aperti i commenti su questa vicenda: "${newsItem.title.substring(0, 68)}...". Dite la vostra!`

          geminiData = {
            titolo_seo: newsItem.title.substring(0, 80),
            articolo_completo: `${newsItem.description || newsItem.title}\n\n${newsItem.content || 'Contenuto non disponibile.'}\n\nFonte: ${newsItem.source.name}`,
            domanda_breve: questionText,
            luogo: 'Italia',
            lat: 41.9028 + (Math.random() - 0.5) * 20,
            lng: 12.4964 + (Math.random() - 0.5) * 20,
            slug: baseSlug,
            categoria: 'mondo'
          }
        }

        // Ensure unique slug
        const finalSlug = slugify(geminiData.slug || geminiData.titolo_seo) + '-' + Date.now()

        // Step C: Save to Supabase
        // 1. Create the Globe Pin (chat with tipo=domanda_notizia)
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            titolo: geminiData.domanda_breve,
            lat: geminiData.lat,
            lng: geminiData.lng,
            regione: geminiData.luogo,
            lat_originale: geminiData.lat,
            lng_originale: geminiData.lng,
            regione_originale: geminiData.luogo,
            km_viaggiati: 0,
            risposte_count: 0,
            autore: 'Think News',
            user_id: null,
            ultima_attivita: new Date().toISOString(),
            tipo: 'domanda_notizia',
            blog_slug: finalSlug,
            country_code: 'IT',
            categoria: geminiData.categoria || 'mondo'
          })
          .select('id')
          .single()

        if (chatError || !chatData) {
          console.error('[Cron] Chat insert error:', chatError)
          continue
        }

        const chatId: number = chatData.id

        // 2. Create the Blog Article
        const { error: articleError } = await supabase
          .from('news_articles')
          .insert({
            slug: finalSlug,
            titolo: geminiData.titolo_seo,
            contenuto_completo: geminiData.articolo_completo,
            domanda_breve: geminiData.domanda_breve,
            fonte_url: newsItem.url,
            immagine_url: newsItem.image || null,
            lat: geminiData.lat,
            lng: geminiData.lng,
            chat_id: chatId
          })

        if (articleError) {
          console.error('[Cron] Article insert error:', articleError)
          // Rollback chat if article fails
          await supabase.from('chats').delete().eq('id', chatId)
          continue
        }

        // Update the chat blob_slug reference with the chat_id in the news article
        // (already done above during insert)

        // 3. Create push notifications for all registered users
        await createNotificationsForAllUsers(supabase, chatId, geminiData.domanda_breve, geminiData.lat, geminiData.lng)

        articlesCreated++
        results.push(`✅ Titolo: "${geminiData.titolo_seo.substring(0, 40)}..."\n❓ Domanda: "${geminiData.domanda_breve}"`)

        // Small delay between articles to respect API rate limits
        await new Promise(r => setTimeout(r, 1500))

      } catch (articleErr) {
        console.error('[Cron] Error processing article:', articleErr)
        results.push(`❌ Errore: ${newsItem.title.substring(0, 40)}...`)
      }
    }

    console.log(`[Cron] Completato: ${articlesCreated} articoli creati`)

    return NextResponse.json({
      success: true,
      articlesCreated,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      { success: false, error: String(error), articlesCreated },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering from admin
export const POST = GET
