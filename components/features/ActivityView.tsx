"use client"

import React from "react"
import { Pencil, MessageSquare, Bookmark, Clock, Flame } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { timeAgoI18n, translateRegion, type Lang } from "@/lib/i18n"

interface ActivityViewProps {
  utenteLoggato: Utente | null
  myThinks: Chat[]
  myRepliedChats: Chat[]
  bookmarks: Bookmark[]
  accountLoading: boolean
  apriChat: (c: Chat) => void
  t: (key: string) => string
  lang: Lang
}

export function ActivityView({
  utenteLoggato,
  myThinks,
  myRepliedChats,
  bookmarks,
  accountLoading,
  apriChat,
  t,
  lang,
}: ActivityViewProps) {

  if (!utenteLoggato) {
    return (
      <div className="space-y-8 pb-10 fade-in-up animate-in duration-500">
        <div className="text-center">
          <h2 className="text-[28px] font-black tracking-tight mb-1">{t('attivita')}</h2>
          <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('la_tua_cronologia')}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 mb-4 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-[var(--color-text-faint)]" />
          </div>
          <h2 className="text-lg font-bold mb-2">{t('accedi_attivita')}</h2>
          <p className="text-[14px] font-medium text-[var(--color-text-muted)] mb-6">
            {t('pensieri_risposte_qui')}
          </p>
          <Button onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}>
            {t('accedi_registrati')}
          </Button>
        </div>
      </div>
    )
  }

  if (accountLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-text-main)] border-t-transparent animate-spin" />
      </div>
    )
  }

  const savedChats = bookmarks.map(b => b.chat).filter((c): c is Chat => c !== undefined)

  return (
    <div className="space-y-8 pb-10 fade-in-up animate-in duration-500">
      <div className="text-center">
        <h2 className="text-[28px] font-black tracking-tight mb-1">{t('attivita')}</h2>
        <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {t('la_tua_cronologia')}
        </p>
      </div>

      {/* I miei Pensieri — con statistiche */}
      <ActivitySection
        icon={<Pencil className="w-4 h-4" />}
        title={t('miei_pensieri')}
        items={myThinks}
        onSelect={apriChat}
        emptyMsg={t('no_pensieri')}
        showStats
        lang={lang}
        t={t}
      />

      {/* Le mie Risposte */}
      <ActivitySection
        icon={<MessageSquare className="w-4 h-4" />}
        title={t('mie_risposte')}
        items={myRepliedChats}
        onSelect={apriChat}
        emptyMsg={t('no_risposte')}
        lang={lang}
        t={t}
      />

      {/* Pensieri Salvati */}
      <ActivitySection
        icon={<Bookmark className="w-4 h-4" />}
        title={t('pensieri_salvati')}
        items={savedChats}
        onSelect={apriChat}
        emptyMsg={t('no_salvati')}
        lang={lang}
        t={t}
      />
    </div>
  )
}

function ActivitySection({ icon, title, items, onSelect, emptyMsg, showStats, lang, t }: { 
  icon: React.ReactNode
  title: string
  items: Chat[]
  onSelect: (c: Chat) => void
  emptyMsg: string
  showStats?: boolean
  lang: Lang
  t: (k: string) => string
}) {
  const validItems = items.filter(Boolean)
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 ml-1">
        <span className="text-[var(--color-brand-blue)]">{icon}</span>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{title}</h3>
        {validItems.length > 0 && (
          <span className="text-[11px] font-bold text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10 px-2 py-0.5 rounded-full">
            {validItems.length}
          </span>
        )}
      </div>
      {validItems.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/50 text-center text-[13px] font-semibold text-[var(--color-text-faint)]">
          {emptyMsg}
        </div>
      ) : (
        <div className="space-y-2">
          {validItems.map((c, idx) => {
            const giorni = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24))
            const vitaLabel = giorni === 0 ? t('today') : `${giorni}${lang === 'it' ? 'g' : lang === 'de' ? ' T' : 'd'}`
            const haUltimaAtt = c.ultima_attivita && c.ultima_attivita !== c.created_at
            const gapRinascita = haUltimaAtt
              ? Math.floor((new Date(c.ultima_attivita!).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7))
              : 0
            const rinascite = Math.max(0, gapRinascita)

            return (
              <button
                key={`${c.id}-${idx}`}
                type="button"
                onClick={() => onSelect(c)}
                className="w-full text-left p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="font-bold text-[14px] mb-2 text-[var(--color-text-main)]">{c.titolo}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wide">{translateRegion(c.regione, lang)}</span>

                  {showStats && (
                    <>
                      {/* Risposte ricevute */}
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-2 py-0.5 rounded-full">
                        <MessageSquare className="w-3 h-3" />
                        {c.risposte_count || 0}
                      </span>

                      {/* Vita del pensiero */}
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {vitaLabel}
                      </span>

                      {/* Rinascite */}
                      {rinascite > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Flame className="w-3 h-3" />
                          {rinascite}×
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
