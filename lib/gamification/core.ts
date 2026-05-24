"use client"

export const CHALLENGE_READ_DELAY_MS = 6000
export const GAMIFICATION_STORAGE_KEY = "think_gamification_state_v2"

export type ChallengeCategory = "attivita" | "sociale" | "pensiero" | "lettura"
export type ChallengeTrackingType = "client" | "hybrid" | "server"

export interface ChallengeDefinition {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  xpReward: number
  difficultyOrder: number
  repeatable: boolean
  progressTarget: number
  trackingType: ChallengeTrackingType
  statusVisibility: "always"
  icon: string
}

export interface ChallengeProgress {
  challenge_id: string
  current_value: number
  completed: boolean
  completed_at: string | null
  times_completed: number
  last_notified_at: string | null
  updated_at: string
}

export interface DerivedGamificationSnapshot {
  gamification: UserGamification
  challenges: ChallengeDefinition[]
  userChallenges: ChallengeProgress[]
  progressMap: Record<string, ChallengeProgress>
  counters: ChallengeCounters
}

export interface ChallengeCounters {
  articleSlugsRead: string[]
  articleChatIdsRead: string[]
  questionChatIdsOpened: string[]
  participatedChatIds: string[]
  newsInteractedChatIds: string[]
  ownChatParticipantKeys: string[]
  completedChallengeIds: string[]
}

export interface TrackEventResult {
  snapshot: DerivedGamificationSnapshot
  completedChallenges: ChallengeDefinition[]
  levelUps: { from: number; to: number }[]
  articleReadCount?: number
}

export type ChallengeEvent =
  | { type: "thought_created"; chatId: string; chatType?: Chat["tipo"] }
  | { type: "reply_created"; chatId: string; chatType?: Chat["tipo"]; countsForParticipation?: boolean; countsForNewsChain?: boolean; isMostDiscussedNews?: boolean }
  | { type: "question_opened"; chatId: string }
  | { type: "article_read"; slug: string; chatId?: string | null }
  | { type: "chat_became_tree"; chatId: string }
  | { type: "chat_became_seme"; chatId: string }
  | { type: "chat_became_germoglio"; chatId: string }
  | { type: "chat_became_foglia_secca"; chatId: string }
  | { type: "chat_became_archivio"; chatId: string }
  | { type: "my_chat_participants_synced"; participantKeys: string[] }
  | { type: "leaderboard_status"; isTopToday?: boolean; isTopWeek?: boolean }

export const THINK_CHALLENGES: ChallengeDefinition[] = [
  {
    id: "scrivi_un_messaggio",
    title: "Scrivi un messaggio",
    description: "Pubblica il tuo primo pensiero sul globo.",
    category: "attivita",
    xpReward: 1,
    difficultyOrder: 1,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "✍️",
  },
  {
    id: "rispondi_a_un_messaggio_altrui",
    title: "Rispondi a un messaggio altrui",
    description: "Aggiungi profondita rispondendo a un pensiero di un altro utente.",
    category: "sociale",
    xpReward: 1,
    difficultyOrder: 2,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "💬",
  },
  {
    id: "espandi_gli_orizzonti_inizia_una_nuova_conversazione",
    title: "Espandi gli orizzonti",
    description: "Inizia una nuova conversazione con un pensiero originale.",
    category: "pensiero",
    xpReward: 1,
    difficultyOrder: 3,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🧭",
  },
  {
    id: "leggi_la_tua_prima_thinknews",
    title: "Leggi la tua prima ThinkNews",
    description: "Apri un articolo del blog e resta abbastanza da leggerlo davvero.",
    category: "lettura",
    xpReward: 1,
    difficultyOrder: 4,
    repeatable: false,
    progressTarget: 1,
    trackingType: "hybrid",
    statusVisibility: "always",
    icon: "📰",
  },
  {
    id: "leggi_una_question",
    title: "Leggi una Question",
    description: "Apri un pensiero nella sezione Tendenze e soffermati qualche secondo.",
    category: "lettura",
    xpReward: 1,
    difficultyOrder: 5,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🔥",
  },
  {
    id: "scrivi_la_tua_opinione_sulla_thinknews_piu_discussa",
    title: "Scrivi la tua opinione sulla ThinkNews piu discussa",
    description: "Partecipa alla conversazione news piu viva del momento.",
    category: "pensiero",
    xpReward: 1,
    difficultyOrder: 6,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🗞️",
  },
  {
    id: "scrivi_la_tua_opinione_sulla_question_che_ti_interessa_di_piu",
    title: "Scrivi la tua opinione sulla Question che ti interessa di piu",
    description: "Rispondi a una Question dalla sezione Tendenze.",
    category: "pensiero",
    xpReward: 1,
    difficultyOrder: 7,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🧠",
  },
  {
    id: "raggiungi_stato_seme",
    title: "Genesi: Pianta un Seme",
    description: "Crea il tuo primo pensiero e dallo alla luce sul globo.",
    category: "attivita",
    xpReward: 1,
    difficultyOrder: 1,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🌱",
  },
  {
    id: "raggiungi_stato_germoglio",
    title: "Risveglio: Spunta un Germoglio",
    description: "Attrai la tua prima interazione per far evolvere il seme in germoglio.",
    category: "attivita",
    xpReward: 1,
    difficultyOrder: 2,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🌿",
  },
  {
    id: "fai_crescere_il_tuo_pensiero_come_un_albero",
    title: "Maturità: Cresce un Albero",
    description: "Il tuo pensiero fa radici profonde e diventa un albero maestoso.",
    category: "attivita",
    xpReward: 2,
    difficultyOrder: 3,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🌳",
  },
  {
    id: "raggiungi_stato_foglia_secca",
    title: "Autunno: Foglia Secca",
    description: "Lascia che il tuo pensiero si posi, entrando nella fase di inattività.",
    category: "attivita",
    xpReward: 1,
    difficultyOrder: 4,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🍂",
  },
  {
    id: "raggiungi_stato_archivio",
    title: "Memoria: Archivio Storico",
    description: "Il tuo pensiero compie il suo ciclo vitale e passa alla storia.",
    category: "attivita",
    xpReward: 1,
    difficultyOrder: 5,
    repeatable: false,
    progressTarget: 1,
    trackingType: "client",
    statusVisibility: "always",
    icon: "📦",
  },
  {
    id: "spazia_partecipa_a_10_conversazioni_diverse",
    title: "Spazia: partecipa a 10 conversazioni diverse",
    description: "Interagisci con 10 conversazioni diverse tra pensieri e question.",
    category: "sociale",
    xpReward: 2,
    difficultyOrder: 9,
    repeatable: false,
    progressTarget: 10,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🌍",
  },
  {
    id: "sii_il_pensatore_piu_operoso_del_giorno",
    title: "Sii il pensatore piu operoso del giorno",
    description: "Chiudi la giornata in cima alla classifica delle attivita.",
    category: "attivita",
    xpReward: 2,
    difficultyOrder: 10,
    repeatable: false,
    progressTarget: 1,
    trackingType: "server",
    statusVisibility: "always",
    icon: "☀️",
  },
  {
    id: "tieniti_informato_leggi_10_articoli_diversi_nel_blog",
    title: "Tieniti informato: leggi 10 articoli diversi nel Blog",
    description: "Completa 10 letture qualificate di articoli differenti nel blog Think.",
    category: "lettura",
    xpReward: 2,
    difficultyOrder: 11,
    repeatable: false,
    progressTarget: 10,
    trackingType: "hybrid",
    statusVisibility: "always",
    icon: "📚",
  },
  {
    id: "sii_il_pensatore_piu_attivo_della_settimana",
    title: "Sii il pensatore piu attivo della settimana",
    description: "Chiudi la settimana in testa alla classifica delle attivita.",
    category: "attivita",
    xpReward: 2,
    difficultyOrder: 12,
    repeatable: false,
    progressTarget: 1,
    trackingType: "server",
    statusVisibility: "always",
    icon: "🏁",
  },
  {
    id: "coinvolgi_10_pensatori_diversi_nella_tua_chat",
    title: "Coinvolgi 10 pensatori diversi nella tua chat",
    description: "Raccogli 10 partecipanti diversi su uno o piu pensieri creati da te.",
    category: "sociale",
    xpReward: 3,
    difficultyOrder: 13,
    repeatable: false,
    progressTarget: 10,
    trackingType: "hybrid",
    statusVisibility: "always",
    icon: "👥",
  },
  {
    id: "completa_10_sfide_diverse",
    title: "Completa 10 sfide diverse",
    description: "Sblocca 10 sfide differenti almeno una volta.",
    category: "attivita",
    xpReward: 3,
    difficultyOrder: 14,
    repeatable: false,
    progressTarget: 10,
    trackingType: "client",
    statusVisibility: "always",
    icon: "🏆",
  },
  {
    id: "prendi_in_mano_il_tempo_politico_instaurA_o_alimenta_10_conversazioni_sulle_thinknews_che_hai_letto",
    title: "Prendi in mano il tempo politico",
    description: "Installa o alimenta 10 conversazioni sulle ThinkNews che hai letto.",
    category: "pensiero",
    xpReward: 3,
    difficultyOrder: 15,
    repeatable: false,
    progressTarget: 10,
    trackingType: "hybrid",
    statusVisibility: "always",
    icon: "🗳️",
  },
]

const CHALLENGE_MAP = new Map(THINK_CHALLENGES.map((challenge) => [challenge.id, challenge]))

function toUniqueList(values: (string | number | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string | number => value != null).map(String)))
}

export function createEmptyCounters(): ChallengeCounters {
  return {
    articleSlugsRead: [],
    articleChatIdsRead: [],
    questionChatIdsOpened: [],
    participatedChatIds: [],
    newsInteractedChatIds: [],
    ownChatParticipantKeys: [],
    completedChallengeIds: [],
  }
}

export function createEmptyGamification(userId?: string | null): UserGamification {
  const thinkPoints = 0
  const depthLevel = calculateDepthLevel(thinkPoints)
  return {
    user_id: userId || null,
    think_points: thinkPoints,
    depth_level: depthLevel,
    streak_days: 0,
    last_activity_date: null,
    updated_at: new Date().toISOString(),
    current_level_points: getLevelThreshold(depthLevel),
    next_level_points: getLevelThreshold(depthLevel + 1),
  }
}

export function getLevelThreshold(level: number): number {
  if (level <= 1) return 0
  const rank = level - 1
  return Math.round((rank * rank * 4) + (rank * 12))
}

export function calculateDepthLevel(thinkPoints: number): number {
  let level = 1
  while (getLevelThreshold(level + 1) <= thinkPoints) {
    level += 1
  }
  return level
}

export function buildVirtualDepthLevels(currentLevel: number, span = 8): DepthLevel[] {
  const maxLevel = Math.max(span, currentLevel + 2)
  return Array.from({ length: maxLevel }, (_, index) => {
    const level = index + 1
    return {
      id: level,
      nome: level === 1 ? "Livello 1" : `Livello ${level}`,
      slug: `livello-${level}`,
      soglia_punti: getLevelThreshold(level),
      descrizione: level === 1 ? "Ogni nuova sfida ti mette in moto." : `Serve piu esperienza del livello ${level - 1}.`,
      recognition_nome: null,
      recognition_descrizione: null,
      recognition_tipo: null,
    }
  })
}

function createInitialProgress(challengeId: string): ChallengeProgress {
  const now = new Date().toISOString()
  return {
    challenge_id: challengeId,
    current_value: 0,
    completed: false,
    completed_at: null,
    times_completed: 0,
    last_notified_at: null,
    updated_at: now,
  }
}

export function buildSnapshot(input: {
  gamification?: Partial<UserGamification> | null
  userChallenges?: Partial<ChallengeProgress>[] | null
  counters?: Partial<ChallengeCounters> | null
  userId?: string | null
}): DerivedGamificationSnapshot {
  const counters = {
    ...createEmptyCounters(),
    ...input.counters,
  }
  const gamification = {
    ...createEmptyGamification(input.userId),
    ...input.gamification,
  }

  const progressMap = THINK_CHALLENGES.reduce<Record<string, ChallengeProgress>>((acc, challenge) => {
    const existing = input.userChallenges?.find((entry) => entry.challenge_id === challenge.id)
    acc[challenge.id] = {
      ...createInitialProgress(challenge.id),
      ...existing,
      challenge_id: challenge.id,
    }
    return acc
  }, {})

  counters.completedChallengeIds = toUniqueList(
    THINK_CHALLENGES.filter((challenge) => progressMap[challenge.id]?.completed).map((challenge) => challenge.id)
  )

  gamification.depth_level = calculateDepthLevel(gamification.think_points || 0)
  gamification.current_level_points = getLevelThreshold(gamification.depth_level)
  gamification.next_level_points = getLevelThreshold(gamification.depth_level + 1)

  return {
    gamification,
    challenges: THINK_CHALLENGES,
    userChallenges: THINK_CHALLENGES.map((challenge) => progressMap[challenge.id]),
    progressMap,
    counters,
  }
}

function markChallengeCompleted(
  snapshot: DerivedGamificationSnapshot,
  challengeId: string,
  completedChallenges: ChallengeDefinition[],
  nowIso: string,
) {
  const challenge = CHALLENGE_MAP.get(challengeId)
  if (!challenge) return
  const progress = snapshot.progressMap[challengeId] || createInitialProgress(challengeId)

  if (progress.completed && !challenge.repeatable) {
    return
  }

  progress.current_value = Math.max(progress.current_value, challenge.progressTarget)
  progress.completed = true
  progress.completed_at = progress.completed_at || nowIso
  progress.updated_at = nowIso
  progress.last_notified_at = nowIso
  progress.times_completed += 1
  snapshot.progressMap[challengeId] = progress

  if (!snapshot.counters.completedChallengeIds.includes(challengeId)) {
    snapshot.counters.completedChallengeIds = [...snapshot.counters.completedChallengeIds, challengeId]
    snapshot.gamification.think_points += challenge.xpReward
    completedChallenges.push(challenge)
  }
}

function setProgressValue(snapshot: DerivedGamificationSnapshot, challengeId: string, value: number, nowIso: string) {
  const progress = snapshot.progressMap[challengeId] || createInitialProgress(challengeId)
  progress.current_value = value
  progress.updated_at = nowIso
  snapshot.progressMap[challengeId] = progress
}

export function applyChallengeEvent(
  previous: DerivedGamificationSnapshot,
  event: ChallengeEvent,
  options?: { userId?: string | null }
): TrackEventResult {
  const nowIso = new Date().toISOString()
  const snapshot = buildSnapshot({
    gamification: previous.gamification,
    userChallenges: previous.userChallenges,
    counters: previous.counters,
    userId: options?.userId ?? previous.gamification.user_id,
  })
  const completedChallenges: ChallengeDefinition[] = []
  const oldLevel = snapshot.gamification.depth_level

  switch (event.type) {
    case "thought_created": {
      markChallengeCompleted(snapshot, "scrivi_un_messaggio", completedChallenges, nowIso)
      markChallengeCompleted(snapshot, "espandi_gli_orizzonti_inizia_una_nuova_conversazione", completedChallenges, nowIso)
      snapshot.counters.participatedChatIds = toUniqueList([...snapshot.counters.participatedChatIds, event.chatId])
      break
    }
    case "reply_created": {
      markChallengeCompleted(snapshot, "rispondi_a_un_messaggio_altrui", completedChallenges, nowIso)
      if (event.chatType === "domanda_trending") {
        markChallengeCompleted(snapshot, "scrivi_la_tua_opinione_sulla_question_che_ti_interessa_di_piu", completedChallenges, nowIso)
      }
      if (event.chatType === "domanda_notizia" && event.isMostDiscussedNews) {
        markChallengeCompleted(snapshot, "scrivi_la_tua_opinione_sulla_thinknews_piu_discussa", completedChallenges, nowIso)
      }
      if (event.countsForParticipation !== false) {
        snapshot.counters.participatedChatIds = toUniqueList([...snapshot.counters.participatedChatIds, event.chatId])
      }
      if (event.chatType === "domanda_notizia" && event.countsForNewsChain) {
        snapshot.counters.newsInteractedChatIds = toUniqueList([...snapshot.counters.newsInteractedChatIds, event.chatId])
      }
      break
    }
    case "question_opened": {
      snapshot.counters.questionChatIdsOpened = toUniqueList([...snapshot.counters.questionChatIdsOpened, event.chatId])
      markChallengeCompleted(snapshot, "leggi_una_question", completedChallenges, nowIso)
      snapshot.counters.participatedChatIds = toUniqueList([...snapshot.counters.participatedChatIds, event.chatId])
      break
    }
    case "article_read": {
      snapshot.counters.articleSlugsRead = toUniqueList([...snapshot.counters.articleSlugsRead, event.slug])
      if (event.chatId) {
        snapshot.counters.articleChatIdsRead = toUniqueList([...snapshot.counters.articleChatIdsRead, event.chatId])
      }
      setProgressValue(snapshot, "leggi_la_tua_prima_thinknews", Math.min(1, snapshot.counters.articleSlugsRead.length), nowIso)
      setProgressValue(
        snapshot,
        "tieniti_informato_leggi_10_articoli_diversi_nel_blog",
        Math.min(10, snapshot.counters.articleSlugsRead.length),
        nowIso
      )
      if (snapshot.counters.articleSlugsRead.length >= 1) {
        markChallengeCompleted(snapshot, "leggi_la_tua_prima_thinknews", completedChallenges, nowIso)
      }
      if (snapshot.counters.articleSlugsRead.length >= 10) {
        markChallengeCompleted(snapshot, "tieniti_informato_leggi_10_articoli_diversi_nel_blog", completedChallenges, nowIso)
      }
      break
    }
    case "chat_became_seme": {
      markChallengeCompleted(snapshot, "raggiungi_stato_seme", completedChallenges, nowIso)
      break
    }
    case "chat_became_germoglio": {
      markChallengeCompleted(snapshot, "raggiungi_stato_germoglio", completedChallenges, nowIso)
      break
    }
    case "chat_became_tree": {
      markChallengeCompleted(snapshot, "fai_crescere_il_tuo_pensiero_come_un_albero", completedChallenges, nowIso)
      break
    }
    case "chat_became_foglia_secca": {
      markChallengeCompleted(snapshot, "raggiungi_stato_foglia_secca", completedChallenges, nowIso)
      break
    }
    case "chat_became_archivio": {
      markChallengeCompleted(snapshot, "raggiungi_stato_archivio", completedChallenges, nowIso)
      break
    }
    case "my_chat_participants_synced": {
      snapshot.counters.ownChatParticipantKeys = toUniqueList(event.participantKeys)
      setProgressValue(
        snapshot,
        "coinvolgi_10_pensatori_diversi_nella_tua_chat",
        Math.min(10, snapshot.counters.ownChatParticipantKeys.length),
        nowIso
      )
      if (snapshot.counters.ownChatParticipantKeys.length >= 10) {
        markChallengeCompleted(snapshot, "coinvolgi_10_pensatori_diversi_nella_tua_chat", completedChallenges, nowIso)
      }
      break
    }
    case "leaderboard_status": {
      if (event.isTopToday) {
        markChallengeCompleted(snapshot, "sii_il_pensatore_piu_operoso_del_giorno", completedChallenges, nowIso)
      }
      if (event.isTopWeek) {
        markChallengeCompleted(snapshot, "sii_il_pensatore_piu_attivo_della_settimana", completedChallenges, nowIso)
      }
      break
    }
  }

  setProgressValue(
    snapshot,
    "spazia_partecipa_a_10_conversazioni_diverse",
    Math.min(10, snapshot.counters.participatedChatIds.length),
    nowIso
  )
  if (snapshot.counters.participatedChatIds.length >= 10) {
    markChallengeCompleted(snapshot, "spazia_partecipa_a_10_conversazioni_diverse", completedChallenges, nowIso)
  }

  const readAndDiscussedCount = snapshot.counters.newsInteractedChatIds.filter((chatId) =>
    snapshot.counters.articleChatIdsRead.includes(chatId)
  ).length
  setProgressValue(
    snapshot,
    "prendi_in_mano_il_tempo_politico_instaurA_o_alimenta_10_conversazioni_sulle_thinknews_che_hai_letto",
    Math.min(10, readAndDiscussedCount),
    nowIso
  )
  if (readAndDiscussedCount >= 10) {
    markChallengeCompleted(
      snapshot,
      "prendi_in_mano_il_tempo_politico_instaurA_o_alimenta_10_conversazioni_sulle_thinknews_che_hai_letto",
      completedChallenges,
      nowIso
    )
  }

  setProgressValue(
    snapshot,
    "completa_10_sfide_diverse",
    Math.min(10, snapshot.counters.completedChallengeIds.length),
    nowIso
  )
  if (snapshot.counters.completedChallengeIds.length >= 10) {
    markChallengeCompleted(snapshot, "completa_10_sfide_diverse", completedChallenges, nowIso)
  }

  snapshot.gamification.depth_level = calculateDepthLevel(snapshot.gamification.think_points)
  snapshot.gamification.current_level_points = getLevelThreshold(snapshot.gamification.depth_level)
  snapshot.gamification.next_level_points = getLevelThreshold(snapshot.gamification.depth_level + 1)
  snapshot.gamification.updated_at = nowIso
  snapshot.userChallenges = THINK_CHALLENGES.map((challenge) => snapshot.progressMap[challenge.id])

  const levelUps =
    snapshot.gamification.depth_level > oldLevel
      ? [{ from: oldLevel, to: snapshot.gamification.depth_level }]
      : []

  return {
    snapshot,
    completedChallenges,
    levelUps,
    articleReadCount: event.type === "article_read" ? snapshot.counters.articleSlugsRead.length : undefined,
  }
}

export function serializeSnapshot(snapshot: DerivedGamificationSnapshot) {
  return JSON.stringify({
    gamification: snapshot.gamification,
    userChallenges: snapshot.userChallenges,
    counters: snapshot.counters,
  })
}

export function deserializeSnapshot(raw: string | null, userId?: string | null): DerivedGamificationSnapshot {
  if (!raw) return buildSnapshot({ userId })
  try {
    const parsed = JSON.parse(raw)
    return buildSnapshot({
      gamification: parsed?.gamification,
      userChallenges: parsed?.userChallenges,
      counters: parsed?.counters,
      userId,
    })
  } catch {
    return buildSnapshot({ userId })
  }
}

