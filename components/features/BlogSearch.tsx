"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'

// Pass data from server component to avoid heavy client fetching
export default function BlogSearch({ initialArticles, lang = 'it' }: { initialArticles: any[], lang?: string }) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Real predictive search with 0 latency (client-side matching on top 50, sufficient for typical blog reading)
  const results = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return initialArticles.filter(a => {
      const localeTitle = a.traduzioni?.[lang]?.titolo || a.titolo || ''
      const localeDesc = a.traduzioni?.[lang]?.domanda_breve || a.domanda_breve || ''
      return localeTitle.toLowerCase().includes(q) || localeDesc.toLowerCase().includes(q)
    }).slice(0, 5) // max 5 suggestive hits
  }, [query, initialArticles, lang])

  return (
    <div className="relative w-full max-w-lg mb-10 group z-40">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
      </div>
      <input
        type="text"
        placeholder={lang === 'it' ? "Cerca notizie o dibattiti..." : "Search news or debates..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsSearching(true)
          setTimeout(() => setIsSearching(false), 200) // fake loader for fluidity feedback
        }}
        className="block w-full pl-11 pr-10 py-4 bg-zinc-50 border border-zinc-200 rounded-3xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
      />
      {isSearching && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
        </div>
      )}

      {/* Flyout results */}
      {query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map(r => {
                const localeTitle = r.traduzioni?.[lang]?.titolo || r.titolo
                const url = lang === 'it' ? `/blog/${r.slug}` : `/blog/${lang}/${r.slug}`
                return (
                  <li key={r.id}>
                    <Link href={url} className="px-5 py-3 hover:bg-zinc-50 flex flex-col gap-1 transition-colors">
                      <span className="text-sm font-bold text-zinc-900 block truncate">{localeTitle}</span>
                      <span className="text-xs text-amber-600 font-medium uppercase tracking-widest">{lang === 'it' ? 'Leggi articolo' : 'Read post'} &rarr;</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-zinc-500 font-medium">
              {lang === 'it' ? "Nessun risultato." : "No results found."}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
