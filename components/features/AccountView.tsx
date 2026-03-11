import React, { useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { type Lang, LANGS } from "@/lib/i18n"

export type AppTheme = "light" | "dark" | "system"

interface AccountViewProps {
  utenteLoggato: Utente | null
  mioNickname: string
  setMioNickname: (v: string) => void
  onSaveNickname: (nick: string) => Promise<{ success: boolean; error?: string }>
  nicknameErrorMessage: (nick: string) => string
  accountLoading: boolean
  appTheme: AppTheme
  setAppTheme: (t: AppTheme) => void
  logout: () => void
  t: (key: string) => string
  lang: Lang
  setLang: (l: Lang) => void
}

export function AccountView({
  utenteLoggato,
  mioNickname,
  setMioNickname,
  onSaveNickname,
  nicknameErrorMessage,
  accountLoading,
  appTheme,
  setAppTheme,
  logout,
  t,
  lang,
  setLang
}: AccountViewProps) {

  if (!utenteLoggato) {
    return (
      <div className="space-y-6 pb-28 fade-in-up animate-in duration-500">
        <div className="text-center">
          <h2 className="text-[28px] font-black tracking-tight mb-1">{t('account')}</h2>
          <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            {t('visitatore_anonimo')}
          </p>
        </div>

        {/* CTA Login — in cima, ben visibile */}
        <div className="relative p-6 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-blue)]/20 to-[var(--color-brand-cyan)]/10 pointer-events-none" />
          <div className="absolute inset-0 bg-[var(--color-bg-panel)] backdrop-blur-2xl -z-10" />
          <div className="absolute inset-0 border border-[var(--color-brand-blue)]/30 rounded-3xl pointer-events-none" />
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-brand-blue)]/15 border border-[var(--color-brand-blue)]/30 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-[17px] font-black tracking-tight">{t('sblocca_potenziale')}</h3>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
              {t('crea_account_desc')}
            </p>
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
              className="w-full mt-2"
            >
              {t('accedi_registrati')}
            </Button>
          </div>
        </div>

        <div className="h-px bg-[var(--color-border-subtle)]" />

        {/* Impostazioni Globali (Visibili a tutti) */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1">{t('impostazioni')}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
              <span className="font-bold text-[14px]">{t('lingua_app')}</span>
              <select 
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer appearance-none text-right"
              >
                {LANGS.map(l => (
                  <option key={l.code} value={l.code} className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{l.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
              <span className="font-bold text-[14px]">{t('tema_app')}</span>
              <select
                value={appTheme}
                onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer appearance-none text-right"
              >
                <option value="system" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('sistema')}</option>
                <option value="light" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('chiaro')}</option>
                <option value="dark" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('scuro')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] opacity-50 cursor-not-allowed">
              <span className="font-bold text-[14px]">{t('notifiche_push')}</span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-brand-amber)]">{t('presto')}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-28 fade-in-up animate-in duration-500">
      <div className="text-center">
        <h2 className="text-[28px] font-black tracking-tight mb-1">{t('account')}</h2>
        <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {utenteLoggato.app_metadata?.provider === "google" ? t('connesso_google') : t('connesso_email')}
          <span className="block mt-1 font-medium tracking-normal text-[var(--color-text-main)] sm:inline sm:mt-0 sm:ml-2">{t('account_verificato')}</span>
        </p>
      </div>

      <div className="relative p-6 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-amber-dim)] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[var(--color-bg-panel)] backdrop-blur-2xl -z-10" />
        <div className="absolute inset-0 border border-[var(--color-brand-amber)]/30 rounded-3xl pointer-events-none" />

        <Badge variant="premium" className="mb-4">{t('badge_pioniere')}</Badge>
        <div className="text-[15px] font-medium text-[var(--color-text-main)]/80 leading-relaxed">
          {t('badge_desc')}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">
          {t('pseudonimo')}
        </label>
        <div className="relative">
          <Input
            value={mioNickname}
            onChange={(e) => setMioNickname(e.target.value)}
            className="w-full font-bold pr-14 bg-[var(--color-bg-panel)] h-12 rounded-2xl border-[var(--color-border-subtle)]"
          />
          <Button
            size="icon"
            onClick={async () => {
              const res = await onSaveNickname(mioNickname)
              if (res.success) {
                alert(t('nick_salvato'))
              } else {
                alert(res.error || t('errore_salvataggio'))
              }
            }}
            className="absolute right-1 top-1 bottom-1 w-10 h-10 rounded-xl"
            title={t('salva')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
          </Button>
        </div>
        <p className="text-[11px] font-semibold text-[var(--color-text-faint)] ml-1">
          {t('nick_regole')}
        </p>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)] my-8" />

      {accountLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-text-main)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1">{t('impostazioni')}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
                <span className="font-bold text-[14px]">{t('lingua_app')}</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer appearance-none text-right"
                >
                  {LANGS.map(l => (
                    <option key={l.code} value={l.code} className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
                <span className="font-bold text-[14px]">{t('tema_app')}</span>
                <select
                  value={appTheme}
                  onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                  className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer appearance-none text-right"
                >
                  <option value="system" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('sistema')}</option>
                  <option value="light" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('chiaro')}</option>
                  <option value="dark" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('scuro')}</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] opacity-50 cursor-not-allowed">
                <span className="font-bold text-[14px]">{t('notifiche_push')}</span>
                <span className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-brand-amber)]">{t('presto')}</span>
              </div>

              {/* Sezione Feedback / Segnalazioni — Form Inline verso API Telegram */}
              <FeedbackSection autore={utenteLoggato?.email ? 'Utente' : 'Anonimo'} t={t} />
            </div>
          </div>
        </div>
      )}

      <div className="pt-8">
        <Button onClick={logout} variant="danger" size="lg" className="w-full">
          {t('logout')}
        </Button>
      </div>
    </div>
  )
}


// --------------------------------------------------------------------------
// Componente: FeedbackSection (Bug & Consigli → API Telegram → Topic N.4)
// --------------------------------------------------------------------------
function FeedbackSection({ autore, t }: { autore: string, t: (k: string) => string }) {
  const [aperto, setAperto] = useState(false)
  const [tipo, setTipo] = useState<'bug' | 'consiglio'>('consiglio')
  const [testo, setTesto] = useState('')
  const [stato, setStato] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  async function invia() {
    if (!testo.trim()) return
    setStato('loading')
    try {
      const res = await fetch('/api/telegram/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, testo: testo.trim(), autore })
      })
      setStato(res.ok ? 'ok' : 'err')
      if (res.ok) { setTesto(''); setTimeout(() => { setAperto(false); setStato('idle') }, 2500) }
    } catch { setStato('err') }
  }

  return (
    <div className="pt-4">
      {!aperto ? (
        <div className="flex justify-center">
          <button
            onClick={() => setAperto(true)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-semibold text-xs transition-colors py-2 px-4 rounded-xl hover:bg-[var(--color-bg-hover)]"
          >
            {t('segnala_bug')}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{t('lascia_messaggio')}</p>
          <div className="flex gap-2">
            {(['bug', 'consiglio'] as const).map(tp => (
              <button
                key={tp}
                onClick={() => setTipo(tp)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors border ${tipo === tp ? 'bg-[var(--color-brand-blue)]/10 border-[var(--color-brand-blue)]/40 text-[var(--color-brand-blue)]' : 'border-[var(--color-border-subtle)] text-[var(--color-text-faint)]'}`}
              >
                {t(tp)}
              </button>
            ))}
          </div>
          <textarea
            value={testo}
            onChange={e => setTesto(e.target.value)}
            placeholder={tipo === 'bug' ? t('descrivi_problema') : t('tua_idea')}
            rows={3}
            className="w-full bg-[var(--color-bg-panel)] border border-[var(--color-border-subtle)] rounded-xl p-3 text-sm resize-none outline-none focus:border-[var(--color-brand-blue)]/60 text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)]"
          />
          {stato === 'ok' && <p className="text-green-500 text-xs font-semibold text-center">{t('ricevuto_grazie')}</p>}
          {stato === 'err' && <p className="text-red-400 text-xs font-semibold text-center">{t('errore_riprova')}</p>}
          <div className="flex gap-2">
            <button onClick={() => setAperto(false)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
              {t('annulla')}
            </button>
            <button
              onClick={invia}
              disabled={stato === 'loading' || !testo.trim()}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-[var(--color-brand-blue)] text-white disabled:opacity-50 transition-opacity"
            >
              {stato === 'loading' ? t('invio') : t('invia')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
