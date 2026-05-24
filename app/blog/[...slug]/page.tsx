import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { getTranslatedArticle } from '@/lib/translationHelper'
import BlogSearch from '@/components/features/BlogSearch'
import ArticleAudioPlayer from '@/components/features/ArticleAudioPlayer'
import { BlogChallengeTracker } from '@/components/features/BlogChallengeTracker'
import { JsonLd, newsArticleSchema, breadcrumbSchema } from '@/components/seo/JsonLd'

const BASE_URL = 'https://thethink.space'

export const revalidate = 120

interface NewsArticle {
  id: string
  slug: string
  titolo: string
  contenuto_completo: string
  domanda_breve: string
  fonte_url: string | null
  immagine_url: string | null
  lat: number | null
  lng: number | null
  chat_id: number | null
  created_at: string
  traduzioni: Record<string, { titolo: string; contenuto_completo: string; domanda_breve: string }> | null
}

interface Risposta {
  id: number
  testo: string
  autore: string
  regione?: string
  created_at: string
}

interface Props {
  params: Promise<{ slug: string[] }>
}

const SUPPORTED_LANGS = ['it', 'en', 'es', 'fr', 'de']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
  return {
    data: `${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m fa`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h fa`
  return `${Math.floor(hours / 24)}g fa`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const slugArray = resolvedParams.slug || []
  
  let lang = 'it'
  let articleSlug = ''

  if (slugArray.length === 1 && SUPPORTED_LANGS.includes(slugArray[0])) {
    return {
      title: `Blog — Think (${slugArray[0].toUpperCase()})`,
      alternates: {
        canonical: `${BASE_URL}/blog/${slugArray[0]}`,
        languages: {
          'it': `${BASE_URL}/blog`,
          'en': `${BASE_URL}/blog/en`,
          'es': `${BASE_URL}/blog/es`,
          'fr': `${BASE_URL}/blog/fr`,
          'de': `${BASE_URL}/blog/de`,
        },
      },
    }
  } else if (slugArray.length === 1) {
    articleSlug = slugArray[0]
  } else if (slugArray.length === 2 && SUPPORTED_LANGS.includes(slugArray[0])) {
    lang = slugArray[0]
    articleSlug = slugArray[1]
  }

  if (!articleSlug) return { title: 'Blog — Think' }

  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('news_articles')
    .select('id, titolo, domanda_breve, contenuto_completo, traduzioni, immagine_url, created_at, slug')
    .eq('slug', articleSlug)
    .single()

  if (!data) return { title: 'Articolo non trovato — Think Blog' }

  let titolo = data.titolo
  let desc = data.domanda_breve

  if (lang !== 'it') {
    try {
      const trad = await getTranslatedArticle(data.id, { titolo: data.titolo, contenuto_completo: data.contenuto_completo, domanda_breve: data.domanda_breve }, lang, data.traduzioni)
      titolo = trad.titolo
      desc = trad.domanda_breve
    } catch (e) { console.error('Meta Translation err', e) }
  }

  const canonicalUrl = lang === 'it'
    ? `${BASE_URL}/blog/${articleSlug}`
    : `${BASE_URL}/blog/${lang}/${articleSlug}`

  // OG image: use article image if available, else generate branded OG
  const ogImageUrl = data.immagine_url
    ? data.immagine_url
    : `${BASE_URL}/api/og?title=${encodeURIComponent(titolo)}&subtitle=${encodeURIComponent(desc || '')}`

  return {
    title: titolo,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'it': `${BASE_URL}/blog/${articleSlug}`,
        'en': `${BASE_URL}/blog/en/${articleSlug}`,
        'es': `${BASE_URL}/blog/es/${articleSlug}`,
        'fr': `${BASE_URL}/blog/fr/${articleSlug}`,
        'de': `${BASE_URL}/blog/de/${articleSlug}`,
      },
    },
    openGraph: {
      title: titolo,
      description: desc,
      type: 'article',
      url: canonicalUrl,
      siteName: 'Think',
      locale: lang === 'it' ? 'it_IT' : lang === 'en' ? 'en_US' : lang === 'es' ? 'es_ES' : lang === 'fr' ? 'fr_FR' : 'de_DE',
      publishedTime: new Date(data.created_at).toISOString(),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: titolo,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titolo,
      description: desc,
      images: [ogImageUrl],
    },
  }
}

export default async function BlogArticleOrIndexPage({ params }: Props) {
  const resolvedParams = await params
  const slugArray = resolvedParams.slug || []
  const supabase = createSupabaseServer()
  
  let lang = 'it'
  let articleSlug = ''
  let isIndex = false

  if (slugArray.length === 1 && SUPPORTED_LANGS.includes(slugArray[0])) {
    lang = slugArray[0]
    isIndex = true
  } else if (slugArray.length === 1) {
    articleSlug = slugArray[0]
  } else if (slugArray.length === 2 && SUPPORTED_LANGS.includes(slugArray[0])) {
    lang = slugArray[0]
    articleSlug = slugArray[1]
  } else {
    notFound()
  }

  // Se è un index multilingua (ex: /blog/en) mostriamo la lista:
  // Per mantenere basso il costo iniziale potremmo mostrare la lista in italiano ma reindirizzare ai post inglesi.
  // Tuttavia per un lavoro perfetto, la pagina base "Index" la facciamo a parte o qua.
  if (isIndex) {
    const { data: articles } = await supabase
      .from('news_articles')
      .select('id, slug, titolo, domanda_breve, immagine_url, created_at, contenuto_completo, traduzioni')
      .order('created_at', { ascending: false })
      .limit(50)

    const news = articles || []

    return (
      <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-amber-100 selection:text-amber-900">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-70">
              <span className="text-2xl font-black tracking-tight text-zinc-900">Think.</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Blog [{lang.toUpperCase()}]</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-sm font-bold text-zinc-800 transition-colors">
              Go to globe
            </Link>
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-6 pt-24 pb-12 border-b border-zinc-100 flex flex-col md:flex-row gap-8 justify-between">
          <div>
            <h1 className="text-5xl sm:text-6xl font-black mb-6 tracking-tight text-zinc-900 leading-[1.1]">Ideas &<br/>Updates.</h1>
            <p className="text-zinc-500 text-[1.125rem] font-medium max-w-lg leading-relaxed">
              A calm space to reflect on the world&apos;s news. Translated dynamically into {lang.toUpperCase()}.
            </p>
          </div>
          
          {/* Breaking Bar Emulator */}
          <div className="md:w-72 bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 self-start shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
             <div className="flex items-center gap-2 mb-4">
               <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
               <span className="text-xs font-black uppercase tracking-widest text-red-500">LIVE / Trending</span>
             </div>
             {news.slice(0, 1).map(b => {
               const locTitle = b.traduzioni?.[lang]?.titolo || b.titolo
               return (
                 <Link key={b.id} href={`/blog/${lang}/${b.slug}`} className="block">
                    <h3 className="text-[17px] font-bold text-zinc-900 leading-snug group-hover:text-amber-600 transition-colors">{locTitle.substring(0, 70)}...</h3>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-4 inline-block">Read post &rarr;</span>
                 </Link>
               )
             })}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 pt-12 pb-4">
           <BlogSearch initialArticles={news} lang={lang} />
        </section>

        <main className="max-w-4xl mx-auto px-6 py-16 mb-12">
          {news.length === 0 ? (
            <div className="text-center py-24 text-zinc-400"><p className="text-xl font-medium">No posts yet.</p></div>
          ) : (
            <div className="flex flex-col gap-16">
              {news.map((article) => {
                const { data } = formatDate(article.created_at)
                // Se c'è già la traduzione la usiamo, se no mostriamo IT. (Evitiamo translate batch che consuma troppi token per l'index).
                const localeTitle = article.traduzioni?.[lang]?.titolo || article.titolo
                const localeDesc = article.traduzioni?.[lang]?.domanda_breve || article.domanda_breve

                return (
                  <article key={article.id} className="group flex flex-col md:flex-row gap-8 items-start relative">
                    <div className="w-full md:w-48 flex-shrink-0 pt-2 flex flex-col gap-4">
                       <time className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{data}</time>
                       <Link href={`/blog/${lang}/${article.slug}`} className="block w-full aspect-video rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 relative group-hover:shadow-md transition-shadow">
                         {article.immagine_url ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={article.immagine_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                              <span className="text-white font-black text-3xl opacity-50">?</span>
                           </div>
                         )}
                       </Link>
                    </div>
                    <div className="flex-1 pt-1">
                      <Link href={`/blog/${lang}/${article.slug}`} className="block">
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight mb-4 group-hover:text-amber-600 transition-colors">
                          {localeTitle} {(!article.traduzioni?.[lang] ? `(IT)` : '')}
                        </h2>
                      </Link>
                      {localeDesc && (
                        <p className="text-lg text-zinc-600 leading-relaxed mb-6 font-serif italic">
                          &ldquo;{localeDesc}&rdquo;
                        </p>
                      )}
                      <Link href={`/blog/${lang}/${article.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-amber-600 transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-amber-600 pb-1">
                        Read post <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    )
  }

  // -- PAGE ARTICOLO --
  const { data: dbArticle } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', articleSlug)
    .single()

  if (!dbArticle) notFound()

  const article = dbArticle as NewsArticle

  // Just-In-Time Translation solo per la pagina del dettaglio!
  if (lang !== 'it') {
    try {
      const trad = await getTranslatedArticle(
        article.id, 
        { titolo: article.titolo, contenuto_completo: article.contenuto_completo, domanda_breve: article.domanda_breve }, 
        lang, 
        article.traduzioni
      )
      article.titolo = trad.titolo
      article.contenuto_completo = trad.contenuto_completo
      article.domanda_breve = trad.domanda_breve
    } catch (e) {
      console.error("Translation block failed, using IT fallback", e)
    }
  }

  // Fetch comments (risposte)
  let risposte: Risposta[] = []
  if (article.chat_id) {
    const { data: replies } = await supabase
      .from('risposte')
      .select('id, testo, autore, regione, created_at')
      .eq('chat_id', article.chat_id)
      .order('created_at', { ascending: true })
      .limit(100)
    if (replies) risposte = replies
  }

  const siteUrl = BASE_URL
  const canonicalUrl = lang === 'it'
    ? `${BASE_URL}/blog/${article.slug}`
    : `${BASE_URL}/blog/${lang}/${article.slug}`
  const ogImageUrl = article.immagine_url
    ? article.immagine_url
    : `${BASE_URL}/api/og?title=${encodeURIComponent(article.titolo)}&subtitle=${encodeURIComponent(article.domanda_breve || '')}`

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-100 dark:selection:bg-amber-900 selection:text-amber-900 dark:selection:text-amber-100">
      {/* Structured Data */}
      <JsonLd data={newsArticleSchema({
        headline: article.titolo,
        description: article.domanda_breve || '',
        imageUrl: article.immagine_url,
        datePublished: article.created_at,
        articleSlug: article.slug,
        lang,
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Blog', url: `${BASE_URL}/blog` },
        { name: article.titolo, url: canonicalUrl },
      ])} />
      <BlogChallengeTracker slug={article.slug} chatId={article.chat_id} />
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={lang === 'it' ? "/blog" : `/blog/${lang}`} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Blog
          </Link>
          <div className="flex items-center gap-4">
             {/* Simple Language Switcher */}
             <div className="flex gap-2">
                {SUPPORTED_LANGS.map(l => (
                   <Link key={l} href={l === 'it' ? `/blog/${article.slug}` : `/blog/${l}/${article.slug}`} className={`text-xs font-bold uppercase transition-colors px-1 ${lang === l ? 'text-amber-600' : 'text-zinc-300 hover:text-zinc-600'}`}>
                     {l}
                   </Link>
                ))}
             </div>
             <Link href="/" className="text-xl font-black tracking-tight text-zinc-900 hover:opacity-70 transition-opacity">Think.</Link>
          </div>
        </div>
      </header>

      {/* Hero / Breaking Bar emulation with simple tags */}
      <article className="max-w-3xl mx-auto px-6 pt-12 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-amber-600 text-sm font-black">?</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Daily Dispatch</span>
        </div>

        <h1 className="text-4xl sm:text-[2.75rem] font-black leading-[1.15] mb-6 text-zinc-900 dark:text-zinc-50 tracking-tight">
          {article.titolo}
        </h1>

        <ArticleAudioPlayer testata={article.titolo} text={article.contenuto_completo} lang={lang} />

        {article.domanda_breve && (
          <blockquote className="border-l-4 border-amber-500 pl-6 py-2 my-10 relative bg-amber-50/50 dark:bg-amber-500/5 rounded-r-xl pr-4">
            <p className="text-xl sm:text-2xl font-serif text-zinc-700 dark:text-zinc-300 italic leading-snug">&ldquo;{article.domanda_breve}&rdquo;</p>
          </blockquote>
        )}

        <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-10 uppercase tracking-widest flex-wrap">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            AI Verified
          </span>
          <span className="text-zinc-500">{formatDate(article.created_at).data}</span>
          {article.fonte_url && (
            <a href={article.fonte_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-500 hover:text-amber-700 transition-colors flex items-center gap-1 ml-auto sm:ml-0 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full">
              Source <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            </a>
          )}
        </div>

        {article.immagine_url && (
          <div className="rounded-2xl overflow-hidden mb-12 border border-zinc-100 dark:border-zinc-800 shadow-lg bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.immagine_url} alt={article.titolo} className="w-full object-cover max-h-[450px]" loading="lazy" />
          </div>
        )}

        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none prose-p:leading-[1.8] prose-p:text-[1.125rem] prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50 tracking-[0.01em]">
          {article.contenuto_completo.split('\\n\\n').map((paragraph, i) => (
            <p key={i} className="mb-7">{paragraph.replace(/\\n/g, '')}</p>
          ))}
        </div>
      </article>

      {/* Separatore + Commenti */}
      <div className="max-w-3xl mx-auto px-6"><div className="border-t border-zinc-100 dark:border-zinc-800" /></div>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-zinc-900 dark:text-zinc-50 tracking-tight">
          Global Thoughts <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-xs font-bold text-zinc-500">{risposte.length}</span>
        </h2>
        {risposte.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-800/30">
            <p className="text-lg font-medium mb-1">No thoughts yet</p>
            <p className="text-sm">Be the first to share your perspective on the globe.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {risposte.map((r) => (
              <div key={r.id} className="flex gap-4 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                  <span className="text-sm font-black text-zinc-600 dark:text-zinc-400">{(r.autore || 'A')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.autore || 'Anonymous'}</span>
                    {r.regione && <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">• {r.regione}</span>}
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">• {timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">{r.testo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Globo */}
      <section className="max-w-3xl mx-auto px-6 pb-24 mt-4">
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 p-10 text-center shadow-lg shadow-amber-100/20 dark:shadow-none">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border border-amber-200 dark:border-amber-700/50 shadow-sm">
            <span className="text-amber-600 dark:text-amber-500 font-black text-3xl">?</span>
          </div>
          <h3 className="text-2xl font-black mb-3 text-zinc-900 dark:text-zinc-50 tracking-tight">Have an opinion?</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
            Share your perspective on the 3D globe. Your thought will appear geo-located alongside people from all over the world.
          </p>
          <Link href={`${siteUrl}/?news_id=${article.chat_id || ''}`} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold tracking-wide hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/10">
            Go to Globe <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
