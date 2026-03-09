"use client"

import { useState, useEffect } from "react"
import { supabase } from '@/lib/supabaseClient'
import { containsBannedWord } from "@/lib/bannedWords"
import { Search, MessageSquare, Plus, Bookmark, User, Pencil, Send, Clock, TrendingUp, MapPin, Archive, Flag } from "lucide-react"

// Layout Components
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNavigation } from "@/components/layout/BottomNavigation"
import { MobileSheet } from "@/components/layout/MobileSheet"

// Feature Components
import { STILI_STATO, calcolaStatoVitale, MapGlobe } from "@/components/features/MapGlobe"
import { ChatCard, timeAgo } from "@/components/features/ChatCard"
import { AccountView } from "@/components/features/AccountView"
import { ActivityView } from "@/components/features/ActivityView"
import { ModalsContainer } from "@/components/features/ModalsContainer"
import { ReportModal } from "@/components/features/ReportModal"
import type { AppTheme } from "@/components/features/AccountView"

// UI Components
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { GlassPanel } from "@/components/ui/Glass"

const FILTRI = [
  { id: "Recenti", label: "Recenti", icon: <Clock className="w-4 h-4 mr-1.5 inline" /> },
  { id: "Tendenze", label: "Tendenze", icon: <TrendingUp className="w-4 h-4 mr-1.5 inline" /> },
  { id: "Vicini", label: "Vicini", icon: <MapPin className="w-4 h-4 mr-1.5 inline" /> },
  { id: "Archivio", label: "Archivio", icon: <Archive className="w-4 h-4 mr-1.5 inline" /> }
]

const CITTA_TEST = [
  { id: 'auto', nome: '📍 Rilevamento Auto', lat: null, lng: null, regione: '' },
  { id: 'roma', nome: '🏛️ Roma, IT', lat: 41.9028, lng: 12.4964, regione: 'Lazio' },
  { id: 'milano', nome: '🍕 Milano, IT', lat: 45.4642, lng: 9.1900, regione: 'Lombardia' },
  { id: 'newyork', nome: '🗽 New York', lat: 40.7128, lng: -74.006, regione: 'New York' },
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

type Mode = "feed" | "chat" | "account" | "activity"

export default function ThinkApp() {
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
  
  const [chatAttiva, setChatAttiva] = useState<Chat | null>(null)
  const [risposte, setRisposte] = useState<Risposta[]>([])
  const [nuovaRisposta, setNuovaRisposta] = useState('')
  
  const [mioNickname, setMioNickname] = useState('Anonimo')
  const [gpsSimulato, setGpsSimulato] = useState('roma')
  const [filtroAttivo, setFiltroAttivo] = useState('Recenti')
  const [testoRicerca, setTestoRicerca] = useState('')
  
  // Modals state
  const [nuovoMessaggio, setNuovoMessaggio] = useState('')
  const [mostraModaleComponi, setMostraModaleComponi] = useState(false)
  
  const [utenteLoggato, setUtenteLoggato] = useState<Utente | null>(null)
  const [mostraPopupLogin, setMostraPopupLogin] = useState(false)
  const [mostraPopupBenvenuto, setMostraPopupBenvenuto] = useState(false)
  
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

  // Backend Calls
  async function fetchChats() {
    const mieCoord = await ottieniCoordinate()
    
    // 1. Chats vicine (feed normale, tendenze, recenti)
    const localRes = supabase.rpc('chats_in_view', {
      lat_in: mieCoord.lat,
      lng_in: mieCoord.lng,
      radius_km: 500
    })
    
    // 2. Archiviati globali
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const archRes = supabase.from('chats').select('*, risposte(count)').lt('created_at', twentyFourHoursAgo).order('created_at', { ascending: false }).limit(50)

    const [localData, archData] = await Promise.all([localRes, archRes])

    const merged = new Map<number, Chat>()
    
    if (localData.data) {
      localData.data.forEach((c: Chat) => merged.set(c.id, c))
    }
    
    if (archData.data) {
      const arch = archData.data.map((c: Chat & { risposte?: { count: number }[] }) => ({
        ...c,
        risposte_count: c.risposte?.[0]?.count || 0
      })) as Chat[]
      
      arch.forEach(c => {
        if (calcolaStatoVitale(c) === 'archivio') {
          merged.set(c.id, c)
        }
      })
    }
    
    const chatOrdinate = Array.from(merged.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
    setChats(chatOrdinate)
  }

  async function ottieniCoordinate() {
    const citta = CITTA_TEST.find(c => c.id === gpsSimulato)
    if (citta && citta.id !== 'auto') return { lat: citta.lat!, lng: citta.lng!, regione: citta.regione }
    return { lat: 41.9, lng: 12.4, regione: 'Europa' }
  }

  // Effect Initialization
  useEffect(() => {
    // Globe Data
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json()).then(setCountries)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChats()

    // Nickname logic
    let nickLocale = localStorage.getItem('think_nickname')
    if (!nickLocale) {
      nickLocale = `${ANIMALI[Math.floor(Math.random() * ANIMALI.length)]}_${AGGETTIVI[Math.floor(Math.random() * AGGETTIVI.length)]}_${Math.floor(Math.random() * 100)}`
      localStorage.setItem('think_nickname', nickLocale)
      setMostraPopupBenvenuto(true)
    }
    setMioNickname(nickLocale)

    // Auth
    supabase.auth.getSession().then(({ data: { session } }) => setUtenteLoggato((session?.user as unknown as Utente) ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUtenteLoggato((session?.user as unknown as Utente) ?? null))

    // Realtime Subscriptions
    const chatsChannel = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => fetchChats())
      .subscribe()

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsSimulato])

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
    if (mode !== "account") return
    if (!utenteLoggato) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccountData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, utenteLoggato])


  async function creaChat() {
    if (!nuovoMessaggio.trim()) return
    const mieCoord = await ottieniCoordinate()

    await supabase.from('chats').insert([{
      titolo: nuovoMessaggio,
      lat: mieCoord.lat,
      lng: mieCoord.lng,
      regione: mieCoord.regione,
      risposte_count: 0,
      autore: utenteLoggato ? utenteLoggato.email.split('@')[0] : mioNickname,
      user_id: utenteLoggato ? utenteLoggato.id : null,
      ultima_attivita: new Date().toISOString()
    }])

    setNuovoMessaggio('')
    setMostraModaleComponi(false)
  }

  async function apriChat(chat: Chat) {
    setChatAttiva(chat)
    setMode("chat")
    setActiveTab("esplora")
    setMobileSheetOpen(true)
    const { data } = await supabase.from('risposte').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true })
    if (data) setRisposte(data)
  }

  function chiudiChat() {
    setChatAttiva(null)
    setRisposte([])
    setMode("feed")
  }

  async function inviaRisposta() {
    if (!nuovaRisposta.trim() || !chatAttiva) return

    await supabase.from('risposte').insert([{
      testo: nuovaRisposta,
      chat_id: chatAttiva.id,
      autore: utenteLoggato ? utenteLoggato.email.split('@')[0] : mioNickname,
      user_id: utenteLoggato ? utenteLoggato.id : null
    }])

    setNuovaRisposta('')
    const mieCoord = await ottieniCoordinate()
    const newCount = (chatAttiva.risposte_count ?? 0) + 1
    const endLat = (chatAttiva.lat + mieCoord.lat) / 2
    const endLng = (chatAttiva.lng + mieCoord.lng) / 2

    await supabase.from('chats')
      .update({ lat: endLat, lng: endLng, regione: mieCoord.regione, risposte_count: newCount, ultima_attivita: new Date().toISOString() })
      .eq('id', chatAttiva.id)

    setChatAttiva({ ...chatAttiva, lat: endLat, lng: endLng, regione: mieCoord.regione, risposte_count: newCount })
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
    setMode("feed")
    setActiveTab("home")
  }

  async function accediConGoogle() {
    setLoginLoading(true)
    setLoginError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
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

  function salvaNicknameSoloLocale() {
    if (!mioNickname.trim()) return
    const err = nicknameErrorMessage(mioNickname)
    if (err) { alert(err); return }
    localStorage.setItem('think_nickname', mioNickname)
    setMostraPopupBenvenuto(false)
  }

  // Views Renderers
  const getChatsFiltrate = () => {
    let f = [...chats].filter(c => c.lat !== null)
    
    if (filtroAttivo === 'Archivio') {
      f = f.filter(c => calcolaStatoVitale(c) === 'archivio')
    } else {
      f = f.filter(c => calcolaStatoVitale(c) !== 'archivio')
    }
    
    if (testoRicerca) f = f.filter(c => c.titolo.toLowerCase().includes(testoRicerca.toLowerCase()) || c.autore.toLowerCase().includes(testoRicerca.toLowerCase()))
    
    if (filtroAttivo === 'Tendenze') f.sort((a, b) => (b.risposte_count || 0) - (a.risposte_count || 0))
    return f
  }

  const chatsFiltrate = getChatsFiltrate()

  // Dynamic Views
  const renderFeedContent = () => (
    <div className="fade-in-up md:animate-in md:duration-500 pb-10">
      <div className="sticky top-0 z-[40] pb-2 pt-2 -mx-6 px-6 bg-[var(--color-bg-panel)] backdrop-blur-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border-b border-[var(--color-border-subtle)]">
        <div className="lg:hidden mb-3">
          <h2 className="text-[28px] font-black tracking-tight text-center">Feed</h2>
          <p className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-center">Pensieri dal mondo</p>
        </div>
        <Input 
          icon={<Search className="w-4 h-4 text-[var(--color-text-faint)]" />} 
          placeholder="Cerca pensieri nel mondo..." 
          value={testoRicerca} 
          onChange={(e) => setTestoRicerca(e.target.value)} 
          className="mb-5 shadow-sm border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] h-12 rounded-2xl"
        />

        <div className="flex gap-2 overflow-x-auto pb-4 pt-1 scrollbar-hide" style={{ maskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)", WebkitMaskImage: "-webkit-linear-gradient(left, transparent, black 16px, black calc(100% - 16px), transparent)", paddingLeft: '16px', paddingRight: '16px', marginLeft: '-16px', marginRight: '-16px' }}>
          {FILTRI.map((f) => (
            <button 
              key={f.id} 
              onClick={() => setFiltroAttivo(f.id)} 
              className={`px-5 py-2.5 rounded-full flex items-center justify-center text-[13px] font-bold transition-all whitespace-nowrap border ${
                filtroAttivo === f.id 
                ? "bg-[var(--color-brand-blue)] text-white border-transparent shadow-[0_4px_15px_rgba(59,130,246,0.3)]" 
                : "bg-[var(--color-bg-card)] text-[var(--color-text-main)] border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)]"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 mt-2 mb-4 bg-transparent">
          <div className="flex items-center gap-2.5 text-[var(--color-text-muted)]">
            <MessageSquare className="w-4 h-4 opacity-70" />
            <span className="text-[13px] font-semibold tracking-wide">
              <strong className="text-[var(--color-text-main)]">{chatsFiltrate.length}</strong> pensieri sparsi
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {chatsFiltrate.map(chat => <ChatCard key={chat.id} chat={chat} onClick={apriChat} />)}
      </div>
    </div>
  )

  const renderChatContent = () => {
    if (!chatAttiva) return null
    const stato = calcolaStatoVitale(chatAttiva)
    return (
      <div className="fade-in-up sm:animate-in sm:duration-500 pb-6">

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
                <div className={`w-2 h-2 rounded-full ${
                  ['seme', 'germoglio', 'albero'].includes(stato) ? 'bg-emerald-400 animate-pulse' :
                  stato === 'foglia_secca' ? 'bg-amber-400' : 'bg-zinc-500'
                }`} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
                  {['seme', 'germoglio', 'albero'].includes(stato) ? 'Attivo' : stato === 'foglia_secca' ? 'In declino' : 'Archivio'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setReportChatId(String(chatAttiva.id))
                    setReportRispostaId(undefined)
                    setReportOpen(true)
                  }}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-faint)] hover:text-red-400"
                  title="Segnala"
                >
                  <Flag className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(chatAttiva)}
                  className={`p-2 rounded-xl transition-colors ${
                    bookmarks.some(b => b.chat?.id === chatAttiva.id)
                      ? "text-[var(--color-brand-amber)] bg-[var(--color-brand-amber-dim)]"
                      : "text-[var(--color-text-faint)] hover:bg-[var(--color-bg-hover)]"
                  }`}
                  title="Salva"
                >
                  <Bookmark className="w-4 h-4" fill={bookmarks.some(b => b.chat?.id === chatAttiva.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Il Pensiero */}
            <p className="text-[18px] sm:text-[20px] font-bold leading-relaxed text-[var(--color-text-main)] mb-6">
              {chatAttiva.titolo}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {chatAttiva.autore}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {chatAttiva.regione}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {chatAttiva.risposte_count || 0} rispost{(chatAttiva.risposte_count || 0) === 1 ? 'a' : 'e'}
              </span>
            </div>
          </div>
        </div>

        {/* Risposte / Sviluppi */}
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4 ml-1 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Sviluppi
          </h3>
          
          {risposte.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[var(--color-text-faint)]" />
              </div>
              <p className="text-[var(--color-text-muted)] text-[14px] font-semibold mb-1">Nessuna risposta ancora</p>
              <p className="text-[var(--color-text-faint)] text-[13px] font-medium">Sii il primo a contribuire a questo pensiero.</p>
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
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px] font-bold text-[var(--color-text-main)]">{r.autore}</span>
                      <span className="text-[10px] text-[var(--color-text-faint)]">{timeAgo(r.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReportChatId(String(chatAttiva.id))
                          setReportRispostaId(String(r.id))
                          setReportOpen(true)
                        }}
                        className="ml-auto p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-faint)] hover:text-red-400"
                        title="Segnala risposta"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[14px] leading-relaxed font-medium text-[var(--color-text-main)]/90">{r.testo}</p>
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
      <div className="fixed top-0 left-0 right-0 z-[45] lg:hidden flex items-center justify-between px-5 py-3 pointer-events-none">
        <h1 className="text-xl font-black tracking-tight text-gradient">
          Think.
        </h1>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[12px] font-bold text-[var(--color-text-muted)] tracking-wide">
            {utenteLoggato ? utenteLoggato.email.split('@')[0] : mioNickname}
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
        gpsSimulato={gpsSimulato} 
        cittaTest={CITTA_TEST} 
        setGpsSimulato={setGpsSimulato} 
        onMarkerClick={apriChat}
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
              <Button size="lg" className="w-full flex items-center justify-center gap-2" onClick={() => setMostraModaleComponi(true)}>
                <Plus className="w-5 h-5" strokeWidth={2.5} /> Crea Pensiero
              </Button>
            </div>
          ) : (
            <div className="flex relative items-center gap-2">
              <Input 
                placeholder="Invia una risposta nell'etere..." 
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
              title="Cambia Nickname"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-[14px]">
              {utenteLoggato ? utenteLoggato.email.split('@')[0] : mioNickname}
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
                  { id: "feed", label: "Feed" },
                  { id: "activity", label: "Attivit\u00e0" },
                  { id: "account", label: "Profilo" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setMode(tab.id as Mode); setChatAttiva(null) }}
                    className={`relative z-10 flex-1 py-2 text-[13px] font-bold rounded-xl transition-colors duration-300 ${
                      mode === tab.id
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Torna al Feed
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
              nicknameErrorMessage={nicknameErrorMessage} 
              accountLoading={accountLoading} 
              appTheme={appTheme}
              setAppTheme={handleSetAppTheme}
              logout={logout} 
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
            />
          )}
        </div>
      </Sidebar>

      {/* MOBILE BOTTOM NAVIGATION */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onCompose={() => setMostraModaleComponi(true)} 
      />

      {/* MOBILE SHEET PANELS */}
      <MobileSheet 
        isOpen={mobileSheetOpen} 
        onClose={() => {
          setMobileSheetOpen(false)
          setActiveTab("home")
        }}
        initialPosition="partial"
        footer={mode === "chat" ? (
          <div className="flex relative items-center gap-2">
            <Input 
              inputMode="text"
              placeholder="Rispondi..." 
              value={nuovaRisposta} 
              onChange={(e) => setNuovaRisposta(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && inviaRisposta()} 
              className="pr-14"
            />
            <Button 
              onClick={inviaRisposta}
              size="icon" 
              className="absolute right-1 top-1 bottom-1 w-11 h-11 rounded-xl m-0 flex items-center justify-center bg-[var(--color-brand-blue)] text-white"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        ) : undefined}
      >
        <div className="pt-0 pb-2">
          {mode === "feed" && renderFeedContent()}
          {mode === "chat" && renderChatContent()}
          {mode === "account" && (
            <AccountView 
              utenteLoggato={utenteLoggato} 
              mioNickname={mioNickname} 
              setMioNickname={setMioNickname} 
              nicknameErrorMessage={nicknameErrorMessage} 
              accountLoading={accountLoading} 
              appTheme={appTheme}
              setAppTheme={handleSetAppTheme}
              logout={logout} 
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
            />
          )}
        </div>
      </MobileSheet>


      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        chatId={reportChatId}
        rispostaId={reportRispostaId}
        nickname={mioNickname}
      />

      <ModalsContainer 
        mostraModaleComponi={mostraModaleComponi} 
        setMostraModaleComponi={setMostraModaleComponi} 
        nuovoMessaggio={nuovoMessaggio} 
        setNuovoMessaggio={setNuovoMessaggio} 
        creaChat={creaChat} 
        cittaSimulata={CITTA_TEST.find(c => c.id === gpsSimulato)?.nome || ''} 
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
      />
    </div>
  )
}
