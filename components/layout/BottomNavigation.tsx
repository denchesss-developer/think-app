import React from "react"
import { MapPin, Plus, User, Compass, Bookmark, SendHorizontal, Reply, X } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onCompose: () => void
  isChatMode?: boolean
  nuovaRisposta?: string
  setNuovaRisposta?: (v: string) => void
  onInviaRisposta?: () => void
  replyingTo?: Risposta | null
  onCancelReply?: () => void
  t: (key: string) => string
}

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  onCompose,
  isChatMode = false,
  nuovaRisposta = "",
  setNuovaRisposta,
  onInviaRisposta,
  replyingTo = null,
  onCancelReply,
  t
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] lg:hidden flex items-center justify-center pointer-events-none w-full px-4">
      <div className="flex flex-col items-center w-full max-w-lg">
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
          className={`glass-panel rounded-[2rem] flex items-center pointer-events-auto backdrop-blur-xl shadow-2xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
          ${isChatMode ? "w-full pl-4 pr-[10px] py-[10px] gap-0" : "px-4 py-2 w-auto gap-1.5"}
          `}
        >
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
            <input
              type="text"
              placeholder={t('rispondi')}
              value={nuovaRisposta}
              onChange={(e) => setNuovaRisposta?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onInviaRisposta?.()}
              className="w-full bg-transparent border-none outline-none text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] text-[15px] pl-2 pr-2"
            />
          </div>

          {/* Morphing Central Button */}
          <button
            type="button"
            onClick={isChatMode ? onInviaRisposta : onCompose}
            className={`flex-shrink-0 bg-[var(--color-brand-blue)] text-white flex items-center justify-center shadow-[0_4px_24px_rgba(59,130,246,0.6)] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95
              ${isChatMode ? "h-[48px] w-[48px] rounded-full ml-1 mr-0 flex-shrink-0 rotate-0" : "h-[52px] w-[52px] rounded-full mx-3 flex-shrink-0 rotate-90"}
            `}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Plus 
                strokeWidth={3} 
                className={`absolute transition-all duration-400 flex items-center justify-center ${isChatMode ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"} w-6 h-6`} 
              />
              <SendHorizontal 
                strokeWidth={2.5} 
                className={`absolute transition-all duration-400 flex items-center justify-center ${isChatMode ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"} w-5 h-5 ml-[2px]`} 
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
