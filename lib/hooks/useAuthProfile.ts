"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { containsBannedWord } from "@/lib/bannedWords"

const getNicknamePromptSeenKey = (userId: string) => `think_nickname_prompt_seen:${userId}`

const hasSeenNicknamePrompt = (userId: string) => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(getNicknamePromptSeenKey(userId)) === 'true'
}

const markNicknamePromptSeen = (userId: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(getNicknamePromptSeenKey(userId), 'true')
}

const clearNicknamePromptSeen = (userId: string) => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(getNicknamePromptSeenKey(userId))
}

export function nicknameErrorMessage(nick: string) {
  const n = (nick || "").trim()
  if (n.toLowerCase() === 'anonimo') return "Scegli un nickname diverso da Anonimo"
  if (n.length < 3) return "Minimo 3 caratteri"
  if (n.length > 20) return "Massimo 20 caratteri"
  if (!/^[a-zA-Z0-9_]+$/.test(n)) return "Solo lettere, numeri e _"
  if (containsBannedWord(n)) return "Nickname non consentito"
  return ""
}

export function useAuthProfile(setMode: (m: any) => void, setActiveTab: (t: any) => void) {
  const [utenteLoggato, setUtenteLoggato] = useState<Utente | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mioNickname, setMioNickname] = useState<string>("")

  // Modals state
  const [mostraPopupLogin, setMostraPopupLogin] = useState(false)
  const [mostraPopupBenvenuto, setMostraPopupBenvenuto] = useState(false)
  const [mostraPopupNicknameObbligatorio, setMostraPopupNicknameObbligatorio] = useState(false)

  // Login inputs
  const [emailLogin, setEmailLogin] = useState("")
  const [loginSent, setLoginSent] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Push notifications onboarding state
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)

  const syncProfileImmediate = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', userId)
        .single()

      if (error) return

      if (!data || !data.nickname || data.nickname.trim() === '') {
        if (!hasSeenNicknamePrompt(userId)) {
          markNicknamePromptSeen(userId)
          setMostraPopupNicknameObbligatorio(true)
          setMostraPopupBenvenuto(false)
        }
      } else {
        setMioNickname(data.nickname)
        if (typeof window !== 'undefined') {
          localStorage.setItem('think_nickname', data.nickname)
        }
        clearNicknamePromptSeen(userId)
        setMostraPopupNicknameObbligatorio(false)
      }
    } catch {
      // Profilo non caricabile
    }
  }, [])

  const syncProfile = useCallback(async () => {
    if (!utenteLoggato) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', utenteLoggato.id)
        .single()

      if (error) return

      // Verifica se il nickname è presente e non vuoto
      if (data && data.nickname && data.nickname.trim() !== '') {
        setMioNickname(data.nickname)
        if (typeof window !== 'undefined') {
          localStorage.setItem('think_nickname', data.nickname)
        }
        clearNicknamePromptSeen(utenteLoggato.id)
        setMostraPopupNicknameObbligatorio(false)
      } else {
        if (!hasSeenNicknamePrompt(utenteLoggato.id)) {
          markNicknamePromptSeen(utenteLoggato.id)
          setMostraPopupNicknameObbligatorio(true)
          setMostraPopupBenvenuto(false)
          setMostraPopupLogin(false)
        }
      }
    } catch {
      // Profilo non sincronizzabile
    }
  }, [utenteLoggato])

  const salvaNicknameSoloLocale = useCallback(async (nickDaSalvare?: string) => {
    const targetNick = nickDaSalvare || mioNickname
    if (!targetNick.trim()) return { error: "Nome non valido" }

    const err = nicknameErrorMessage(targetNick)
    if (err) return { error: err }

    if (sessionId) {
      // Chiama l'RPC per riservare il nickname provvisoriamente
      const { data, error } = await supabase.rpc('reserve_provisional_nickname', {
        p_nickname: targetNick.trim(),
        p_session_id: sessionId
      })

      if (error) {
        return { error: "Errore di connessione." }
      }

      if (!data.success) {
        if (data.error === 'nickname_taken_by_user') return { error: "Nickname preso da un utente registrato." }
        if (data.error === 'nickname_taken_by_guest') return { error: "Nickname preso da un altro ospite ora." }
        return { error: "Nickname non disponibile." }
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('think_nickname', targetNick.trim())
    }
    setMioNickname(targetNick.trim())
    setMostraPopupBenvenuto(false)
    return { success: true }
  }, [mioNickname, sessionId])

  const handleDismissWelcome = useCallback(async () => {
    const defaultNick = "THINKER"
    if (typeof window !== 'undefined') {
      localStorage.setItem('think_nickname', defaultNick)
    }
    setMioNickname(defaultNick)
    setMostraPopupBenvenuto(false)
  }, [])

  const handleCompleteProfile = useCallback(async (nickFinale: string) => {
    const nickPulito = nickFinale.trim()
    const err = nicknameErrorMessage(nickPulito)
    if (err) return { error: { message: err } }

    // RPC SICURO
    const { data, error } = await supabase.rpc('claim_definitive_nickname', {
      p_nickname: nickPulito,
      p_session_id: sessionId || null
    })

    if (error) {
      return { error: { code: 'OTHER' } }
    }

    if (!data.success) {
      if (data.error === 'nickname_taken_by_user') return { error: { code: '23505' } }
      if (data.error === 'nickname_taken_by_guest') return { error: { code: '23505' } }
      return { error: { code: 'OTHER' } }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('think_nickname', nickPulito)
    }
    setMioNickname(nickPulito)
    if (utenteLoggato?.id) {
      clearNicknamePromptSeen(utenteLoggato.id)
    }
    setMostraPopupNicknameObbligatorio(false)
    return { error: null }
  }, [sessionId, utenteLoggato])

  const handleSaveNickname = useCallback(async (newNick: string): Promise<{ success: boolean; error?: string }> => {
    const err = nicknameErrorMessage(newNick)
    if (err) return { success: false, error: err }

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

    if (typeof window !== 'undefined') {
      localStorage.setItem('think_nickname', newNick)
    }
    setMioNickname(newNick)
    return { success: true }
  }, [sessionId, utenteLoggato])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('think_nickname')
    }
    setMioNickname('')
    setUtenteLoggato(null)
    setMostraPopupBenvenuto(true)
    setMode("feed")
    setActiveTab("home")
  }, [setMode, setActiveTab])

  const accediConGoogle = useCallback(async () => {
    setLoginLoading(true)
    setLoginError('')
    const ts = Date.now()
    const redirectTo = typeof window !== 'undefined' && window.location.hostname === 'thethink.space'
      ? `https://thethink.space/?v=${ts}`
      : typeof window !== 'undefined' ? `${window.location.origin}/?v=${ts}` : ''

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
  }, [])

  const inviaMagicLink = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoginError("")

    // Cheat code Dennis
    if (emailLogin === "DennisTest") {
      setLoginLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email: 'dennischeats@thethink.space',
        password: 'DennisTestPassword123!'
      })
      setLoginLoading(false)
      if (error) {
        setLoginError("Errore account di test: " + error.message)
      } else {
        setMostraPopupLogin(false)
        setMostraPopupBenvenuto(false)
      }
      return
    }

    if (!emailLogin || !emailLogin.includes("@")) { setLoginError("Inserisci una email valida"); return }
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: emailLogin,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
    })
    setLoginLoading(false)
    if (error) setLoginError(error.message)
    else setLoginSent(true)
  }, [emailLogin])

  // Bootstrap Auth
  useEffect(() => {
    let currentSessionId = ""
    if (typeof window !== 'undefined') {
      currentSessionId = localStorage.getItem('think_session_id') || ""
      if (!currentSessionId) {
        try {
          currentSessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
        } catch (e) {
          currentSessionId = Math.random().toString(36).substring(2, 15)
        }
        localStorage.setItem('think_session_id', currentSessionId)
      }
    }
    setSessionId(currentSessionId)

    if (typeof window !== 'undefined') {
      (window as any).THINK_VERSION = "v5"

      // Handle OAuth token
      const processOAuth = async () => {
        if (window.location.hash.includes('access_token')) {
          const hash = window.location.hash
          const tokenMatch = hash.match(/access_token=([^&#]+)/)
          const refreshMatch = hash.match(/refresh_token=([^&#]+)/)

          const accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null
          const refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1]) : null

          if (accessToken) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              })

              if (!error && data.session) {
                setUtenteLoggato(data.session.user as unknown as Utente)
              }
            } catch {
              // Sessione OAuth non impostabile
            }
          }
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
      processOAuth()

      // Check for Auth Errors
      const params = new URLSearchParams(window.location.search)
      const errorParam = params.get('error')
      const errorDescParam = params.get('error_description')

      if (errorParam === 'bad_oauth_state' || errorDescParam?.includes('OAuth state')) {
        setLoginError("Errore sessione (OAuth). Se usi l'app di Telegram, prova ad aprire il sito nel browser esterno (Safari/Chrome).")
        setMostraPopupLogin(true)
      } else if (errorParam === 'server_error' || errorDescParam?.includes('Database')) {
        setLoginError("Errore durante la registrazione. Il problema potrebbe essere: 1) Limite utenti raggiunto, 2) Problema temporaneo del database. Riprova tra qualche minuto.")
        setMostraPopupLogin(true)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user as unknown as Utente | null
      const isLoggedIn = !!user && !!user.id && typeof user.id === 'string' && user.id.trim().length > 0

      if (isLoggedIn) {
        setUtenteLoggato(user)
        setMostraPopupLogin(false)
        syncProfileImmediate(user.id)

        const pushDecision = typeof window !== 'undefined' ? localStorage.getItem('think_push_decision') : null
        if (!pushDecision) {
          setTimeout(() => setShowPushPrompt(true), 1500)
        } else if (pushDecision === 'granted') {
          setPushEnabled(true)
        }
      } else {
        setUtenteLoggato(null)
        const nickLocale = typeof window !== 'undefined' ? localStorage.getItem('think_nickname') : null
        if (!nickLocale) {
          setMioNickname('')
          setMostraPopupBenvenuto(true)
        } else {
          setMioNickname(nickLocale)
          setMostraPopupBenvenuto(false)
        }
      }
    }).catch(() => {})

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user as unknown as Utente | null
      setUtenteLoggato(prev => prev?.id === user?.id ? prev : user)
      if (user) setMostraPopupLogin(false)
    })

    const handleOpenLogin = () => {
      setMostraPopupBenvenuto(false)
      setMostraPopupLogin(true)
    }
    window.addEventListener('open-login-modal', handleOpenLogin)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('open-login-modal', handleOpenLogin)
    }
  }, [syncProfileImmediate])

  return {
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
    handleDismissWelcome
  }
}
