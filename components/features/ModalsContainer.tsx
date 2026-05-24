import React, { useState } from "react"
import { X, Mail, Globe2, Sprout, Trophy, ChevronRight, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GlassPanel } from "@/components/ui/Glass"

export const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4" />
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853" />
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
  </svg>
)

interface ModalsContainerProps {
  mostraPopupBenvenuto: boolean
  onDismissWelcome: () => Promise<void>
  utenteLoggato: Utente | null
  mioNickname: string
  setMioNickname: (v: string) => void
  salvaNicknameSoloLocale: () => Promise<{ success?: boolean; error?: string }>

  mostraPopupLogin: boolean
  setMostraPopupLogin: (v: boolean) => void
  loginSent: boolean
  loginLoading: boolean
  accediConGoogle: () => void
  emailLogin: string
  setEmailLogin: (v: string) => void
  inviaMagicLink: (e: React.FormEvent) => void
  loginError: string

  mostraPopupNicknameObbligatorio: boolean
  setMostraPopupNicknameObbligatorio: (v: boolean) => void
  onCompleteProfile: (nick: string) => Promise<{ error: { code?: string; message?: string } | null }>
  nicknameErrorMessage: (nick: string) => string

  t: (key: string) => string
}

export function ModalsContainer({
  mostraPopupBenvenuto, onDismissWelcome, utenteLoggato, mioNickname, setMioNickname, salvaNicknameSoloLocale,
  mostraPopupLogin, setMostraPopupLogin, loginSent, loginLoading, accediConGoogle, emailLogin, setEmailLogin, inviaMagicLink, loginError,
  mostraPopupNicknameObbligatorio, setMostraPopupNicknameObbligatorio, onCompleteProfile, nicknameErrorMessage,
  t
}: ModalsContainerProps) {

  const [localNick, setLocalNick] = React.useState("")
  const [completeLoading, setCompleteLoading] = React.useState(false)
  const [completeError, setCompleteError] = React.useState("")

  const [welcomeLoading, setWelcomeLoading] = useState(false)
  const [welcomeError, setWelcomeError] = useState("")

  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1)

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentSlide(prev => prev + newDirection)
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
     center: {
       zIndex: 1,
       x: 0,
       opacity: 1,
       scale: 1,
       transition: { stiffness: 300, damping: 30 }
     },
     exit: (dir: number) => ({
       zIndex: 0,
       x: dir < 0 ? 100 : -100,
       opacity: 0,
       scale: 0.95,
       transition: { stiffness: 300, damping: 30 }
     })
  } as const

  const slides = [
    {
      id: 0,
      icon: <Globe2 className="w-10 h-10 text-[var(--color-brand-blue)]" />,
      color: 'bg-blue-500',
      title: "Un Globo di Pensieri",
      desc: "Non è un classico social. È una mappa globale dove ogni idea, sfogo o notizia nasce esattamente da dove ti trovi."
    },
    {
      id: 1,
      icon: <Sprout className="w-10 h-10 text-emerald-500" />,
      color: 'bg-emerald-500',
      title: "Il Ciclo Vitale",
      desc: "Ogni pensiero nasce come Seme. Se la community interagisce, cresce fino a diventare un Albero. Altrimenti, svanisce."
    },
    {
      id: 2,
      icon: <Trophy className="w-10 h-10 text-amber-500" />,
      color: 'bg-amber-500',
      title: "Guadagna Punti",
      desc: "Completa sfide ed esplora la mappa. Guadagna ThinkPoints e sblocca livelli di profondità per farti notare."
    }
  ]

  async function handleWelcomeDismiss() {
    setWelcomeError("")
    setWelcomeLoading(true)
    await onDismissWelcome()
    setWelcomeLoading(false)
  }

  React.useEffect(() => {
    if (mostraPopupNicknameObbligatorio) {
      setLocalNick(mioNickname || "")
    }
  }, [mostraPopupNicknameObbligatorio, mioNickname])

  async function handleFinalize() {
    setCompleteError("")
    const err = nicknameErrorMessage(localNick)
    if (err) { setCompleteError(err); return }

    setCompleteLoading(true)
    
    // Branch logic: if it's the unauthenticated welcome, use Local Storage.
    if (mostraPopupBenvenuto && !utenteLoggato) {
      setMioNickname(localNick) // Update parent first
      const res = await salvaNicknameSoloLocale()
      setCompleteLoading(false)
      if (res && res.error) {
        setCompleteError(res.error)
      } else {
        await onDismissWelcome()
      }
      return
    }

    // Otherwise (authenticated but no nickname), use Supabase.
    const { error } = await onCompleteProfile(localNick)
    setCompleteLoading(false)

    if (error) {
      if (error.code === '23505') {
        setCompleteError(t('nick_gia_preso'))
      } else {
        setCompleteError(t('errore_salv_riprova'))
      }
    }
  }

  return (
    <>
      <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-md transition-opacity duration-300 ${(mostraPopupBenvenuto && !utenteLoggato) || (mostraPopupLogin && !utenteLoggato) || mostraPopupNicknameObbligatorio ? "opacity-100" : "opacity-0 pointer-events-none"}`} />

      {/* WELCOME NICKNAME MODAL (REMOVED: Now handled by the Onboarding Carousel below) */}

      {/* LOGIN MODAL */}
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-500 ease-out ${mostraPopupLogin && !utenteLoggato ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"}`}>
        <GlassPanel className="p-8 sm:p-10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] w-full max-w-md text-center relative overflow-hidden bg-[var(--color-bg-base)]/95 backdrop-blur-3xl border border-[var(--color-border-strong)]">
          <Button variant="ghost" size="icon" onClick={() => setMostraPopupLogin(false)} className="absolute top-6 right-6 rounded-full text-[var(--color-text-faint)]">
            <X className="w-5 h-5" />
          </Button>

          <div className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] shadow-inner">
            <Mail className="w-8 h-8 text-[var(--color-text-main)]" />
          </div>

          {!loginSent ? (
            <>
              <h2 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-main)]">{t('accedi_think')}</h2>
              <p className="font-medium mb-8 text-[15px] text-[var(--color-text-muted)] leading-relaxed px-4">
                {t('nessuna_password')}
              </p>

              <Button
                onClick={accediConGoogle}
                disabled={loginLoading}
                variant="secondary"
                size="lg"
                className="w-full gap-3 py-4 text-[15px] hover:bg-[var(--color-bg-hover)]"
              >
                <div className="bg-white p-1 rounded-sm"><GoogleLogo /></div>
                {t('continua_google')}
              </Button>

              <div className="flex items-center gap-4 my-8 opacity-60">
                <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{t('oppure_email')}</span>
                <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              </div>

              <Input
                type="email"
                placeholder="unnome@email.com"
                className="mb-4"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
              />
              <Button
                onClick={inviaMagicLink}
                disabled={loginLoading}
                size="lg"
                className="w-full py-4 bg-gradient-to-r from-[var(--color-text-main)] to-[var(--color-text-main)] text-[var(--color-bg-base)] hover:opacity-90"
              >
                {loginLoading ? t('invio_corso') : t('ricevi_magic')}
              </Button>
              {loginError && <p className="text-red-400 mt-5 text-[13px] font-bold">{loginError}</p>}
            </>
          ) : (
            <div className="py-8">
              <h2 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-main)]">{t('controlla_mail')}</h2>
              <p className="font-medium text-[15px] text-[var(--color-text-muted)] leading-relaxed">
                {t('mail_inviata')} <span className="text-[var(--color-text-main)] font-bold">{emailLogin}</span>{t('mail_clicca')}
              </p>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* MANDATORY NICKNAME MODAL (ONBOARDING CAROUSEL) */}
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-500 ease-out ${(mostraPopupBenvenuto && !utenteLoggato) || mostraPopupNicknameObbligatorio ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
        <GlassPanel className="p-8 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md relative overflow-hidden bg-[var(--color-bg-base)]/95 backdrop-blur-3xl border border-[var(--color-brand-blue)]/20 min-h-[460px] flex flex-col">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--color-brand-blue)]/10 blur-3xl rounded-full" />
          
          <div className="flex-1 relative flex flex-col justify-center">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {currentSlide < 3 ? (
                <motion.div
                  key={`slide-${currentSlide}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col items-center text-center pb-4"
                >
                  <div className={`w-20 h-20 mx-auto mb-8 rounded-[1.5rem] ${slides[currentSlide].color}/15 flex items-center justify-center border border-${slides[currentSlide].color}/20 shadow-inner`}>
                    {slides[currentSlide].icon}
                  </div>
                  <h2 className="text-2xl font-black mb-4 tracking-tight text-[var(--color-text-main)]">
                    {slides[currentSlide].title}
                  </h2>
                  <p className="font-medium text-[15px] text-[var(--color-text-muted)] leading-relaxed px-2">
                    {slides[currentSlide].desc}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="slide-final"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="flex flex-col text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--color-brand-blue)]/15 flex items-center justify-center border border-[var(--color-brand-blue)]/20 shadow-inner">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-2xl font-black mb-3 tracking-tight text-[var(--color-text-main)]">{t('benvenuto')}</h2>
                  <p className="font-medium mb-8 text-[14px] text-[var(--color-text-muted)] leading-relaxed px-2">
                    {t('quasi_pronto')}
                  </p>
                  
                  <div className="space-y-1 mb-8">
                    <Input
                      type="text"
                      placeholder={t('esempio_nick')}
                      className="text-center text-lg font-bold py-4 h-14 rounded-2xl border-[var(--color-border-strong)] focus:border-[var(--color-brand-blue)] transition-all"
                      value={localNick}
                      onChange={(e) => setLocalNick(e.target.value)}
                      disabled={completeLoading}
                    />
                    {completeError && (
                      <p className="text-red-400 text-[11px] font-bold mt-2 bg-red-400/10 py-1.5 px-3 rounded-lg border border-red-400/20">
                        {completeError}
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-[var(--color-text-faint)] mt-2 uppercase tracking-widest">
                      {t('caratteri_nick')}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleFinalize}
                    disabled={completeLoading || !localNick.trim()}
                    size="lg"
                    className="w-full py-6 text-base font-black bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-cyan)] text-white shadow-xl hover:shadow-blue-500/20 border-none group"
                  >
                    {completeLoading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t('inizia_esplorazione')}
                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                        setMostraPopupNicknameObbligatorio(false)
                        setMostraPopupLogin(true)
                    }}
                    className="mt-5 text-[12px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] transition-colors underline underline-offset-4"
                  >
                    Hai già un account? Accedi qui.
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controller & Dots (only on intro slides) */}
          {currentSlide < 3 && (
            <div className="mt-8 flex items-center justify-between">
              {currentSlide > 0 ? (
                <button
                  type="button"
                  onClick={() => paginate(-1)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-12 h-12" /> // spacer
              )}
              
              {/* Dots */}
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-[var(--color-brand-blue)] w-6' : 'bg-[var(--color-text-muted)]/30'}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => paginate(1)}
                className="group flex items-center gap-2 px-5 h-12 rounded-2xl bg-[var(--color-brand-blue)] hover:bg-blue-500 text-white font-bold text-[14px] transition-colors shadow-lg shadow-blue-500/20"
              >
                Continua
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </GlassPanel>
      </div>
    </>
  )
}
