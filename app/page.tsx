"use client"

import { useState, useEffect } from "react"
import { supabase } from '@/lib/supabaseClient'
import { containsBannedWord } from "@/lib/bannedWords"
import { useLang, timeAgoI18n, repliesLabel } from "@/lib/i18n"
import { Search, MessageSquare, Plus, Bookmark, User, Pencil, Send, Clock, TrendingUp, MapPin, Archive, Flag, Plane, Share2, ChevronDown, SlidersHorizontal, FolderArchive, Languages, Globe } from "lucide-react"

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
import { ModalsContainer } from "@/components/features/ModalsContainer"
import { ReportModal } from "@/components/features/ReportModal"
import type { AppTheme } from "@/components/features/AccountView"

// UI Components
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GlassPanel } from "@/components/ui/Glass"

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

function nicknameErrorMessage(nick: string) {
  const n = (nick || "").trim()
  if (n.length < 3) return "Minimo 3 caratteri"
  if (n.length > 20) return "Massimo 20 caratteri"
  if (!/^[a-zA-Z0-9_]+$/.test(n)) return "Solo lettere, numeri e _"
  if (containsBannedWord(n)) return "Nickname non consentito"
  return ""
}

type Mode = "feed" | "chat" | "account" | "activity" | "compose"

export default function ThinkApp() {
  const { lang, setLang, t } = useLang()
  const [appTheme, setAppTheme] = useState<AppTheme>("system")
  const [isDark, setIsDark] = useState(false)

  // Desktop Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mode, setMode] = useState<Mode>("feed")

  // Mobile Navigation State
  const [activeTab, setActiveTab] = useState("home")
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

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

  const [mioNickname, setMioNickname] = useState('Anonimo')
  const [filtroAttivo, setFiltroAttivo] = useState('Recenti')
  const [testoRicerca, setTestoRicerca] = useState('')
  const [mostraPannelloFiltri, setMostraPannelloFiltri] = useState(false)

  // Modals state
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')

  const [utenteLoggato, setUtenteLoggato] = useState<Utente | null>(null)
  // Session ID per anonimi
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Modali e Stati Variabili
  const [mostraPopupLogin, setMostraPopupLogin] = useState(false)
  const [mostraPopupBenvenuto, setMostraPopupBenvenuto] = useState(false)
  const [mostraPopupNicknameObbligatorio, setMostraPopupNicknameObbligatorio] = useState(false)

  const [emailLogin, setEmailLogin] = useState('')
  const [loginSent, setLoginSent] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

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

  // Backend Calls
  async function fetchChats() {
    try {
      if (searchQueryLng) {
        // Use Global Search RPC if a translated search query exists
        const { data, error } = await supabase.rpc('search_chats', { search_term: searchQueryLng });
        if (error) {
           console.error("DEBUG: Search RPC error:", error);
           return;
        }
        setChats(data || []);
      } else {
        // Fetch all chats globally, ordered by newest first
        const { data: allChats, error } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)

        if (error) {
          console.error("DEBUG: Supabase fetch error:", error)
          return
        }
        setChats(allChats || [])
      }
    } catch (err) {
      console.error("DEBUG: fetchChats error:", err)
    }
  }

  // User location state for UI feedback
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; regione: string } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  async function updateLocation() {
    setLocationLoading(true)
    setLocationError(null)
    
    // Check if permission is denied beforehand (for better UX)
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        if (status.state === 'denied') {
          setLocationError("Permesso negato. Riabilita la posizione nelle impostazioni del browser.")
          setLocationLoading(false)
          return
        }
      } catch (e) {
        // Permissions API might not support 'geolocation' in all browsers
      }
    }

    try {
      const loc = await ottieniCoordinate()
      if (loc.regione === 'Europa' && loc.lat === 41.9) {
        // This is our typical fallback, which usually means it failed
        // but for now let's just update the location.
      }
      setUserLocation(loc)
    } catch (e) {
      console.error("Location update failed:", e)
      setLocationError("Impossibile recuperare la posizione.")
    } finally {
      setLocationLoading(false)
    }
  }

  async function ottieniCoordinate(): Promise<{ lat: number; lng: number; regione: string }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Fallback if geolocation not supported
        resolve({ lat: 41.9, lng: 12.4, regione: 'Europa' })
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          console.log("GPS Success:", lat, lng);

          // Reverse geocode with Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
              { headers: { 'Accept-Language': 'it' } }
            )
            const data = await res.json()
            const addr = data.address || {}
            
            // Try different fields for the region
            const regione =
              addr.state ||
              addr.region ||
              addr.province ||
              addr.city ||
              addr.town ||
              addr.county ||
              addr.country ||
              'Sconosciuta'
              
            console.log("Region Found:", regione);
            resolve({ lat, lng, regione })
          } catch (e) {
            console.error("Reverse Geocode Error:", e)
            resolve({ lat, lng, regione: 'Sconosciuta' })
          }
        },
        (error) => {
          console.warn('Geolocation error:', error.code, error.message)
          // error.code 1 = Denied, 2 = Unavailable, 3 = Timeout
          resolve({ lat: 41.9, lng: 12.4, regione: 'Europa' })
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 
        }
      )
    })
  }

  // Effect Initialization
  useEffect(() => {
    console.log("Think App v5.5 - Real GPS: ON, Translate UI: UPDATED");
    updateLocation()
    
    // Globe Data
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json()).then(setCountries)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChats().catch(e => console.error("DEBUG: fetchChats failed early:", e))

    // Session ID Logic (Device Identity) - Safe Fallback for crypto.randomUUID
    let currentSessionId = localStorage.getItem('think_session_id')
    if (!currentSessionId) {
      try {
        currentSessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
      } catch (e) {
        currentSessionId = Math.random().toString(36).substring(2, 15)
      }
      localStorage.setItem('think_session_id', currentSessionId)
    }
    setSessionId(currentSessionId)

    // NICKNAME LOGIC
    let nickLocale = localStorage.getItem('think_nickname')
    if (!nickLocale) {
      // Non impostiamo subito il nome local, forziamo il popup a deciderlo e validarlo sul server.
      setMostraPopupBenvenuto(true)
    } else {
      setMioNickname(nickLocale)
    }

    // ALERT DIAGNOSTICO IMMEDIATO E PULIZIA URL
    if (typeof window !== 'undefined') {
      (window as any).THINK_VERSION = "v5"
      console.warn("DEBUG/ALERT: Think App v5 Loaded")

      // Handle OAuth token - deve essere processato PRIMA di getSession
      const processOAuth = async () => {
        // PRIMA DI TUTTO: se c'è un hash con token, pulisci tutto e basta
        if (window.location.hash.includes('access_token')) {
          console.warn("DEBUG: Hash with access_token detected, cleaning URL first...")

          // Estrai SOLO il primo access_token
          const hash = window.location.hash
          // Trova il primo access_token=
          const tokenMatch = hash.match(/access_token=([^&#]+)/)
          const refreshMatch = hash.match(/refresh_token=([^&#]+)/)

          const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null
          const refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1]) : null

          if (accessToken) {
            console.warn("DEBUG: Setting session with first access_token...")
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              })

              if (error) {
                console.error("DEBUG: setSession error:", error.message)
              } else if (data.session) {
                console.warn("DEBUG: Session set! User:", data.session.user.email)
                setUtenteLoggato(data.session.user as unknown as Utente)
              }
            } catch (e) {
              console.error("DEBUG: Exception in setSession:", e)
            }
          }

          // Pulisci URL DOPO
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      // Esegui subito
      processOAuth()
    }

    // Check for Auth Errors in URL (e.g. bad_oauth_state)
    const params = new URLSearchParams(window.location.search)

    // DEBUG: Log all URL params for error diagnosis
    const errorParam = params.get('error')
    const errorCodeParam = params.get('error_code')
    const errorDescParam = params.get('error_description')

    if (errorParam || errorCodeParam || errorDescParam) {
      console.error('DEBUG: Auth error in URL:', { error: errorParam, error_code: errorCodeParam, error_description: errorDescParam })
    }

    if (errorParam === 'bad_oauth_state' || errorDescParam?.includes('OAuth state')) {
      setLoginError("Errore sessione (OAuth). Se usi l'app di Telegram, prova ad aprire il sito nel browser esterno (Safari/Chrome).")
      setMostraPopupLogin(true)
    } else if (errorParam === 'server_error' || errorDescParam?.includes('Database')) {
      setLoginError("Errore durante la registrazione. Il problema potrebbe essere: 1) Limite utenti raggiunto, 2) Problema temporaneo del database. Riprova tra qualche minuto.")
      setMostraPopupLogin(true)
    }

    // Auth
    console.warn("DEBUG/ALERT: Auth initialization started")
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user as unknown as Utente | null
      console.warn("DEBUG/ALERT: getSession user:", user?.id || "not logged in")
      if (user) {
        setUtenteLoggato(user)
        setMostraPopupLogin(false)
        // Trigger syncProfile immediately after setting user
        syncProfileImmediate(user.id)
      } else {
        setUtenteLoggato(null)
      }
    }).catch(e => console.error("DEBUG: getSession exception:", e))

    // Funzione per syncronizzare il profilo - definita qui per essere chiamata subito
    const syncProfileImmediate = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', userId)
          .single()

        if (error || !data || !data.nickname || data.nickname.trim() === '') {
          console.log("DEBUG: Profile needs nickname, showing popup")
          setMostraPopupNicknameObbligatorio(true)
          setMostraPopupBenvenuto(false)
        } else {
          console.log("DEBUG: Profile found with nickname:", data.nickname)
          setMioNickname(data.nickname)
          localStorage.setItem('think_nickname', data.nickname)
        }
      } catch (err) {
        console.error("DEBUG: Error checking profile:", err)
        setMostraPopupNicknameObbligatorio(true)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user as unknown as Utente | null
      console.warn("DEBUG/ALERT: onAuthStateChange event:", _event, "user:", user?.id || "null")
      setUtenteLoggato(user)
      if (user) setMostraPopupLogin(false)
    })

    // Realtime Subscriptions
    const chatsChannel = supabase
      .channel('public:chats_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
        // New chat: add to array without replacing existing items (preserves transitions)
        if (payload.new) {
          setChats((prev) => {
            const exists = prev.some(c => c.id === payload.new.id)
            if (exists) return prev
            return [payload.new as Chat, ...prev]
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, (payload) => {
        if (payload.new) {
          setChats((prev) => {
            const old = prev.find(c => c.id === payload.new.id)
            if (old && (old.lat !== payload.new.lat || old.lng !== payload.new.lng)) {
              const arc = { id: `${payload.new.id}-${Date.now()}`, startLat: old.lat!, startLng: old.lng!, endLat: payload.new.lat, endLng: payload.new.lng }
              setArcsViaggio(a => [...a, arc])
              // Arc stays visible for 30 seconds
              setTimeout(() => setArcsViaggio(a => a.filter(x => x.id !== arc.id)), 30000)
            }
            // Mutate the existing object in-place to preserve object identity.
            // react-globe.gl tracks HTML elements by object reference, so a new
            // object (spread) would create a new DOM element (instant teleport).
            // Mutating the SAME object lets the library apply CSS transitions.
            if (old) {
              Object.assign(old, payload.new)
              return [...prev] // new array, same object references
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
        // Risposte: a new reply may have updated the chat's risposte_count / coordinates
        // The chats UPDATE event will handle that, so nothing extra needed here
      })
      .subscribe((status) => {
        console.warn("DEBUG/REALTIME: Subscription status:", status)
      })

    // Theme logic
    const savedTheme = localStorage.getItem('think_theme') as AppTheme | null
    if (savedTheme) setAppTheme(savedTheme)

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

    // Listen for open-login-modal custom event (from AccountView/ActivityView mobile buttons)
    const handleOpenLogin = () => setMostraPopupLogin(true)
    window.addEventListener('open-login-modal', handleOpenLogin)

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(chatsChannel)
      prefersDark.removeEventListener('change', mediaListener)
      window.removeEventListener('open-login-modal', handleOpenLogin)
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

  // Sincronizza profilo/nickname se loggato (sempre, non solo in account)
  useEffect(() => {
    console.warn("DEBUG/ALERT: utenteLoggato state changed to:", utenteLoggato?.id || "null")
    if (utenteLoggato) {
      console.warn("DEBUG/ALERT: Triggering syncProfile...")
      syncProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utenteLoggato])

  useEffect(() => {
    console.log("DEBUG: mostraPopupNicknameObbligatorio changed:", mostraPopupNicknameObbligatorio)
  }, [mostraPopupNicknameObbligatorio])

  async function syncProfile() {
    if (!utenteLoggato) return
    console.log("DEBUG: syncProfile started for", utenteLoggato.id)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', utenteLoggato.id)
        .single()

      if (error) {
        console.log("DEBUG: syncProfile error:", error.code, error.message)
        // Qualsiasi errore significa che dobbiamo mostrare il popup (profilo non esistente o errore)
        console.log("DEBUG: Profile error, triggering mandatory modal.")
        setMostraPopupNicknameObbligatorio(true)
        setMostraPopupBenvenuto(false)
        setMostraPopupLogin(false)
        return
      }

      // Verifica se il nickname è presente e non vuoto
      if (data && data.nickname && data.nickname.trim() !== '') {
        console.log("DEBUG: Profile found, nickname is:", data.nickname)
        setMioNickname(data.nickname)
        localStorage.setItem('think_nickname', data.nickname)
        setMostraPopupNicknameObbligatorio(false)
      } else {
        // Profile esiste ma senza nickname - mostra il popup
        console.log("DEBUG: Profile exists but has no nickname. Triggering mandatory modal.")
        setMostraPopupNicknameObbligatorio(true)
        setMostraPopupBenvenuto(false)
        setMostraPopupLogin(false)
      }
    } catch (err) {
      console.error("DEBUG: Exception in syncProfile:", err)
      // In caso di errore, mostra comunque il popup per sicurezza
      setMostraPopupNicknameObbligatorio(true)
      setMostraPopupBenvenuto(false)
      setMostraPopupLogin(false)
    }
  }

  async function salvaNicknameSoloLocale(nickDaSalvare?: string) {
    const targetNick = nickDaSalvare || mioNickname
    if (!targetNick.trim()) return { error: "Nome non valido" }

    // Rimuoviamo il Regex se vuoi permettere spazi? No, manteniamo lo standard.
    const err = nicknameErrorMessage(targetNick)
    if (err) return { error: err }

    if (sessionId) {
      // Chiama l'RPC per riservare il nickname provvisoriamente
      const { data, error } = await supabase.rpc('reserve_provisional_nickname', {
        p_nickname: targetNick.trim(),
        p_session_id: sessionId
      })

      if (error) {
        console.error("DEBUG: Error reserving provisional nickname", error)
        return { error: "Errore di connessione." }
      }

      if (!data.success) {
        if (data.error === 'nickname_taken_by_user') return { error: "Nickname preso da un utente registrato." }
        if (data.error === 'nickname_taken_by_guest') return { error: "Nickname preso da un altro ospite ora." }
        return { error: "Nickname non disponibile." }
      }
    }

    // Se successo (o niente error)
    localStorage.setItem('think_nickname', targetNick.trim())
    setMioNickname(targetNick.trim())
    setMostraPopupBenvenuto(false)
    return { success: true }
  }

  // --- Chiamato dalla modale Obbligatoria O da Account --- 
  async function handleCompleteProfile(nickFinale: string) {
    const nickPulito = nickFinale.trim()
    const err = nicknameErrorMessage(nickPulito)
    if (err) return { error: { message: err } }

    // RPC SICURO (Evita furti tra la query e l'insert, controllando anche la tabella guest)
    const { data, error } = await supabase.rpc('claim_definitive_nickname', {
      p_nickname: nickPulito,
      p_session_id: sessionId || null
    })

    if (error) {
      console.error("DEBUG: RPC error claiming nickname", error)
      return { error: { code: 'OTHER' } }
    }

    if (!data.success) {
      if (data.error === 'nickname_taken_by_user') return { error: { code: '23505' } } // Simula l'errore unique constraint
      if (data.error === 'nickname_taken_by_guest') return { error: { code: '23505' } }
      return { error: { code: 'OTHER' } }
    }

    // Claim riuscito (aggiornamento account avvenuto sul db). Ora ricarico cache locale.        
    localStorage.setItem('think_nickname', nickPulito)
    setMioNickname(nickPulito)
    setMostraPopupNicknameObbligatorio(false)
    return { error: null }
  }

  async function handleSaveNickname(newNick: string): Promise<{ success: boolean; error?: string }> {
    const err = nicknameErrorMessage(newNick)
    if (err) return { success: false, error: err }

    // Se loggato, salviamo su DB in modo definitivo
    if (utenteLoggato) {
      const { data, error } = await supabase.rpc('claim_definitive_nickname', {
        p_nickname: newNick,
        p_session_id: sessionId || null
      })

      if (error) return { success: false, error: "Errore durante il salvataggio su database" }
      if (!data.success) {
        if (data.error === 'nickname_taken_by_user') return { success: false, error: "Nickname già occupato da un altro utente" }
        if (data.error === 'nickname_taken_by_guest') return { success: false, error: "Nickname temporaneamente bloccato da un ospite" }
        return { success: false, error: "Nickname non disponibile" }
      }
    } else {
      // Se non loggato, proviamo a riservarlo come anonimi
      if (sessionId) {
        const { data, error } = await supabase.rpc('reserve_provisional_nickname', {
          p_nickname: newNick,
          p_session_id: sessionId
        })
        if (error) return { success: false, error: "Errore di connessione" }
        if (!data.success) {
          if (data.error === 'nickname_taken_by_user') return { success: false, error: "Nickname già occupato da un altro utente" }
          if (data.error === 'nickname_taken_by_guest') return { success: false, error: "Nickname già in uso da un ospite" }
          return { success: false, error: "Nickname non disponibile" }
        }
      }
    }

    // In ogni caso di successo, salviamo in locale
    localStorage.setItem('think_nickname', newNick)
    setMioNickname(newNick)
    return { success: true }
  }


  async function creaChat() {
    if (!nuovoMessaggio.trim()) return
    const mieCoord = await ottieniCoordinate()

    const { data: newChat, error } = await supabase.from('chats').insert([{
      titolo: nuovoMessaggio,
      lat: mieCoord.lat,
      lng: mieCoord.lng,
      regione: mieCoord.regione,
      risposte_count: 0,
      autore: utenteLoggato ? (mioNickname || 'Anonimo') : mioNickname,
      user_id: utenteLoggato ? utenteLoggato.id : null,
      ultima_attivita: new Date().toISOString()
    }]).select().single()

    if (error) {
      console.error("Error creating chat:", error)
      return
    }

    // Aggiorna UI locale
    setChats([newChat, ...chats])
    setMode("feed")
    setMobileSheetOpen(false)
    setNuovoMessaggio('')
  }

  async function apriChat(chat: Chat) {
    setChatAttiva(chat)
    setMode("chat")
    setActiveTab("esplora")
    setMobileSheetOpen(true)
    
    // Reset translations when opening a new chat
    setTranslatedSeed({ text: '', isTranslated: false, loading: true })
    setTranslatedReplies({})
    
    // Fetch replies
    const { data } = await supabase.from('risposte').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true })
    if (data) setRisposte(data)
    
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

  function chiudiChat() {
    setChatAttiva(null)
    setRisposte([])
    setMode("feed")
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

  async function inviaRisposta() {
    if (!nuovaRisposta.trim() || !chatAttiva) return

    const mieCoord = await ottieniCoordinate()

    await supabase.from('risposte').insert([{
      testo: nuovaRisposta,
      chat_id: chatAttiva.id,
      autore: utenteLoggato ? (mioNickname || 'Anonimo') : mioNickname,
      user_id: utenteLoggato ? utenteLoggato.id : null,
      regione: mieCoord.regione
    }])

    setNuovaRisposta('')
    const newCount = (chatAttiva.risposte_count ?? 0) + 1

    // Move to midpoint between current position and replier's position
    const currentLat = chatAttiva.lat ?? mieCoord.lat
    const currentLng = chatAttiva.lng ?? mieCoord.lng
    const midLat = (currentLat + mieCoord.lat) / 2
    const midLng = (currentLng + mieCoord.lng) / 2

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
      .update({ lat: midLat, lng: midLng, regione: midRegione, risposte_count: newCount, ultima_attivita: new Date().toISOString() })
      .eq('id', chatAttiva.id)

    setChatAttiva({ ...chatAttiva, lat: midLat, lng: midLng, regione: midRegione, risposte_count: newCount })
  }

  async function toggleBookmark(chat: Chat) {
    if (!utenteLoggato) {
      setMostraPopupLogin(true)
      return
    }

    const existing = bookmarks.find(b => b.chat?.id === chat.id)
    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id)
    } else {
      await supabase.from('bookmarks').insert([{ user_id: utenteLoggato.id, chat_id: chat.id }])
    }
    fetchAccountData()
  }

  async function logout() {
    await supabase.auth.signOut()
    localStorage.removeItem('think_nickname')
    setMioNickname('')
    setUtenteLoggato(null)
    setMostraPopupBenvenuto(true)
    setMode("feed")
    setActiveTab("home")
  }

  async function accediConGoogle() {
    setLoginLoading(true)
    setLoginError('')
    // Fallback on origin guarantees that the PWA resumes at the EXACT path it left off
    // Cache-busting for redirect to avoid Cloudflare/Browser issues
    const ts = Date.now()
    const redirectTo = window.location.hostname === 'thethink.space'
      ? `https://thethink.space/?v=${ts}`
      : `${window.location.origin}/?v=${ts}`

    // Assicuriamoci che non ci siano frammenti residui nel redirectTo
    const cleanRedirectTo = redirectTo.split('#')[0]

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: cleanRedirectTo,
        queryParams: { prompt: 'select_account' }
      }
    })
    if (error) {
      setLoginError(error.message)
      setLoginLoading(false)
    }
  }

  async function inviaMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoginError("")
    if (!emailLogin || !emailLogin.includes("@")) { setLoginError("Inserisci una email valida"); return }
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email: emailLogin, options: { emailRedirectTo: window.location.origin } })
    setLoginLoading(false)
    if (error) setLoginError(error.message)
    else setLoginSent(true)
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
    fetchChats();
  }, [searchQueryLng]);

  // Views Renderers
  const getChatsFiltrate = () => {
    let f = [...chats].filter(c => c.lat !== null)

    if (filtroAttivo === 'Archivio') {
      f = f.filter(c => calcolaStatoVitale(c) === 'archivio')
    } else {
      f = f.filter(c => {
        const stato = calcolaStatoVitale(c)
        // Nascondi sempre Archivio e Foglia Secca dalla mappa attiva e dal feed base
        if (stato === 'archivio' || stato === 'foglia_secca') return false
        
        // Tutti gli altri pensieri (semi, germogli, ecc) sono visibili globalmente
        return true
      })
    }

    // Client-side fallback filtering if search term isn't translated yet, or for immediate local feedback
    if (testoRicerca && !searchQueryLng) {
      f = f.filter(c => c.titolo.toLowerCase().includes(testoRicerca.toLowerCase()) || c.autore.toLowerCase().includes(testoRicerca.toLowerCase()))
    }

    if (filtroAttivo === 'Tendenze') f.sort((a, b) => (b.risposte_count || 0) - (a.risposte_count || 0))
    console.log(`DEBUG: Filtraggio completato. Input: ${chats.length}, Output: ${f.length}`)
    return f
  }

  const chatsFiltrate = getChatsFiltrate()

  // Dynamic Views
  const renderFeedContent = () => (
    <div className="fade-in-up md:animate-in md:duration-500 pb-10">
      <div className="sticky top-0 z-[40] pb-2 pt-2 -mx-6 px-6 bg-[var(--color-bg-panel)] backdrop-blur-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-b border-[var(--color-border-subtle)]">
        <div className="lg:hidden mb-3">
          <h2 className="text-[28px] font-black tracking-tight text-center">{t('feed')}</h2>
          <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-center">{chatsFiltrate.length} {t('pensieri_sparsi')}</p>
        </div>
        <div className="flex flex-row items-center gap-3 mb-4">
          <div className="flex-1">
            <Input
              icon={<Search className="w-4 h-4 text-[var(--color-text-faint)]" />}
              placeholder={t('cerca_pensieri')}
              value={testoRicerca}
              onChange={(e) => setTestoRicerca(e.target.value)}
              className="w-full shadow-sm border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] h-12 rounded-[20px]"
            />
          </div>
          <button
            type="button"
            onClick={() => setMostraPannelloFiltri(!mostraPannelloFiltri)}
            className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full border border-[var(--color-border-subtle)] shadow-sm transition-colors ${
              mostraPannelloFiltri || filtroAttivo === 'Archivio'
                ? "bg-[var(--color-brand-blue)] text-white border-transparent"
                : "bg-[var(--color-bg-card)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)]"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Filter Panel */}
        <div 
          className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            mostraPannelloFiltri ? "max-h-[300px] opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"
          }`}
        >
          <div className="p-4 bg-[var(--color-bg-card)] rounded-[20px] border border-[var(--color-border-subtle)] shadow-sm flex flex-col gap-3">
            {/* Livello Primario (In evidenza) */}
            <button
              onClick={() => { setFiltroAttivo('Archivio'); setMostraPannelloFiltri(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                filtroAttivo === 'Archivio'
                  ? "bg-[var(--color-brand-blue)] text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)] border-transparent"
                  : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]"
              }`}
            >
              <FolderArchive className="w-5 h-5 flex-shrink-0" />
              <div className="flex flex-col items-start flex-1 text-left">
                <span className="font-bold text-[15px]">{t('archiviati')}</span>
                <span className="text-[12px] opacity-80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{t('sfoglia_archivio')}</span>
              </div>
            </button>

            {/* Livello Secondario (Ordinamento) */}
            <div 
              className="flex flex-row flex-nowrap overflow-x-auto gap-2 scrollbar-hide pb-1 pt-1"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
                paddingLeft: '16px',
                paddingRight: '16px',
                marginLeft: '-16px',
                marginRight: '-16px'
              }}
            >
              {FILTRI_KEYS.filter(f => f.id !== 'Archivio').map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFiltroAttivo(f.id); setMostraPannelloFiltri(false); }}
                  className={`flex-shrink-0 py-2.5 px-4 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all border whitespace-nowrap ${
                    filtroAttivo === f.id
                      ? "bg-[var(--color-brand-blue)] text-white border-transparent shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
                      : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]"
                  }`}
                >
                  {f.icon}
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {chatsFiltrate.map(chat => <ChatCard key={chat.id} chat={chat} onClick={apriChat} t={t} lang={lang} />)}
      </div>
    </div>
  )

  const renderChatContent = () => {
    if (!chatAttiva) return null
    const stato = calcolaStatoVitale(chatAttiva)
    return (
      <div className="fade-in-up sm:animate-in sm:duration-500 pb-6 relative">
        {/* Pensiero Originale — Hero Card */}
        <div className="relative rounded-3xl overflow-hidden mb-6">
          {/* Gradient BG accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-blue)]/10 via-transparent to-[var(--color-brand-cyan)]/5 pointer-events-none" />
          <div className="absolute inset-0 bg-[var(--color-bg-card)] -z-10" />
          <div className="absolute inset-0 border border-[var(--color-border-subtle)] rounded-3xl pointer-events-none" />

          <div className="p-6 sm:p-8">
            {/* Top bar: stato + azioni */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${['seme', 'germoglio', 'albero'].includes(stato) ? 'bg-emerald-400 animate-pulse' :
                  stato === 'foglia_secca' ? 'bg-amber-400' : 'bg-zinc-500'
                  }`} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
                  {['seme', 'germoglio', 'albero'].includes(stato) ? t('attivo') : stato === 'foglia_secca' ? t('in_declino') : t('archivio')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setReportChatId(String(chatAttiva.id))
                    setReportRispostaId(undefined)
                    setReportTestoContenuto(chatAttiva.titolo)
                    setReportOpen(true)
                  }}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-faint)] hover:text-red-400"
                  title={t('segnala')}
                >
                  <Flag className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const url = `${window.location.origin}?thought=${chatAttiva.id}`
                    const text = `"${chatAttiva.titolo}" — da ${chatAttiva.regione || 'Think'}`
                    if (navigator.share) {
                      await navigator.share({ title: 'Think', text, url }).catch(() => {})
                    } else {
                      await navigator.clipboard.writeText(`${text}\n${url}`)
                    }
                  }}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-faint)] hover:text-[var(--color-brand-blue)]"
                  title={t('condividi')}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(chatAttiva)}
                  className={`p-2 rounded-xl transition-colors ${bookmarks.some(b => b.chat?.id === chatAttiva.id)
                    ? "text-[var(--color-brand-amber)] bg-[var(--color-brand-amber-dim)]"
                    : "text-[var(--color-text-faint)] hover:bg-[var(--color-bg-hover)]"
                    }`}
                  title={t('salva')}
                >
                  <Bookmark className="w-4 h-4" fill={bookmarks.some(b => b.chat?.id === chatAttiva.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Il Pensiero */}
            <div className="mb-6 relative">
              <p className={`text-[18px] sm:text-[20px] font-bold leading-relaxed text-[var(--color-text-main)] transition-opacity duration-300 ${translatedSeed.loading ? 'opacity-50' : 'opacity-100'}`}>
                {translatedSeed.text || chatAttiva.titolo}
              </p>
              
              {/* Translation Badge */}
              {translatedSeed.isTranslated && !translatedSeed.loading && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-panel)] border border-[var(--color-border-subtle)] backdrop-blur-md shadow-sm">
                  <Languages className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span className="text-[10px] font-bold tracking-wide text-[var(--color-text-muted)] uppercase">
                    (Tradotto in automatico)
                  </span>
                </div>
              )}
              {/* Loading State for Translation */}
              {translatedSeed.loading && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-panel)] border border-[var(--color-border-subtle)] backdrop-blur-md shadow-sm animate-pulse">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold tracking-wide text-[var(--color-text-faint)] uppercase">
                    Traduzione in corso...
                  </span>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {chatAttiva.autore}
              </span>
              <span className="flex items-center gap-1.5">
                {(chatAttiva.risposte_count ?? 0) > 0
                  ? <Plane className="w-3.5 h-3.5 text-[var(--color-brand-blue)]" />
                  : <MapPin className="w-3.5 h-3.5" />
                }
                {chatAttiva.regione}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {repliesLabel(chatAttiva.risposte_count || 0, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Risposte / Sviluppi */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            {t('sviluppi')}
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
            <div className="space-y-3">
              {risposte.map(r => (
                <div
                  key={r.id}
                  className="flex gap-3 group"
                >
                  {/* Thread line */}
                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-faint)]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-px flex-1 bg-[var(--color-border-subtle)] mt-1.5 opacity-50" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-bold text-[var(--color-text-main)] truncate max-w-[120px]">{r.autore}</span>
                          
                          <button
                            type="button"
                            onClick={() => handleTranslateReply(r.id, r.testo)}
                            disabled={translatedReplies[r.id]?.loading || translatedReplies[r.id]?.text !== undefined}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all ${translatedReplies[r.id]?.text ? 'text-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/10' : 'text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border-subtle)]'}`}
                            title="Traduci"
                          >
                            {translatedReplies[r.id]?.loading ? (
                              <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : (
                              <Globe className="w-3 h-3" />
                            )}
                            <span className="text-[9px] font-black uppercase tracking-tighter">TR</span>
                          </button>

                          {r.regione && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] flex items-center gap-0.5 bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                              <MapPin className="w-2.5 h-2.5" />
                              {r.regione}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--color-text-faint)] whitespace-nowrap">{timeAgoI18n(r.created_at, lang)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setReportChatId(String(chatAttiva.id))
                          setReportRispostaId(String(r.id))
                          setReportTestoContenuto(r.testo)
                          setReportOpen(true)
                        }}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-faint)] hover:text-red-400 flex-shrink-0 mt-[-2px]"
                        title={t('segnala_risposta')}
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className={`text-[14px] leading-relaxed font-medium transition-opacity duration-300 break-words ${translatedReplies[r.id]?.loading ? 'opacity-50' : 'text-[var(--color-text-main)]/90'}`}>
                      {translatedReplies[r.id]?.text || r.testo}
                    </p>
                  </div>
                </div>
              ))}
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
      }
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-main)] font-sans antialiased selection:bg-[var(--color-brand-blue)]/30 selection:text-white">

      {/* MOBILE HEADER: Logo + Nickname */}
      <div 
        className="fixed top-0 left-0 right-0 z-[45] lg:hidden flex items-center justify-between px-5 pb-3 pointer-events-none"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-gradient pointer-events-auto drop-shadow-md">
            Think.
          </h1>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[12px] font-bold text-[var(--color-text-muted)] tracking-wide">
            {mioNickname || 'Anonimo'}
          </span>
          {!utenteLoggato && (
            <button
              type="button"
              className="w-7 h-7 rounded-full bg-[var(--color-bg-panel)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-faint)] hover:text-[var(--color-text-main)] transition-colors shadow-sm"
              onClick={() => setMostraPopupBenvenuto(true)}
              title="Cambia nickname"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <MapGlobe
        countries={countries}
        chats={chatsFiltrate}
        sidebarOpen={sidebarOpen}
        isDark={isDark}
        onMarkerClick={apriChat}
        arcsViaggio={arcsViaggio}
      />

      {/* DESKTOP SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        isDark={isDark}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onToggleTheme={() => handleSetAppTheme(isDark ? 'light' : 'dark')}
        onLogoClick={() => {
          setMode("feed")
          setChatAttiva(null)
        }}
        footer={
          mode !== "chat" ? (
            <div className="space-y-4">
              <Button size="lg" className="w-full flex items-center justify-center gap-2" onClick={() => setMode("compose")}>
                <Plus className="w-5 h-5" strokeWidth={2.5} /> {t('lancia_pensiero')}
              </Button>
            </div>
          ) : (
            <div className="flex relative items-center gap-2">
              <Input
                placeholder={t('rispondi')}
                value={nuovaRisposta}
                onChange={(e) => setNuovaRisposta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviaRisposta()}
                className="pr-14"
              />
              <Button
                onClick={inviaRisposta}
                size="icon"
                className="absolute right-1 top-1 bottom-1 w-11 h-11 rounded-xl shadow-lg m-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )
        }
      >
        <div className="pt-2">
          {/* Header Piccolo Info Account Desktop: matita nel cerchio + nome */}
          <div className="hidden lg:flex items-center gap-2 mb-3 mt-2 px-1">
            <button
              type="button"
              onClick={() => setMostraPopupBenvenuto(true)}
              className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-faint)] hover:text-[var(--color-text-main)] flex items-center justify-center shadow-sm transition-colors"
              title={t('pseudonimo')}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-[14px]">
              {mioNickname || 'Anonimo'}
            </span>
          </div>

          {/* Desktop Tab Nav */}
          {mode !== "chat" && (
            <div className="sticky top-0 z-[60] bg-[var(--color-bg-panel)] backdrop-blur-xl pt-1 pb-3 -mx-7 px-7 mb-4 border-b border-[var(--color-border-subtle)]">
              <div className="relative flex gap-1 p-1 rounded-2xl bg-[var(--color-bg-hover)] shadow-inner">
                {/* Sliding indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-xl bg-[var(--color-bg-panel)] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    left: `calc(4px + ${mode === 'feed' ? 0 : mode === 'activity' ? 1 : 2} * ((100% - 8px) / 3))`,
                  }}
                />
                {[
                  { id: "feed", label: t('feed') },
                  { id: "activity", label: t('attivita') },
                  { id: "account", label: t('profilo') },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setMode(tab.id as Mode); setChatAttiva(null) }}
                    className={`relative z-10 flex-1 py-2 text-[13px] font-bold rounded-xl transition-colors duration-300 ${mode === tab.id
                      ? "text-[var(--color-text-main)]"
                      : "text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Back button in chat mode */}
          {mode === "chat" && (
            <div className="sticky top-0 z-[60] bg-[var(--color-bg-base)]/90 backdrop-blur-xl pt-2 pb-4 -mx-7 px-7 mb-4 border-b border-[var(--color-border-subtle)]">
              <Button variant="ghost" className="-ml-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors" onClick={() => { chiudiChat(); setMode("feed") }}>
                <span className="flex items-center gap-2 text-[14px] font-bold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  {t('feed')}
                </span>
              </Button>
            </div>
          )}

          {mode === "feed" && renderFeedContent()}
          {mode === "chat" && renderChatContent()}
          {mode === "account" && (
            <AccountView
              utenteLoggato={utenteLoggato}
              mioNickname={mioNickname}
              setMioNickname={setMioNickname}
              onSaveNickname={handleSaveNickname}
              nicknameErrorMessage={nicknameErrorMessage}
              accountLoading={accountLoading}
              appTheme={appTheme}
              setAppTheme={handleSetAppTheme}
              logout={logout}
              t={t}
              lang={lang}
              setLang={setLang}
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
            />
          )}
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
              updateLocation={updateLocation}
              t={t}
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
        nuovaRisposta={nuovaRisposta}
        setNuovaRisposta={setNuovaRisposta}
        onInviaRisposta={inviaRisposta}
        t={t}
      />

      {/* MOBILE SHEET PANELS */}
      <MobileSheet
        isOpen={mobileSheetOpen}
        onClose={() => {
          setMobileSheetOpen(false)
          setMode("feed")
          setActiveTab("home")
        }}
        initialPosition={mode === "compose" ? "expanded" : "partial"}
        footer={undefined}
      >
        <div className="pt-0 pb-2">
          {mode === "feed" && renderFeedContent()}
          {mode === "chat" && renderChatContent()}
          {mode === "account" && (
            <AccountView
              utenteLoggato={utenteLoggato}
              mioNickname={mioNickname}
              setMioNickname={setMioNickname}
              onSaveNickname={handleSaveNickname}
              nicknameErrorMessage={nicknameErrorMessage}
              accountLoading={accountLoading}
              appTheme={appTheme}
              setAppTheme={handleSetAppTheme}
              logout={logout}
              t={t}
              lang={lang}
              setLang={setLang}
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
            />
          )}

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
              updateLocation={updateLocation}
              t={t}
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
        setMostraPopupBenvenuto={setMostraPopupBenvenuto}
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
        onCompleteProfile={handleCompleteProfile}
        nicknameErrorMessage={nicknameErrorMessage}
        userLocation={userLocation}
        locationLoading={locationLoading}
        locationError={locationError}
        updateLocation={updateLocation}
        t={t}
      />
    </div>
  )
}
