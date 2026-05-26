"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Notification } from "@/components/features/NotificationItem"

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Caricamento iniziale delle notifiche
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      return
    }

    fetchNotifications()

    // Iscrizione al canale Realtime
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
          )
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('useNotifications: Realtime channel error for user', userId)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  // Funzione per segnare come letta
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    }
  }

  // Funzione per segnare tutte come lette
  const markAllAsRead = async () => {
    if (!userId) return
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
  }

  return { notifications, loading, markAsRead, markAllAsRead, refresh: fetchNotifications }
}
