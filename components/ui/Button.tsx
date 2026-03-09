import React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon"
  size?: "sm" | "md" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-500 animate-spring active:scale-95 disabled:opacity-50 disabled:pointer-events-none outline-none",
          
          /* Variants */
          variant === "primary" && "bg-[var(--color-brand-blue)] text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5",
          variant === "secondary" && "bg-[var(--color-bg-card)] text-[var(--color-text-main)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)] shadow-sm",
          variant === "ghost" && "bg-transparent text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]",
          variant === "danger" && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
          variant === "icon" && "p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-main)]",
          
          /* Sizes */
          size === "sm" && "text-xs px-3 py-1.5 rounded-xl",
          size === "md" && "text-sm px-5 py-3 rounded-2xl",
          size === "lg" && "text-[15px] px-8 py-4 rounded-full",
          size === "icon" && "p-3 rounded-2xl",
          
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
