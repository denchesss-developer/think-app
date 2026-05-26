import { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { logError } from '@/lib/log'
import BlogSearch from '@/components/features/BlogSearch'

const BASE_URL = 'https://thethink.space'

export const metadata: Metadata = {
  title: 'Blog — Notizie del Mondo come Domande di Dibattito',
  description:
    'Scopri le notizie internazionali trasformate in domande di dibattito. Leggi gli articoli e condividi la tua opinione sul globo 3D di Think. Aggiornato quotidianamente.',
  keywords: [
    'notizie mondo',
    'dibattiti internazionali',
    'blog notizie',
    'domande dibattito',
    'opinioni globali',
    'news blog italiano',
    'attualità internazionale',
    'think blog',
  ],
  alternates: {
    canonical: `${BASE_URL}/blog`,
    languages: {
      'it': `${BASE_URL}/blog`,
      'en': `${BASE_URL}/blog/en`,
      'es': `${BASE_URL}/blog/es`,
      'fr': `${BASE_URL}/blog/fr`,
      'de': `${BASE_URL}/blog/de`,
    },
  },
  openGraph: {
    title: 'Think Blog — Notizie del Mondo come Domande di Dibattito',
    description:
      'Ogni notizia diventa una domanda. Leggi, rifletti, poi esprimi la tua opinione geo-localizzata sul globo 3D.',
    type: 'website',
    url: `${BASE_URL}/blog`,
    siteName: 'Think',
    locale: 'it_IT',
    images: [
      {
        url: `${BASE_URL}/api/og?title=${encodeURIComponent('Think Blog — Notizie del Mondo')}&subtitle=${encodeURIComponent('Ogni notizia diventa una domanda di dibattito')}&type=blog`,
        width: 1200,
        height: 630,
        alt: 'Think Blog — Notizie del mondo come domande di dibattito',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Think Blog — Notizie come Domande di Dibattito',
    description:
      'Ogni notizia diventa una domanda. Esprimi la tua opinione geo-localizzata sul globo 3D di Think.',
    images: [
      `${BASE_URL}/api/og?title=${encodeURIComponent('Think Blog')}&type=blog`,
    ],
  },
}

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
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
  const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
  return {
    giorno: giorni[d.getDay()],
    data: `${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`,
    ora: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
}

export const revalidate = 60 // ISR: rivalida ogni 60 secondi

export default async function BlogPage() {
  const supabase = createSupabaseServer()

  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('id, slug, titolo, domanda_breve, immagine_url, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    logError('Blog fetch error — news_articles query failed:', error.message)
  }

  const news: Pick<NewsArticle, 'id' | 'slug' | 'titolo' | 'domanda_breve' | 'immagine_url' | 'created_at'>[] = articles || []

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-70">
            <span className="text-2xl font-black tracking-tight text-zinc-900">
              Think.
            </span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Blog</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-sm font-bold text-zinc-800 transition-colors"
          >
            Go to 3D Globe
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-12 border-b border-zinc-100 flex flex-col md:flex-row gap-8 justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-black mb-6 tracking-tight text-zinc-900 leading-[1.1]">
            Ideas &<br/>Updates.
          </h1>
          <p className="text-zinc-500 text-[1.125rem] font-medium max-w-lg leading-relaxed">
            Spazio asettico per le notizie. Ogni articolo genera un dibattito sul globo 3D.
          </p>
        </div>
        
        {/* Breaking Bar Emulator */}
        <div className="md:w-72 bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 self-start shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
           <div className="flex items-center gap-2 mb-4">
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             <span className="text-xs font-black uppercase tracking-widest text-red-500">LIVE / Tendenze</span>
           </div>
           {news.slice(0, 1).map(b => (
             <Link key={b.id} href={`/blog/${b.slug}`} className="block">
                <h3 className="text-[17px] font-bold text-zinc-900 leading-snug group-hover:text-amber-600 transition-colors">{b.titolo.substring(0, 70)}...</h3>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-4 inline-block">Approfondisci &rarr;</span>
             </Link>
           ))}
        </div>
      </section>

      {/* Filter / Search Bar */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-4">
         <BlogSearch initialArticles={news} lang="it" />
      </section>

      {/* Article List */}
      <main className="max-w-4xl mx-auto px-6 py-16 mb-12">
        {news.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            <p className="text-xl font-medium">No posts yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            {news.map((article) => {
              const { data } = formatDate(article.created_at)
              return (
                <article key={article.id} className="group flex flex-col md:flex-row gap-8 items-start relative">
                  
                  {/* Meta / Date (Left col on md desktop) */}
                  <div className="w-full md:w-48 flex-shrink-0 pt-2 flex flex-col gap-4">
                     <time className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{data}</time>
                     
                     {/* Immagine o Placeholder per dare colpo d'occhio colorato */}
                     <Link href={`/blog/${article.slug}`} className="block w-full aspect-video rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 relative group-hover:shadow-md transition-shadow">
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

                  {/* Content (Right col) */}
                  <div className="flex-1 pt-1">
                    <Link href={`/blog/${article.slug}`} className="block">
                      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight mb-4 group-hover:text-amber-600 transition-colors">
                        {article.titolo}
                      </h2>
                    </Link>
                    
                    {article.domanda_breve && (
                      <p className="text-lg text-zinc-600 leading-relaxed mb-6 font-serif italic">
                        &ldquo;{article.domanda_breve}&rdquo;
                      </p>
                    )}

                    <Link 
                      href={`/blog/${article.slug}`} 
                      className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-amber-600 transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-amber-600 pb-1"
                    >
                      Read post 
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
