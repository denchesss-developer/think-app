"use client"

import React from "react"
import { Pencil, MessageSquare, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { timeAgo } from "@/components/features/ChatCard"

interface ActivityViewProps {
  utenteLoggato: Utente | null
  myThinks: Chat[]
  myRepliedChats: Chat[]
  bookmarks: Bookmark[]
  accountLoading: boolean
  apriChat: (c: Chat) => void
}

export function ActivityView({
  utenteLoggato,
  myThinks,
  myRepliedChats,
  bookmarks,
  accountLoading,
  apriChat,
}: ActivityViewProps) {

  if (!utenteLoggato) {
    return (
      <div className="space-y-8 pb-10 fade-in-up animate-in duration-500">
        <div className="text-center">
          <h2 className="text-[28px] font-black tracking-tight mb-1">Attività</h2>
          <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            La tua cronologia
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 mb-4 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-[var(--color-text-faint)]" />
          </div>
          <h2 className="text-lg font-bold mb-2">Accedi per vedere la tua attività</h2>
          <p className="text-[14px] font-medium text-[var(--color-text-muted)] mb-6">
            I tuoi pensieri, risposte e segnalibri appariranno qui.
          </p>
          <Button onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}>
            Accedi o Registrati
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
        <h2 className="text-[28px] font-black tracking-tight mb-1">Attività</h2>
        <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          La tua cronologia
        </p>
      </div>

      {/* I miei Pensieri */}
      <ActivitySection
        icon={<Pencil className="w-4 h-4" />}
        title="I miei Pensieri"
        items={myThinks}
        onSelect={apriChat}
        emptyMsg="Non hai ancora creato nessun pensiero."
      />

      {/* Le mie Risposte */}
      <ActivitySection
        icon={<MessageSquare className="w-4 h-4" />}
        title="Le mie Risposte"
        items={myRepliedChats}
        onSelect={apriChat}
        emptyMsg="Non hai ancora risposto a nessun pensiero."
      />

      {/* Pensieri Salvati */}
      <ActivitySection
        icon={<Bookmark className="w-4 h-4" />}
        title="Pensieri Salvati"
        items={savedChats}
        onSelect={apriChat}
        emptyMsg="Non hai salvato nessun pensiero."
      />
    </div>
  )
}

function ActivitySection({ icon, title, items, onSelect, emptyMsg }: { 
  icon: React.ReactNode
  title: string
  items: Chat[]
  onSelect: (c: Chat) => void
  emptyMsg: string 
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
          {validItems.map((c, idx) => (
            <button
              key={`${c.id}-${idx}`}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full text-left p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="font-bold text-[14px] mb-1.5 text-[var(--color-text-main)]">{c.titolo}</div>
              <div className="text-[11px] font-bold text-[var(--color-text-faint)] tracking-wide">
                <span className="uppercase">{c.regione}</span> • {timeAgo(c.ultima_attivita || c.created_at)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
