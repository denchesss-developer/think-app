"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  GAMIFICATION_STORAGE_KEY,
  THINK_CHALLENGES,
  applyChallengeEvent,
  buildSnapshot,
  buildVirtualDepthLevels,
  createEmptyGamification,
  deserializeSnapshot,
  serializeSnapshot,
  type ChallengeEvent,
  type DerivedGamificationSnapshot,
  type TrackEventResult,
} from "@/lib/gamification/core"

interface ServerChallengeProgressRow {
  challenge_id: string
  current_value: number | null
  completed: boolean | null
  completed_at: string | null
  times_completed: number | null
  last_notified_at: string | null
  meta?: Record<string, unknown> | null
  updated_at?: string
}

function getStorageKey(userId?: string | null, sessionId?: string | null) {
  if (userId) return `${GAMIFICATION_STORAGE_KEY}:user:${userId}`
  if (sessionId) return `${GAMIFICATION_STORAGE_KEY}:anon:${sessionId}`
  return `${GAMIFICATION_STORAGE_KEY}:anon:default`
}

async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const { data: existing } = await supabase
    .from("user_gamification")
    .select("streak_days, last_activity_date")
    .eq("user_id", userId)
    .single()

  if (!existing) {
    await supabase.from("user_gamification").upsert({
      user_id: userId,
      think_points: 0,
      depth_level: 1,
      streak_days: 1,
      last_activity_date: today,
      current_level_points: 0,
      next_level_points: 16,
    })
    return
  }

  if (existing.last_activity_date === today) return

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const isConsecutive = existing.last_activity_date === yesterday.toISOString().slice(0, 10)

  await supabase
    .from("user_gamification")
    .update({
      streak_days: isConsecutive ? (existing.streak_days || 0) + 1 : 1,
      last_activity_date: today,
    })
    .eq("user_id", userId)
}

async function loadServerSnapshot(userId: string): Promise<DerivedGamificationSnapshot | null> {
  const [{ data: gamification }, { data: progressRows }] = await Promise.all([
    supabase.from("user_gamification").select("*").eq("user_id", userId).single(),
    supabase.from("user_challenge_progress").select("*").eq("user_id", userId),
  ])

  if (!gamification && !progressRows) return null

  const rows = (progressRows || []) as ServerChallengeProgressRow[]

  const counters = rows.reduce<Record<string, unknown>>((acc, row) => {
    if (row.challenge_id === "__counters__" && row.meta) {
      return { ...row.meta }
    }
    return acc
  }, {})

  const userChallenges = rows
    .filter((row) => row.challenge_id !== "__counters__")
    .map((row) => ({
      challenge_id: row.challenge_id,
      current_value: row.current_value ?? 0,
      completed: row.completed ?? false,
      completed_at: row.completed_at ?? null,
      times_completed: row.times_completed ?? 0,
      last_notified_at: row.last_notified_at ?? null,
      updated_at: row.updated_at,
    }))

  return buildSnapshot({
    gamification: gamification || createEmptyGamification(userId),
    userChallenges,
    counters,
    userId,
  })
}

async function saveServerSnapshot(userId: string, snapshot: DerivedGamificationSnapshot) {
  const challengeRows: Array<{
    user_id: string
    challenge_id: string
    current_value: number
    completed: boolean
    completed_at: string | null
    times_completed: number
    last_notified_at: string | null
    meta: Record<string, unknown> | null
  }> = snapshot.userChallenges.map((progress) => ({
    user_id: userId,
    challenge_id: progress.challenge_id,
    current_value: progress.current_value,
    completed: progress.completed,
    completed_at: progress.completed_at,
    times_completed: progress.times_completed,
    last_notified_at: progress.last_notified_at,
    meta: null,
  }))

  challengeRows.push({
    user_id: userId,
    challenge_id: "__counters__",
    current_value: 0,
    completed: false,
    completed_at: null,
    times_completed: 0,
    last_notified_at: null,
    meta: snapshot.counters as unknown as Record<string, unknown>,
  })

  await Promise.all([
    supabase.from("user_gamification").upsert({
      user_id: userId,
      think_points: snapshot.gamification.think_points,
      depth_level: snapshot.gamification.depth_level,
      streak_days: snapshot.gamification.streak_days,
      last_activity_date: snapshot.gamification.last_activity_date,
      current_level_points: snapshot.gamification.current_level_points,
      next_level_points: snapshot.gamification.next_level_points,
      updated_at: new Date().toISOString(),
    }),
    supabase.from("user_challenge_progress").upsert(challengeRows, { onConflict: "user_id,challenge_id" }),
  ])
}

function hydrateParticipantChallenge(snapshot: DerivedGamificationSnapshot, rows: { user_id: string | null; autore: string | null }[]) {
  const participantKeys = rows
    .map((row) => row.user_id || (row.autore ? `anon:${row.autore.trim().toLowerCase()}` : null))
    .filter((value): value is string => Boolean(value))

  return applyChallengeEvent(snapshot, {
    type: "my_chat_participants_synced",
    participantKeys,
  }, { userId: snapshot.gamification.user_id })
}

async function evaluateLeaderboardStatus(userId: string) {
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(dayStart)
  const weekDay = weekStart.getDay() || 7
  weekStart.setDate(weekStart.getDate() - (weekDay - 1))

  const [{ data: todayChats }, { data: todayReplies }, { data: weekChats }, { data: weekReplies }] = await Promise.all([
    supabase.from("chats").select("user_id, created_at").gte("created_at", dayStart.toISOString()).not("user_id", "is", null),
    supabase.from("risposte").select("user_id, created_at").gte("created_at", dayStart.toISOString()).not("user_id", "is", null),
    supabase.from("chats").select("user_id, created_at").gte("created_at", weekStart.toISOString()).not("user_id", "is", null),
    supabase.from("risposte").select("user_id, created_at").gte("created_at", weekStart.toISOString()).not("user_id", "is", null),
  ])

  const countEntries = (entries: { user_id: string | null }[]) => {
    return entries.reduce<Record<string, number>>((acc, entry) => {
      if (!entry.user_id) return acc
      acc[entry.user_id] = (acc[entry.user_id] || 0) + 1
      return acc
    }, {})
  }

  const daily = countEntries([...(todayChats || []), ...(todayReplies || [])])
  const weekly = countEntries([...(weekChats || []), ...(weekReplies || [])])

  const topDaily = Object.entries(daily).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topWeekly = Object.entries(weekly).sort((a, b) => b[1] - a[1])[0]?.[0]

  return {
    isTopToday: topDaily === userId && (daily[userId] || 0) > 0,
    isTopWeek: topWeekly === userId && (weekly[userId] || 0) > 0,
  }
}

export function useGamification(userId: string | undefined, sessionId?: string | null) {
  const storageKey = useMemo(() => getStorageKey(userId, sessionId), [userId, sessionId])

  const [snapshot, setSnapshot] = useState<DerivedGamificationSnapshot>(() =>
    deserializeSnapshot(typeof window === "undefined" ? null : localStorage.getItem(storageKey), userId || sessionId)
  )
  const [popupQueue, setPopupQueue] = useState<GamificationPopupItem[]>([])
  const [loading, setLoading] = useState(true)
  const shownPopupsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem("think_shown_popups")
      if (stored) shownPopupsRef.current = new Set(JSON.parse(stored))
    } catch {
      shownPopupsRef.current = new Set()
    }
  }, [])

  const persistSnapshot = useCallback((nextSnapshot: DerivedGamificationSnapshot) => {
    localStorage.setItem(storageKey, serializeSnapshot(nextSnapshot))
    setSnapshot(nextSnapshot)
  }, [storageKey])

  const enqueuePopup = useCallback((item: GamificationPopupItem) => {
    if (shownPopupsRef.current.has(item.popupKey)) return
    setPopupQueue((queue) => [...queue, item])
  }, [])

  const syncDerivedServerData = useCallback(async (baseSnapshot: DerivedGamificationSnapshot) => {
    if (!userId) return baseSnapshot

    const { data: myChats } = await supabase.from("chats").select("id").eq("user_id", userId).limit(200)
    let nextSnapshot = baseSnapshot

    if (myChats?.length) {
      const myChatIds = myChats.map((chat) => chat.id)
      const { data: replies } = await supabase
        .from("risposte")
        .select("user_id, autore, chat_id")
        .in("chat_id", myChatIds)
      if (replies) {
        nextSnapshot = hydrateParticipantChallenge(nextSnapshot, replies).snapshot
      }
    }

    const leaderboardStatus = await evaluateLeaderboardStatus(userId)
    nextSnapshot = applyChallengeEvent(nextSnapshot, {
      type: "leaderboard_status",
      ...leaderboardStatus,
    }, { userId }).snapshot

    return nextSnapshot
  }, [userId])

  const refresh = useCallback(async () => {
    setLoading(true)
    let baseSnapshot = deserializeSnapshot(localStorage.getItem(storageKey), userId || sessionId)

    if (userId) {
      await updateStreak(userId)
      const serverSnapshot = await loadServerSnapshot(userId)
      if (serverSnapshot) {
        baseSnapshot = serverSnapshot
      }
      baseSnapshot = await syncDerivedServerData(baseSnapshot)
      await saveServerSnapshot(userId, baseSnapshot).catch(() => undefined)
    }

    persistSnapshot(baseSnapshot)
    setLoading(false)
  }, [persistSnapshot, sessionId, storageKey, syncDerivedServerData, userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  const emitResultPopups = useCallback((result: TrackEventResult) => {
    result.completedChallenges.forEach((challenge) => {
      enqueuePopup({
        type: "challenge_completed",
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        challengeIcon: challenge.icon,
        points: challenge.xpReward,
        popupKey: `challenge:${challenge.id}:${result.snapshot.progressMap[challenge.id]?.times_completed || 1}`,
      })
    })

    if (typeof result.articleReadCount === "number" && result.articleReadCount > 0) {
      enqueuePopup({
        type: "challenge_progress",
        challengeId: "leggi_la_tua_prima_thinknews",
        challengeTitle: "ThinkNews lette",
        challengeIcon: "📰",
        counterText: `${result.articleReadCount} articoli letti`,
        description: "Continua a leggere per accumulare esperienza.",
        popupKey: `article-counter:${result.articleReadCount}:${Date.now()}`,
      })
    }

    result.levelUps.forEach((levelUp) => {
      enqueuePopup({
        type: "depth_up",
        depthLevel: levelUp.to,
        depthName: `Livello ${levelUp.to}`,
        popupKey: `level-up:${levelUp.to}:${Date.now()}`,
      })
    })
  }, [enqueuePopup])

  const trackChallengeEvent = useCallback(async (event: ChallengeEvent) => {
    const baseSnapshot = deserializeSnapshot(localStorage.getItem(storageKey), userId || sessionId)
    const result = applyChallengeEvent(baseSnapshot, event, { userId })

    if (!userId && result.completedChallenges.length > 0) {
      enqueuePopup({
        type: "anon_notice",
        challengeTitle: "Salva le tue sfide",
        challengeIcon: "🔐",
        description: "Accedi per salvare queste sfide per sempre.",
        popupKey: `anon-notice:${Date.now()}`,
      })
    }

    persistSnapshot(result.snapshot)
    emitResultPopups(result)

    if (userId) {
      await saveServerSnapshot(userId, result.snapshot).catch(() => undefined)
    }

    return result
  }, [emitResultPopups, enqueuePopup, persistSnapshot, sessionId, storageKey, userId])

  const trackArticleRead = useCallback(async (slug: string, chatId?: string | null) => {
    return trackChallengeEvent({ type: "article_read", slug, chatId: chatId || null })
  }, [trackChallengeEvent])

  const dismissPopup = useCallback((popupKey: string) => {
    shownPopupsRef.current.add(popupKey)
    localStorage.setItem("think_shown_popups", JSON.stringify([...shownPopupsRef.current]))
    setPopupQueue((queue) => queue.filter((popup) => popup.popupKey !== popupKey))
  }, [])

  const depthLevels = useMemo(() => buildVirtualDepthLevels(snapshot.gamification.depth_level), [snapshot.gamification.depth_level])
  const currentDepth = useMemo(
    () => depthLevels.find((level) => level.id === snapshot.gamification.depth_level),
    [depthLevels, snapshot.gamification.depth_level]
  )
  const nextDepth = useMemo(
    () => depthLevels.find((level) => level.id === snapshot.gamification.depth_level + 1),
    [depthLevels, snapshot.gamification.depth_level]
  )

  const progressToNext = useMemo(() => {
    const currentFloor = snapshot.gamification.current_level_points
    const nextFloor = snapshot.gamification.next_level_points
    const range = Math.max(1, nextFloor - currentFloor)
    const earned = snapshot.gamification.think_points - currentFloor
    return Math.max(0, Math.min(100, Math.round((earned / range) * 100)))
  }, [snapshot.gamification.current_level_points, snapshot.gamification.next_level_points, snapshot.gamification.think_points])

  return {
    gamification: snapshot.gamification,
    depthLevels,
    challenges: THINK_CHALLENGES.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      categoria: challenge.category,
      xp_reward: challenge.xpReward,
      difficulty_order: challenge.difficultyOrder,
      repeatable: challenge.repeatable,
      progress_target: challenge.progressTarget,
      tracking_type: challenge.trackingType,
      status_visibility: challenge.statusVisibility,
      icona: challenge.icon,
    })) as Challenge[],
    userChallenges: snapshot.userChallenges.map((progress) => ({
      id: 0,
      user_id: userId || null,
      challenge_id: progress.challenge_id,
      current_value: progress.current_value,
      completed: progress.completed,
      completed_at: progress.completed_at,
      times_completed: progress.times_completed,
      last_notified_at: progress.last_notified_at,
      updated_at: progress.updated_at,
    })) as UserChallengeProgress[],
    currentDepth,
    nextDepth,
    progressToNext,
    popupQueue,
    loading,
    trackChallengeEvent,
    trackArticleRead,
    dismissPopup,
    refresh,
    counters: snapshot.counters,
  }
}
