import React from "react"
import { X, Lock, Smartphone, Globe, Settings, MapPin } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { GlassPanel } from "@/components/ui/Glass"

interface LocationGuideProps {
  isOpen: boolean
  onClose: () => void
  t: (key: string) => string
}

export function LocationGuide({ isOpen, onClose, t }: LocationGuideProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <GlassPanel className="w-full max-w-lg p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden bg-[var(--color-bg-base)]/90 border border-[var(--color-border-strong)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <MapPin className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-[var(--color-text-main)]">{t('guida_posizione')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6 relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Chrome / Brave / Edge */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--color-brand-cyan)]" />
              <h3 className="font-bold text-sm text-[var(--color-text-main)]">Chrome, Brave, Edge</h3>
            </div>
            <ol className="text-sm text-[var(--color-text-muted)] space-y-2 ml-4 list-decimal">
              <li>Clicca sull'icona del <strong>Lucchetto</strong> o delle <strong>Impostazioni</strong> a sinistra dell'URL.</li>
              <li>Trova la voce <strong>"Posizione"</strong>.</li>
              <li>Imposta su <strong>"Consenti"</strong> o attiva l'interruttore.</li>
              <li>Ricarica la pagina se richiesto.</li>
            </ol>
          </div>

          {/* iPhone / Safari */}
          <div className="space-y-3 pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[var(--color-brand-blue)]" />
              <h3 className="font-bold text-sm text-[var(--color-text-main)]">Safari (iPhone / iPad)</h3>
            </div>
            <ol className="text-sm text-[var(--color-text-muted)] space-y-2 ml-4 list-decimal">
              <li>Apri le <strong>Impostazioni</strong> del dispositivo.</li>
              <li>Vai su <strong>Privacy e Sicurezza</strong> &gt; <strong>Localizzazione</strong>.</li>
              <li>Assicurati che "Localizzazione" sia <strong>Attiva</strong>.</li>
              <li>Scendi fino a <strong>Safari</strong> e seleziona <strong>"Mentre usi l'app"</strong>.</li>
            </ol>
          </div>

          {/* Android */}
          <div className="space-y-3 pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-[var(--color-text-main)]">Android (Chrome)</h3>
            </div>
            <ol className="text-sm text-[var(--color-text-muted)] space-y-2 ml-4 list-decimal">
              <li>Tieni premuto sull'icona dell'app del Browser (es. Chrome).</li>
              <li>Clicca su <strong>"Informazioni App"</strong> (icona ⓘ).</li>
              <li>Vai su <strong>Autorizzazioni</strong> &gt; <strong>Posizione</strong>.</li>
              <li>Seleziona <strong>"Consenti solo mentre l'app è in uso"</strong>.</li>
            </ol>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mt-4">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[12px] text-amber-200/80 leading-relaxed font-medium">
                <strong>Perché è necessaria?</strong> Think App si basa sulla vicinanza geografica. Senza la posizione, non possiamo inserire il tuo pensiero nell'angolo corretto della mappa.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 relative z-10">
          <Button onClick={onClose} className="w-full h-14 rounded-2xl bg-[var(--color-text-main)] text-[var(--color-bg-base)] font-black hover:opacity-90 transition-all">
            {t('ho_capito')}
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
