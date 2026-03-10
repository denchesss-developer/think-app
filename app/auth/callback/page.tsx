'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Gestisce il token dall'hash dell'URL (OAuth callback)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Errore callback auth:', error)
          setStatus('error')
          setTimeout(() => {
            window.location.href = '/?login_error=true'
          }, 1500)
          return
        }

        if (data.session) {
          setStatus('success')
          
          setTimeout(() => {
            // Se siamo dentro il popup (PWA login in-app)
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage('login_success', window.location.origin)
              window.close() // Chiudi il popup automaticamente
            } else {
              // Se siamo in un normale redirect su stessa tab
              window.location.href = '/'
            }
          }, 800)
        } else {
          // Nessuna sessione, riprova
          setStatus('error')
          setTimeout(() => {
            window.location.href = '/'
          }, 1500)
        }
      } catch (err) {
        console.error('Errore inaspettato:', err)
        setStatus('error')
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
    }

    handleCallback()
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: status === 'success' ? '#0a0a0a' : '#0a0a0a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        gap: '20px',
        transition: 'all 0.3s ease'
      }}
    >
      {status === 'loading' && (
        <>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.2)',
              borderTop: '3px solid #ffffff',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>Completando l'accesso...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize: '48px' }}>✅</div>
          <p style={{ fontSize: '18px', fontWeight: 700 }}>Sei dentro!</p>
          <p style={{ fontSize: '14px', opacity: 0.6 }}>Ritorno all'app...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <p style={{ fontSize: '18px', fontWeight: 700 }}>Qualcosa è andato storto</p>
          <p style={{ fontSize: '14px', opacity: 0.6 }}>Ritorno alla home...</p>
        </>
      )}
    </div>
  )
}
