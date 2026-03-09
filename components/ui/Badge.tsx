import React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "seed" | "sprout" | "tree" | "faded" | "archived" | "premium"
  icon?: string
}

export function Badge({ children, className, variant = "seed", icon, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest border transition-colors",
        
        variant === "seed" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        variant === "sprout" && "bg-green-500/10 text-green-500 border-green-500/20",
        variant === "tree" && "bg-teal-500/10 text-teal-500 border-teal-500/20",
        variant === "faded" && "bg-[var(--color-bg-card)] text-[var(--color-text-faint)] border-[var(--color-border-subtle)] opacity-50",
        variant === "archived" && "bg-[var(--color-bg-card)] text-[var(--color-text-faint)] border-dashed border-[var(--color-border-subtle)]",
        
        /* Special premium badge */
        variant === "premium" && "bg-gradient-to-r from-[var(--color-brand-amber-dim)] to-transparent text-[var(--color-brand-amber)] border-[var(--color-brand-amber)]/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)]",
        
        className
      )}
      {...props}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </span>
  )
}
