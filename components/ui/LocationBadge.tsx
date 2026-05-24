import React from "react"
import { cn } from "@/lib/utils"

interface LocationBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  regione?: string | null
  icon?: React.ReactNode
  variant?: 'default' | 'faint' | 'brand'
}

export function LocationBadge({ regione, icon, variant = 'default', className, ...props }: LocationBadgeProps) {
  if (!regione) return null

  // Scomponiamo "Città 🇮🇹" -> ["Città", "🇮🇹"]
  const parts = regione.trim().split(' ')
  let cityName = regione
  let flag = ''

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1]
    // Se l'ultima parte sembra un'emoji (non alfanumerica)
    if (/[^\p{L}\p{N}]/u.test(lastPart)) {
      flag = lastPart
      cityName = parts.slice(0, -1).join(' ')
    }
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border backdrop-blur-md transition-all duration-300",
        
        // Varianti di stile
        variant === 'default' && "bg-[var(--color-bg-hover)]/30 border-[var(--color-border-subtle)] text-[var(--color-text-main)]",
        variant === 'faint' && "bg-transparent border-[var(--color-border-subtle)]/50 text-[var(--color-text-faint)]",
        variant === 'brand' && "bg-[var(--color-brand-blue)]/10 border-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] font-bold",
        
        className
      )}
      {...props}
    >
      {icon && (
        <>
          <span className="opacity-70 mr-0.5 flex-shrink-0">
            {icon}
          </span>
          <div className="w-[1px] h-2.5 bg-current opacity-10 mx-0.5" />
        </>
      )}
      
      <span className="text-[10px] font-bold uppercase tracking-tight truncate max-w-[120px] opacity-90">
        {cityName}
      </span>
      
      {flag && (
        <div className="flex items-center gap-1.5 ml-0.5">
          <div className="w-[1.5px] h-2 bg-current opacity-20 rounded-full" />
          <span className="text-[13px] leading-none select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
            {flag}
          </span>
        </div>
      )}
    </div>
  )
}
