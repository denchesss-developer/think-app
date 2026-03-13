import React from "react"
import { Navigation, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Input"

interface ComposeViewProps {
  nuovoMessaggio: string
  setNuovoMessaggio: (v: string) => void
  creaChat: () => void
  mioNickname: string
  setMostraPopupBenvenuto: (v: boolean) => void
  userLocation: { lat: number; lng: number; regione: string } | null
  locationLoading: boolean
  locationError: string | null
  updateLocation: () => Promise<void>
  t: (key: string) => string
}

export function ComposeView({
  nuovoMessaggio,
  setNuovoMessaggio,
  creaChat,
  mioNickname,
  setMostraPopupBenvenuto,
  userLocation,
  locationLoading,
  locationError,
  updateLocation,
  t
}: ComposeViewProps) {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info Account */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <button
          type="button"
          onClick={() => setMostraPopupBenvenuto(true)}
          className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-faint)] hover:text-[var(--color-text-main)] flex items-center justify-center shadow-sm transition-colors"
          title={t('pseudonimo')}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <span className="font-bold text-[14px] text-[var(--color-text-main)]">
          {mioNickname || 'Anonimo'}
        </span>
        <div className="ml-auto">
          <h3 className="font-bold text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
            {t('nuovo_pensiero')}
          </h3>
        </div>
      </div>

      <div className="relative">
        <Textarea 
          autoFocus
          placeholder={t('placeholder_componi')} 
          value={nuovoMessaggio} 
          onChange={(e) => setNuovoMessaggio(e.target.value)} 
          className="min-h-[200px] border-none bg-[var(--color-bg-hover)]/30 rounded-2xl p-4 text-[16px] text-[var(--color-text-main)] placeholder:text-[var(--color-text-faint)] focus:ring-1 focus:ring-[var(--color-brand-blue)]/30 transition-all shadow-inner"
        />
      </div>
      
      <div className="flex flex-col gap-3 mt-2">
        {locationError && (
          <p className="text-red-400 text-[11px] font-bold bg-red-400/10 py-2 px-3 rounded-lg border border-red-400/20">
            {locationError}
          </p>
        )}
        
        <div className="flex justify-between items-center gap-4">
          <button 
            type="button"
            onClick={updateLocation}
            disabled={locationLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${locationLoading ? 'bg-[var(--color-bg-hover)] opacity-70 cursor-wait' : 'bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-panel)] active:scale-95 border-[var(--color-border-subtle)] hover:border-[var(--color-brand-cyan)]/50'} text-xs font-bold text-[var(--color-text-muted)] flex-1 sm:flex-none justify-center sm:justify-start`}
          >
            {locationLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-brand-cyan)]" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-[var(--color-brand-cyan)]" />
            )}
            <span className="truncate max-w-[150px]">
              {userLocation?.regione || t('il_tuo_angolo')}
            </span>
          </button>

          <Button 
            onClick={creaChat} 
            size="lg" 
            disabled={!nuovoMessaggio.trim()}
            className="bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-cyan)] text-white shadow-lg border-none hover:shadow-cyan-500/25 px-8 font-black flex-1 sm:flex-none h-[42px]"
          >
            {t('lancia')}
          </Button>
        </div>
      </div>
    </div>
  )
}
