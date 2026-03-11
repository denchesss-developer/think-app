import React from "react"
import { GlassCard } from "@/components/ui/Glass"
import { Badge } from "@/components/ui/Badge"
import { MapPin, MessageCircle, Clock, Plane, Share2 } from "lucide-react"
import { calcolaStatoVitale, STILI_STATO } from "@/components/features/MapGlobe"
import { timeAgoI18n, translateRegion, type Lang } from "@/lib/i18n"

export function ChatCard({ chat, onClick, t, lang }: { chat: Chat, onClick: (chat: Chat) => void, t: (k: string) => string, lang: Lang }) {
  const count = chat.risposte_count ?? 0
  const hasReplies = count > 0
  const stato = calcolaStatoVitale(chat)
  const stile = STILI_STATO[stato]
  const isSbiadita = stato === 'foglia_secca'

  /* Determine badge variant based on state */
  let badgeVariant: "seed" | "sprout" | "tree" | "faded" | "archived" | "premium" = "seed"
  if (stato === "germoglio") badgeVariant = "sprout"
  if (stato === "albero") badgeVariant = "tree"
  if (stato === "foglia_secca") badgeVariant = "faded"
  if (stato === "archivio") badgeVariant = "archived"

  // Localised state name
  const stateNameMap: Record<string, string> = {
    seme: t('stato_nuova'),
    germoglio: t('stato_crescita'),
    albero: t('stato_popolare'),
    foglia_secca: t('stato_inattiva'),
    archivio: t('stato_archivio'),
  }
  const stateName = stateNameMap[stato] || stile.nome

  async function condividi(e: React.MouseEvent) {
    e.stopPropagation() // Don't open the chat
    const url = `${window.location.origin}?thought=${chat.id}`
    const text = `"${chat.titolo}" — da ${translateRegion(chat.regione, lang) || 'Think'}`

    if (navigator.share) {
      await navigator.share({ title: 'Think', text, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      // Brief visual feedback — swap icon content
      const btn = e.currentTarget as HTMLElement
      btn.textContent = '✓'
      setTimeout(() => { btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' }, 1500)
    }
  }

  return (
    <div 
      className={`relative mb-5 cursor-pointer group transition-all duration-500 ease-out ${isSbiadita ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-100'}`} 
      onClick={() => onClick(chat)}
    >
      {/* Stacked Cards Effect for Threads */}
      {hasReplies && (
        <>
          <div className="absolute inset-0 translate-y-3 translate-x-1.5 rounded-2xl bg-[var(--color-bg-panel)] border border-[var(--color-border-subtle)] opacity-50 transition-transform group-hover:translate-y-4 group-hover:translate-x-2" />
          <div className="absolute inset-0 translate-y-1.5 translate-x-0.5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] opacity-70 transition-transform group-hover:translate-y-2 group-hover:translate-x-1" />
        </>
      )}
      
      <GlassCard className="relative z-10 transition-transform duration-300 group-hover:-translate-y-1 group-active:translate-y-0 group-active:scale-[0.98]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-bold tracking-tight text-[var(--color-text-main)]">
            {chat.autore}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]">
            {hasReplies ? <Plane className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" /> : <MapPin className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-bold tracking-widest uppercase">{translateRegion(chat.regione, lang)}</span>
          </div>
        </div>
        
        <p className="text-[15px] leading-relaxed mb-5 font-medium text-[var(--color-text-main)] opacity-90">
          {chat.titolo}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant} icon={stile.icona}>
              <span className="hidden xs:inline ml-1 text-[10px]">{stateName}</span>
            </Badge>
            
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-widest bg-[var(--color-bg-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{count}</span>
            </div>

            {/* Share button — same height as Badge */}
            <button
              type="button"
              onClick={condividi}
              className="inline-flex items-center justify-center px-2.5 py-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] hover:bg-[var(--color-brand-blue)]/20 text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] transition-all duration-200"
              title={t('condividi_pensiero')}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-faint)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgoI18n(chat.ultima_attivita || chat.created_at, lang)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
