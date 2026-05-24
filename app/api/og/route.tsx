import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Think — Global Map Debate'
  const subtitle = searchParams.get('subtitle') || 'Condividi la tua opinione sul globo 3D'
  const type = searchParams.get('type') || 'article' // 'article' | 'blog' | 'home'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #050505 0%, #0f0f0f 50%, #1a1208 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '60px 70px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative amber glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Globe / grid decoration */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '60px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '1px solid rgba(245,158,11,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '1px solid rgba(245,158,11,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: '120px',
                opacity: 0.06,
                color: '#f59e0b',
              }}
            >
              ?
            </div>
          </div>
        </div>

        {/* Badge */}
        {type === 'article' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#f59e0b',
              }}
            >
              Think Blog · Daily Dispatch
            </span>
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? '38px' : title.length > 40 ? '44px' : '52px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            maxWidth: '800px',
            marginBottom: '20px',
            letterSpacing: '-0.5px',
          }}
        >
          {title}
        </div>

        {/* Subtitle / debate question */}
        {subtitle && subtitle !== 'Condividi la tua opinione sul globo 3D' && (
          <div
            style={{
              fontSize: '20px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: '700px',
              marginBottom: '32px',
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            &ldquo;{subtitle}&rdquo;
          </div>
        )}

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '24px',
            marginTop: subtitle && subtitle !== 'Condividi la tua opinione sul globo 3D' ? '0' : '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-1px',
              }}
            >
              Think.
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              thethink.space
            </span>
          </div>

          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'rgba(245,158,11,0.8)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              background: 'rgba(245,158,11,0.1)',
              padding: '8px 16px',
              borderRadius: '100px',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            🌍 Global Map Debate
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
