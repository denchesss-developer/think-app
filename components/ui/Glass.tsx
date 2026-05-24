import React from "react"
import { cn } from "@/lib/utils"

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "panel" | "card"
}

export function GlassPanel({ children, className, variant = "panel", ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-monolith transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function GlassCard({ children, className, ...props }: GlassPanelProps) {
  return (
    <GlassPanel variant="card" className={cn("rounded-2xl p-5", className)} {...props}>
      {children}
    </GlassPanel>
  )
}
