import React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, type, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-panel)] px-4 py-3.5 text-[15px] font-medium transition-all outline-none",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-[var(--color-text-faint)]",
            "focus-visible:border-[var(--color-border-strong)] focus-visible:bg-[var(--color-bg-card)] focus-visible:shadow-[0_0_15px_rgba(255,255,255,0.05)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-11",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-panel)] px-5 py-4 text-[15px] xl:text-[22px] font-medium transition-all outline-none resize-none",
          "placeholder:text-[var(--color-text-faint)]",
          "focus-visible:border-[var(--color-border-strong)] focus-visible:bg-[var(--color-bg-card)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
