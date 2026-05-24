import React, { useState } from "react"
import { MapPin, Plus, User, Compass, Bookmark, SendHorizontal, Reply, X, Search } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onCompose: () => void
  isChatMode?: boolean
  isComposeMode?: boolean
  nuovaRisposta?: string
  setNuovaRisposta?: (v: string) => void
  onInviaRisposta?: () => void
  replyingTo?: Risposta | null
  onCancelReply?: () => void
  onOpenManualSearch?: () => void
  onActivateGPS?: () => void
  userLocation?: { lat: number; lng: number; regione: string } | null
  locationLoading?: boolean
  t: (key: string) => string
  className?: string
}

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  onCompose,
  isChatMode = false,
  isComposeMode = false,
  nuovaRisposta = "",
  setNuovaRisposta,
  onInviaRisposta,
  replyingTo = null,
  onCancelReply,
  onOpenManualSearch,
  onActivateGPS,
  userLocation,
  locationLoading = false,
  t,
  className
}: BottomNavigationProps) {
  const [showManualInput, setShowManualInput] = useState(false)
  const isLocationActive = !!userLocation?.regione && userLocation.regione !== t('il_tuo_angolo')

  return (
    <div className={className || "fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] lg:hidden flex items-center justify-center pointer-events-none w-full px-4"}>
      <div className="flex flex-col items-center w-full max-w-lg">
        {/* Location Banner — shown in compose mode always, or in chat mode when GPS is missing */}
        {((isChatMode && !isLocationActive) || isComposeMode) && (
          <div className="mb-2 w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300 px-1">
            <div className="relative p-4 rounded-[2.5rem] bg-[var(--color-bg-panel)] backdrop-blur-md shadow-[var(--hardware-shadow)] border border-[var(--glass-border)] overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-brand-blue)]/5 blur-[24px] rounded-full translate-x-6 -translate-y-6 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { onActivateGPS?.(); }}
                    disabled={locationLoading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--color-bg-hover)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {locationLoading ? (
                      <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <MapPin className="w-3 h-3 text-[var(--color-brand-blue)]" />
                    )}
                    Attiva GPS
                  </button>
                  <button
                    type="button"
                    onClick={onOpenManualSearch}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--color-bg-hover)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-all active:scale-95"
                  >
                    <Search className="w-3 h-3 text-[var(--color-brand-cyan)]" />
                    Città manuale
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replying To Banner */}
        {isChatMode && replyingTo && (
          <div className="mb-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-blue)] text-white text-[11px] font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
            <Reply className="w-3 h-3" />
            <span>{t('risposta_a')} @{replyingTo.autore}</span>
            <button 
              onClick={onCancelReply}
              className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div 
          className={`glass-panel hardware-shadow rounded-[3rem] p-2 flex items-center pointer-events-auto relative overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isChatMode ? "w-full pl-4 pr-[10px] py-[10px] gap-0" : "w-auto gap-0"}
          `}
        >
          {/* Glow Line Superiore */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[2px] bg-blue-500/40 blur-[2px] z-10" />

          <NavButton
            icon={<MapPin />}
            isActive={activeTab === "home"}
            onClick={() => onTabChange("home")}
            hidden={isChatMode}
          />
          <NavButton
            icon={<Compass />}
            isActive={activeTab === "esplora"}
            onClick={() => onTabChange("esplora")}
            hidden={isChatMode}
          />

          {/* Morphing Input Field */}
          <div 
            className={`transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center ${
              isChatMode ? "flex-1 opacity-100" : "w-0 opacity-0 overflow-hidden"
            }`}
          >
            <button
              onClick={onOpenManualSearch}
              className="p-2 -ml-1 text-[var(--color-brand-cyan)] hover:bg-[var(--color-brand-blue)]/10 rounded-full transition-colors"
              title="Cambia città"
            >
              <MapPin className="w-4 h-4" />
            </button>
            <input
              id="reply-input-mobile"
              type="text"
              placeholder={t('rispondi')}
              value={nuovaRisposta}
              onChange={(e) => setNuovaRisposta?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onInviaRisposta?.()}
              className="w-full bg-transparent border-none outline-none text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] text-[15px] pl-1 pr-2"
            />
          </div>

          {/* Morphing Central Button */}
          <button
            type="button"
            onClick={isChatMode ? onInviaRisposta : onCompose}
            className={`flex-shrink-0 bg-blue-600 text-white flex items-center justify-center transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95 border-4 border-[var(--color-bg-base)]
              ${isChatMode ? "h-[56px] w-[56px] rounded-full ml-1 mr-0" : "h-[64px] w-[64px] rounded-full mx-1 animate-vital"}
            `}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Plus 
                size={isChatMode ? 28 : 32}
                strokeWidth={3} 
                className={`absolute transition-all duration-400 flex items-center justify-center ${isChatMode ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"}`} 
              />
              <SendHorizontal 
                size={isChatMode ? 24 : 28}
                strokeWidth={2.5} 
                className={`absolute transition-all duration-400 flex items-center justify-center ${isChatMode ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"} ml-[2px]`} 
              />
            </div>
          </button>

          <NavButton
            icon={<Bookmark />}
            isActive={activeTab === "attivita"}
            onClick={() => onTabChange("attivita")}
            hidden={isChatMode}
          />

          <NavButton
            icon={<User />}
            isActive={activeTab === "account"}
            onClick={() => onTabChange("account")}
            hidden={isChatMode}
          />
        </div>
      </div>
    </div>
  )
}

function NavButton({
  icon,
  isActive,
  onClick,
  hidden
}: {
  icon: React.ReactElement
  isActive: boolean
  onClick: () => void
  hidden?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-2xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
        hidden ? "w-0 h-[52px] opacity-0 mx-0 px-0 pointer-events-none scale-50" : "w-[52px] h-[52px] opacity-100 scale-100 mx-0.5"
      } ${
        isActive
          ? "bg-[var(--color-brand-blue)]/10 text-[var(--color-text-main)] shadow-inner"
          : "text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
      }`}
    >
      <div
        className={`transition-transform duration-300 ${
          isActive ? "scale-110 drop-shadow-sm" : ""
        }`}
      >
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: "w-[24px] h-[24px]",
        })}
      </div>
    </button>
  )
}

