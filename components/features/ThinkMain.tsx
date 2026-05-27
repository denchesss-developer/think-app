"use client"


import { useState, useEffect, useRef, useCallback } from "react"
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import Logo from "@/components/ui/Logo"
import { X } from "lucide-react"

// Layout Components
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { MobileSheet } from "@/components/layout/MobileSheet"

// Feature Components
import { STILI_STATO, calcolaStatoVitale, MapGlobe } from "@/components/features/MapGlobe"
import { AccountView } from "@/components/features/AccountView"
import { ActivityView } from "@/components/features/ActivityView"
import { ComposeView } from "@/components/features/ComposeView"
import DiscoveryView from "@/components/features/DiscoveryView"
import ChatDetailView from "@/components/features/ChatDetailView"
import ManualLocationSearchModal from "@/components/features/ManualLocationSearchModal"
import MaintenancePage from "@/components/features/MaintenancePage"
import { LocationGuide } from "@/components/features/LocationGuide"
import { ModalsContainer } from "@/components/features/ModalsContainer"
import { ReportModal } from "@/components/features/ReportModal"
import { NotificationBell } from "@/components/features/NotificationBell"
import { NotificationsView } from "@/components/features/NotificationsView"
import { PushPermissionModal } from "@/components/features/PushPermissionModal"
import { GamificationPopup } from "@/components/features/GamificationPopup"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useGamification } from "@/lib/hooks/useGamification"
import type { AppTheme } from "@/components/features/AccountView"

// UI Components
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"

// Actions
import { translateText, translateSearchQuery } from "@/app/actions/translate"

import { useAuthProfile, nicknameErrorMessage } from "@/lib/hooks/useAuthProfile"
import { useLocationManager } from "@/lib/hooks/useLocationManager"

type Mode = "feed" | "chat" | "account" | "activity" | "compose" | "notifications"

export default function ThinkMain() {
  const { lang, setLang, t } = useLang()
  const { toast } = useToast()
  const [appTheme, setAppTheme] = useState<AppTheme>("system")
  const [isDark, setIsDark] = useState(false)

  // Desktop Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mode, setMode] = useState<Mode>("feed")

  // Feed Back-to-Top State
  const desktopFeedTopRef = useRef<HTMLDivElement>(null)
  const mobileFeedTopRef = useRef<HTMLDivElement>(null)
  const [showTornaSu, setShowTornaSu] = useState(false)
  const lastScrollTop = useRef(0)
  const [isScrollingUp, setIsScrollingUp] = useState(true)
  const [showBottomBar, setShowBottomBar] = useState(true)

  useEffect(() => {
    if (mode !== 'feed') {
      setShowTornaSu(false)
      setShowBottomBar(true)
      return
    }

    let rafId: number

    const handleScroll = () => {
      // Usa requestAnimationFrame per non bloccare il main thread
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const isDesktop = window.innerWidth >= 1024
        const activeRef = isDesktop ? desktopFeedTopRef.current : mobileFeedTopRef.current
        if (!activeRef) return

        const currentTop = activeRef.getBoundingClientRect().top
        const diff = currentTop - lastScrollTop.current

        if (diff > 5) {
          setIsScrollingUp(true)
        } else if (diff < -5) {
          setIsScrollingUp(false)
        }

        lastScrollTop.current = currentTop
        setShowTornaSu(currentTop < -800 && diff < -5)

        if (currentTop > -100) {
          setShowBottomBar(true)
        } else {
          setShowBottomBar(diff > 5)
        }
      })
    }

    // Ascolta lo scroll sul document (supporta sia desktop che mobile sheet)
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [mode])

  const [activeTab, setActiveTab] = useState("home")
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Maintenance / Beta Access State
  const [hasBetaAccess, setHasBetaAccess] = useState<boolean | null>(null)
  // Loading state for the initial feed fetch
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    const access = localStorage.getItem("think_beta_access")
    setHasBetaAccess(access === "true")
  }, [])

  const handleAuthorized = () => {
    localStorage.setItem("think_beta_access", "true")
    setHasBetaAccess(true)
  }

  const [chats, setChats] = useState<Chat[]>([])
  const [countries, setCountries] = useState<{ features: Record<string, unknown>[] }>({ features: [] })
  const [arcsViaggio, setArcsViaggio] = useState<{ id: string, startLat: number, startLng: number, endLat: number, endLng: number }[]>([])

  const [chatAttiva, setChatAttiva] = useState<Chat | null>(null)

  // Translation State
  const [translatedSeed, setTranslatedSeed] = useState<{ text: string, isTranslated: boolean, loading: boolean }>({ text: '', isTranslated: false, loading: false })
  const [translatedReplies, setTranslatedReplies] = useState<Record<number, { text: string, loading: boolean }>>({})
  const [searchQueryLng, setSearchQueryLng] = useState<string>('')

  const [risposte, setRisposte] = useState<Risposta[]>([])
  const [nuovaRisposta, setNuovaRisposta] = useState('')
  const [replyingTo, setReplyingTo] = useState<Risposta | null>(null)


  const [filtroAttivo, setFiltroAttivo] = useState('Recenti')
  const [testoRicerca, setTestoRicerca] = useState('')
  const [mostraPannelloFiltri, setMostraPannelloFiltri] = useState(false)
  const [mostraNotizie, setMostraNotizie] = useState(false)
  const [mostraTendenze, setMostraTendenze] = useState(false)
  const [categoriaAttiva, setCategoriaAttiva] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('think_trend_country') ||
        (navigator.language?.slice(-2).toUpperCase()) || 'IT'
    }
    return 'IT'
  })

  const {
    utenteLoggato,
    setUtenteLoggato,
    sessionId,
    mioNickname,
    setMioNickname,
    mostraPopupLogin,
    setMostraPopupLogin,
    mostraPopupBenvenuto,
    setMostraPopupBenvenuto,
    mostraPopupNicknameObbligatorio,
    setMostraPopupNicknameObbligatorio,
    emailLogin,
    setEmailLogin,
    loginSent,
    setLoginSent,
    loginLoading,
    setLoginLoading,
    loginError,
    setLoginError,
    showPushPrompt,
    setShowPushPrompt,
    pushEnabled,
    setPushEnabled,
    syncProfile,
    handleCompleteProfile,
    handleSaveNickname,
    salvaNicknameSoloLocale,
    logout,
    accediConGoogle,
    inviaMagicLink,
    handleDismissWelcome,
  } = useAuthProfile(setMode, setActiveTab);

  const {
    userLocation,
    setUserLocation,
    isLocationActive,
    locationLoading,
    locationError,
    showLocationGuide,
    setShowLocationGuide,
    manualSearchQuery,
    setManualSearchQuery,
    manualResults,
    setManualResults,
    searchLoading,
    mostraRicercaManualeChat,
    setMostraRicercaManualeChat,
    ottieniCoordinate,
    updateLocation,
    cercaCitta,
    selezionaCittaManuale,
    getEffectiveCoords,
  } = useLocationManager();

  // Modals state
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')


  // Account Data
  const [myThinks, setMyThinks] = useState<Chat[]>([])
  const [myRepliedChats, setMyRepliedChats] = useState<Chat[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [accountLoading, setAccountLoading] = useState(false)

  // Report state
  const [reportOpen, setReportOpen] = useState(false)
  const [reportChatId, setReportChatId] = useState<string | undefined>(undefined)
  const [reportRispostaId, setReportRispostaId] = useState<string | undefined>(undefined)
  const [reportTestoContenuto, setReportTestoContenuto] = useState<string | undefined>(undefined)
  const [autoRotate, setAutoRotate] = useState(true)



  // News Toast state (Task 3: notifica in-app per nuovi Pin Domanda)
  const [newsToast, setNewsToast] = useState<{ chat: Chat; visible: boolean } | null>(null)
  const questionReadTimeoutRef = useRef<number | null>(null)


  // Notifications logic
  const { notifications, markAsRead, markAllAsRead } = useNotifications(utenteLoggato?.id)

  // Gamification logic
  const {
    gamification,
    depthLevels,
    challenges,
    userChallenges,
    currentDepth,
    nextDepth,
    progressToNext,
    popupQueue,
    loading: gamificationLoading,
    trackChallengeEvent,
    dismissPopup,
    counters: challengeCounters,
  } = useGamification(utenteLoggato?.id, sessionId)

  const handleNotificationAction = (notification: any) => {
    markAsRead(notification.id)
    if (notification.latitude && notification.longitude) {
      // Rotate the globe to these coordinates
      const globeEl = (window as any).THINK_GLOBE_REF
      if (globeEl && globeEl.pointOfView) {
        globeEl.pointOfView({ lat: notification.latitude, lng: notification.longitude, altitude: 1.5 }, 2000)
      }

      // If there's a thought_id, we can also open the chat
      if (notification.thought_id) {
        const targetChat = chats.find(c => c.id === notification.thought_id)
        if (targetChat) {
          setChatAttiva(targetChat)
          setMode("chat")
        }
      }
    }
  }

  // Backend Calls
    const fetchChats = useCallback(async () => {
    setFeedLoading(true)
    try {
      if (searchQueryLng) {
        const { data, error } = await supabase.rpc('search_chats', { search_term: searchQueryLng })
        if (error) {
          console.error("Search RPC error:", error)
          setFeedLoading(false)
          return
        }
        setChats(data || [])
      } else {
        const { data: allChats, error } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)

        if (error) {
          console.error("fetchChats error:", error)
          setFeedLoading(false)
          return
        }
        setChats(allChats || [])
      }
    } catch (err) {
      console.error("fetchChats error:", err)
    } finally {
      setFeedLoading(false)
    }
  }, [searchQueryLng])



  // Effect Initialization (non-auth: deep-links, realtime, theme, countries)
  useEffect(() => {
    updateLocation(false)
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json()).then(setCountries)
    fetchChats().catch(e => console.error("fetchChats failed early:", e))

    // Task 5 / Task 3: Intercetta ?news_id= o ?thought= nell'URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const newsIdParam = urlParams.get('news_id') || urlParams.get('thought')
      if (newsIdParam) {
        window.history.replaceState(null, '', window.location.pathname)
        const tryOpenPin = (retries = 0) => {
          setTimeout(() => {
            const targetChat = (window as any).__THINK_CHATS__?.find((c: Chat) => String(c.id) === newsIdParam)
            if (targetChat) {
              const globeEl = (window as any).THINK_GLOBE_REF
              if (globeEl?.pointOfView && targetChat.lat && targetChat.lng) {
                globeEl.pointOfView({ lat: targetChat.lat, lng: targetChat.lng, altitude: 1.5 }, 1500)
              }
              setTimeout(() => {
                ; (window as any).__THINK_OPEN_PIN__?.(targetChat)
              }, 1600)
            } else if (retries < 10) {
              tryOpenPin(retries + 1)
            }
          }, 800)
        }
        tryOpenPin()
      }
    }

    // Realtime Subscriptions
    const chatsChannel = supabase
      .channel('public:chats_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
        if (payload.new) {
          setChats((prev) => {
            const exists = prev.some(c => c.id === payload.new.id)
            if (exists) return prev
            return [payload.new as Chat, ...prev]
          })

          // Task 3: Se è un Pin Domanda, mostra un toast in-app a tutti gli utenti
          if (payload.new.tipo === 'domanda_notizia') {
            const newsPinChat = payload.new as Chat
            setNewsToast({ chat: newsPinChat, visible: true })
            setTimeout(() => setNewsToast(prev => prev ? { ...prev, visible: false } : null), 8000)
            setTimeout(() => setNewsToast(null), 8800)
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, (payload) => {
        if (payload.new) {
          setChats((prev) => {
            const old = prev.find(c => c.id === payload.new.id)
            if (old && (old.lat !== payload.new.lat || old.lng !== payload.new.lng)) {
              const arc = { id: `${payload.new.id}-${Date.now()}`, startLat: old.lat!, startLng: old.lng!, endLat: payload.new.lat, endLng: payload.new.lng }
              setArcsViaggio(a => [...a, arc])
              setTimeout(() => setArcsViaggio(a => a.filter(x => x.id !== arc.id)), 30000)
            }
            if (old) {
              Object.assign(old, payload.new)
              return [...prev]
            }
            return prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } as Chat : c)
          })
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chats' }, (payload) => {
        if (payload.old) {
          setChats((prev) => prev.filter(c => c.id !== (payload.old as Chat).id))
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risposte' }, () => {
        // The chats UPDATE event will handle risposte_count / coordinates
      })
      .subscribe()

    // Theme logic
    const savedTheme = localStorage.getItem('think_theme') as AppTheme | null
    const savedAutoRotate = localStorage.getItem('think_auto_rotate')
    if (savedTheme) setAppTheme(savedTheme)
    if (savedAutoRotate !== null) setAutoRotate(savedAutoRotate !== 'false')

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    const resolveTheme = (theme: AppTheme) => {
      const dark = theme === 'dark' || (theme === 'system' && prefersDark.matches)
      setIsDark(dark)
      if (dark) {
        document.documentElement.classList.add('dark')
        document.documentElement.style.colorScheme = 'dark'
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
      }
    }
    resolveTheme(savedTheme || 'system')

    const mediaListener = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem('think_theme') as AppTheme | null
      if (!current || current === 'system') {
        setIsDark(e.matches)
        if (e.matches) {
          document.documentElement.classList.add('dark')
          document.documentElement.style.colorScheme = 'dark'
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.style.colorScheme = 'light'
        }
      }
    }
    prefersDark.addEventListener('change', mediaListener)

    return () => {
      supabase.removeChannel(chatsChannel)
      prefersDark.removeEventListener('change', mediaListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!chatAttiva) return
    const risposteChannel = supabase
      .channel('public:risposte')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risposte' }, (payload) => {
        if (payload.new.chat_id === chatAttiva.id) {
          // Ricorda update the status without reloading all (simplified)
          setRisposte((prev) => [...prev, payload.new as Risposta])
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(risposteChannel)
    }
  }, [chatAttiva])

  const prevLocationRef = useRef(userLocation)
  useEffect(() => {
    if (prevLocationRef.current !== userLocation && userLocation) {
      toast(lang === 'it' ? 'Posizione aggiornata' : 'Location updated', 'success')
    }
    prevLocationRef.current = userLocation
  }, [userLocation])
  const prevErrorRef = useRef(locationError)
  useEffect(() => {
    if (prevErrorRef.current !== locationError && locationError) {
      toast(locationError, 'error')
    }
    prevErrorRef.current = locationError
  }, [locationError])

  // Expose chats + apriChat on window for URL param mechanism (Task 5 deep-link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THINK_CHATS__ = chats
    }
  }, [chats])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THINK_OPEN_PIN__ = (chat: Chat) => apriChat(chat)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gamification: Lifecycle States Checker
  useEffect(() => {
    if (chats.length > 0 && mioNickname) {
      const imAuthorChats = chats.filter(c => c.autore === mioNickname)
      if (imAuthorChats.length === 0) return

      const states = new Set(imAuthorChats.map(c => calcolaStatoVitale(c)))
       const checkAndTrack = (state: ReturnType<typeof calcolaStatoVitale>, eventType: any) => {
         if (states.has(state)) {
           const chatInState = imAuthorChats.find(c => calcolaStatoVitale(c) === state)
           if (chatInState) {
             trackChallengeEvent({ type: eventType, chatId: String(chatInState.id) }).catch(() => undefined)
           }
         }
       }

      checkAndTrack('seme', 'chat_became_seme')
      checkAndTrack('germoglio', 'chat_became_germoglio')
      checkAndTrack('albero', 'chat_became_tree')
      checkAndTrack('foglia_secca', 'chat_became_foglia_secca')
      checkAndTrack('archivio', 'chat_became_archivio')
    }
  }, [chats, mioNickname, trackChallengeEvent])

  async function fetchAccountData() {
    if (!utenteLoggato) return
    setAccountLoading(true)

    const { data: mine } = await supabase.from('chats').select('*').eq('user_id', utenteLoggato.id).order('created_at', { ascending: false }).limit(30)
    if (mine) setMyThinks(mine)

    const { data: myReplies } = await supabase.from('risposte').select('chat_id, created_at').eq('user_id', utenteLoggato.id).order('created_at', { ascending: false }).limit(200)
    const uniqueChatIds = Array.from(new Set((myReplies || []).map(r => r.chat_id))).slice(0, 30)

    if (uniqueChatIds.length > 0) {
      const { data: repliedChats } = await supabase.from('chats').select('*').in('id', uniqueChatIds)
      if (repliedChats) {
        const mapById = new Map((repliedChats || []).map((c: Chat) => [c.id, c]))
        const ordered = uniqueChatIds.map(id => mapById.get(id)).filter((c): c is Chat => Boolean(c))
        setMyRepliedChats(ordered)
      }
    } else {
      setMyRepliedChats([])
    }

    const { data: bms } = await supabase.from('bookmarks').select('id, created_at, chat_id, user_id, chat:chats(*)').eq('user_id', utenteLoggato.id).order('created_at', { ascending: false }).limit(50)
    if (bms) setBookmarks(bms as unknown as Bookmark[])

    setAccountLoading(false)
  }


  useEffect(() => {
    if (mode !== "account" || !utenteLoggato) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccountData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, utenteLoggato])



  async function creaChat() {
    if (!nuovoMessaggio.trim()) return
    const mieCoord = await getEffectiveCoords()
    if (!mieCoord) return

    const { data: newChat, error } = await supabase.from('chats').insert([{
      titolo: nuovoMessaggio,
      lat: mieCoord.lat,
      lng: mieCoord.lng,
      regione: mieCoord.regione,
      lat_originale: mieCoord.lat,
      lng_originale: mieCoord.lng,
      regione_originale: mieCoord.regione,
      km_viaggiati: 0,
      risposte_count: 0,
      autore: utenteLoggato ? (mioNickname || 'Anonimo') : mioNickname,
      user_id: utenteLoggato ? utenteLoggato.id : null,
      ultima_attivita: new Date().toISOString()
    }]).select().single()

    if (error) return

    // Aggiorna UI locale
    setChats([newChat, ...chats])
    setMode("feed")
    setMobileSheetOpen(false)
    setNuovoMessaggio('')

    trackChallengeEvent({
      type: 'thought_created',
      chatId: String(newChat.id),
      chatType: newChat.tipo,
    }).catch(() => undefined)

    // Se l'utente non è loggato, salva l'ID del pensiero per consentire l'edit
    if (!utenteLoggato) {
      const anonChats = JSON.parse(localStorage.getItem('think_anon_my_chats') || '[]');
      anonChats.push(newChat.id);
      localStorage.setItem('think_anon_my_chats', JSON.stringify(anonChats));
    }
  }

  async function apriChat(chat: Chat) {
    setChatAttiva(chat)
    setMode("chat")
    setActiveTab("esplora")
    setMobileSheetOpen(true)

    if (questionReadTimeoutRef.current) {
      window.clearTimeout(questionReadTimeoutRef.current)
      questionReadTimeoutRef.current = null
    }

    // 1. Ferma l'auto-rotazione se attiva per focus sul contenuto
    setAutoRotate(false); 

    // 2. Cinematic Camera: Volo verso il Pin (con piccolo delay per evitare conflitti di render)
    setTimeout(() => {
      const focusChat = (window as any).__THINK_FOCUS_CHAT__
      if (typeof focusChat === 'function') {
        focusChat(chat)
      }
    }, 100);

    if (chat.tipo === 'domanda_trending') {
      questionReadTimeoutRef.current = window.setTimeout(() => {
        trackChallengeEvent({
          type: 'question_opened',
          chatId: String(chat.id),
        }).catch(() => undefined)
        questionReadTimeoutRef.current = null
      }, 6000)
    }

    // Reset translations when opening a new chat
    setTranslatedSeed({ text: '', isTranslated: false, loading: true })
    setTranslatedReplies({})
    setReplyingTo(null)

    // Fetch replies
    const { data } = await supabase.from('risposte').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true })
    if (data) {
      setRisposte(data)
      if (chat.user_id && utenteLoggato?.id === chat.user_id) {
        const participantKeys = data
          .map(reply => reply.user_id || (reply.autore ? `anon:${reply.autore.trim().toLowerCase()}` : null))
          .filter((value): value is string => Boolean(value))
        trackChallengeEvent({
          type: 'my_chat_participants_synced',
          participantKeys,
        }).catch(() => undefined)
      }
    }

    // Handle Translation
    const translationResult = await translateText(
      chat.titolo,
      lang,
      chat.id,
      'chat'
    )

    if (translationResult.sourceLang !== lang.toLowerCase() && !translationResult.sourceLang.startsWith(lang.toLowerCase())) {
      setTranslatedSeed({
        text: translationResult.translatedText,
        isTranslated: true,
        loading: false
      })
    } else {
      setTranslatedSeed({
        text: chat.titolo,
        isTranslated: false,
        loading: false
      })
    }
  }

  function handleQuickReply(autore: string, replyNode?: Risposta) {
    setReplyingTo(replyNode || null)
    setNuovaRisposta(`@${autore} `)

    // Focus after state update
    setTimeout(() => {
      const input = document.getElementById('reply-input-desktop') || document.getElementById('reply-input-mobile')
      if (input) input.focus()
    }, 100)
  }

  function chiudiChat() {
    if (questionReadTimeoutRef.current) {
      window.clearTimeout(questionReadTimeoutRef.current)
      questionReadTimeoutRef.current = null
    }
    setChatAttiva(null)
    setRisposte([])
    setMode("feed")
    setReplyingTo(null)
  }

  async function handleTranslateReply(replyId: number, originalText: string) {
    if (translatedReplies[replyId]?.text) return; // already translated

    setTranslatedReplies(prev => ({ ...prev, [replyId]: { text: '', loading: true } }));

    const result = await translateText(originalText, lang, replyId, 'reply');

    setTranslatedReplies(prev => ({
      ...prev,
      [replyId]: {
        text: result.translatedText,
        loading: false
      }
    }));
  }

  function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Temporal Editing Control
  function isEditable(chat: Chat): boolean {
    const createdAt = new Date(chat.created_at).getTime();
    const now = new Date().getTime();
    if ((now - createdAt) >= 5 * 60 * 1000) return false;

    if (utenteLoggato) {
      if (chat.user_id === utenteLoggato.id) return true;
    } else {
      const anonChats = JSON.parse(localStorage.getItem('think_anon_my_chats') || '[]');
      if (anonChats.includes(chat.id) && chat.user_id === null) return true;
    }
    return false;
  }

  async function handleDeleteChat(chatId: string | number) {
    let query = supabase.from('chats').delete().eq('id', chatId);
    
    if (utenteLoggato) {
      query = query.eq('user_id', utenteLoggato.id);
    } else {
      const anonChats = JSON.parse(localStorage.getItem('think_anon_my_chats') || '[]');
      if (!anonChats.includes(chatId)) return;
      query = query.is('user_id', null);
    }
    
    const { error } = await query;
    if (!error) {
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (chatAttiva?.id === chatId) chiudiChat();
    }
  }

  async function handleEditChat(chatId: string | number, newTitle: string) {
    if (!newTitle.trim()) return;
    
    let query = supabase.from('chats').update({ titolo: newTitle }).eq('id', chatId);
    
    if (utenteLoggato) {
      query = query.eq('user_id', utenteLoggato.id);
    } else {
      const anonChats = JSON.parse(localStorage.getItem('think_anon_my_chats') || '[]');
      if (!anonChats.includes(chatId)) return;
      query = query.is('user_id', null);
    }

    const { error } = await query;
    if (!error) {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, titolo: newTitle } : c));
      if (chatAttiva?.id === chatId) {
        setChatAttiva({ ...chatAttiva, titolo: newTitle });
        setTranslatedSeed({ text: newTitle, isTranslated: false, loading: false });
      }
    }
  }

  async function inviaRisposta() {
    if (!nuovaRisposta.trim() || !chatAttiva) return

    const mieCoord = await getEffectiveCoords()
    if (!mieCoord) return

    await supabase.from('risposte').insert([{
      testo: nuovaRisposta,
      chat_id: chatAttiva.id,
      autore: utenteLoggato ? (mioNickname || 'Anonimo') : mioNickname,
      user_id: utenteLoggato ? utenteLoggato.id : null,
      regione: mieCoord.regione,
      parent_id: replyingTo?.id || null
    }])

    setNuovaRisposta('')
    setReplyingTo(null)
    const newCount = (chatAttiva.risposte_count ?? 0) + 1

    // Move to midpoint between current position and replier's position
    const currentLat = chatAttiva.lat ?? mieCoord.lat
    const currentLng = chatAttiva.lng ?? mieCoord.lng
    const midLat = (currentLat + mieCoord.lat) / 2
    const midLng = (currentLng + mieCoord.lng) / 2

    // Calculate distance traveled in this step
    const distStep = getHaversineDistance(currentLat, currentLng, midLat, midLng)
    const newKm = (chatAttiva.km_viaggiati || 0) + distStep

    // Reverse geocode the midpoint — with fallback zoom and ocean detection
    const getOceanName = (lat: number, lng: number): string => {
      // Mediterranean Sea
      if (lat >= 30 && lat <= 46 && lng >= -5 && lng <= 37) return 'Mar Mediterraneo'
      // Atlantic Ocean
      if (lng >= -80 && lng <= 20 && lat >= -60 && lat <= 70) return 'Oceano Atlantico'
      // Pacific Ocean (west)
      if (lng >= 100 || lng <= -60) return 'Oceano Pacifico'
      // Indian Ocean
      if (lat >= -60 && lat <= 30 && lng >= 20 && lng <= 100) return 'Oceano Indiano'
      // Arctic
      if (lat >= 70) return 'Oceano Artico'
      return 'In Alto Mare'
    }

    let midRegione = mieCoord.regione
    try {
      const geoFetch = async (zoom: number) => {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${midLat}&lon=${midLng}&format=json&zoom=${zoom}`,
          { headers: { 'Accept-Language': 'it' } }
        )
        if (!r.ok) return null
        const j = await r.json()
        return j?.error ? null : j
      }

      // Try regional zoom first (land regions)
      const geo5 = await geoFetch(5)
      const land = geo5?.address?.state || geo5?.address?.county || geo5?.address?.country
      if (land) {
        midRegione = land
      } else {
        // Fallback: wider zoom to catch seas
        const geo3 = await geoFetch(3)
        midRegione = geo3?.address?.sea
          || geo3?.address?.ocean
          || geo3?.address?.body_of_water
          || geo3?.address?.country
          || geo3?.name
          || getOceanName(midLat, midLng) // last resort: coordinate-based ocean name
      }
    } catch {
      midRegione = getOceanName(midLat, midLng)
    }

    await supabase.from('chats')
      .update({ lat: midLat, lng: midLng, regione: midRegione, risposte_count: newCount, km_viaggiati: newKm, ultima_attivita: new Date().toISOString() })
      .eq('id', chatAttiva.id)

    const updatedChat = { ...chatAttiva, lat: midLat, lng: midLng, regione: midRegione, risposte_count: newCount, km_viaggiati: newKm, ultima_attivita: new Date().toISOString() }
    setChatAttiva(updatedChat)
    setChats(prev => prev.map(c => c.id === updatedChat.id ? { ...c, ...updatedChat } : c))

    if (calcolaStatoVitale(updatedChat) === 'albero') {
      trackChallengeEvent({
        type: 'chat_became_tree',
        chatId: String(updatedChat.id),
      }).catch(() => undefined)
    }

    const isMostDiscussedNews = Boolean(
      updatedChat.tipo === 'domanda_notizia' &&
      chats
        .filter(c => c.tipo === 'domanda_notizia')
        .sort((a, b) => (b.risposte_count || 0) - (a.risposte_count || 0))[0]?.id === updatedChat.id
    )

    trackChallengeEvent({
      type: 'reply_created',
      chatId: String(updatedChat.id),
      chatType: updatedChat.tipo,
      countsForParticipation: true,
      countsForNewsChain: updatedChat.tipo === 'domanda_notizia' && challengeCounters.articleChatIdsRead.includes(String(updatedChat.id)),
      isMostDiscussedNews,
    }).catch(() => undefined)
  }

  async function toggleBookmark(chat: Chat) {
    if (!utenteLoggato) {
      setMostraPopupLogin(true)
      return
    }

    const existing = bookmarks.find(b => b.chat?.id === chat.id)
    if (existing) {
      setBookmarks(prev => prev.filter(b => b.chat?.id !== chat.id))
      await supabase.from('bookmarks').delete().eq('id', existing.id)
      toast(lang === 'it' ? 'Rimosso dai salvati' : 'Removed from saved', 'info')
    } else {
      const tempBookmark = { id: Date.now(), user_id: utenteLoggato.id, chat_id: chat.id, chat } as unknown as Bookmark
      setBookmarks(prev => [...prev, tempBookmark])
      await supabase.from('bookmarks').insert([{ user_id: utenteLoggato.id, chat_id: chat.id }])
      toast(lang === 'it' ? 'Salvato nei preferiti' : 'Saved to bookmarks', 'success')
    }
  }

  const handleShare = async (chat: Chat) => {
    const url = window.location.origin + '/think/' + chat.id;
    const shareText = "Sto discutendo di questo su Think. Se potessi dire la tua su tutto, anonimamente lo faresti?";
    
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: chat.titolo || 'Think', 
          text: shareText,
          url 
        });
      } else {
        throw new Error("Share not supported");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(shareText + " " + url);
        toast(t('link_copiato') || "Link copiato negli appunti!", 'success');
      } catch (clipErr) {
        console.error("Could not copy to clipboard", clipErr);
      }
    }
  }

  const handleReportChat = (chat: Chat) => {
    setReportChatId(String(chat.id));
    setReportRispostaId(undefined);
    setReportTestoContenuto(chat.titolo);
    setReportOpen(true);
  }



  // Multi-lingual search debouncer
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (testoRicerca.trim().length > 2) {
        // Translate the search query into English (ponte)
        const translatedQuery = await translateSearchQuery(testoRicerca);
        setSearchQueryLng(translatedQuery);
      } else {
        setSearchQueryLng('');
      }
    }, 600); // 600ms debounce to avoid spamming the DeepL API

    return () => clearTimeout(timer);
  }, [testoRicerca]);

  // Trigger fetchChats when searchQueryLng changes (handled by the debouncer)
  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Views Renderers
  const getChatsFiltrate = () => {
    let f = [...chats].filter(c => c.lat !== null)

    // Se siamo nella sezione News o Tendenze, filtriamo pesantemente i pin del globo
    // per mostrare solo il contenuto pertinente alla sezione.
    if (mostraNotizie) {
      return f.filter(c => c.tipo === 'domanda_notizia')
    }
    
    if (mostraTendenze) {
      return f.filter(c => c.tipo === 'domanda_trending')
    }

    if (filtroAttivo === 'Archivio') {
      f = f.filter(c => {
        const stato = calcolaStatoVitale(c)
        // Mostra nell'archivio SOLO i pensieri utente che sono archiviati o inattivi (foglia_secca)
        return (stato === 'archivio' || stato === 'foglia_secca') && c.tipo !== 'domanda_notizia'
      })
    } else {
      f = f.filter(c => {
        const stato = calcolaStatoVitale(c)
        // Nascondi Archivio a meno che non sia una Notizia/Domanda del Blog
        if (stato === 'archivio' && c.tipo !== 'domanda_notizia') return false
        
        // Nascondi Foglia Secca (inattivi) a meno che non sia una Notizia/Domanda del Blog
        if (stato === 'foglia_secca' && c.tipo !== 'domanda_notizia') return false

        // Tutti gli altri pensieri (semi, germogli, ecc) sono visibili globalmente
        return true
      })
    }

    // Client-side fallback filtering if search term isn't translated yet, or for immediate local feedback
    if (testoRicerca && !searchQueryLng) {
      f = f.filter(c => c.titolo.toLowerCase().includes(testoRicerca.toLowerCase()) || c.autore.toLowerCase().includes(testoRicerca.toLowerCase()))
    }

    if (filtroAttivo === 'Tendenze') f.sort((a, b) => (b.risposte_count || 0) - (a.risposte_count || 0))
    return f
  }

  const chatsFiltrate = getChatsFiltrate()

  function handleSetAppTheme(theme: AppTheme) {
    setAppTheme(theme)
    localStorage.setItem('think_theme', theme)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    const dark = theme === 'dark' || (theme === 'system' && prefersDark.matches)
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
  }

  function handleToggleAutoRotate() {
    setAutoRotate(prev => {
      const next = !prev
      localStorage.setItem('think_auto_rotate', String(next))
      return next
    })
  }

  const handleTabChange = (tab: string) => {
    if (tab === "home") {
      setMobileSheetOpen(false)
      setMode("feed")
      setActiveTab(tab)
    } else if (tab === activeTab && mobileSheetOpen) {
      setActiveTab("home")
      setTimeout(() => setMobileSheetOpen(false), 10)
    } else {
      setActiveTab(tab)
      if (tab === "esplora") {
        setMode("feed")
        setMobileSheetOpen(true)
      } else if (tab === "attivita") {
        setMode("activity")
        setMobileSheetOpen(true)
      } else if (tab === "account") {
        setMode("account")
        setMobileSheetOpen(true)
      } else if (tab === "notifiche") {
        setMode("notifications")
        setMobileSheetOpen(true)
      }
    }
  }

  const handleTogglePush = async () => {
    if (!pushEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        localStorage.setItem('think_push_decision', permission)
        if (permission === 'granted') setPushEnabled(true)
      }
    } else {
      setPushEnabled(false)
      localStorage.setItem('think_push_decision', 'denied')
    }
  }

  if (hasBetaAccess === null) return null
  if (!hasBetaAccess) {
    return <MaintenancePage onAuthorized={handleAuthorized} />
  }

  // Dynamic Views

  const renderNotificationsContent = () => (
    <NotificationsView
      notifications={notifications}
      onRead={markAsRead}
      onReadAll={markAllAsRead}
      onAction={(notif: import("@/components/features/NotificationItem").Notification) => {
        handleNotificationAction(notif)
        setMode("feed")
      }}
    />
  );

  return (
    <div>
      <MapGlobe
        countries={countries}
        chats={chatsFiltrate}
        sidebarOpen={sidebarOpen}
        isDark={isDark}
        onMarkerClick={apriChat}
        arcsViaggio={arcsViaggio}
        autoRotate={autoRotate}
        filtroAttivo={filtroAttivo}
      />

      {/* DESKTOP SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        isDark={isDark}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onToggleTheme={() => handleSetAppTheme(isDark ? 'light' : 'dark')}
        onLogoClick={() => { 
          setMode("feed"); 
          setChatAttiva(null);
          const globe = (window as any).THINK_GLOBE_REF;
          if (globe) {
            globe.pointOfView({ altitude: 1.7 }, 1100);
          }
        }}
        bottomNavigation={
          <BottomNavigation
            className={cn(
              "flex items-center justify-center w-full transition-all duration-500 ease-in-out",
              showBottomBar ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-24 opacity-0 pointer-events-none"
            )}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onCompose={() => { setMode("compose"); setSidebarOpen(true) }}
            isChatMode={mode === "chat"}
            isComposeMode={mode === "compose"}
            nuovaRisposta={nuovaRisposta}
            setNuovaRisposta={setNuovaRisposta}
            onInviaRisposta={inviaRisposta}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onOpenManualSearch={() => {
              setMostraRicercaManualeChat(true)
            }}
            onActivateGPS={() => updateLocation(true)}
            userLocation={userLocation}
            locationLoading={locationLoading}
            t={t}
          />
        }
        notificationBell={
          <NotificationBell
            unreadCount={notifications.filter(n => !n.is_read).length}
            onClick={() => setMode("notifications")}
          />
        }
        nickname={mioNickname}
        level={gamification?.depth_level}
        progressToNext={progressToNext}
        onEditNickname={() => setMostraPopupNicknameObbligatorio(true)}
        onOpenProfile={() => {
          setMode("account")
          setActiveTab("account")
          setMobileSheetOpen(true)
        }}
      >
        <div>
          {/* Back button in chat mode */}
          {mode === "chat" && (
            <div className="sticky top-0 z-[60] bg-[var(--color-bg-base)]/90 backdrop-blur-xl pt-2 pb-4 -mx-7 px-7 mb-4 border-b border-transparent">
              <Button variant="ghost" className="-ml-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors" onClick={() => { chiudiChat(); setMode("feed") }}>
                <span className="flex items-center gap-2 text-[14px] font-bold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  {t('feed')}
                </span>
              </Button>
            </div>
          )}

          {mode === "feed" && (
            <DiscoveryView
              feedLoading={feedLoading}
              chatsFiltrate={chatsFiltrate}
              filtroAttivo={filtroAttivo}
              setFiltroAttivo={setFiltroAttivo}
              testoRicerca={testoRicerca}
              setTestoRicerca={setTestoRicerca}
              mostraPannelloFiltri={mostraPannelloFiltri}
              setMostraPannelloFiltri={setMostraPannelloFiltri}
              mostraNotizie={mostraNotizie}
              setMostraNotizie={setMostraNotizie}
              mostraTendenze={mostraTendenze}
              setMostraTendenze={setMostraTendenze}
              categoriaAttiva={categoriaAttiva}
              setCategoriaAttiva={setCategoriaAttiva}
              bookmarks={bookmarks}
              onApriChat={apriChat}
              onToggleBookmark={toggleBookmark}
              onShare={handleShare}
              onReport={handleReportChat}
              isEditable={isEditable}
              onEditChat={handleEditChat}
              onDeleteChat={handleDeleteChat}
              t={t}
              lang={lang}
              currentFeedRef={desktopFeedTopRef}
              showTornaSu={showTornaSu}
              onTornaSu={() => desktopFeedTopRef.current?.scrollIntoView({ behavior: 'smooth' })}
            />
          )}
          {mode === "chat" && chatAttiva && (
            <ChatDetailView
              chatAttiva={chatAttiva}
              risposte={risposte}
              translatedSeed={translatedSeed}
              translatedReplies={translatedReplies}
              bookmarks={bookmarks}
              t={t}
              lang={lang}
              onShare={handleShare}
              onToggleBookmark={toggleBookmark}
              onReport={(chatId, rispostaId, testoContenuto) => {
                setReportOpen(true)
                setReportChatId(chatId)
                setReportRispostaId(rispostaId)
                setReportTestoContenuto(testoContenuto)
              }}
              onTranslateReply={handleTranslateReply}
              onQuickReply={handleQuickReply}
              onSetReplyingTo={setReplyingTo}
            />
          )}
          {mode === "account" && (
            <AccountView
              utenteLoggato={utenteLoggato}
              mioNickname={mioNickname}
              setMioNickname={setMioNickname}
              onSaveNickname={handleSaveNickname}
              accountLoading={accountLoading}
              appTheme={appTheme}
              setAppTheme={handleSetAppTheme}
              logout={logout}
              t={t}
              lang={lang}
              setLang={setLang}
              pushEnabled={pushEnabled}
              onTogglePush={handleTogglePush}
              autoRotate={autoRotate}
              onToggleRotate={handleToggleAutoRotate}
              myThinks={myThinks}
              gamification={gamification}
              depthLevels={depthLevels}
              challenges={challenges}
              userChallenges={userChallenges}
              currentDepth={currentDepth}
              nextDepth={nextDepth}
              progressToNext={progressToNext}
              gamificationLoading={gamificationLoading}
            />
           )}
           {mode === "activity" && (
             <ActivityView
               utenteLoggato={utenteLoggato}
               myThinks={myThinks}
               myRepliedChats={myRepliedChats}
               bookmarks={bookmarks}
               accountLoading={accountLoading}
               apriChat={apriChat}
               t={t}
               lang={lang}
               onEdit={(c) => {
                 const newTitle = prompt("Modifica il tuo pensiero:", c.titolo);
                 if (newTitle) handleEditChat(c.id, newTitle);
               }}
               onDelete={(c) => {
                 if (confirm("Vuoi davvero eliminare questo pensiero?")) handleDeleteChat(c.id);
               }}
             />
           )}
           {mode === "notifications" && renderNotificationsContent()}
          {mode === "compose" && (
            <ComposeView
              nuovoMessaggio={nuovoMessaggio}
              setNuovoMessaggio={setNuovoMessaggio}
              creaChat={creaChat}
              mioNickname={mioNickname}
              setMostraPopupBenvenuto={setMostraPopupBenvenuto}
              userLocation={userLocation}
              locationLoading={locationLoading}
              locationError={locationError}
              updateLocation={() => updateLocation(true)}
              setShowLocationGuide={setShowLocationGuide}
              t={t}
              manualSearchQuery={manualSearchQuery}
              setManualSearchQuery={setManualSearchQuery}
              manualResults={manualResults}
              searchLoading={searchLoading}
              onSearchCity={cercaCitta}
              onSelectCity={selezionaCittaManuale}
            />
          )}
        </div>
      </Sidebar>

      {/* MOBILE BOTTOM NAVIGATION */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCompose={() => {
          setMode("compose")
          setMobileSheetOpen(true)
          setActiveTab("home")
        }}
        isChatMode={mode === "chat"}
        isComposeMode={mode === "compose"}
        nuovaRisposta={nuovaRisposta}
        setNuovaRisposta={setNuovaRisposta}
        onInviaRisposta={inviaRisposta}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onOpenManualSearch={() => {
          setMostraRicercaManualeChat(true)
        }}
        onActivateGPS={() => updateLocation(true)}
        userLocation={userLocation}
        locationLoading={locationLoading}
        t={t}
        className={cn(
          "fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] lg:hidden flex items-center justify-center w-full px-4 transition-all duration-500 ease-in-out",
          showBottomBar ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-24 opacity-0 pointer-events-none"
        )}
      />

      {/* MOBILE SHEET PANELS */}
      <MobileSheet
        isOpen={mobileSheetOpen}
        onClose={() => {
          setMobileSheetOpen(false)
          setMode("feed")
          setActiveTab("home")
        }}
        initialPosition="partial"
        footer={undefined}
      >
        <div className="pt-0 pb-2">
          {mode === "feed" && (
            <DiscoveryView
              feedLoading={feedLoading}
              chatsFiltrate={chatsFiltrate}
              filtroAttivo={filtroAttivo}
              setFiltroAttivo={setFiltroAttivo}
              testoRicerca={testoRicerca}
              setTestoRicerca={setTestoRicerca}
              mostraPannelloFiltri={mostraPannelloFiltri}
              setMostraPannelloFiltri={setMostraPannelloFiltri}
              mostraNotizie={mostraNotizie}
              setMostraNotizie={setMostraNotizie}
              mostraTendenze={mostraTendenze}
              setMostraTendenze={setMostraTendenze}
              categoriaAttiva={categoriaAttiva}
              setCategoriaAttiva={setCategoriaAttiva}
              bookmarks={bookmarks}
              onApriChat={apriChat}
              onToggleBookmark={toggleBookmark}
              onShare={handleShare}
              onReport={handleReportChat}
              isEditable={isEditable}
              onEditChat={handleEditChat}
              onDeleteChat={handleDeleteChat}
              t={t}
              lang={lang}
              currentFeedRef={mobileFeedTopRef}
              showTornaSu={showTornaSu}
              onTornaSu={() => mobileFeedTopRef.current?.scrollIntoView({ behavior: 'smooth' })}
            />
          )}
          {mode === "chat" && chatAttiva && (
            <ChatDetailView
              chatAttiva={chatAttiva}
              risposte={risposte}
              translatedSeed={translatedSeed}
              translatedReplies={translatedReplies}
              bookmarks={bookmarks}
              t={t}
              lang={lang}
              onShare={handleShare}
              onToggleBookmark={toggleBookmark}
              onReport={(chatId, rispostaId, testoContenuto) => {
                setReportOpen(true)
                setReportChatId(chatId)
                setReportRispostaId(rispostaId)
                setReportTestoContenuto(testoContenuto)
              }}
              onTranslateReply={handleTranslateReply}
              onQuickReply={handleQuickReply}
              onSetReplyingTo={setReplyingTo}
            />
          )}
          {mode === "account" && (
            <AccountView
              utenteLoggato={utenteLoggato}
              mioNickname={mioNickname}
              setMioNickname={setMioNickname}
              onSaveNickname={handleSaveNickname}
              accountLoading={accountLoading}
              appTheme={appTheme}
              setAppTheme={handleSetAppTheme}
              logout={logout}
              t={t}
              lang={lang}
              setLang={setLang}
              pushEnabled={pushEnabled}
              onTogglePush={handleTogglePush}
              autoRotate={autoRotate}
              onToggleRotate={handleToggleAutoRotate}
              myThinks={myThinks}
              gamification={gamification}
              depthLevels={depthLevels}
              challenges={challenges}
              userChallenges={userChallenges}
              currentDepth={currentDepth}
              nextDepth={nextDepth}
              progressToNext={progressToNext}
              gamificationLoading={gamificationLoading}
            />
          )}
           {mode === "activity" && (
             <ActivityView
               utenteLoggato={utenteLoggato}
               myThinks={myThinks}
               myRepliedChats={myRepliedChats}
               bookmarks={bookmarks}
               accountLoading={accountLoading}
               apriChat={apriChat}
               t={t}
               lang={lang}
               onEdit={(c) => {
                 const newTitle = prompt("Modifica il tuo pensiero:", c.titolo);
                 if (newTitle) handleEditChat(c.id, newTitle);
               }}
               onDelete={(c) => {
                 if (confirm("Vuoi davvero eliminare questo pensiero?")) handleDeleteChat(c.id);
               }}
             />
           )}

          {mode === "notifications" && renderNotificationsContent()}

          {mode === "compose" && (
            <ComposeView
              nuovoMessaggio={nuovoMessaggio}
              setNuovoMessaggio={setNuovoMessaggio}
              creaChat={creaChat}
              mioNickname={mioNickname}
              setMostraPopupBenvenuto={setMostraPopupBenvenuto}
              userLocation={userLocation}
              locationLoading={locationLoading}
              locationError={locationError}
              updateLocation={() => updateLocation(true)}
              setShowLocationGuide={setShowLocationGuide}
              t={t}
              manualSearchQuery={manualSearchQuery}
              setManualSearchQuery={setManualSearchQuery}
              manualResults={manualResults}
              searchLoading={searchLoading}
              onSearchCity={cercaCitta}
              onSelectCity={selezionaCittaManuale}
            />
          )}
        </div>
      </MobileSheet>
      



      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        chatId={reportChatId}
        rispostaId={reportRispostaId}
        testoContenuto={reportTestoContenuto}
        nickname={mioNickname}
        t={t}
      />

      <ModalsContainer
        mostraPopupBenvenuto={mostraPopupBenvenuto}
        onDismissWelcome={handleDismissWelcome}
        utenteLoggato={utenteLoggato}
        mioNickname={mioNickname}
        setMioNickname={setMioNickname}
        salvaNicknameSoloLocale={salvaNicknameSoloLocale}
        mostraPopupLogin={mostraPopupLogin}
        setMostraPopupLogin={setMostraPopupLogin}
        loginSent={loginSent}
        loginLoading={loginLoading}
        accediConGoogle={accediConGoogle}
        emailLogin={emailLogin}
        setEmailLogin={setEmailLogin}
        inviaMagicLink={inviaMagicLink}
        loginError={loginError}
        mostraPopupNicknameObbligatorio={mostraPopupNicknameObbligatorio}
        setMostraPopupNicknameObbligatorio={setMostraPopupNicknameObbligatorio}
        onCompleteProfile={handleCompleteProfile}
        nicknameErrorMessage={nicknameErrorMessage}
        t={t}
      />

      <ManualLocationSearchModal
        isOpen={mostraRicercaManualeChat}
        onClose={() => {
          setMostraRicercaManualeChat(false)
          setManualResults([])
          setManualSearchQuery('')
        }}
        searchQuery={manualSearchQuery}
        setSearchQuery={setManualSearchQuery}
        results={manualResults}
        searchLoading={searchLoading}
        onSearchCity={cercaCitta}
        onSelectCity={(item) => {
          selezionaCittaManuale(item)
          setMostraRicercaManualeChat(false)
        }}
      />

      <LocationGuide
        isOpen={showLocationGuide}
        onClose={() => setShowLocationGuide(false)}
        t={t}
      />

      <PushPermissionModal
        isOpen={showPushPrompt}
        onClose={() => {
          setShowPushPrompt(false)
          localStorage.setItem('think_push_decision', 'later')
        }}
        onConfirm={async () => {
          if (typeof window !== 'undefined' && 'Notification' in window) {
            const permission = await Notification.requestPermission()
            localStorage.setItem('think_push_decision', permission)
          }
          setShowPushPrompt(false)
        }}
      />

      {/* Gamification Popup — one at a time, above everything */}
      <GamificationPopup
        popupQueue={popupQueue}
        onDismiss={dismissPopup}
        onGoToProfile={() => {
          setMode("account")
          setActiveTab("account")
          setMobileSheetOpen(true)
        }}
      />

      {/* Task 3: News Pin Toast — appare quando arriva un nuovo Pin Domanda in realtime */}
      {newsToast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-32px)] max-w-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${newsToast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <button
            type="button"
            onClick={() => {
              const { chat } = newsToast
              setNewsToast(null)
              // Rotate globe
              const globeEl = (window as any).THINK_GLOBE_REF
              if (globeEl?.pointOfView && chat.lat && chat.lng) {
                globeEl.pointOfView({ lat: chat.lat, lng: chat.lng, altitude: 1.5 }, 1500)
              }
              // Open panel
              setTimeout(() => {
                apriChat(chat)
              }, 1600)
            }}
            className="w-full text-left flex items-start gap-3 p-4 rounded-2xl shadow-2xl border border-amber-500/30 bg-gradient-to-r from-[var(--color-bg-panel)]/95 via-amber-950/20 to-[var(--color-bg-panel)]/95 backdrop-blur-xl"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30 animate-pulse">
              <span className="text-white font-black text-lg">?</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Nuova Domanda del Giorno</p>
              <p className="text-[14px] font-bold text-[var(--color-text-main)] leading-snug line-clamp-2">{newsToast.chat.titolo}</p>
              <p className="text-[11px] text-[var(--color-text-faint)] mt-1 font-medium">Tocca per vedere sul globo →</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setNewsToast(null) }}
              className="p-1 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-faint)] flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </button>
        </div>
      )}
    </div>
  )
}
