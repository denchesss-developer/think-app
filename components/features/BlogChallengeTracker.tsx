"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useGamification } from "@/lib/hooks/useGamification"
import { CHALLENGE_READ_DELAY_MS } from "@/lib/gamification/core"
import { GamificationPopup } from "@/components/features/GamificationPopup"

interface BlogChallengeTrackerProps {
  slug: string
  chatId?: number | null
}

function ensureAnonSessionId() {
  const existing = localStorage.getItem("think_session_id")
  if (existing) return existing
  const next = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  localStorage.setItem("think_session_id", next)
  return next
}

export function BlogChallengeTracker({ slug, chatId }: BlogChallengeTrackerProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { popupQueue, dismissPopup, trackArticleRead } = useGamification(userId, sessionId)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUserId(data.user?.id)
      setSessionId(ensureAnonSessionId())
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return
    const timeoutId = window.setTimeout(() => {
      trackArticleRead(slug, chatId ? String(chatId) : null).catch(() => undefined)
    }, CHALLENGE_READ_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [chatId, sessionId, slug, trackArticleRead])

  return (
    <GamificationPopup
      popupQueue={popupQueue}
      onDismiss={dismissPopup}
      onGoToProfile={() => router.push("/")}
    />
  )
}

