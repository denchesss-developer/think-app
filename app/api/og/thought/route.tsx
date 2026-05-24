import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const baseUrl = req.nextUrl.origin
  
  const title = searchParams.get('title') || 'Dovremmo chiudere il centro storico alle auto?'
  const authorName = searchParams.get('author') || '@think_user'
  const responses = searchParams.get('responses') || '142'
  
  const initial = authorName.replace('@', '').charAt(0).toUpperCase() || 'T'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          backgroundColor: '#050505',
          backgroundImage: 'radial-gradient(circle at 50% -20%, #1e1e24, #050505)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Enorme virgoletta decorativa di sfondo */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '60px',
            fontSize: '320px',
            color: 'rgba(255,255,255,0.03)',
            fontFamily: 'serif',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          “
        </div>

        {/* Logo in alto al centro */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px', width: '100%' }}>
          {/* Se il PNG non si carica, usa un fallback testuale. 
              Vercel OG supporta path assoluti per le immagini. */}
          <img src={`${baseUrl}/logo-bianco.png`} height="60" alt="Think Logo" style={{ objectFit: 'contain' }} />
        </div>

        {/* Il Pensiero (La domanda) */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 100px',
            textAlign: 'center',
            fontSize: title.length > 80 ? '48px' : '64px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.25,
            letterSpacing: '-0.03em',
            zIndex: 10,
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </div>

        {/* Footer info: Autore e Risposte */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '40px 60px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          {/* Autore */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '32px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 0 0 4px rgba(245,158,11,0.2)',
              }}
            >
              {initial}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
                {authorName}
              </span>
              <span style={{ fontSize: '20px', color: '#a1a1aa', fontWeight: 500 }}>
                Ha condiviso un pensiero
              </span>
            </div>
          </div>

          {/* Social Proof (Risposte) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 28px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '32px' }}>🔥</span>
            <span style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
              {responses} opinioni dal mondo
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
