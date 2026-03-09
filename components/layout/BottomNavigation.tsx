import React from "react"
import { MapPin, Plus, User, Compass, Bookmark } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onCompose: () => void
}

export function BottomNavigation({ activeTab, onTabChange, onCompose }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] lg:hidden flex items-center justify-center pointer-events-none w-full px-4">
      <div className="glass-panel rounded-[2rem] px-4 py-2 flex items-center gap-1.5 pointer-events-auto backdrop-blur-xl shadow-2xl">
        <NavButton
          icon={<MapPin />}
          isActive={activeTab === "home"}
          onClick={() => onTabChange("home")}
        />
        <NavButton
          icon={<Compass />}
          isActive={activeTab === "esplora"}
          onClick={() => onTabChange("esplora")}
        />

        {/* Compose Button */}
        <button
          type="button"
          onClick={onCompose}
          className="mx-3 h-[52px] w-[52px] rounded-full bg-[var(--color-brand-blue)] text-white flex items-center justify-center shadow-[0_4px_24px_rgba(59,130,246,0.6)] transition-transform active:scale-90"
        >
          <Plus strokeWidth={3} className="w-6 h-6" />
        </button>

        <NavButton
          icon={<Bookmark />}
          isActive={activeTab === "attivita"}
          onClick={() => onTabChange("attivita")}
        />

        <NavButton
          icon={<User />}
          isActive={activeTab === "account"}
          onClick={() => onTabChange("account")}
        />
      </div>
    </div>
  )
}

function NavButton({
  icon,
  isActive,
  onClick,
}: {
  icon: React.ReactElement
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-2xl transition-all duration-300 ${
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
          className: "w-[24px] h-[24px]", // Icone un po' più grandi per riempire lo spazio senza testi
        })}
      </div>
    </button>
  )
}
