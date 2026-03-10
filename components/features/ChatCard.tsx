import React from "react"
import { GlassCard } from "@/components/ui/Glass"
import { Badge } from "@/components/ui/Badge"
import { MapPin, MessageCircle, Clock } from "lucide-react"
import { calcolaStatoVitale, STILI_STATO } from "@/components/features/MapGlobe"

export function timeAgo(dateString: string) {
  const min = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
  if (min < 1) return 'Ora'
  if (min < 60) return `${min}m fa`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h fa`
  return `${Math.floor(hrs / 24)}g fa`
}

export function ChatCard({ chat, onClick }: { chat: Chat, onClick: (chat: Chat) => void }) {
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
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-widest uppercase">{chat.regione}</span>
          </div>
        </div>
        
        <p className="text-[15px] leading-relaxed mb-5 font-medium text-[var(--color-text-main)] opacity-90">
          {chat.titolo}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <Badge variant={badgeVariant} icon={stile.icona}>
              <span className="hidden xs:inline ml-1 text-[10px]">{stile.nome}</span>
            </Badge>
            
            <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs font-bold bg-[var(--color-bg-hover)] px-2 py-1 rounded-md">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{count}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-faint)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo(chat.ultima_attivita || chat.created_at)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
