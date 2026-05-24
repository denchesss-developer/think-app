"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
}

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-full transition-all",
        "hover:bg-[var(--color-bg-hover)] active:scale-95",
        unreadCount > 0 && "text-[var(--color-brand-blue)]"
      )}
    >
      <Bell size={20} className={cn(unreadCount > 0 && "animate-[pulse_3s_ease-in-out_infinite]")} />

      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
