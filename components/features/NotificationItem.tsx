"use client"

import React from "react"
import { GlassPanel } from "@/components/ui/Glass"
import { useLang, timeAgoI18n } from "@/lib/i18n"
import { motion } from "framer-motion"
import { Bell, MapPin, Check, Heart, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Notification {
  id: string
  type: string
  content: any
  created_at: string
  is_read: boolean
  latitude?: number
  longitude?: number
  thought_id?: string
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
  onAction: (notification: Notification) => void
}

export function NotificationItem({ notification, onRead, onAction }: NotificationItemProps) {
  const { t, lang } = useLang()

  // Determine colors based on type
  let iconBg = "bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] shadow-[0_0_15px_rgba(59,130,246,0.3)]"
  if (notification.type === 'new_reply' || notification.type === 'new_thought_nearby') {
    iconBg = "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
  } else if (notification.type === 'news_question') {
    iconBg = "bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
  } else if (notification.type === 'new_bookmark') {
    iconBg = "bg-pink-500/20 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
  }

  // Se la notifica è letta, spegni il glow
  if (notification.is_read) {
    iconBg = "bg-white/5 text-[var(--color-text-muted)] shadow-none"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="relative group mb-3 w-full"
    >
      <div
        className={cn(
          "relative p-4 rounded-[1.5rem] cursor-pointer flex gap-4 items-start transition-all duration-300 w-full overflow-hidden",
          notification.is_read 
            ? "opacity-60 hover:opacity-100 hover:bg-white/5" 
            : "bg-[var(--color-bg-card)] shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:bg-[var(--color-bg-hover)] hover:-translate-y-0.5"
        )}
        onClick={() => onAction(notification)}
      >
        {/* Absolute Background Accent for unread */}
        {!notification.is_read && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        )}

        {/* Icon Container with Glow */}
        <div className={cn(
          "relative z-10 w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-500",
          iconBg
        )}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          {notification.type === 'new_thought_nearby' && <MapPin size={18} strokeWidth={2.5} />}
          {notification.type === 'new_reply' && <Bell size={18} strokeWidth={2.5} />}
          {notification.type === 'new_bookmark' && <Heart size={18} strokeWidth={2.5} />}
          {notification.type === 'news_question' && <Newspaper size={18} strokeWidth={2.5} />}
          {!['new_thought_nearby', 'new_reply', 'new_bookmark', 'news_question'].includes(notification.type) && <Bell size={18} strokeWidth={2.5} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 z-10 py-0.5">
          <div className="flex justify-between items-center mb-1.5 gap-2">
            <h4 className={cn(
              "font-bold text-[13px] truncate tracking-wide",
              notification.is_read ? "text-[var(--color-text-muted)] font-medium" : "text-[var(--color-text-main)]"
            )}>
              {notification.type === 'new_thought_nearby' && t('nuovo_sviluppo')}
              {notification.type === 'new_reply' && t('nuova_risposta')}
              {notification.type === 'new_bookmark' && t('interazione')}
              {notification.type === 'news_question' && 'Domanda del Giorno'}
              {!['new_thought_nearby', 'new_reply', 'new_bookmark', 'news_question'].includes(notification.type) && t('notifiche')}
            </h4>
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] whitespace-nowrap shrink-0">
              {timeAgoI18n(notification.created_at, lang)}
            </span>
          </div>
          <p className={cn(
            "text-[13px] leading-relaxed line-clamp-2 transition-colors",
            notification.is_read ? "text-[var(--color-text-faint)]" : "text-[var(--color-text-sub)]"
          )}>
            {notification.content?.text || t('notifica_testo')}
          </p>
        </div>

        {/* Mark as read button */}
        {!notification.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRead(notification.id)
            }}
            className="z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:bg-emerald-500/20 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-1"
            title={t('segna_come_letto')}
          >
            <Check size={14} strokeWidth={3} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
