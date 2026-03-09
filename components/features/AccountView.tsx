import React from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export type AppTheme = "light" | "dark" | "system"

interface AccountViewProps {
  utenteLoggato: Utente | null
  mioNickname: string
  setMioNickname: (v: string) => void
  nicknameErrorMessage: (nick: string) => string
  accountLoading: boolean
  appTheme: AppTheme
  setAppTheme: (t: AppTheme) => void
  logout: () => void
}

export function AccountView({
  utenteLoggato, 
  mioNickname, 
  setMioNickname, 
  nicknameErrorMessage,
  accountLoading,
  appTheme,
  setAppTheme,
  logout
}: AccountViewProps) {
  
  if (!utenteLoggato) {
    return (
      <div className="space-y-6 pb-28 fade-in-up animate-in duration-500">
        <div className="text-center">
          <h2 className="text-[28px] font-black tracking-tight mb-1">Account</h2>
          <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Visitatore Anonimo
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
            <h3 className="text-[17px] font-black tracking-tight">Sblocca il Potenziale</h3>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
              Crea un account per salvare pensieri, tenere traccia delle risposte e molto altro.
            </p>
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
              className="w-full mt-2"
            >
              Accedi o Registrati
            </Button>
          </div>
        </div>

        <div className="h-px bg-[var(--color-border-subtle)]" />

        {/* Impostazioni Globali (Visibili a tutti) */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1">Impostazioni</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
              <span className="font-bold text-[14px]">Lingua App</span>
              <select className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer appearance-none text-right">
                <option value="it" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Italiano</option>
                <option value="en" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">English</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
              <span className="font-bold text-[14px]">Tema App</span>
              <select 
                value={appTheme} 
                onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer appearance-none text-right"
              >
                <option value="system" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Sistema</option>
                <option value="light" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Chiaro</option>
                <option value="dark" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Scuro</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] opacity-50 cursor-not-allowed">
              <span className="font-bold text-[14px]">Notifiche Push</span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-brand-amber)]">Presto</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-28 fade-in-up animate-in duration-500">
      <div className="text-center">
        <h2 className="text-[28px] font-black tracking-tight mb-1">Account</h2>
        <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {utenteLoggato.app_metadata?.provider === "google" ? "Connesso con Google" : "Connesso via Email"} 
          <span className="block mt-1 lowercase font-medium tracking-normal text-[var(--color-text-main)] sm:inline sm:mt-0 sm:ml-2">{utenteLoggato.email}</span>
        </p>
      </div>

      <div className="relative p-6 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-amber-dim)] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[var(--color-bg-panel)] backdrop-blur-2xl -z-10" />
        <div className="absolute inset-0 border border-[var(--color-brand-amber)]/30 rounded-3xl pointer-events-none" />
        
        <Badge variant="premium" className="mb-4">Pioniera di Think</Badge>
        <div className="text-[15px] font-medium text-[var(--color-text-main)]/80 leading-relaxed">
          Sei tra i primi esploratori ad utilizzare Think. Il tuo account ha il badge premium attivo.
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">
          Il tuo Pseudonimo Globale
        </label>
        <div className="relative">
          <Input 
            value={mioNickname}
            onChange={(e) => setMioNickname(e.target.value)}
            className="w-full font-bold pr-14 bg-[var(--color-bg-panel)] h-12 rounded-2xl border-[var(--color-border-subtle)]"
          />
          <Button 
            size="icon"
            onClick={() => {
              const err = nicknameErrorMessage(mioNickname)
              if (err) { alert(err); return }
              localStorage.setItem("think_nickname", mioNickname)
              alert("Nickname salvato con successo!")
            }}
            className="absolute right-1 top-1 bottom-1 w-10 h-10 rounded-xl"
            title="Salva"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </Button>
        </div>
        <p className="text-[11px] font-semibold text-[var(--color-text-faint)] ml-1">
          Solo lettere, numeri e underscore. 3–20 caratteri.
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
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1">Impostazioni</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
                <span className="font-bold text-[14px]">Lingua App</span>
                <select className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer">
                  <option value="it" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Italiano</option>
                  <option value="en" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">English</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
                <span className="font-bold text-[14px]">Tema App</span>
                <select 
                  value={appTheme} 
                  onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                  className="bg-transparent text-[var(--color-brand-blue)] font-bold text-sm outline-none cursor-pointer text-right"
                >
                  <option value="system" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Sistema</option>
                  <option value="light" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Chiaro</option>
                  <option value="dark" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">Scuro</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] opacity-50 cursor-not-allowed">
                <span className="font-bold text-[14px]">Notifiche Push</span>
                <span className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-brand-amber)]">Presto</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8">
        <Button onClick={logout} variant="danger" size="lg" className="w-full">
          Logout
        </Button>
      </div>
    </div>
  )
}

