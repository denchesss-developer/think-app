"use client"

import React, { useState } from "react"
import { Bell, ChevronDown, ChevronRight, MapPin, Heart, Newspaper, Check } from "lucide-react"
import { GlassPanel } from "@/components/ui/Glass"
import { motion, AnimatePresence } from "framer-motion"
import { useLang, timeAgoI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Notification, NotificationItem } from "@/components/features/NotificationItem"

interface NotificationsViewProps {
  notifications: Notification[]
  onRead: (id: string) => void
  onReadAll: () => void
  onAction: (notification: Notification) => void
}

// Derive a cluster key: day string + notification type + (for replies: thought_id)
function getClusterKey(n: Notification): string {
  const day = new Date(n.created_at).toDateString()
  if (n.type === 'new_reply' && n.thought_id) return `${day}::reply::${n.thought_id}`
  if (n.type === 'news_question') return `${day}::news_question`
  if (n.type === 'new_thought_nearby') return `${day}::nearby`
  if (n.type === 'new_bookmark') return `${day}::bookmark`
  return `${day}::${n.type}`
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return "Oggi"
  if (diff === 1) return "Ieri"
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getClusterLabel(notifications: Notification[]): string {
  const type = notifications[0].type
  const count = notifications.length
  if (count === 1) return "" // single: render normally
  if (type === 'news_question') return `${count} domande del giorno`
  if (type === 'new_reply') return `${count} nuove risposte`
  if (type === 'new_thought_nearby') return `${count} nuovi pensieri vicino a te`
  if (type === 'new_bookmark') return `${count} nuovi preferiti`
  return `${count} notifiche`
}

function getClusterIcon(type: string) {
  if (type === 'new_thought_nearby') return <MapPin size={16} />
  if (type === 'new_bookmark') return <Heart size={16} className="text-pink-500" />
  if (type === 'news_question') return <Newspaper size={16} className="text-amber-500" />
  return <Bell size={16} />
}

interface NotificationCluster {
  key: string
  dayLabel: string
  notifications: Notification[]
}

function buildClusters(notifications: Notification[]): { day: string; clusters: { key: string; items: Notification[] }[] }[] {
  // Group by day first
  const byDay: Record<string, Notification[]> = {}
  for (const n of notifications) {
    const day = new Date(n.created_at).toDateString()
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(n)
  }

  return Object.entries(byDay).map(([day, items]) => {
    // Within a day, group by cluster key
    const byCluster: Record<string, Notification[]> = {}
    for (const n of items) {
      const key = getClusterKey(n)
      if (!byCluster[key]) byCluster[key] = []
      byCluster[key].push(n)
    }
    return {
      day,
      clusters: Object.entries(byCluster).map(([key, clusterItems]) => ({ key, items: clusterItems }))
    }
  })
}

function NotificationClusterRow({
  items,
  onRead,
  onAction
}: {
  items: Notification[]
  onRead: (id: string) => void
  onAction: (n: Notification) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { lang } = useLang()

  if (items.length === 1) {
    return (
      <NotificationItem
        notification={items[0]}
        onRead={onRead}
        onAction={onAction}
      />
    )
  }

  const label = getClusterLabel(items)
  const type = items[0].type
  const unread = items.filter(n => !n.is_read).length

  return (
    <div className="mb-4 relative">
      {/* Cluster header logic with Stack effect */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 p-4 rounded-[1.5rem] border transition-all duration-300 relative z-20 overflow-hidden",
          expanded ? "bg-[var(--color-bg-card)] border-[var(--color-border-strong)]" : "bg-[var(--color-bg-base)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:-translate-y-1",
          !expanded && items.length > 1 && "shadow-[0_4px_0_rgba(255,255,255,0.03),0_8px_0_rgba(255,255,255,0.01)]", // Stacked cards effect
          unread > 0 && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[var(--color-brand-blue)]/5 before:to-transparent before:pointer-events-none"
        )}
      >
        <div className={cn(
          "p-2.5 rounded-xl shrink-0 flex items-center justify-center relative",
          unread > 0 ? "bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-white/5 text-[var(--color-text-muted)]"
        )}>
          {getClusterIcon(type)}
        </div>
        <div className="flex-1 text-left">
          <p className={cn("font-bold text-[14px]", unread > 0 ? "text-[var(--color-text-main)]" : "text-[var(--color-text-muted)]")}>{label}</p>
          <p className="text-[11px] mt-0.5 text-[var(--color-text-faint)] font-medium">
            {timeAgoI18n(items[0].created_at, lang)}
            {unread > 0 && (
              <span className="ml-2 text-[var(--color-brand-blue)] font-black tracking-widest uppercase">• {unread} non {unread === 1 ? 'letta' : 'lette'}</span>
            )}
          </p>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 200 }}>
          <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
        </motion.div>
      </button>

      {/* Expanded list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="overflow-hidden relative z-10"
          >
            <div className="pt-2 pl-4 sm:pl-6 space-y-2 border-l-2 border-[var(--color-border-subtle)]/50 ml-6 mt-2 mb-4">
              {items.map(n => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={onRead}
                  onAction={onAction}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function NotificationsView({ notifications, onRead, onReadAll, onAction }: NotificationsViewProps) {
  const days = buildClusters(notifications)
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-8 pb-10 fade-in-up animate-in duration-500 w-full max-w-2xl mx-auto px-4 sm:px-0">
      {/* Header stile Discovery */}
      <header className="text-center pt-6 pb-2">
        <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text-main)]">
          Notifiche.
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
          Le tue interazioni
        </p>
        
        {unreadCount > 0 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onReadAll}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand-blue)]/50 hover:bg-[var(--color-brand-blue)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] rounded-full transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <Check size={14} strokeWidth={3} />
              Segna tutto letto
            </button>
          </div>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
          <div className="w-20 h-20 mb-6 rounded-[2rem] bg-[var(--color-bg-card)] shadow-inner flex items-center justify-center border border-[var(--color-border-subtle)]">
            <Bell className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-base font-bold text-[var(--color-text-muted)] tracking-wide">Tutto tace</p>
          <p className="text-xs text-[var(--color-text-faint)] mt-2">Non ci sono nuove interazioni.</p>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {days.map(({ day, clusters }) => (
            <div key={day} className="relative">
              {/* Day label */}
              <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="h-px flex-1 bg-[var(--color-border-subtle)] opacity-50" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                  {getDayLabel(clusters[0].items[0].created_at)}
                </span>
                <div className="h-px flex-1 bg-[var(--color-border-subtle)] opacity-50" />
              </div>

              {/* Clusters for this day */}
              <div className="space-y-1">
                {clusters.map(({ key, items }) => (
                  <NotificationClusterRow
                    key={key}
                    items={items}
                    onRead={onRead}
                    onAction={onAction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
