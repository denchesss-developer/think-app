"use client"

import React, { useState } from "react"
import { X, Flag } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/Button"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  chatId?: string
  rispostaId?: string
  testoContenuto?: string
  nickname: string
  t: (key: string) => string
}

export function ReportModal({ isOpen, onClose, chatId, rispostaId, testoContenuto, nickname, t }: ReportModalProps) {
  const [motivoSelezionato, setMotivoSelezionato] = useState<string | null>(null)
  const [dettagli, setDettagli] = useState("")
  const [invio, setInvio] = useState(false)
  const [inviato, setInviato] = useState(false)

  const MOTIVI_SEGNALAZIONE = [
    { id: "spam", label: t('motivo_spam'), icon: "📢" },
    { id: "odio", label: t('motivo_odio'), icon: "🚫" },
    { id: "violenza", label: t('motivo_violenza'), icon: "⚠️" },
    { id: "nsfw", label: t('motivo_nsfw'), icon: "🔞" },
    { id: "altro", label: t('motivo_altro'), icon: "💬" },
  ]

  if (!isOpen) return null

  async function inviaSegnalazione() {
    if (!motivoSelezionato) return
    setInvio(true)
    try {
      await supabase.from("segnalazioni").insert([{
        chat_id: chatId || null,
        risposta_id: rispostaId || null,
        motivo: motivoSelezionato,
        dettagli: dettagli.trim() || null,
        segnalato_da: nickname,
      }])

      // Notifica Telegram (silenziosa)
      fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId || null,
          rispostaId: rispostaId || null,
          testoContenuto: testoContenuto || null,
          motivo: motivoSelezionato,
          dettagli: dettagli.trim() || null,
          segnalatoDa: nickname,
        }),
      }).catch(err => console.error("Errore notifica Telegram:", err))

      setInviato(true)
    } catch (err) {
      console.error("Errore segnalazione:", err)
    }
    setInvio(false)
  }

  function chiudi() {
    setMotivoSelezionato(null)
    setDettagli("")
    setInviato(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={chiudi} />
      <div className="relative w-full max-w-md rounded-3xl bg-[var(--color-bg-panel)] backdrop-blur-2xl border border-[var(--color-border-subtle)] shadow-2xl p-6 space-y-5 animate-in fade-in-up duration-300">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-black tracking-tight">{t('segnala_contenuto')}</h2>
          </div>
          <button type="button" onClick={chiudi} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviato ? (
          <div className="py-8 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <h3 className="text-lg font-bold">{t('segnalazione_inviata')}</h3>
            <p className="text-[14px] text-[var(--color-text-muted)] font-medium">
              {t('grazie_segnalazione')}
            </p>
            <Button onClick={chiudi} className="mt-4">{t('chiudi')}</Button>
          </div>
        ) : (
          <>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
              {t('seleziona_motivo')}
            </p>

            <div className="space-y-2">
              {MOTIVI_SEGNALAZIONE.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMotivoSelezionato(m.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3 ${
                    motivoSelezionato === m.id 
                      ? "border-red-500/50 bg-red-500/10 shadow-sm" 
                      : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className="font-bold text-[14px]">{m.label}</span>
                </button>
              ))}
            </div>

            {motivoSelezionato === "altro" && (
              <textarea
                placeholder={t('descrivi_problema')}
                value={dettagli}
                onChange={(e) => setDettagli(e.target.value)}
                className="w-full p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[14px] font-medium outline-none resize-none h-24 placeholder:text-[var(--color-text-faint)]"
              />
            )}

            <Button
              onClick={inviaSegnalazione}
              variant="danger"
              size="lg"
              className="w-full"
              disabled={!motivoSelezionato || invio}
            >
              {invio ? t('invio') : t('invia_segnalazione')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
