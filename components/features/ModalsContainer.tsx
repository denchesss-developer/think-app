import React from "react"
import { X, Mail } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GlassPanel } from "@/components/ui/Glass"

export const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
)

interface ModalsContainerProps {
  mostraPopupBenvenuto: boolean
  setMostraPopupBenvenuto: (v: boolean) => void
  utenteLoggato: any
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
  onCompleteProfile: (nick: string) => Promise<{ error: any }>
  nicknameErrorMessage: (nick: string) => string

  t: (key: string) => string
}

export function ModalsContainer({
  mostraPopupBenvenuto, setMostraPopupBenvenuto, utenteLoggato, mioNickname, setMioNickname, salvaNicknameSoloLocale,
  mostraPopupLogin, setMostraPopupLogin, loginSent, loginLoading, accediConGoogle, emailLogin, setEmailLogin, inviaMagicLink, loginError,
  mostraPopupNicknameObbligatorio, onCompleteProfile, nicknameErrorMessage,
  t
}: ModalsContainerProps) {

  const [localNick, setLocalNick] = React.useState("")
  const [completeLoading, setCompleteLoading] = React.useState(false)
  const [completeError, setCompleteError] = React.useState("")
  
  const [welcomeLoading, setWelcomeLoading] = React.useState(false)
  const [welcomeError, setWelcomeError] = React.useState("")

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

      {/* WELCOME NICKNAME MODAL */}
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-500 ease-out ${mostraPopupBenvenuto && !utenteLoggato ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
        <GlassPanel className="p-8 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center relative overflow-hidden bg-[var(--color-bg-base)]/90 backdrop-blur-2xl">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
          <button
            type="button"
            onClick={() => setMostraPopupBenvenuto(false)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-faint)] hover:text-[var(--color-text-main)] transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-main)]">{t('il_tuo_nome')}</h2>
          <p className="font-medium mb-8 text-[15px] text-[var(--color-text-muted)] leading-relaxed">
            {t('scegli_nome')}
          </p>
          <div className="space-y-1 mb-6">
            <Input 
              type="text" 
              className="text-center text-xl font-bold py-5 px-6" 
              value={mioNickname} 
              onChange={(e) => {
                setMioNickname(e.target.value)
                setWelcomeError("")
              }} 
              disabled={welcomeLoading}
            />
            {welcomeError && (
              <p className="text-red-400 text-[11px] font-bold mt-2 bg-red-400/10 py-1.5 px-3 rounded-lg border border-red-400/20">
                {welcomeError}
              </p>
            )}
          </div>
          
          <Button 
            onClick={async () => {
              setWelcomeError("")
              setWelcomeLoading(true)
              const res = await salvaNicknameSoloLocale()
              setWelcomeLoading(false)
              if (res && res.error) {
                setWelcomeError(res.error)
              }
            }} 
            disabled={welcomeLoading || !mioNickname.trim()}
            size="lg" 
            className="w-full py-5 text-base"
          >
            {welcomeLoading ? t('salvataggio') : t('salva_nome')}
          </Button>
        </GlassPanel>
      </div>

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

      {/* MANDATORY NICKNAME MODAL (FIRST LOGIN) */}
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 transition-all duration-500 ease-out ${mostraPopupNicknameObbligatorio ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
        <GlassPanel className="p-8 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center relative overflow-hidden bg-[var(--color-bg-base)]/95 backdrop-blur-3xl border border-[var(--color-brand-blue)]/20">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-[var(--color-brand-blue)]/10 blur-3xl rounded-full" />
          
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
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </span>
            )}
          </Button>
        </GlassPanel>
      </div>
    </>
  )
}
