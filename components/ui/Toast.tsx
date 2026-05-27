"use client"

import { useState, useCallback, createContext, useContext } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300",
              t.type === "success" && "bg-emerald-600/90 border-emerald-400/30 text-white",
              t.type === "error" && "bg-red-600/90 border-red-400/30 text-white",
              t.type === "info" && "bg-blue-600/90 border-blue-400/30 text-white",
            )}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 shrink-0" />}
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
