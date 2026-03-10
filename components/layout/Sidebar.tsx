import React from "react"
import { Sun, Moon, X, Sparkles, Menu } from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  isDark: boolean
  onToggleOpen: () => void
  onToggleTheme: () => void
  onLogoClick: () => void
  children: React.ReactNode
  footer: React.ReactNode
}

export function Sidebar({ 
  isOpen, 
  isDark, 
  onToggleOpen, 
  onToggleTheme, 
  onLogoClick,
  children,
  footer
}: SidebarProps) {
  return (
    <>
      {/* Mobile Trigger */}
      {!isOpen && (
        <button 
          onClick={onToggleOpen} 
          className="hidden lg:flex fixed top-6 left-6 z-50 p-3 rounded-2xl glass-card text-[var(--color-text-main)] transition-transform hover:scale-105 active:scale-95 shadow-xl"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Floating Sidebar Desktop */}
      <div className={`hidden lg:flex fixed left-6 top-6 bottom-6 flex-col bg-[var(--color-bg-panel)] backdrop-blur-3xl rounded-[2rem] border border-[var(--color-border-subtle)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 w-[420px] shadow-[30px_0_60px_rgba(0,0,0,0.3)] ${
        isOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
        
        {/* Header */}
        <div className="px-7 pt-8 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={onLogoClick}>
              <img 
                src="/logo.svg" 
                alt="Think" 
                className="h-14 w-auto dark:invert object-contain transition-transform group-hover:scale-[1.02]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onToggleTheme} 
                className="p-2.5 rounded-xl transition-all glass-card hover:bg-[var(--color-bg-hover)] active:scale-95"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button 
                onClick={onToggleOpen} 
                className="p-2.5 rounded-xl transition-all glass-card hover:bg-[var(--color-bg-hover)] active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-7 overflow-y-auto scrollbar-hide pb-4 relative">
          {children}
        </div>

        {/* Footer Area */}
        <div className="p-7 flex-shrink-0 border-t border-[var(--color-border-subtle)] rounded-b-[2rem] bg-[var(--color-bg-base)]/30 backdrop-blur-lg">
          {footer}
        </div>
      </div>
    </>
  )
}
