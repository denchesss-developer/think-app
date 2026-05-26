"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useLang, timeAgoI18n, repliesLabel, translateRegion } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import Logo from "@/components/ui/Logo"
import {
  Plus,
  Search,
  Map as MapIcon,
  User,
  Bell,
  LogOut,
  ChevronLeft,
  Send,
  Bookmark,
  MessageSquare,
  Share2,
  MoreVertical,
  Navigation,
  Loader2,
  Pencil,
  AlertCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  MapPin,
  Archive,
  Flag,
  Plane,
  ChevronDown,
  SlidersHorizontal,
  FolderArchive,
  Languages,
  Globe,
  Reply,
  CornerDownRight,
  X,
  ExternalLink,
  Newspaper,
  Quote,
  ChevronRight,
  ChevronUp,
  Check,
  Eye,
  BarChart2
} from "lucide-react"

// Layout Components
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { MobileSheet } from "@/components/layout/MobileSheet"

// Feature Components
import { STILI_STATO, calcolaStatoVitale, MapGlobe } from "@/components/features/MapGlobe"
import { ChatCard } from "@/components/features/ChatCard"
import { AccountView } from "@/components/features/AccountView"
import { ActivityView } from "@/components/features/ActivityView"
import { ComposeView } from "@/components/features/ComposeView"
import MaintenancePage from "@/components/features/MaintenancePage"
import { LocationGuide } from "@/components/features/LocationGuide"
import { ModalsContainer } from "@/components/features/ModalsContainer"
import { ReportModal } from "@/components/features/ReportModal"
import { NotificationBell } from "@/components/features/NotificationBell"
import { NotificationItem } from "@/components/features/NotificationItem"
import { NotificationsView } from "@/components/features/NotificationsView"
import { PushPermissionModal } from "@/components/features/PushPermissionModal"
import { GamificationPopup } from "@/components/features/GamificationPopup"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { useGamification } from "@/lib/hooks/useGamification"
import type { AppTheme } from "@/components/features/AccountView"

// UI Components
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GlassPanel } from "@/components/ui/Glass"
import { Badge } from "@/components/ui/Badge"
import { ChatCardSkeleton } from "@/components/ui/ChatCardSkeleton"

// Actions
import { translateText, translateSearchQuery } from "@/app/actions/translate"

const FILTRI_KEYS = [
  { id: "Recenti", labelKey: "recenti", icon: <Clock className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> },
  { id: "Tendenze", labelKey: "tendenze", icon: <TrendingUp className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> },
  { id: "Vicini", labelKey: "vicini", icon: <MapPin className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> },
  { id: "Archivio", labelKey: "archivio", icon: <Archive className="w-4 h-4 mr-1.5 inline flex-shrink-0" /> }
]

const ANIMALI = ['Pinguino', 'Volpe', 'Panda', 'Tigre']
const AGGETTIVI = ['Saggio', 'Veloce', 'Astuto', 'Felice']

const CATEGORIE = [
  { slug: null,               label: 'Tutto',    emoji: '🌍' },
  { slug: 'sport',            label: 'Sport',    emoji: '⚽' },
  { slug: 'economia',         label: 'Economia', emoji: '💰' },
  { slug: 'politica',         label: 'Politica', emoji: '🏛️' },
  { slug: 'tech',             label: 'Tech',     emoji: '💻' },
  { slug: 'ambiente',         label: 'Ambiente', emoji: '🌿' },
  { slug: 'salute',           label: 'Salute',   emoji: '❤️' },
  { slug: 'cultura',          label: 'Cultura',  emoji: '🎭' },
  { slug: 'intrattenimento',  label: 'Entertain',emoji: '🎬' },
  { slug: 'mondo',            label: 'Mondo',    emoji: '🌐' },
];

import { useAuthProfile, nicknameErrorMessage } from "@/lib/hooks/useAuthProfile"
import { useLocationManager } from "@/lib/hooks/useLocationManager"

const PAESI = [
  { code: 'IT', flag: '🇮🇹' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'DE', flag: '🇩🇪' },
];

type Mode = "feed" | "chat" | "account" | "activity" | "compose" | "notifications"

const LocationBadge = ({ regione, variant = "default" }: { regione: string; variant?: "default" | "brand" }) => (
  <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm ${
    variant === "brand" ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "glass-panel text-zinc-400 border-transparent"
  }`}>
    {regione}
  </div>
);

const CollapsibleMonthBucket = ({ bucket, children, isFirst }: { bucket: { label: string; isCollapsible?: boolean }, children: React.ReactNode, isFirst?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!bucket.isCollapsible) {
    return (
      <div className={isFirst ? "pt-10" : "pt-14"}>
        <div className="flex items-center gap-4 px-4 mb-10">
          <div className="flex-1 h-[2px] bg-gradient-to-l from-[var(--color-text-muted)] opacity-20 to-transparent" />
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] whitespace-nowrap mr-[-0.2em]">
            {bucket.label}
          </h4>
          <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--color-text-muted)] opacity-20 to-transparent" />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={isFirst ? "pt-10" : "pt-14"}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 px-4 mb-10 group cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
      >
        <div className="flex-1 h-[2px] bg-gradient-to-l from-[var(--color-text-muted)] opacity-20 to-transparent" />
        <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] whitespace-nowrap mr-[-0.2em] group-hover:text-[var(--color-text-main)] transition-colors">
          {bucket.label}
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </h4>
        <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--color-text-muted)] opacity-20 to-transparent" />
      </button>
      
      <div 
        className={cn(
          "relative transition-all duration-500",
          !isOpen && "cursor-pointer group"
        )}
        onClick={!isOpen ? () => setIsOpen(true) : undefined}
      >
        <div 
          className={cn(
            "transition-all duration-700 ease-in-out",
            isOpen ? "opacity-100" : "max-h-[160px] pt-20 -mt-20 overflow-hidden pointer-events-none"
          )}
          style={!isOpen ? {
            WebkitMaskImage: 'linear-gradient(to bottom, black 100px, transparent 160px)',
            maskImage: 'linear-gradient(to bottom, black 100px, transparent 160px)',
          } : {}}
        >
          {/* 
            Ripristinato overflow-hidden per fissare il bug dello scroll infinito.
            USIAMO pt-20 per creare uno "spazio di volo" in alto per l'animazione di hover.
          */}
          {/* 
            Quando il cluster è chiuso, impediamo l'interazione diretta con le card singole (pointer-events-none sopra).
            Le card continuano però a rispondere al "group-hover" del padre per l'animazione di spostamento verso l'alto.
          */}
          {children}
        </div>

        {!isOpen && (
          // Overlay invisibile che cattura il click per espandere, 
          // sovrapposto all'area delle card che ora sono pointer-events-none.
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="absolute inset-0 cursor-pointer z-10"
          />
        )}
      </div>
    </div>
  );
};

export default function ThinkMain() {
  const { lang, setLang, t } = useLang()
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
      // Optimistic update
      setBookmarks(prev => prev.filter(b => b.chat?.id !== chat.id))
      await supabase.from('bookmarks').delete().eq('id', existing.id)
    } else {
      // Optimistic update
      const tempBookmark = { id: Date.now(), user_id: utenteLoggato.id, chat_id: chat.id, chat } as unknown as Bookmark
      setBookmarks(prev => [...prev, tempBookmark])
      await supabase.from('bookmarks').insert([{ user_id: utenteLoggato.id, chat_id: chat.id }])
    }
  }

  const handleShare = async (chat: Chat) => {
    // Usiamo il link diretto /think/[id] così WhatsApp/Telegram leggono l'OG Image dinamica
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
        alert(t('link_copiato') || "Link copiato negli appunti!");
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


  // Dynamic Views
  const renderMainFeed = () => {
    const userChats = chatsFiltrate.filter(c => c.tipo !== 'domanda_notizia' && c.tipo !== 'domanda_trending');
    const newsChats = chatsFiltrate.filter(c => c.tipo === 'domanda_notizia');
    const trendingChats = chatsFiltrate.filter(c => 
      c.tipo === 'domanda_trending' && 
      calcolaStatoVitale(c) !== 'archivio'
    );
    const trendingFiltered = categoriaAttiva 
      ? trendingChats.filter(c => c.categoria === categoriaAttiva)
      : trendingChats;
    const newsFiltered = categoriaAttiva && mostraNotizie
      ? newsChats.filter(c => c.categoria === categoriaAttiva)
      : newsChats;

    return (
    <>
      {/* Scheletro di caricamento per il primo fetch */}
      {feedLoading && (
        <div className="mt-6">
          <ChatCardSkeleton count={5} />
        </div>
      )}

      {/* Feed principale visibile solo dopo il caricamento */}
      {!feedLoading && (
        <>
      {/* Featured News / Blog */}
      {newsChats.length > 0 && !mostraNotizie && !mostraTendenze && (
        <button
          onClick={() => setMostraNotizie(true)}
          className="w-full flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 shadow-xl hover:-translate-y-1 transition-all group mt-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-[var(--color-text-main)]">ESPLORA NOTIZIE BLOG</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">News & Trends</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Esplora Tendenze BUTTON */}
      {!mostraNotizie && !mostraTendenze && trendingChats.length > 0 && (
        <button
          onClick={() => setMostraTendenze(true)}
          className="w-full flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-black text-2xl leading-none select-none">?</span>
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-[var(--color-text-main)]">ESPLORA TENDENZE</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-500/80">Trending Questions</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-violet-500 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* TRENDING SECTION */}
      {mostraTendenze && (
        <div className="space-y-4 pt-2 pb-12">
          {trendingFiltered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[var(--color-text-muted)] font-bold">
                {categoriaAttiva ? `Nessuna tendenza in "${categoriaAttiva}".` : 'Nessuna tendenza disponibile al momento.'}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Il cron le aggiornerà presto.</p>
            </div>
          ) : (
            <div className="space-y-0 pb-12">
              {(() => {
                // Raggruppa dinamicamente per country_code
                const grouped = trendingFiltered.reduce((acc, chat) => {
                  const code = chat.country_code || 'Altro';
                  if (!acc[code]) acc[code] = [];
                  acc[code].push(chat);
                  return acc;
                }, {} as Record<string, typeof trendingFiltered>);

                // Per un ordine prevedibile (prima quelli in PAESI, poi gli altri)
                const sortedCodes = Object.keys(grouped).sort((a, b) => {
                  const idxA = PAESI.findIndex(p => p.code === a);
                  const idxB = PAESI.findIndex(p => p.code === b);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.localeCompare(b);
                });

                return sortedCodes.map(code => {
                  const chatsForCountry = grouped[code];
                  const paeseConfig = PAESI.find(p => p.code === code);
                  const flag = paeseConfig ? paeseConfig.flag : '🌍';

                  return (
                    <div key={code} className="pt-6">
                      {/* Section Header */}
                      <div className="flex items-center gap-4 px-4 mb-10">
                        <div className="flex-1 h-[2px] bg-gradient-to-l from-[var(--color-text-muted)] opacity-20 to-transparent" />
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--color-text-muted)] whitespace-nowrap mr-[-0.2em]">
                          {code === 'Altro' ? 'Global Trends' : `Trends in ${code}`}
                        </h4>
                        <div className="flex-1 h-[2px] bg-gradient-to-r from-[var(--color-text-muted)] opacity-20 to-transparent" />
                      </div>

                      {/* Chat Cards */}
                      <div className="grid grid-cols-1 gap-4">
                        {chatsForCountry.map(chat => (
                          <ChatCard
                            key={chat.id}
                            chat={chat}
                            onClick={apriChat}
                            t={t}
                            lang={lang}
                            isSaved={bookmarks.some(b => b.chat?.id === chat.id)}
                            onSave={toggleBookmark}
                            onShare={handleShare}
                            onReport={handleReportChat}
                            isEditable={false} /* Non editabile */
                            onEdit={() => {}}
                            onDelete={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
          <div className="h-0 bg-transparent my-8" />
        </div>
      )}

      {/* NEWS SECTION */}
      {mostraNotizie && (
        <div className="space-y-0 pt-0 pb-12">
          {(() => {
            if (newsFiltered.length === 0) return null;

            // Bucket logic using ultima_attivita
            const buckets: Record<string, { label: string; order: number; isCollapsible?: boolean; chats: typeof newsFiltered }> = {};
            
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const yesterdayStart = todayStart - 86400000;
            const weekStart = todayStart - 86400000 * 7;
            
            const formatter = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-US', { month: 'long', year: 'numeric' });

            newsFiltered.forEach(news => {
              const date = new Date(news.ultima_attivita || news.created_at);
              const time = date.getTime();
              
              let bucketKey = '';
              let label = '';
              let order = 0;
              let isCollapsible = false;

              if (time >= todayStart) {
                bucketKey = 'oggi';
                label = lang === 'it' ? 'Ultime 24h' : 'Last 24 Hours';
                order = 1;
              } else if (time >= yesterdayStart) {
                bucketKey = 'ieri';
                label = lang === 'it' ? 'Ieri' : 'Yesterday';
                order = 2;
              } else if (time >= weekStart) {
                bucketKey = 'settimana';
                label = lang === 'it' ? 'Questa Settimana' : 'This Week';
                order = 3;
                isCollapsible = true;
              } else {
                bucketKey = `mese_${date.getFullYear()}_${date.getMonth()}`;
                label = formatter.format(date);
                label = label.charAt(0).toUpperCase() + label.slice(1);
                order = 4 + (2100 - date.getFullYear()) * 12 + (11 - date.getMonth());
                isCollapsible = true;
              }

              if (!buckets[bucketKey]) {
                buckets[bucketKey] = { label, order, isCollapsible, chats: [] };
              }
              buckets[bucketKey].chats.push(news);
            });

            const sortedBuckets = Object.values(buckets).sort((a, b) => a.order - b.order);

            return sortedBuckets.map((bucket, index) => (
              <CollapsibleMonthBucket key={bucket.label} bucket={bucket} isFirst={index === 0}>
                {/* News Cards */}
                <div className="grid grid-cols-1 gap-8">
                  {bucket.chats.map(news => (
                    <ChatCard 
                      key={news.id} 
                      chat={news} 
                      onClick={apriChat} 
                      t={t} 
                      lang={lang} 
                      isSaved={bookmarks.some(b => b.chat?.id === news.id)}
                      onSave={toggleBookmark}
                      onShare={handleShare}
                      onReport={handleReportChat}
                      isEditable={isEditable(news)}
                      onEdit={(c) => {
                        const newTitle = prompt("Modifica il tuo pensiero:", c.titolo);
                        if (newTitle) handleEditChat(c.id, newTitle);
                      }}
                      onDelete={(c) => {
                        if (confirm("Vuoi davvero eliminare questo pensiero?")) handleDeleteChat(c.id);
                      }}
                    />
                  ))}
                </div>
              </CollapsibleMonthBucket>
            ));
          })()}
          <div className="h-0 bg-transparent my-8" />
        </div>
      )}

      {/* Secondary Grid (Time Buckets) */}
      <div className="mt-0 space-y-8">
        {(() => {
          const chatsToBucket = (mostraNotizie || mostraTendenze ? [] : userChats);

          if (chatsToBucket.length === 0) return null;

          // Bucket logic using ultima_attivita
          const buckets: Record<string, { label: string; icon: string; order: number; isCollapsible?: boolean; chats: typeof userChats }> = {};
          
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const yesterdayStart = todayStart - 86400000;
          const weekStart = todayStart - 86400000 * 7;
          
          const formatter = new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-US', { month: 'long', year: 'numeric' });

          chatsToBucket.forEach(chat => {
            const date = new Date(chat.ultima_attivita || chat.created_at);
            const time = date.getTime();
            
            let bucketKey = '';
            let label = '';
            let icon = '';
            let order = 0;
            let isCollapsible = false;

            if (time >= todayStart) {
              bucketKey = 'oggi';
              label = lang === 'it' ? 'Ultime 24h' : 'Last 24 Hours';
              icon = '⚡️';
              order = 1;
            } else if (time >= yesterdayStart) {
              bucketKey = 'ieri';
              label = lang === 'it' ? 'Ieri' : 'Yesterday';
              icon = '💫';
              order = 2;
            } else if (time >= weekStart) {
              bucketKey = 'settimana';
              label = lang === 'it' ? 'Questa Settimana' : 'This Week';
              icon = '📆';
              order = 3;
              isCollapsible = true;
            } else {
              bucketKey = `mese_${date.getFullYear()}_${date.getMonth()}`;
              label = formatter.format(date);
              // capitalize first letter of month
              label = label.charAt(0).toUpperCase() + label.slice(1);
              icon = '🗓'; // user preferred month naming with distinct visual
              // order by year descending, month descending
              order = 4 + (2100 - date.getFullYear()) * 12 + (11 - date.getMonth());
              isCollapsible = true;
            }

            if (!buckets[bucketKey]) {
              buckets[bucketKey] = { label, icon, order, isCollapsible, chats: [] };
            }
            buckets[bucketKey].chats.push(chat);
          });

          // Sort buckets based on predefined order
          const sortedBuckets = Object.values(buckets).sort((a, b) => a.order - b.order);

          return sortedBuckets.map((bucket, index) => (
            <CollapsibleMonthBucket key={bucket.label} bucket={bucket} isFirst={index === 0}>
              {/* Chats List */}
              <div className="grid grid-cols-1 gap-8">
                {bucket.chats.map(chat => (
                  <ChatCard 
                    key={chat.id} 
                    chat={chat} 
                    onClick={apriChat} 
                    t={t} 
                    lang={lang}
                    isSaved={bookmarks.some(b => b.chat?.id === chat.id)}
                    onSave={toggleBookmark}
                    onShare={handleShare}
                    onReport={handleReportChat}
                    isEditable={isEditable(chat)}
                    onEdit={(c) => {
                      const newTitle = prompt("Modifica il tuo pensiero:", c.titolo);
                      if (newTitle) handleEditChat(c.id, newTitle);
                    }}
                    onDelete={(c) => {
                      if (confirm("Vuoi davvero eliminare questo pensiero?")) handleDeleteChat(c.id);
                    }}
                  />
                ))}
              </div>
            </CollapsibleMonthBucket>
          ));
        })()}
      </div>

      {chatsFiltrate.length === 0 && !feedLoading && (
        <div className="flex flex-col items-center justify-start h-[45vh] pt-12 text-center animate-in fade-in zoom-in duration-500 overflow-hidden">
          <div className="w-16 h-16 bg-[var(--color-bg-card)] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-transparent">
             <Search className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-muted)] font-black text-[10px] uppercase tracking-[0.3em] mr-[-0.3em]">
            {lang === 'it' ? 'Nessun Risultato' : 'No Results'}
          </p>
        </div>
      )}
        </>
      )}
    </>
    );
  };

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

  const renderFeedContent = (currentFeedRef: React.RefObject<HTMLDivElement | null>) => (
    <div className="space-y-8 pb-10 px-1 relative fade-in-up animate-in duration-500">
      <div ref={currentFeedRef} className="absolute top-0 left-0 w-full h-[1px] pointer-events-none" />
      
      <button
        onClick={() => currentFeedRef.current?.scrollIntoView({ behavior: 'smooth' })}
        className={`fixed bottom-2 left-1/2 -translate-x-1/2 z-[100] bg-blue-600/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 active:scale-95 transition-all duration-700 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-white/20 ${
          showTornaSu && !chatAttiva && mode === "feed" 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-32 scale-50 pointer-events-none text-transparent"
        }`}
      >
        <ChevronUp className="w-4 h-4 text-white" />
        TORNA SU
      </button>

      <header className="text-center pt-6 pb-2">
        <h2 className="text-5xl font-black tracking-tighter text-[var(--color-text-main)]">
          {mostraNotizie ? 'News' : mostraTendenze ? 'Tendenze' : (filtroAttivo === 'Archivio' ? 'Archivio' : 'Discovery')}
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
          {mostraNotizie ? 'notizie dal blog' : mostraTendenze ? 'TRENDING QUESTIONS' : (filtroAttivo === 'Archivio' ? 'MEMORIE STORICHE' : 'GLOBAL THOUGHTS')}
        </p>
      </header>

      {/* SEARCH AND FILTERS WRAPPER to prevent space-y-8 jump */}
      <div className="flex flex-col gap-0">
        {/* SEARCH BAR & ARCHIVE BUTTON */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Input
              icon={<Search className="w-4 h-4 text-zinc-500" />}
              placeholder={mostraNotizie ? "Cerca news" : mostraTendenze ? "Cerca tendenze" : "Cerca pensieri"}
              value={testoRicerca}
              onChange={(e) => setTestoRicerca(e.target.value)}
              className="w-full glass-monolith h-14 rounded-2xl pr-14 !border-none shadow-xl placeholder:text-zinc-500"
            />
            {/* PULSANTE FILTRI: Blu pieno se aperto, solo icona blu se filtri attivi */}
            <button
              onClick={() => setMostraPannelloFiltri(!mostraPannelloFiltri)}
              className={`absolute right-2 top-2 bottom-2 aspect-square rounded-xl flex items-center justify-center transition-all ${
                mostraPannelloFiltri 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                : ((filtroAttivo !== 'Recenti' && filtroAttivo !== 'Archivio') || categoriaAttiva !== null)
                ? "text-blue-500 hover:bg-[var(--color-bg-hover)]"
                : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* PULSANTE ARCHIVIO / CHIUDI BLOG/TENDENZE */}
          <button
            onClick={() => {
              if (mostraNotizie) {
                setMostraNotizie(false);
              } else if (mostraTendenze) {
                setMostraTendenze(false);
              } else {
                setFiltroAttivo(filtroAttivo === 'Archivio' ? 'Recenti' : 'Archivio');
              }
            }}
            className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all !border-none ${
              (filtroAttivo === 'Archivio' && !mostraNotizie && !mostraTendenze)
              ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
              : "glass-monolith text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            }`}
            title={mostraNotizie || mostraTendenze ? "Chiudi" : (filtroAttivo === 'Archivio' ? "Esci dall'Archivio" : "Archivio")}
          >
            {mostraNotizie || mostraTendenze ? <X size={20} /> : <Archive size={20} />}
          </button>
        </div>

        {/* PANNELLO FILTRI (Largo quanto l'intero header: Ricerca + Archivio) */}
        <AnimatePresence>
          {mostraPannelloFiltri && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="relative overflow-visible"
            >
               <div className="w-[calc(100%+48px)] -mx-6 px-6 pt-4 pb-12">
                 {/* CRITERI PRINCIPALI (Novità, Popolari, Vicino) */}
                 <div className="flex items-center justify-between gap-3 mb-6">
                   {[
                     { id: 'Recenti', label: 'Novità', icon: <Clock size={16} /> },
                     { id: 'Tendenze', label: 'Popolari', icon: <TrendingUp size={16} /> },
                     { id: 'Vicini', label: 'Vicino', icon: <MapPin size={16} /> }
                   ].map((f) => (
                     <button
                       key={f.id}
                       onClick={() => {
                         setFiltroAttivo(f.id as any);
                         setMostraPannelloFiltri(false);
                         if (mostraNotizie) setMostraNotizie(false);
                         if (mostraTendenze) setMostraTendenze(false);
                       }}
                       className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                         filtroAttivo === f.id && !mostraNotizie && !mostraTendenze
                         ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                         : "glass-panel text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                       }`}
                     >
                       {f.icon}
                       {f.label}
                     </button>
                   ))}
                 </div>

                 {/* DIVISORE CATEGORIE */}
                 <div className="flex items-center gap-4 mb-6 opacity-40">
                   <div className="flex-1 h-[1px] bg-gradient-to-l from-[var(--color-text-muted)] to-transparent" />
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Categorie</div>
                   <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--color-text-muted)] to-transparent" />
                 </div>

                 {/* GRIGLIA TEMI */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                   {CATEGORIE.map(cat => (
                     <button
                       key={cat.slug ?? 'tutto'}
                       onClick={() => {
                         setCategoriaAttiva(cat.slug);
                         setMostraPannelloFiltri(false);
                       }}
                       className={`flex flex-col justify-center items-center gap-1.5 p-3 h-24 rounded-2xl transition-all border-none text-center ${
                         categoriaAttiva === cat.slug
                           ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                           : "glass-panel text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]"
                       }`}
                     >
                       <span className="text-2xl flex-shrink-0 mb-0.5">{cat.emoji}</span>
                       <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-tight break-words px-1">
                         {cat.label}
                       </span>
                     </button>
                   ))}
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RENDER CONTENUTI (Feed o Archivio) */}
      {renderMainFeed()}
    </div>
  );

  const renderChatContent = () => {
    if (!chatAttiva) return null
    const isNewsDomanda = chatAttiva.tipo === 'domanda_notizia'
    
    return (
      <div className="fade-in-up sm:animate-in sm:duration-500 pb-24 relative space-y-8">
        
        {/* The Thought Canvas (2026 Spatial Style) */}
        <div className="relative p-6 md:p-10 lg:p-12 rounded-[2.5rem] bg-gradient-to-b from-[var(--color-bg-elevated)] to-[var(--color-bg-main)] border border-white/5 shadow-2xl overflow-hidden group">
          {/* Abstract Aurora Glow Background */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 pointer-events-none" />
          <Quote className="absolute top-8 right-8 w-40 h-40 text-[var(--color-text-main)] opacity-[0.02] pointer-events-none rotate-6" />

          {/* Header / Author Pill */}
          <div className="flex flex-wrap items-center gap-3 mb-10 relative z-10">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 shadow-sm backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-inner">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-bold text-[var(--color-text-main)]">{chatAttiva.autore}</span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-white/5 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{translateRegion(chatAttiva.regione, lang)}</span>
            </div>

            <div className="px-3 py-2 rounded-full bg-transparent">
              <span className="text-[11px] font-medium text-[var(--color-text-faint)] tracking-wide">{chatAttiva.created_at ? timeAgoI18n(chatAttiva.created_at, lang) : "Ora"}</span>
            </div>
          </div>

          {/* Title / The Seed */}
          <h1 className="text-3xl md:text-5xl lg:text-[56px] font-black leading-[1.12] tracking-tight text-[var(--color-text-main)] drop-shadow-sm mb-12 relative z-10">
            {translatedSeed.text || chatAttiva.titolo}
          </h1>

          {/* Tags & Context */}
          <div className="flex flex-wrap items-center gap-3 relative z-10 mb-8">
            <LocationBadge regione={translateRegion(chatAttiva.regione_originale || chatAttiva.regione, lang)} variant="brand" />
            {isNewsDomanda && (chatAttiva.blog_slug || chatAttiva.news_id) && (
              <a 
                href={`/blog/${lang || 'it'}/${chatAttiva.blog_slug || chatAttiva.news_id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 text-[11px] font-black uppercase tracking-widest transition-all"
              >
                <Newspaper className="w-4 h-4 shrink-0" />
                Approfondisci
              </a>
            )}
            {chatAttiva.km_viaggiati > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 text-[var(--color-text-muted)] text-[11px] font-black uppercase tracking-widest backdrop-blur-sm">
                <Plane className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                {Math.round(chatAttiva.km_viaggiati)} KM
              </div>
            )}
          </div>

          {/* The Action Dock (Floating bottom inside card) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2.5 rounded-[2rem] bg-black/5 dark:bg-white/[0.02] border border-white/5 backdrop-blur-3xl relative z-10 mt-6 shadow-inner">
            {/* Metrics */}
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default group">
                <Eye className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-blue-400 transition-colors" />
                <span className="font-bold text-[14px] text-[var(--color-text-main)]">{(chatAttiva.risposte_count || 0) * 14 + 102}</span>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl hover:bg-white/5 transition-colors cursor-default group">
                <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-emerald-400 transition-colors" />
                <span className="font-bold text-[14px] text-[var(--color-text-main)]">{chatAttiva.risposte_count || 0}</span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => handleShare(chatAttiva)}
                className="flex items-center justify-center w-14 h-14 rounded-[1.5rem] hover:bg-white/10 transition-all text-[var(--color-text-muted)] hover:text-blue-400 active:scale-95 bg-black/5 dark:bg-transparent"
                title="Condividi"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-[var(--color-border-subtle)] mx-2 opacity-50" />
              <button
                type="button"
                onClick={() => toggleBookmark(chatAttiva)}
                className={`flex items-center justify-center w-14 h-14 rounded-[1.5rem] transition-all active:scale-95 ${bookmarks.some(b => b.chat?.id === chatAttiva.id) ? "text-amber-500 bg-amber-500/10" : "text-[var(--color-text-muted)] hover:bg-white/10 bg-black/5 dark:bg-transparent"}`}
                title="Salva"
              >
                <Bookmark className="w-5 h-5" fill={bookmarks.some(b => b.chat?.id === chatAttiva.id) ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportChatId(String(chatAttiva.id))
                  setReportRispostaId(undefined)
                  setReportTestoContenuto(chatAttiva.titolo)
                  setReportOpen(true)
                }}
                className="flex items-center justify-center w-14 h-14 rounded-[1.5rem] hover:bg-white/10 transition-all text-[var(--color-text-muted)] hover:text-red-400 active:scale-95 bg-black/5 dark:bg-transparent"
                title="Segnala"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>



        {/* Risposte / Sviluppi */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
          </h3>

          {risposte.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[var(--color-text-faint)]" />
              </div>
              <p className="text-[var(--color-text-muted)] text-[14px] font-semibold mb-1">{t('nessuna_risposta')}</p>
              <p className="text-[var(--color-text-faint)] text-[13px] font-medium">{t('sii_il_primo')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const buildTree = (replies: Risposta[], parentId: number | null = null): any[] => {
                  return replies
                    .filter(r => r.parent_id === parentId)
                    .map(r => ({ ...r, children: buildTree(replies, r.id) }))
                }

                const tree = buildTree(risposte)

                const renderReplyNode = (node: any, depth = 0): React.ReactNode => (
                  <div key={node.id} className="flex flex-col">
                    <div className="flex gap-3 group">
                      {/* Thread line and Avatar */}
                      <div className="flex flex-col items-center pt-1 flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-faint)] ring-1 ring-[var(--color-border-subtle)]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        {node.children.length > 0 && (
                          <div className="w-px flex-1 bg-[var(--color-border-subtle)] mt-1.5 opacity-50" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4 min-w-0">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[12px] font-bold text-[var(--color-text-main)] truncate max-w-[120px] cursor-pointer hover:text-[var(--color-brand-blue)]"
                                onClick={() => handleQuickReply(node.autore, node)}
                              >
                                {node.autore}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleTranslateReply(node.id, node.testo)}
                                disabled={translatedReplies[node.id]?.loading || translatedReplies[node.id]?.text !== undefined}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all ${translatedReplies[node.id]?.text ? 'text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10' : 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-subtle)]'}`}
                                title="Traduci"
                              >
                                {translatedReplies[node.id]?.loading ? (
                                  <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : (
                                  <Globe className="w-3 h-3" />
                                )}
                                <span className="text-[9px] font-black uppercase tracking-tighter">TR</span>
                              </button>

                              {node.regione && (
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] flex items-center gap-0.5 bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {node.regione}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--color-text-faint)] whitespace-nowrap">{timeAgoI18n(node.created_at, lang)}</span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setReplyingTo(node)}
                              className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/10"
                              title={t('rispondi')}
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReportChatId(String(chatAttiva.id))
                                setReportRispostaId(String(node.id))
                                setReportTestoContenuto(node.testo)
                                setReportOpen(true)
                              }}
                              className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-red-400"
                              title={t('segnala_risposta')}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p
                          className={`text-[14px] leading-relaxed font-medium transition-opacity duration-300 break-words cursor-pointer hover:text-[var(--color-brand-blue)]/80 ${translatedReplies[node.id]?.loading ? 'opacity-50' : 'text-[var(--color-text-main)]/90'}`}
                          onClick={() => handleQuickReply(node.autore, node)}
                        >
                          {translatedReplies[node.id]?.text || node.testo}
                        </p>
                      </div>
                    </div>

                    {/* Children replies */}
                    {node.children.length > 0 && (
                      <div className="ml-[14px] pl-4 border-l border-transparent/50 space-y-2">
                        {node.children.map((child: any) => renderReplyNode(child, depth + 1))}
                      </div>
                    )}
                  </div>
                )

                return tree.map(r => renderReplyNode(r))
              })()}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Handle theme change from settings
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

  // Handle Tab Switch — re-tap toggles sheet closed (with animation)
  const handleTabChange = (tab: string) => {
    if (tab === "home") {
      // Close sheet with animation: signal MobileSheet to animate out, then after transition remove
      setMobileSheetOpen(false)
      setMode("feed")
      setActiveTab(tab)
    } else if (tab === activeTab && mobileSheetOpen) {
      // Re-tapping the same tab closes the sheet smoothly:
      // Set activeTab to home immediately (for visual deselect), but keep sheet open for 500ms to animate
      setActiveTab("home")
      setTimeout(() => setMobileSheetOpen(false), 10) // small delay so CSS transition plays
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
      // Attivazione
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        localStorage.setItem('think_push_decision', permission)
        if (permission === 'granted') setPushEnabled(true)
      }
    } else {
      // Disattivazione (logica interna)
      setPushEnabled(false)
      localStorage.setItem('think_push_decision', 'denied')
    }
  }

  if (hasBetaAccess === null) return null // Wait for hydration
  if (!hasBetaAccess) {
    return <MaintenancePage onAuthorized={handleAuthorized} />
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-main)] font-sans antialiased selection:bg-[var(--color-brand-blue)]/30 selection:text-white">

      {/* MOBILE HEADER: Logo + Actions */}
      <div
        className="fixed top-0 left-0 right-0 z-[45] lg:hidden flex items-center justify-between px-4 pointer-events-none"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <button onClick={() => { 
          setMode("feed"); 
          setChatAttiva(null);
          const globe = (window as any).THINK_GLOBE_REF;
          if (globe) {
            globe.pointOfView({ altitude: 1.7 }, 1100);
          }
        }} className="group pointer-events-auto -mt-2 shrink-0">
          <Logo isDark={isDark} className="h-28 w-auto drop-shadow-md -ml-4" />
        </button>

        <div className="flex items-center gap-2 pointer-events-auto mt-2 min-w-0 justify-end">
          {/* Pillola Profilo (Nome + Livello) */}
          <button
            onClick={() => {
              setMode("account")
              setActiveTab("account")
              setMobileSheetOpen(true)
            }}
            className="flex items-center gap-2.5 h-10 pl-1 pr-4 rounded-full bg-[var(--color-bg-panel)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-all shrink min-w-0 max-w-[220px]"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-inner">
               <span className="text-[13px] font-black text-white">{mioNickname ? mioNickname[0].toUpperCase() : 'T'}</span>
            </div>
            <div className="flex flex-col items-start min-w-0 justify-center">
               <span className="text-[12px] font-black text-[var(--color-text-main)] truncate max-w-full leading-[1.2]">
                 {mioNickname || 'Thinker'}
               </span>
               {gamification?.depth_level !== undefined && (
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-[1.2]">
                   Lv. {gamification.depth_level}
                 </span>
               )}
            </div>
          </button>

          {/* Notifiche */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-bg-panel)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-colors shrink-0">
            <NotificationBell
              unreadCount={notifications.filter(n => !n.is_read).length}
              onClick={() => {
                setMode("notifications")
                setMobileSheetOpen(true)
                setActiveTab("notifiche")
              }}
            />
          </div>
        </div>
      </div>

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

          {mode === "feed" && renderFeedContent(desktopFeedTopRef)}
          {mode === "chat" && renderChatContent()}
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
          {mode === "feed" && renderFeedContent(mobileFeedTopRef)}
          {mode === "chat" && renderChatContent()}
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

      {/* Manual Location Search Modal */}
      <AnimatePresence>
        {mostraRicercaManualeChat && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setMostraRicercaManualeChat(false)
                setManualResults([])
                setManualSearchQuery('')
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] z-10 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  setMostraRicercaManualeChat(false)
                  setManualResults([])
                  setManualSearchQuery('')
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-xl font-bold mb-4 pr-8 text-[var(--color-text-main)] flex items-center gap-2">
                <Search className="w-5 h-5 text-[var(--color-brand-cyan)]" />
                Cerca Città
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    className="w-full bg-[var(--color-bg-hover)] border-none h-12 pl-12 pr-4 rounded-xl text-[16px] focus-visible:ring-1 focus-visible:ring-[var(--color-brand-cyan)]/50 placeholder:text-[var(--color-text-faint)]"
                    placeholder="Es. Roma, Kyoto, New York..."
                    value={manualSearchQuery}
                    onChange={(e) => {
                      setManualSearchQuery(e.target.value)
                      cercaCitta(e.target.value)
                    }}
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]" />
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 -mr-2">
                  {searchLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-cyan)] text-opacity-50" />
                    </div>
                  ) : manualResults.length > 0 ? (
                    manualResults.map((item: any) => {
                      const cityName = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.address?.suburb || 'Think'
                      const stateName = item.address?.state || ''
                      return (
                        <button
                          key={item.place_id}
                          type="button"
                          onClick={() => {
                            selezionaCittaManuale(item)
                            setMostraRicercaManualeChat(false)
                          }}
                          className="w-full text-left p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors group flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--color-bg-base)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-brand-cyan)]/10 transition-colors">
                            {item.address?.country_code ? (
                              <img src={`https://flagcdn.com/w20/${item.address.country_code.toLowerCase()}.png`} alt={item.address.country_code} className="w-[18px] h-auto rounded-[2px] shadow-sm" />
                            ) : (
                              <MapPin className="w-4 h-4 text-[var(--color-text-faint)] group-hover:text-[var(--color-brand-cyan)] transition-colors" />
                            )}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-brand-cyan)] transition-colors">
                              {cityName}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                              {stateName ? `${stateName}, ` : ""}{item.display_name}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  ) : manualSearchQuery.length >= 3 ? (
                    <div className="text-center p-4 text-[13px] text-[var(--color-text-muted)] font-medium">
                      Nessun risultato trovato.
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
