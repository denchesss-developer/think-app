import React from "react"
import { X, Mail } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
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
  mostraModaleComponi: boolean
  setMostraModaleComponi: (v: boolean) => void
  nuovoMessaggio: string
  setNuovoMessaggio: (v: string) => void
  creaChat: () => void
  cittaSimulata: string
  
  mostraPopupBenvenuto: boolean
  setMostraPopupBenvenuto: (v: boolean) => void
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
  onCompleteProfile: (nick: string) => Promise<{ error: any }>
  nicknameErrorMessage: (nick: string) => string
}

export function ModalsContainer({
  mostraModaleComponi, setMostraModaleComponi, nuovoMessaggio, setNuovoMessaggio, creaChat, cittaSimulata,
  mostraPopupBenvenuto, setMostraPopupBenvenuto, utenteLoggato, mioNickname, setMioNickname, salvaNicknameSoloLocale,
  mostraPopupLogin, setMostraPopupLogin, loginSent, loginLoading, accediConGoogle, emailLogin, setEmailLogin, inviaMagicLink, loginError,
  mostraPopupNicknameObbligatorio, onCompleteProfile, nicknameErrorMessage
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
        setCompleteError("Questo nickname è già stato preso da un altro utente")
      } else {
        setCompleteError("Errore durante il salvataggio. Riprova.")
      }
    }
  }
  
  return (
    <>
      <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-md transition-opacity duration-300 ${mostraModaleComponi || (mostraPopupBenvenuto && !utenteLoggato) || (mostraPopupLogin && !utenteLoggato) || mostraPopupNicknameObbligatorio ? "opacity-100" : "opacity-0 pointer-events-none"}`} />

      {/* COMPOSER MODAL */}
      <div className={`fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${mostraModaleComponi ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8 pointer-events-none"}`}>
        <GlassPanel className="w-full max-w-2xl p-6 sm:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden bg-[var(--color-bg-base)]/80">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-brand-blue)] to-[var(--color-brand-cyan)] opacity-10 blur-3xl rounded-full" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-bold text-sm uppercase tracking-widest text-[var(--color-text-faint)]">Nuovo Pensiero</h3>
            <Button variant="icon" size="icon" onClick={() => setMostraModaleComponi(false)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <Textarea 
            autoFocus={mostraModaleComponi}
            placeholder="A cosa stai pensando nel tuo angolo di mondo?" 
            value={nuovoMessaggio} 
            onChange={(e) => setNuovoMessaggio(e.target.value)} 
            className="h-40 xl:h-48 border-none bg-transparent px-0 text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)]"
          />
          
          <div className="flex justify-between items-center mt-6 relative z-10 border-t border-[var(--color-border-subtle)] pt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-hover)] text-xs font-bold text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-cyan)] animate-pulse" />
              {cittaSimulata}
            </div>
            <Button onClick={creaChat} size="lg" className="bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-cyan)] text-white shadow-lg border-none hover:shadow-cyan-500/25 px-10">
              Lancia
            </Button>
          </div>
        </GlassPanel>
      </div>

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
          <h2 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-main)]">Il tuo Nome</h2>
          <p className="font-medium mb-8 text-[15px] text-[var(--color-text-muted)] leading-relaxed">
            Scegli un nome per farti riconoscere dagli altri esploratori.
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
            {welcomeLoading ? "Salvataggio..." : "Salva Nome"}
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
              <h2 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-main)]">Accedi a Think</h2>
              <p className="font-medium mb-8 text-[15px] text-[var(--color-text-muted)] leading-relaxed px-4">
                Nessuna password da ricordare. Entra e proteggi il tuo nome per sempre.
              </p>

              <Button
                onClick={accediConGoogle}
                disabled={loginLoading}
                variant="secondary"
                size="lg"
                className="w-full gap-3 py-4 text-[15px] hover:bg-[var(--color-bg-hover)]"
              >
                <div className="bg-white p-1 rounded-sm"><GoogleLogo /></div>
                Continua con Google
              </Button>

              <div className="flex items-center gap-4 my-8 opacity-60">
                <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">oppure via email</span>
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
                {loginLoading ? 'Invio in corso...' : 'Ricevi Magic Link'}
              </Button>
              {loginError && <p className="text-red-400 mt-5 text-[13px] font-bold">{loginError}</p>}
            </>
          ) : (
            <div className="py-8">
              <h2 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text-main)]">Controlla la Mail</h2>
              <p className="font-medium text-[15px] text-[var(--color-text-muted)] leading-relaxed">
                Abbiamo inviato un magic link a <span className="text-[var(--color-text-main)] font-bold">{emailLogin}</span>. Cliccalo dal tuo dispositivo per entrare!
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

          <h2 className="text-2xl font-black mb-3 tracking-tight text-[var(--color-text-main)]">Benvenuta/o su Think!</h2>
          <p className="font-medium mb-8 text-[14px] text-[var(--color-text-muted)] leading-relaxed px-2">
            Sei quasi pronto ad entrare. Come vuoi farti chiamare nel mondo? Scegli il tuo nickname unico.
          </p>

          <div className="space-y-1 mb-8">
            <Input 
              type="text" 
              placeholder="Esempio: Esploratore_99"
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
              3-20 caratteri, solo lettere, numeri e _
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
                Inizia l'Esplorazione
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </span>
            )}
          </Button>
        </GlassPanel>
      </div>
    </>
  )
}
