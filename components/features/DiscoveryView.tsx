"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Clock, TrendingUp, MapPin, Archive, X, SlidersHorizontal, ChevronDown, ChevronRight, ChevronUp, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/Input"
import type { Lang } from "@/lib/i18n"
import { ChatCard } from "@/components/features/ChatCard"
import { ChatCardSkeleton } from "@/components/ui/ChatCardSkeleton"
import { calcolaStatoVitale } from "@/components/features/MapGlobe"

const FILTRI_KEYS = [
  { id: "Recenti", labelKey: "recenti", icon: <Clock className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> },
  { id: "Tendenze", labelKey: "tendenze", icon: <TrendingUp className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> },
  { id: "Vicini", labelKey: "vicini", icon: <MapPin className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> },
  { id: "Archivio", labelKey: "archivio", icon: <Archive className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> }
]

const CATEGORIE = [
  { slug: null,               label: 'Tutto',    emoji: '🌍' },
  { slug: 'sport',            label: 'Sport',    emoji: '⚽' },
  { slug: 'economia',         label: 'Economia', emoji: '💰' },
  { slug: 'politica',         label: 'Politica', emoji: '🏛️' },
  { slug: 'tech',             label: 'Tech',     emoji: '💻' },
  { slug: 'ambiente',         label: 'Ambiente', emoji: '🌿' },
  { slug: 'salute',           label: 'Salute',   emoji: '❤️' },
  { slug: 'cultura',          label: 'Cultura',  emoji: '🎭' },
  { slug: 'intrattenimento',  label: 'Entertain',emoji: '🎬' },
  { slug: 'mondo',            label: 'Mondo',    emoji: '🌐' },
]

const PAESI = [
  { code: 'IT', flag: '🇮🇹' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'DE', flag: '🇩🇪' },
]

const CollapsibleMonthBucket = ({ bucket, children, isFirst }: { bucket: { label: string; isCollapsible?: boolean }; children: React.ReactNode; isFirst?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!bucket.isCollapsible) {
    return (
      <div className={isFirst ? "pt-10" : "pt-14"}>
        <div className="flex items-center gap-4 px-4 mb-10">
          <div className="flex-1 h-[2px] bg-gradient-to-l from-[var(--color-text-muted)] opacity-20 to-transparent" />
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] whitespace-nowrap mr-[-0.2em]">
            {bucket.label}
          </h4>
          <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--color-text-muted)] opacity-20 to-transparent" />
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className={isFirst ? "pt-10" : "pt-14"}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 px-4 mb-10 group cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
      >
        <div className="flex-1 h-[2px] bg-gradient-to-l from-[var(--color-text-muted)] opacity-20 to-transparent" />
        <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] whitespace-nowrap mr-[-0.2em] group-hover:text-[var(--color-text-main)] transition-colors">
          {bucket.label}
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </h4>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--color-text-muted)] opacity-20 to-transparent" />
      </button>

      <div
        className={cn(
          "relative transition-all duration-500",
          !isOpen && "cursor-pointer group"
        )}
        onClick={!isOpen ? () => setIsOpen(true) : undefined}
      >
        <div
          className={cn(
            "transition-all duration-700 ease-in-out",
            isOpen ? "opacity-100" : "max-h-[160px] pt-20 -mt-20 overflow-hidden pointer-events-none"
          )}
          style={!isOpen ? {
            WebkitMaskImage: 'linear-gradient(to bottom, black 100px, transparent 160px)',
            maskImage: 'linear-gradient(to bottom, black 100px, transparent 160px)',
          } : {}}
        >
          {children}
        </div>

        {!isOpen && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(true)
            }}
            className="absolute inset-0 cursor-pointer z-10"
          />
        )}
      </div>
    </div>
  )
}

interface DiscoveryViewProps {
  feedLoading: boolean
  chatsFiltrate: Chat[]
  filtroAttivo: string
  setFiltroAttivo: (f: string) => void
  testoRicerca: string
  setTestoRicerca: (t: string) => void
  mostraPannelloFiltri: boolean
  setMostraPannelloFiltri: (v: boolean) => void
  mostraNotizie: boolean
  setMostraNotizie: (v: boolean) => void
  mostraTendenze: boolean
  setMostraTendenze: (v: boolean) => void
  categoriaAttiva: string | null
  setCategoriaAttiva: (c: string | null) => void
  bookmarks: Bookmark[]
  onApriChat: (chat: Chat) => void
  onToggleBookmark: (chat: Chat) => void
  onShare: (chat: Chat) => void
  onReport: (chat: Chat) => void
  isEditable: (chat: Chat) => boolean
  onEditChat: (id: string | number, title: string) => void
  onDeleteChat: (id: string | number) => void
  t: (key: string) => string
  lang: Lang
  currentFeedRef: React.RefObject<HTMLDivElement | null>
  showTornaSu: boolean
  onTornaSu: () => void
}

export default function DiscoveryView({
  feedLoading,
  chatsFiltrate,
  filtroAttivo,
  setFiltroAttivo,
  testoRicerca,
  setTestoRicerca,
  mostraPannelloFiltri,
  setMostraPannelloFiltri,
  mostraNotizie,
  setMostraNotizie,
  mostraTendenze,
  setMostraTendenze,
  categoriaAttiva,
  setCategoriaAttiva,
  bookmarks,
  onApriChat,
  onToggleBookmark,
  onShare,
  onReport,
  isEditable,
  onEditChat,
  onDeleteChat,
  t,
  lang,
  currentFeedRef,
  showTornaSu,
  onTornaSu,
}: DiscoveryViewProps) {
  const userChats = chatsFiltrate.filter((c: Chat) => c.tipo !== 'domanda_notizia' && c.tipo !== 'domanda_trending')
  const newsChats = chatsFiltrate.filter((c: Chat) => c.tipo === 'domanda_notizia')
  const trendingChats = chatsFiltrate.filter((c: Chat) =>
    c.tipo === 'domanda_trending' &&
    calcolaStatoVitale(c) !== 'archivio'
  )
  const trendingFiltered = categoriaAttiva
    ? trendingChats.filter(c => c.categoria === categoriaAttiva)
    : trendingChats
  const newsFiltered = categoriaAttiva && mostraNotizie
    ? newsChats.filter(c => c.categoria === categoriaAttiva)
    : newsChats

  return (
    <div className="space-y-8 pb-10 px-1 relative fade-in-up animate-in duration-500">
      <div ref={currentFeedRef} className="absolute top-0 left-0 w-full h-[1px] pointer-events-none" />

      <button
        onClick={onTornaSu}
        className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-[100] bg-blue-600/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 active:scale-95 transition-all duration-700 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-white/20 ${
          showTornaSu
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-32 scale-50 pointer-events-none text-transparent"
        }`}
      >
        <ChevronUp className="w-4 h-4 text-white" />
        TORNA SU
      </button>

      <header className="text-center pt-6 pb-2">
        <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text-main)]">
          {mostraNotizie ? 'News' : mostraTendenze ? 'Tendenze' : (filtroAttivo === 'Archivio' ? 'Archivio' : 'Discovery')}
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
          {mostraNotizie ? 'notizie dal blog' : mostraTendenze ? 'TRENDING QUESTIONS' : (filtroAttivo === 'Archivio' ? 'MEMORIE STORICHE' : 'GLOBAL THOUGHTS')}
        </p>
      </header>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col gap-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Input
              icon={<Search className="w-4 h-4 text-zinc-500" />}
              placeholder={mostraNotizie ? "Cerca news" : mostraTendenze ? "Cerca tendenze" : "Cerca pensieri"}
              value={testoRicerca}
              onChange={(e) => setTestoRicerca(e.target.value)}
              className="w-full glass-monolith h-14 rounded-2xl pr-14 !border-none shadow-xl placeholder:text-zinc-500"
            />
            <button
              onClick={() => setMostraPannelloFiltri(!mostraPannelloFiltri)}
              className={`absolute right-2 top-2 bottom-2 aspect-square rounded-xl flex items-center justify-center transition-all ${
                mostraPannelloFiltri
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : ((filtroAttivo !== 'Recenti' && filtroAttivo !== 'Archivio') || categoriaAttiva !== null)
                ? "text-blue-500 hover:bg-[var(--color-bg-hover)]"
                : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              if (mostraNotizie) {
                setMostraNotizie(false)
              } else if (mostraTendenze) {
                setMostraTendenze(false)
              } else {
                setFiltroAttivo(filtroAttivo === 'Archivio' ? 'Recenti' : 'Archivio')
              }
            }}
            className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all !border-none ${
              (filtroAttivo === 'Archivio' && !mostraNotizie && !mostraTendenze)
              ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              : "glass-monolith text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            }`}
            title={mostraNotizie || mostraTendenze ? "Chiudi" : (filtroAttivo === 'Archivio' ? "Esci dall'Archivio" : "Archivio")}
          >
            {mostraNotizie || mostraTendenze ? <X size={20} /> : <Archive size={20} />}
          </button>
        </div>

        {/* FILTERS PANEL */}
        <AnimatePresence>
          {mostraPannelloFiltri && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="relative overflow-visible"
            >
              <div className="w-[calc(100%+48px)] -mx-6 px-6 pt-4 pb-12">
                <div className="flex items-center justify-between gap-3 mb-6">
                  {[
                    { id: 'Recenti', label: 'Novità', icon: <Clock size={16} /> },
                    { id: 'Tendenze', label: 'Popolari', icon: <TrendingUp size={16} /> },
                    { id: 'Vicini', label: 'Vicino', icon: <MapPin size={16} /> }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFiltroAttivo(f.id as any)
                        setMostraPannelloFiltri(false)
                        if (mostraNotizie) setMostraNotizie(false)
                        if (mostraTendenze) setMostraTendenze(false)
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        filtroAttivo === f.id && !mostraNotizie && !mostraTendenze
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "glass-panel text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                      }`}
                    >
                      {f.icon}
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-6 opacity-40">
                  <div className="flex-1 h-[1px] bg-gradient-to-l from-[var(--color-text-muted)] to-transparent" />
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Categorie</div>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--color-text-muted)] to-transparent" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                  {CATEGORIE.map(cat => (
                    <button
                      key={cat.slug ?? 'tutto'}
                      onClick={() => {
                        setCategoriaAttiva(cat.slug)
                        setMostraPannelloFiltri(false)
                      }}
                      className={`flex flex-col justify-center items-center gap-1.5 p-3 h-24 rounded-2xl transition-all border-none text-center ${
                        categoriaAttiva === cat.slug
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          : "glass-panel text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]"
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0 mb-0.5">{cat.emoji}</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-tight break-words px-1">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN FEED */}
      {feedLoading && (
        <div className="mt-6">
          <ChatCardSkeleton count={5} />
        </div>
      )}

      {!feedLoading && (
        <>
          {/* Featured News / Blog */}
          {newsChats.length > 0 && !mostraNotizie && !mostraTendenze && (
            <button
              onClick={() => setMostraNotizie(true)}
              className="w-full flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-xl hover:-translate-y-1 transition-all group mt-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-[var(--color-text-main)]">ESPLORA NOTIZIE BLOG</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">News & Trends</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* EXPLORE TRENDS BUTTON */}
          {!mostraNotizie && !mostraTendenze && trendingChats.length > 0 && (
            <button
              onClick={() => setMostraTendenze(true)}
              className="w-full flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <span className="text-white font-black text-2xl leading-none select-none">?</span>
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-[var(--color-text-main)]">ESPLORA TENDENZE</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-500/80">Trending Questions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-violet-500 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* TRENDING SECTION */}
          {mostraTendenze && (
            <div className="space-y-4 pt-2 pb-12">
              {trendingFiltered.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-[var(--color-text-muted)] font-bold">
                    {categoriaAttiva ? `Nessuna tendenza in "${categoriaAttiva}".` : 'Nessuna tendenza disponibile al momento.'}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Il cron le aggiornerà presto.</p>
                </div>
              ) : (
                <div className="space-y-0 pb-12">
                  {(() => {
                    const grouped = trendingFiltered.reduce((acc, chat) => {
                      const code = chat.country_code || 'Altro'
                      if (!acc[code]) acc[code] = []
                      acc[code].push(chat)
                      return acc
                    }, {} as Record<string, typeof trendingFiltered>)

                    const sortedCodes = Object.keys(grouped).sort((a, b) => {
                      const idxA = PAESI.findIndex(p => p.code === a)
                      const idxB = PAESI.findIndex(p => p.code === b)
                      if (idxA !== -1 && idxB !== -1) return idxA - idxB
                      if (idxA !== -1) return -1
                      if (idxB !== -1) return 1
                      return a.localeCompare(b)
                    })

                    return sortedCodes.map(code => {
                      const chatsForCountry = grouped[code]
                      const paeseConfig = PAESI.find(p => p.code === code)
                      const flag = paeseConfig ? paeseConfig.flag : '🌍'

                      return (
                        <div key={code} className="pt-6">
                          <div className="flex items-center gap-4 px-4 mb-10">
                            <div className="flex-1 h-[2px] bg-gradient-to-l from-[var(--color-text-muted)] opacity-20 to-transparent" />
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] whitespace-nowrap mr-[-0.2em]">
                              {code === 'Altro' ? 'Global Trends' : `Trends in ${code}`}
                            </h4>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--color-text-muted)] opacity-20 to-transparent" />
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {chatsForCountry.map(chat => (
                              <ChatCard
                                key={chat.id}
                                chat={chat}
                                onClick={onApriChat}
                                t={t}
                                lang={lang}
                                isSaved={bookmarks.some(b => b.chat?.id === chat.id)}
                                onSave={onToggleBookmark}
                                onShare={onShare}
                                onReport={onReport}
                                isEditable={false}
                                onEdit={() => {}}
                                onDelete={() => {}}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
              <div className="h-0 bg-transparent my-8" />
            </div>
          )}

          {/* NEWS SECTION */}
          {mostraNotizie && (
            <div className="space-y-0 pt-0 pb-12">
              {(() => {
                if (newsFiltered.length === 0) return null

                const buckets: Record<string, { label: string; order: number; isCollapsible?: boolean; chats: typeof newsFiltered }> = {}
                const now = new Date()
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
                const yesterdayStart = todayStart - 86400000
                const weekStart = todayStart - 86400000 * 7
                const formatter = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-US', { month: 'long', year: 'numeric' })

                newsFiltered.forEach(news => {
                  const date = new Date(news.ultima_attivita || news.created_at)
                  const time = date.getTime()
                  let bucketKey = ''
                  let label = ''
                  let order = 0
                  let isCollapsible = false

                  if (time >= todayStart) {
                    bucketKey = 'oggi'
                    label = lang === 'it' ? 'Ultime 24h' : 'Last 24 Hours'
                    order = 1
                  } else if (time >= yesterdayStart) {
                    bucketKey = 'ieri'
                    label = lang === 'it' ? 'Ieri' : 'Yesterday'
                    order = 2
                  } else if (time >= weekStart) {
                    bucketKey = 'settimana'
                    label = lang === 'it' ? 'Questa Settimana' : 'This Week'
                    order = 3
                    isCollapsible = true
                  } else {
                    bucketKey = `mese_${date.getFullYear()}_${date.getMonth()}`
                    label = formatter.format(date)
                    label = label.charAt(0).toUpperCase() + label.slice(1)
                    order = 4 + (2100 - date.getFullYear()) * 12 + (11 - date.getMonth())
                    isCollapsible = true
                  }

                  if (!buckets[bucketKey]) {
                    buckets[bucketKey] = { label, order, isCollapsible, chats: [] }
                  }
                  buckets[bucketKey].chats.push(news)
                })

                const sortedBuckets = Object.values(buckets).sort((a, b) => a.order - b.order)

                return sortedBuckets.map((bucket, index) => (
                  <CollapsibleMonthBucket key={bucket.label} bucket={bucket} isFirst={index === 0}>
                    <div className="grid grid-cols-1 gap-8">
                      {bucket.chats.map(news => (
                        <ChatCard
                          key={news.id}
                          chat={news}
                          onClick={onApriChat}
                          t={t}
                          lang={lang}
                          isSaved={bookmarks.some(b => b.chat?.id === news.id)}
                          onSave={onToggleBookmark}
                          onShare={onShare}
                          onReport={onReport}
                          isEditable={isEditable(news)}
                          onEdit={(c) => {
                            const newTitle = prompt("Modifica il tuo pensiero:", c.titolo)
                            if (newTitle) onEditChat(c.id, newTitle)
                          }}
                          onDelete={(c) => {
                            if (confirm("Vuoi davvero eliminare questo pensiero?")) onDeleteChat(c.id)
                          }}
                        />
                      ))}
                    </div>
                  </CollapsibleMonthBucket>
                ))
              })()}
              <div className="h-0 bg-transparent my-8" />
            </div>
          )}

          {/* Secondary Grid (Time Buckets) */}
          <div className="mt-0 space-y-8">
            {(() => {
              const chatsToBucket = (mostraNotizie || mostraTendenze ? [] : userChats)
              if (chatsToBucket.length === 0) return null

              const buckets: Record<string, { label: string; icon: string; order: number; isCollapsible?: boolean; chats: typeof userChats }> = {}
              const now = new Date()
              const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
              const yesterdayStart = todayStart - 86400000
              const weekStart = todayStart - 86400000 * 7
              const formatter = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-US', { month: 'long', year: 'numeric' })

              chatsToBucket.forEach(chat => {
                const date = new Date(chat.ultima_attivita || chat.created_at)
                const time = date.getTime()
                let bucketKey = ''
                let label = ''
                let icon = ''
                let order = 0
                let isCollapsible = false

                if (time >= todayStart) {
                  bucketKey = 'oggi'
                  label = lang === 'it' ? 'Ultime 24h' : 'Last 24 Hours'
                  icon = '⚡️'
                  order = 1
                } else if (time >= yesterdayStart) {
                  bucketKey = 'ieri'
                  label = lang === 'it' ? 'Ieri' : 'Yesterday'
                  icon = '💫'
                  order = 2
                } else if (time >= weekStart) {
                  bucketKey = 'settimana'
                  label = lang === 'it' ? 'Questa Settimana' : 'This Week'
                  icon = '📆'
                  order = 3
                  isCollapsible = true
                } else {
                  bucketKey = `mese_${date.getFullYear()}_${date.getMonth()}`
                  label = formatter.format(date)
                  label = label.charAt(0).toUpperCase() + label.slice(1)
                  icon = '🗓'
                  order = 4 + (2100 - date.getFullYear()) * 12 + (11 - date.getMonth())
                  isCollapsible = true
                }

                if (!buckets[bucketKey]) {
                  buckets[bucketKey] = { label, icon, order, isCollapsible, chats: [] }
                }
                buckets[bucketKey].chats.push(chat)
              })

              const sortedBuckets = Object.values(buckets).sort((a, b) => a.order - b.order)

              return sortedBuckets.map((bucket, index) => (
                <CollapsibleMonthBucket key={bucket.label} bucket={bucket} isFirst={index === 0}>
                  <div className="grid grid-cols-1 gap-8">
                    {bucket.chats.map(chat => (
                      <ChatCard
                        key={chat.id}
                        chat={chat}
                        onClick={onApriChat}
                        t={t}
                        lang={lang}
                        isSaved={bookmarks.some(b => b.chat?.id === chat.id)}
                        onSave={onToggleBookmark}
                        onShare={onShare}
                        onReport={onReport}
                        isEditable={isEditable(chat)}
                        onEdit={(c) => {
                          const newTitle = prompt("Modifica il tuo pensiero:", c.titolo)
                          if (newTitle) onEditChat(c.id, newTitle)
                        }}
                        onDelete={(c) => {
                          if (confirm("Vuoi davvero eliminare questo pensiero?")) onDeleteChat(c.id)
                        }}
                      />
                    ))}
                  </div>
                </CollapsibleMonthBucket>
              ))
            })()}
          </div>

          {chatsFiltrate.length === 0 && !feedLoading && (
            <div className="flex flex-col items-center justify-start h-[45vh] pt-12 text-center animate-in fade-in zoom-in duration-500 overflow-hidden">
              <div className="w-16 h-16 bg-[var(--color-bg-card)] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-transparent">
                <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[var(--color-text-muted)] font-black text-[10px] uppercase tracking-[0.3em] mr-[-0.3em]">
                {lang === 'it' ? 'Nessun Risultato' : 'No Results'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
