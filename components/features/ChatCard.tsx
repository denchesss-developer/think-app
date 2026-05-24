"use client"

import React, { useState, useEffect, useCallback } from "react"
import { GlassCard } from "@/components/ui/Glass"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, Clock, Plane, ArrowRight, RotateCcw,
  MoreHorizontal, X, Bookmark, Share2, Flag,
  Pencil, Trash2, User
} from "lucide-react"
import { calcolaStatoVitale, STILI_STATO } from "@/components/features/MapGlobe"
import { timeAgoI18n, translateRegion, type Lang } from "@/lib/i18n"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Splits "Verona 🇮🇹" into { name: "Verona", flag: "🇮🇹" } */
function splitRegionFlag(region: string): { name: string; flag: string } {
  if (!region) return { name: '', flag: '' }
  const parts = region.trim().split(' ')
  if (parts.length > 1) {
    const last = parts[parts.length - 1]
    // Emoji characters are > U+FFFF or in flag range
    if (/\p{Emoji}/u.test(last)) {
      return { name: parts.slice(0, -1).join(' '), flag: last }
    }
  }
  return { name: region, flag: '' }
}

// ─── Vital state colour tokens ─────────────────────────────────────────────────
const STATO_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  seme:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  germoglio:  { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20' },
  albero:     { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  foglia_secca: { bg: 'bg-orange-500/8', text: 'text-orange-400/70', border: 'border-orange-500/15' },
  archivio:   { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ChatCardProps {
  chat: Chat
  onClick: (chat: Chat) => void
  t: (k: string) => string
  lang: Lang
  compact?: boolean
  isEditable?: boolean
  isSaved?: boolean
  onEdit?: (chat: Chat) => void
  onDelete?: (chat: Chat) => void
  onSave?: (chat: Chat) => void
  onShare?: (chat: Chat) => void
  onReport?: (chat: Chat) => void
}

export function ChatCard({
  chat,
  onClick,
  t,
  lang,
  compact = false,
  isEditable = false,
  isSaved = false,
  onEdit,
  onDelete,
  onSave,
  onShare,
  onReport,
}: ChatCardProps) {
  const count = chat.risposte_count ?? 0
  const stato = calcolaStatoVitale(chat)
  const stile = STILI_STATO[stato]
  const statoStyle = STATO_STYLE[stato] ?? STATO_STYLE.archivio
  const isSbiadita = stato === 'foglia_secca'
  // NEW: flag to determine if it's an archived news item
  const isNewsArchived = chat.tipo === 'domanda_notizia' && stato === 'archivio'

  // 5-minute edit window
  const [canEditWindow, setCanEditWindow] = useState(false)
  useEffect(() => {
    const elapsed = Date.now() - new Date(chat.created_at).getTime()
    setCanEditWindow(elapsed <= 5 * 60 * 1000)
  }, [chat.created_at])

  // Action menu open state
  const [menuAperto, setMenuAperto] = useState(false)

  const handleCardClick = useCallback(() => {
    if (menuAperto) return
    onClick(chat)
  }, [menuAperto, onClick, chat])

  // Geo info
  const origRegione = translateRegion(chat.regione_originale || chat.regione, lang)
  const currRegione = translateRegion(chat.regione, lang)
  const origCitta = chat.citta_nome || origRegione
  const { name: origName, flag: origFlag } = splitRegionFlag(origRegione)
  const { name: currName, flag: currFlag } = splitRegionFlag(currRegione)

  const hasTravel =
    chat.regione_originale &&
    chat.regione_originale !== chat.regione

  return (
    <div
      className="relative mb-4 cursor-pointer group"
      onClick={handleCardClick}
    >
      <GlassCard
        className={`relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5 group-active:scale-[0.99] ${
          compact ? '!p-4' : 'p-5'
        } flex flex-col gap-0 overflow-hidden`}
      >

        <div className="flex items-center justify-between mb-3">

          {/* Author side — hidden when menu open */}
          <AnimatePresence mode="wait">
            {!menuAperto ? (
              <motion.div
                key="author"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 min-w-0"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-muted)] shrink-0 opacity-70">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-bold tracking-tight text-[var(--color-text-muted)] truncate">
                  {chat.autore}
                </span>
              </motion.div>
            ) : (
              /* Action icons row */
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bookmark */}
                <button
                  onClick={(e) => { e.stopPropagation(); onSave?.(chat); }}
                  className={`p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors ${isSaved ? 'text-amber-500 bg-amber-500/10' : 'text-[var(--color-text-muted)] hover:text-amber-500'}`}
                  title={t('salva') || 'Salva'}
                >
                  <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                </button>

                {/* Share */}
                <button
                  onClick={(e) => { e.stopPropagation(); onShare?.(chat); }}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-emerald-400 transition-colors"
                  title={t('condividi') || 'Condividi'}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Report */}
                <button
                  onClick={() => { onReport?.(chat); setMenuAperto(false) }}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                  title={t('segnala') || 'Segnala'}
                >
                  <Flag className="w-4 h-4" />
                </button>

                {/* Edit — only within 5 min window */}
                {isEditable && canEditWindow && onEdit && (
                  <button
                    onClick={() => { onEdit(chat); setMenuAperto(false) }}
                    className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-amber-400 transition-colors"
                    title={t('modifica') || 'Modifica (5 min)'}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Delete — only within 5 min window */}
                {isEditable && canEditWindow && onDelete && (
                  <button
                    onClick={() => { onDelete(chat); setMenuAperto(false) }}
                    className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                    title={t('elimina') || 'Elimina (5 min)'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right side: ··· or ✕ */}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuAperto(!menuAperto) }}
            className={`p-2 rounded-xl transition-all shrink-0 ml-2 ${
              menuAperto
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-main)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]'
            }`}
          >
            {menuAperto
              ? <X className="w-4 h-4" />
              : <MoreHorizontal className="w-4 h-4" />
            }
          </button>
        </div>

        {/* ── CONTENT ────────────────────────────────────────────────────── */}
        <p className={`${compact ? 'text-[14px] line-clamp-2' : 'text-[15px] line-clamp-3'} leading-relaxed font-semibold text-[var(--color-text-main)] mb-4`}>
          {chat.titolo}
        </p>

        {/* ── GEO ROW ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Origin */}
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />
            {origFlag && <span className="text-[13px] leading-none">{origFlag}</span>}
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] truncate">
              {origName || origCitta}
            </span>
          </div>

          {/* Arrow — only show if there was actual travel */}
          {hasTravel && (
            <ArrowRight className="w-3 h-3 shrink-0 text-blue-500/60" />
          )}

          {/* Destination — only if different from origin */}
          {hasTravel && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Plane className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />
              {currFlag && <span className="text-[13px] leading-none">{currFlag}</span>}
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] truncate">
                {currName}
              </span>
            </div>
          )}
        </div>

        {/* ── DIVIDER ────────────────────────────────────────────────────── */}
        <div className="h-px w-full bg-[var(--color-text-main)]/[0.06] mb-3" />

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2">

          {/* Left badges */}
          <div className="flex items-center gap-2">
            {/* Vital cycle badge - Specific handling for Archived News */}
            {isNewsArchived ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px] font-black uppercase tracking-widest">
                <span className="text-[12px] leading-none opacity-60">📰</span>
                <span>Archiviato</span>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-black uppercase tracking-widest ${statoStyle.bg} ${statoStyle.border}`}>
                <span className={`text-[12px] leading-none ${statoStyle.text}`}>{chat.tipo === 'domanda_notizia' ? '📰' : stile.icona}</span>
                <span className="text-[var(--color-text-muted)]">{count}</span>
              </div>
            )}

            {/* Revive badge — only if > 0 */}
            {(chat.revive_count && chat.revive_count > 0) ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-blue-500/8 text-blue-400/80 border-blue-500/15 text-[11px] font-black uppercase tracking-widest">
                <RotateCcw className="w-3 h-3" />
                <span>{chat.revive_count}</span>
              </div>
            ) : null}

            {/* KM Badge — fixed color */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-zinc-500/8 text-[var(--color-text-muted)] border-zinc-500/10 text-[11px] font-black uppercase tracking-widest">
              <Plane className="w-3 h-3 opacity-60" />
              <span>{Math.round(chat.km_viaggiati)} KM</span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] shrink-0">
            <Clock className="w-3 h-3" />
            <span>{timeAgoI18n(chat.ultima_attivita || chat.created_at, lang)}</span>
          </div>
        </div>

      </GlassCard>
    </div>
  )
}
