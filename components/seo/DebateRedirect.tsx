'use client'

import { useEffect } from 'react'

/**
 * Client-side deep link redirect.
 * Google Bot (no JS) → vede la pagina SSR completa → la indicizza.
 * Utente reale (JS attivo) → viene rimandato nell'app con il dibattito già aperto.
 */
export function DebateRedirect({ chatId }: { chatId: number }) {
  useEffect(() => {
    // Piccolo delay per permettere a Google AMP o preview tools di leggere il contenuto
    const timer = setTimeout(() => {
      window.location.replace(`/?news_id=${chatId}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [chatId])

  return null
}
