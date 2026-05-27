"use client"

import React, { useState, useEffect } from "react"
import { User, Globe, Check, Activity, Navigation2, Zap, Trophy, Leaf, Flame, Edit2, Moon, Languages, Orbit, Bell, Shield, LogOut } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { type Lang, LANGS } from "@/lib/i18n"
import { useToast } from "@/components/ui/Toast"
import { GamificationView } from "@/components/features/GamificationView"
import { containsBannedWord } from "@/lib/bannedWords"

function nicknameErrorMessage(nick: string) {
  const n = (nick || "").trim()
  if (n.length < 3) return "Il Thinkname deve contenere almeno 3 caratteri."
  if (n.length > 15) return "Il Thinkname non può superare i 15 caratteri."
  if (containsBannedWord(n)) return "Il Thinkname contiene una parola non consentita."
  return ""
}

export type AppTheme = "light" | "dark" | "system"

interface AccountViewProps {
  utenteLoggato: any | null
  mioNickname: string
  setMioNickname: (v: string) => void
  onSaveNickname: (nick: string) => Promise<{ success: boolean; error?: string }>
  accountLoading: boolean
  appTheme: AppTheme
  setAppTheme: (t: AppTheme) => void
  logout: () => void
  t: (key: string) => string
  lang: Lang
  setLang: (l: Lang) => void
  pushEnabled: boolean
  onTogglePush: () => void
  autoRotate?: boolean
  onToggleRotate?: () => void
  myThinks: any[]
  // Gamification
  gamification: any | null
  depthLevels: any[]
  challenges: any[]
  userChallenges: any[]
  currentDepth: any | undefined
  nextDepth: any | undefined
  progressToNext: number
  gamificationLoading: boolean
}

export function AccountView({
  utenteLoggato,
  mioNickname,
  setMioNickname,
  onSaveNickname,
  accountLoading,
  appTheme,
  setAppTheme,
  logout,
  t,
  lang,
  setLang,
  pushEnabled,
  onTogglePush,
  autoRotate = false,
  onToggleRotate,
  myThinks,
  gamification,
  depthLevels,
  challenges,
  userChallenges,
  currentDepth,
  nextDepth,
  progressToNext,
  gamificationLoading,
}: AccountViewProps) {
  const [showGamification, setShowGamification] = useState(false)
  const [showLegal, setShowLegal] = useState(false)

  // Nickname Editing State
  const { toast } = useToast()
  const [isEditingNick, setIsEditingNick] = useState(false)
  const [tempNick, setTempNick] = useState(mioNickname)
  const [nickSaving, setNickSaving] = useState(false)
  const [nickError, setNickError] = useState("")

  useEffect(() => {
    setTempNick(mioNickname)
  }, [mioNickname])

  const handleSaveNick = async () => {
    const err = nicknameErrorMessage(tempNick)
    if (err) {
      setNickError(err)
      return
    }
    setNickSaving(true)
    setNickError("")
    const res = await onSaveNickname(tempNick)
    setNickSaving(false)
    if (res.success) {
      setIsEditingNick(false)
      toast(lang === 'it' ? 'Thinkname salvato!' : 'Thinkname saved!', 'success')
    } else {
      setNickError(res.error || "Errore durante il salvataggio")
    }
  }

  const gamificationPanel = (
    <div className="mt-8">
      <GamificationView
        gamification={gamification}
        depthLevels={depthLevels}
        challenges={challenges}
        userChallenges={userChallenges}
        currentDepth={currentDepth}
        nextDepth={nextDepth}
        progressToNext={progressToNext}
        loading={gamificationLoading}
        isAnonymous={!utenteLoggato}
      />
    </div>
  )

  // -------------------------
  // STATO ANONIMO
  // -------------------------
  if (!utenteLoggato) {
    return (
      <div className="space-y-8 pb-10 fade-in-up animate-in duration-500">
        <header className="text-center pt-6 pb-2">
          <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text-main)]">Account</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
            {t('visitatore_anonimo') || 'Visitatore Anonimo'}
          </p>
          <div className="w-20 h-20 mx-auto rounded-[2.5rem] bg-[var(--color-bg-card)] border border-transparent flex items-center justify-center shadow-2xl mt-6">
             <User className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>
        </header>

        {/* CTA Login: Premium Card */}
        <div className="relative group overflow-hidden rounded-[2.5rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-transparent p-8 transition-all hover:border-blue-500/40 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-20 transition-opacity">
            <Globe className="w-20 h-20 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 relative z-10">{t('sblocca_potenziale') || 'Sblocca il tuo potenziale'}</h3>
          <p className="text-sm text-zinc-400 mb-8 max-w-[80%] leading-relaxed relative z-10">
            Crea un account per tracciare i tuoi spostamenti, raccogliere badge e unirti alla community globale.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-[0.98]"
          >
            {t('accedi_registrati') || 'Accedi o Registrati'}
          </button>
        </div>

        {/* Impostazioni Anonimo */}
        <div className="grid grid-cols-1 gap-4">
           {gamificationPanel}
           <div className="space-y-3 mt-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-4 mb-2">Impostazioni</h4>
              <div className="glass-monolith rounded-[2.5rem] p-3 space-y-1">
                <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--color-bg-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Languages className="w-4 h-4" />
                    </div>
                    <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('lingua_app') || 'Lingua'}</span>
                  </div>
                  <select 
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Lang)}
                    className="bg-transparent text-[var(--color-text-muted)] hover:text-blue-400 font-bold text-sm outline-none cursor-pointer text-right appearance-none pr-2"
                  >
                    {LANGS.map(l => (
                      <option key={l.code} value={l.code} className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{l.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--color-bg-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('tema_app') || 'Tema'}</span>
                  </div>
                  <select
                    value={appTheme}
                    onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                    className="bg-transparent text-[var(--color-text-muted)] hover:text-purple-400 font-bold text-sm outline-none cursor-pointer text-right appearance-none pr-2"
                  >
                    <option value="system" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('sistema') || 'Sistema'}</option>
                    <option value="light" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('chiaro') || 'Chiaro'}</option>
                    <option value="dark" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('scuro') || 'Scuro'}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--color-bg-hover)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Orbit className="w-4 h-4" />
                    </div>
                    <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('rotazione_orbitale') || 'Rotazione Orbitale'}</span>
                  </div>
                  <button
                    onClick={onToggleRotate}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${autoRotate ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-black/10 dark:bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoRotate ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
           </div>
        </div>
      </div>
    )
  }

  // -------------------------
  // STATO LOGGATO
  // -------------------------
  const totalKm = myThinks?.reduce((acc, chat) => acc + (chat.km_viaggiati || 0), 0) || 0;
  const connections = myThinks?.length || 0;

  return (
    <div className="space-y-6 pb-32 px-4 fade-in-up animate-in duration-500">
      <header className="pt-8 pb-2">
        <h2 className="text-4xl font-black tracking-tighter text-[var(--color-text-main)]">Il tuo Profilo</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Thinker Identity</p>
      </header>

      {/* IDENTITY CARD (Premium Profile Header) */}
      <div className="glass-monolith rounded-[2.5rem] p-6 flex flex-col items-center relative overflow-hidden text-center shadow-xl shadow-black/5 border border-white/10 dark:border-white/5">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Globe className="w-40 h-40 text-blue-500" />
        </div>
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[3px] shadow-2xl shadow-blue-500/20 mb-4 relative z-10">
          <div className="w-full h-full rounded-full bg-[var(--color-bg-panel)] flex items-center justify-center overflow-hidden">
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600 uppercase">
              {(mioNickname || 'T')[0]}
            </span>
          </div>
        </div>

        {!isEditingNick ? (
          <div className="flex items-center gap-3 mb-1 relative z-10">
            <h3 className="text-2xl font-black text-[var(--color-text-main)] tracking-tight">{mioNickname || 'Thinker'}</h3>
            <button 
              onClick={() => { setTempNick(mioNickname); setIsEditingNick(true); setNickError(""); }}
              className="p-1.5 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-blue-500 transition-colors shadow-sm"
              aria-label="Modifica Thinkname"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mb-2 w-full max-w-[240px] relative z-10">
            <div className="flex w-full gap-2">
              <Input 
                value={tempNick} 
                onChange={e => setTempNick(e.target.value)}
                className="h-10 text-center font-bold bg-[var(--color-bg-base)] border-none shadow-inner rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/50"
                placeholder="Nuovo Thinkname"
                maxLength={20}
              />
              <Button size="icon" className="h-10 w-10 flex-shrink-0 rounded-xl bg-blue-500 text-white hover:bg-blue-600 shadow-md transition-all active:scale-95" onClick={handleSaveNick} disabled={nickSaving}>
                {nickSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
            </div>
            {nickError && <span className="text-[10px] text-red-500 font-bold">{nickError}</span>}
          </div>
        )}
        
        {utenteLoggato?.email && (
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-4 relative z-10">{utenteLoggato.email}</p>
        )}

        {currentDepth && (
          <div className="relative z-10 mt-1">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-black rounded-full shadow-sm">
              {currentDepth.nome}
            </Badge>
          </div>
        )}
      </div>

      {/* DASHBOARD ANALITICA */}
      <div className="space-y-3 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-4 mb-2">
          Le tue metriche
        </h4>
        <div className="glass-monolith rounded-[2.5rem] p-6 relative overflow-hidden shadow-xl shadow-black/5 border border-white/10 dark:border-white/5">
          {/* Sfondo decorativo */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <Activity className="w-48 h-48" />
          </div>

          <div className="grid grid-cols-2 gap-y-8 gap-x-6 relative z-10">
            {/* Metrica 1: Pensieri */}
            <div className="flex flex-col group">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Zap className="w-3.5 h-3.5 text-blue-500" />
                 </div>
                 <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Pensieri</span>
               </div>
               <div className="text-3xl font-black text-[var(--color-text-main)] tracking-tight ml-[36px]">
                 {connections}
               </div>
            </div>

            {/* Metrica 2: Portata (KM) */}
            <div className="flex flex-col group">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Navigation2 className="w-3.5 h-3.5 text-purple-500" />
                 </div>
                 <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Distanza</span>
               </div>
               <div className="text-3xl font-black text-[var(--color-text-main)] tracking-tight ml-[36px] flex items-baseline">
                 {Math.round(totalKm).toLocaleString('it-IT')}<span className="text-sm text-[var(--color-text-muted)] ml-1 font-bold">km</span>
               </div>
            </div>

            {/* Metrica 3: Streak */}
            <div className="flex flex-col group">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Flame className="w-3.5 h-3.5 text-orange-500" />
                 </div>
                 <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Costanza</span>
               </div>
               <div className="text-3xl font-black text-[var(--color-text-main)] tracking-tight ml-[36px] flex items-baseline">
                 {gamification?.streak_days ?? 0}<span className="text-sm text-[var(--color-text-muted)] ml-1 font-bold">gg</span>
               </div>
            </div>

            {/* Metrica 4: Punti */}
            <div className="flex flex-col group">
               <div className="flex items-center gap-2 mb-2">
                 <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                 </div>
                 <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Punti</span>
               </div>
               <div className="text-3xl font-black text-[var(--color-text-main)] tracking-tight ml-[36px]">
                 {(gamification?.think_points ?? 0).toLocaleString("it-IT")}
               </div>
            </div>
          </div>

          {/* Progress Bar del Livello integrata come Footer della Card */}
          {nextDepth && (
            <div className="mt-8 pt-5 border-t border-[var(--glass-border)] relative z-10">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Progresso Livello</span>
                  <span className="text-[11px] font-bold text-emerald-500 mt-0.5">
                    Mancano {nextDepth.soglia_punti - (gamification?.think_points ?? 0)} pts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[var(--color-text-main)] uppercase tracking-wider">{nextDepth.nome}</span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden shadow-inner p-[2px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${progressToNext}%` }}
                >
                  <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {gamificationPanel}

      {/* PREFERENZE (iOS Settings Style) */}
      <div className="space-y-3 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2 mb-2">Preferenze</h4>
        <div className="glass-monolith rounded-[2rem] p-1.5 flex flex-col shadow-sm border border-white/5">
          
          <div className="flex items-center justify-between p-3.5 border-b border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-colors rounded-t-[1.6rem]">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('lingua_app') || 'Lingua'}</span>
            </div>
            <div className="flex items-center gap-1">
                <select 
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-transparent text-[var(--color-text-muted)] hover:text-blue-500 font-semibold text-[13px] outline-none cursor-pointer text-right appearance-none pr-1"
                >
                {LANGS.map(l => (
                    <option key={l.code} value={l.code} className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{l.label}</option>
                ))}
                </select>
                <div className="text-[var(--color-text-faint)] text-xs font-medium">›</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 border-b border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('tema_app') || 'Tema'}</span>
            </div>
            <div className="flex items-center gap-1">
                <select
                value={appTheme}
                onChange={(e) => setAppTheme(e.target.value as AppTheme)}
                className="bg-transparent text-[var(--color-text-muted)] hover:text-purple-500 font-semibold text-[13px] outline-none cursor-pointer text-right appearance-none pr-1"
                >
                <option value="system" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('sistema') || 'Sistema'}</option>
                <option value="light" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('chiaro') || 'Chiaro'}</option>
                <option value="dark" className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{t('scuro') || 'Scuro'}</option>
                </select>
                <div className="text-[var(--color-text-faint)] text-xs font-medium">›</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 border-b border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('notifiche_push') || 'Notifiche'}</span>
            </div>
            <button 
              onClick={onTogglePush}
              className={`w-[46px] h-[26px] rounded-full p-1 transition-colors duration-300 shadow-inner ${pushEnabled ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'}`}
            >
              <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${pushEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 hover:bg-[var(--color-bg-hover)] transition-colors rounded-b-[1.6rem]">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Orbit className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-bold text-[var(--color-text-main)]">{t('rotazione_orbitale') || 'Rotazione Mappa'}</span>
            </div>
            <button
              onClick={onToggleRotate}
              className={`w-[46px] h-[26px] rounded-full p-1 transition-colors duration-300 shadow-inner ${autoRotate ? 'bg-emerald-500' : 'bg-black/10 dark:bg-white/10'}`}
            >
              <div className={`w-[18px] h-[18px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${autoRotate ? 'translate-x-[20px]' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* PRIVACY & LEGAL SECTION */}
      <div className="space-y-3 mt-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2 mb-2">Supporto & Legale</h4>
        <div className="glass-monolith rounded-[2rem] overflow-hidden border border-white/5">
          <button
            onClick={() => setShowLegal(v => !v)}
            className="w-full flex items-center justify-between p-4 group hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                showLegal ? 'bg-blue-500/10 text-blue-500' : 'bg-black/5 dark:bg-white/5 text-[var(--color-text-muted)]'
              }`}>
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[14px] text-left">Privacy & Legale</div>
              </div>
            </div>
            <div className={`w-6 h-6 flex items-center justify-center text-[var(--color-text-muted)] transition-transform duration-300 ${
              showLegal ? 'rotate-90' : ''
            }`}>
              ›
            </div>
          </button>

          {showLegal && (
            <div className="px-5 pb-5 space-y-1 border-t border-transparent bg-[var(--color-bg-base)]/30 pt-2">
              <div className="flex items-center justify-between py-3 border-b border-[var(--glass-border)]">
                <span className="text-[13px] font-bold text-[var(--color-text-main)]">Termini di Servizio</span>
                <Link href="/terms-of-service" className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)] hover:text-blue-500 transition-colors">
                  Leggi ›
                </Link>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--glass-border)]">
                <span className="text-[13px] font-bold text-[var(--color-text-main)]">Privacy Policy</span>
                <Link href="/privacy-policy" className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)] hover:text-blue-500 transition-colors">
                  Leggi ›
                </Link>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--glass-border)]">
                <span className="text-[13px] font-bold text-[var(--color-text-main)]">Cookie Policy</span>
                <Link href="/cookie-policy" className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)] hover:text-blue-500 transition-colors">
                  Leggi ›
                </Link>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] font-bold text-[var(--color-text-main)]">Preferenze Cookie</span>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-banner'))}
                  className="text-[11px] font-black uppercase tracking-wider text-[var(--color-brand-blue)] hover:text-blue-400 bg-blue-500/10 px-4 py-2 rounded-xl transition-colors"
                >
                  Modifica
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <FeedbackSection autore={utenteLoggato.email || 'Utente'} t={t} />
      </div>

      {/* LOGOUT */}
      <div className="flex justify-center mt-6">
        <button 
          onClick={logout} 
          className="py-2 px-4 flex items-center justify-center gap-1.5 text-[var(--color-text-muted)] font-black uppercase text-[10px] tracking-[0.15em] border border-transparent rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-3.5 h-3.5" />
          ELIMINA PROFILO
        </button>
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
            className="text-[var(--color-text-muted)] hover:text-blue-500 font-bold text-[13px] transition-colors py-3 px-6 rounded-2xl hover:bg-[var(--color-bg-hover)] border border-transparent hover:border-blue-500/20"
          >
            {t('segnala_bug') || '💡 Lascia un Feedback'}
          </button>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-transparent bg-[var(--color-bg-card)] p-5 space-y-4 shadow-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)]">{t('lascia_messaggio') || 'Invia un Feedback'}</p>
          <div className="flex gap-2 bg-[var(--color-bg-base)] p-1.5 rounded-2xl">
            {(['bug', 'consiglio'] as const).map(tp => (
              <button
                key={tp}
                onClick={() => setTipo(tp)}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all ${tipo === tp ? 'bg-white dark:bg-zinc-800 text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]'}`}
              >
                {t(tp) || (tp === 'bug' ? 'Segnala Bug' : 'Consiglio')}
              </button>
            ))}
          </div>
          <textarea
            value={testo}
            onChange={e => setTesto(e.target.value)}
            placeholder={tipo === 'bug' ? (t('descrivi_problema') || 'Descrivi il problema...') : (t('tua_idea') || 'La tua idea per migliorare l\'app...')}
            rows={4}
            className="w-full bg-[var(--color-bg-panel)] border border-[var(--glass-border)] rounded-2xl p-4 text-[14px] resize-none outline-none focus:border-blue-500/50 text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] transition-colors"
          />
          {stato === 'ok' && <p className="text-emerald-500 text-[12px] font-bold text-center bg-emerald-500/10 py-2 rounded-xl">{t('ricevuto_grazie') || 'Ricevuto, grazie!'}</p>}
          {stato === 'err' && <p className="text-red-400 text-[12px] font-bold text-center bg-red-500/10 py-2 rounded-xl">{t('errore_riprova') || 'Errore, riprova più tardi.'}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAperto(false)} className="flex-1 py-3 rounded-xl text-[13px] font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
              {t('annulla') || 'Annulla'}
            </button>
            <button
              onClick={invia}
              disabled={stato === 'loading' || !testo.trim()}
              className="flex-1 py-3 rounded-xl text-[13px] font-black bg-[var(--color-brand-blue)] text-white disabled:opacity-50 transition-opacity active:scale-[0.98] shadow-lg shadow-blue-500/20"
            >
              {stato === 'loading' ? (t('invio') || 'Invio...') : (t('invia') || 'Invia')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

