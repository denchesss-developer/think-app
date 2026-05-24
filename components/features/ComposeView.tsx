import React from "react"
import { Navigation, Loader2, Pencil, HelpCircle, AlertCircle, MapPin, Search, Plane, Send, X } from "lucide-react"
import { LocationBadge } from "@/components/ui/LocationBadge"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Input"
import { useLang, translateRegion } from "@/lib/i18n"

const getCountryEmoji = (code?: string) => {
  if (!code) return '📍'
  const cc = code.toUpperCase()
  if (cc.length !== 2) return '📍'
  const codePoints = cc.split('').map(c => 127397 + c.charCodeAt(0))
  try {
    return String.fromCodePoint(...codePoints)
  } catch {
    return '📍'
  }
}

const formatLocationName = (item: any) => {
  if (item?.address) {
    const parts = []
    const city = item.address.city || item.address.town || item.address.village || item.address.hamlet || item.address.municipality
    if (city) parts.push(city)
    if (item.address.state) parts.push(item.address.state)
    if (item.address.country) parts.push(item.address.country)
    
    if (parts.length > 0) return parts.join(', ')
  }
  return item?.display_name?.split(',').filter((p: string) => !/\d/.test(p)).join(',').replace(/\s+/g, ' ').trim() || 'Posizione Sconosciuta'
}

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
  setShowLocationGuide: (v: boolean) => void
  t: (key: string) => string
  // Manual Selection Props
  manualSearchQuery: string
  setManualSearchQuery: (v: string) => void
  manualResults: any[]
  searchLoading: boolean
  onSearchCity: (query: string) => void
  onSelectCity: (item: any) => void
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
  setShowLocationGuide,
  manualSearchQuery,
  setManualSearchQuery,
  manualResults,
  searchLoading,
  onSearchCity,
  onSelectCity,
  t
}: ComposeViewProps) {
  const [mostraRicercaManuale, setMostraRicercaManuale] = React.useState(false)
  const { lang } = useLang()
  const isLocationActive = !!userLocation?.regione && userLocation.regione !== t('il_tuo_angolo')

  // Detection Utility
  const env = React.useMemo(() => {
    if (typeof navigator === 'undefined') return { isIOS: false, isAndroid: false, isDesktop: true }
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isAndroid = /android/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome|crios|crmo/.test(ua)
    const isChrome = /chrome|crios|crmo/.test(ua)
    return { isIOS, isAndroid, isSafari, isChrome, isDesktop: !isIOS && !isAndroid }
  }, [])
  // Pre-calculate user location flag & text to remove nested badge
  const locationLabel: string = userLocation?.regione ? translateRegion(userLocation.regione, lang) : "Aggiungi Posizione"
  const locParts = locationLabel.trim().split(' ')
  let locCity = locationLabel
  let locFlag = ''
  if (locParts.length > 1) {
    const lastPart = locParts[locParts.length - 1]
    if (/[^\p{L}\p{N}]/u.test(lastPart)) {
      locFlag = lastPart
      locCity = locParts.slice(0, -1).join(' ')
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 lg:pb-8">
      {/* Header Info Account — solo mobile, su desktop c'è già nella sidebar */}
      <div className="lg:hidden flex items-center gap-2 mb-2 px-1">
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
      </div>

      <div className="relative">
        <Textarea 
          autoFocus
          placeholder={t('placeholder_componi')} 
          value={nuovoMessaggio} 
          onChange={(e) => setNuovoMessaggio(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (nuovoMessaggio.trim() && isLocationActive && !locationLoading) {
                creaChat();
              }
            }
          }}
          className="min-h-[200px] bg-[var(--color-bg-panel)]/50 backdrop-blur-md rounded-2xl border border-[var(--glass-border)] p-4 text-[16px] text-[var(--color-text-main)] placeholder:text-[#a1a1aa] outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] focus:ring-0 focus:outline-none"
        />
      </div>
      


          <div className="flex justify-between items-center gap-4">
          {isLocationActive ? (
            <button 
              type="button"
              onClick={updateLocation}
              disabled={locationLoading}
              className={`flex items-center gap-2 px-4 py-3 rounded-[1.25rem] transition-all bg-[var(--color-bg-panel)] backdrop-blur-md shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] border border-[var(--glass-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-main)] ${
                locationLoading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
              } text-[13px] font-bold flex-1 sm:flex-none justify-center sm:justify-start`}
            >
              {locationLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-brand-cyan)]" />
              ) : (
                <div className="flex items-center gap-1.5">
                  {locFlag && <span className="text-[15px] leading-none drop-shadow-sm">{locFlag}</span>}
                  <span className="truncate max-w-[120px] uppercase tracking-tight">{locCity}</span>
                </div>
              )}
            </button>
          ) : <div />}

          <button 
            type="button"
            onClick={creaChat} 
            disabled={!nuovoMessaggio.trim() || !isLocationActive || locationLoading}
            className={`md:hidden flex items-center gap-2 px-8 py-3 rounded-[1.25rem] transition-all ${
              !isLocationActive || !nuovoMessaggio.trim() || locationLoading
                ? 'bg-[var(--color-bg-panel)] backdrop-blur-md shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] border border-[var(--glass-border)] opacity-40 grayscale pointer-events-none text-[var(--color-text-main)]' 
                : 'bg-gradient-to-r from-[var(--color-brand-blue)] to-[var(--color-brand-blue)]/80 text-white hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)] border-none hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
            } text-[13px] font-black flex-1 sm:flex-none justify-center h-[46px]`}
          >
            INVIA <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
  )
}

