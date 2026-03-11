"use client"

import dynamic from 'next/dynamic'
import { useRef, useEffect, useMemo, useCallback } from 'react'
import { MapPin } from "lucide-react"
import * as THREE from 'three'

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false })

export const STILI_STATO: Record<string, { icona: string, nome: string, globoScale: number }> = {
  seme: { icona: '🌱', nome: 'Nuova', globoScale: 0.8 },
  germoglio: { icona: '🌿', nome: 'Crescita', globoScale: 1.0 },
  albero: { icona: '🌳', nome: 'Popolare', globoScale: 1.2 },
  foglia_secca: { icona: '🍂', nome: 'Inattiva', globoScale: 0.9 },
  archivio: { icona: '📦', nome: 'Archivio', globoScale: 0 }
}

export function calcolaStatoVitale(chat: Chat) {
  const dataCreazione = new Date(chat.created_at).getTime()
  const dataAttivita = new Date(chat.ultima_attivita || chat.created_at).getTime()
  
  const oreDallaCreazione = (Date.now() - dataCreazione) / (1000 * 60 * 60)
  const oreDallUltimaAttivita = (Date.now() - dataAttivita) / (1000 * 60 * 60)
  const risposte = chat.risposte_count || 0

  if (oreDallUltimaAttivita > 720) return 'archivio'
  if (oreDallUltimaAttivita > 336 || (risposte === 0 && oreDallaCreazione > 72)) return 'foglia_secca'
  if (oreDallaCreazione > 72 && risposte >= 5 && oreDallUltimaAttivita <= 168) return 'albero'
  if (risposte >= 2 || (oreDallaCreazione > 24 && risposte > 0)) return 'germoglio'
  return 'seme'
}

interface MapGlobeProps {
  countries: { features: Record<string, unknown>[] }
  chats: Chat[]
  sidebarOpen: boolean
  isDark: boolean
  gpsSimulato: string
  cittaTest: { id: string, nome: string, lat: number | null, lng: number | null, regione: string }[]
  setGpsSimulato: (v: string) => void
  onMarkerClick: (chat: Chat) => void
  arcsViaggio?: { id: string, startLat: number, startLng: number, endLat: number, endLng: number }[]
}

// ─── Pulsating dot CSS ────────────────────────────────────────────────────────
const MARKER_STYLE_ID = 'think-marker-css'
const MARKER_STYLES = `
@keyframes think-ripple {
  0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.7; }
  100% { transform: translate(-50%,-50%) scale(3.5); opacity: 0;   }
}

.tk-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Sizes per state */
.tk-seme      { width: 24px; height: 24px; }
.tk-germoglio { width: 52px; height: 52px; }
.tk-albero    { width: 64px; height: 64px; }
.tk-foglia    { width: 18px; height: 18px; }

/* Central dot */
.tk-dot {
  border-radius: 50%;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}

.tk-seme .tk-dot      { width: 5px;  height: 5px;  background: #90caf9; opacity: 0.75; }
.tk-germoglio .tk-dot { width: 9px;  height: 9px;  background: #4fc3f7; }
.tk-albero .tk-dot    { width: 14px; height: 14px; background: #29b6f6;
  box-shadow: 0 0 0 3px rgba(79,195,247,0.25), 0 0 14px 5px rgba(79,195,247,0.45); }
.tk-foglia .tk-dot    { width: 4px;  height: 4px;  background: #78909c; opacity: 0.35; }

/* Ripple rings */
.tk-ring {
  position: absolute;
  left: 50%; top: 50%;
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(79,195,247,0.65);
  transform: translate(-50%,-50%) scale(1);
  opacity: 0;
  pointer-events: none;
  z-index: 1;
}

/* Germoglio — single slow ring */
.tk-germoglio .tk-ring-1 { animation: think-ripple 2s ease-out infinite; }

/* Albero — two staggered fast rings */
.tk-albero .tk-ring-1 { animation: think-ripple 1s ease-out infinite; }
.tk-albero .tk-ring-2 { animation: think-ripple 1s ease-out infinite 0.4s; }
`

// ─── Graticola ────────────────────────────────────────────────────────────────
const GRATICULE_STEP = 10
const GRATICULE_RES  = 2.5
const graticuleLines: [number, number][][] = []
for (let lat = -90; lat <= 90; lat += GRATICULE_STEP) {
  const row: [number, number][] = []
  for (let lng = -180; lng <= 180; lng += GRATICULE_RES) row.push([lat, lng])
  graticuleLines.push(row)
}
for (let lng = -180; lng <= 180; lng += GRATICULE_STEP) {
  const row: [number, number][] = []
  for (let lat = -90; lat <= 90; lat += GRATICULE_RES) row.push([lat, lng])
  graticuleLines.push(row)
}

// ─── Animated position type ───────────────────────────────────────────────────
interface AnimState {
  fromLat: number; fromLng: number
  toLat:   number; toLng:   number
  start:   number; duration: number
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MapGlobe({
  countries,
  chats,
  sidebarOpen,
  isDark,
  gpsSimulato,
  cittaTest,
  setGpsSimulato,
  onMarkerClick,
  arcsViaggio = []
}: MapGlobeProps) {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef    = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elCache     = useRef<Map<string, any>>(new Map())
  const animMap     = useRef<Map<string, AnimState>>(new Map())
  const rafRef      = useRef<number | null>(null)
  const horizonRafRef = useRef<number | null>(null)
  // 'display' positions that we feed to the Globe (lat/lng may differ from DB during animation)
  const displayRef  = useRef<Map<string, { lat: number, lng: number }>>(new Map())
  // Per-marker lat/lng used by the horizon loop (stable reference)
  const markerLatLng = useRef<Map<string, { lat: number, lng: number }>>(new Map())

  // ─── Inject marker CSS once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById(MARKER_STYLE_ID)) {
      const style = document.createElement('style')
      style.id = MARKER_STYLE_ID
      style.textContent = MARKER_STYLES
      document.head.appendChild(style)
    }
    return () => { document.getElementById(MARKER_STYLE_ID)?.remove() }
  }, [])

  // Initial camera
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 30, lng: 10, altitude: 2.5 }, 0)
    }
  }, [])

  // ─── Horizon Fade Loop ──────────────────────────────────────────────────────
  const horizonLoop = useCallback(() => {
    if (!globeRef.current) {
      horizonRafRef.current = requestAnimationFrame(horizonLoop)
      return
    }
    const camera = globeRef.current.camera?.() as THREE.Camera | undefined
    if (!camera) {
      horizonRafRef.current = requestAnimationFrame(horizonLoop)
      return
    }

    const camPos = camera.position.clone().normalize()

    elCache.current.forEach((el, id) => {
      const pos = markerLatLng.current.get(id)
      // Skip permanently hidden (archived) markers
      if (!pos || el.dataset.archived === 'true') return

      const latR = (pos.lat * Math.PI) / 180
      const lngR = (pos.lng * Math.PI) / 180
      const mx = Math.cos(latR) * Math.sin(lngR)
      const my = Math.sin(latR)
      const mz = Math.cos(latR) * Math.cos(lngR)

      const dot = mx * camPos.x + my * camPos.y + mz * camPos.z

      // Fade starts 45° before the horizon (dot=0.7), fully gone at horizon (dot=0)
      const FADE_START = 0.7
      const horizonFactor = dot <= 0 ? 0 : Math.min(1, dot / FADE_START)

      // Force display and control visibility via opacity (overrides library's instant hide)
      el.style.display = ''
      el.style.opacity = String(horizonFactor)
      el.style.pointerEvents = horizonFactor < 0.05 ? 'none' : 'auto'
    })

    horizonRafRef.current = requestAnimationFrame(horizonLoop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    horizonRafRef.current = requestAnimationFrame(horizonLoop)
    return () => { if (horizonRafRef.current) cancelAnimationFrame(horizonRafRef.current) }
  }, [horizonLoop])

  // ─── Radial spread for co-located markers ───────────────────────────────────
  // Groups chats sharing the same ~10km bucket and assigns radial offsets so
  // they don't perfectly overlap. The spread radius is ~25km in lat degrees.
  const spreadChats = useMemo<Chat[]>(() => {
    const buckets = new Map<string, string[]>()
    chats.forEach(c => {
      const k = `${Math.round((c.lat || 0) * 10)},${Math.round((c.lng || 0) * 10)}`
      const arr = buckets.get(k) || []
      arr.push(String(c.id))
      buckets.set(k, arr)
    })

    return chats.map(c => {
      const k = `${Math.round((c.lat || 0) * 10)},${Math.round((c.lng || 0) * 10)}`
      const bucket = buckets.get(k)!
      if (bucket.length <= 1) return c
      const idx = bucket.indexOf(String(c.id))
      const angle = (2 * Math.PI * idx) / bucket.length
      const R = 0.25 // ~25km spread radius
      return {
        ...c,
        lat: (c.lat || 0) + R * Math.sin(angle),
        lng: (c.lng || 0) + R * Math.cos(angle),
      }
    })
  }, [chats])

  // Detect position changes and start RAF animation
  useEffect(() => {
    chats.forEach(chat => {
      const disp = displayRef.current.get(String(chat.id))
      const destLat = chat.lat ?? 0
      const destLng = chat.lng ?? 0

      if (!disp) {
        displayRef.current.set(String(chat.id), { lat: destLat, lng: destLng })
        return
      }

      const existing = animMap.current.get(String(chat.id))
      const alreadyAnimating = existing && existing.toLat === destLat && existing.toLng === destLng
      if (!alreadyAnimating && (disp.lat !== destLat || disp.lng !== destLng)) {
        animMap.current.set(String(chat.id), {
          fromLat: disp.lat, fromLng: disp.lng,
          toLat: destLat,    toLng: destLng,
          start: performance.now(), duration: 8000
        })
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
    })

    const ids = new Set(chats.map(c => String(c.id)))
    displayRef.current.forEach((_, id) => { if (!ids.has(id)) displayRef.current.delete(id) })
    elCache.current.forEach((_, id) => { if (!ids.has(id)) elCache.current.delete(id) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats])

  const tick = useCallback((now: number) => {
    let hasMore = false

    animMap.current.forEach((anim, id) => {
      const t = Math.min(1, (now - anim.start) / anim.duration)
      const e = easeInOut(t)
      const lat = anim.fromLat + (anim.toLat - anim.fromLat) * e
      const lng = anim.fromLng + (anim.toLng - anim.fromLng) * e

      displayRef.current.set(id, { lat, lng })

      if (globeRef.current) {
        const coords = globeRef.current.getCoords?.(lat, lng, 0.015)
        if (coords) {
          const el = elCache.current.get(id)
          if (el) {
            const pos = globeRef.current.toGlobeCoords?.(lat, lng)
            if (pos) {
              el.style.transform = `translate(-50%, -50%) translate3d(${pos.x}px, ${pos.y}px, 0px)`
            }
          }
        }
      }

      if (t < 1) hasMore = true
      else {
        displayRef.current.set(id, { lat: anim.toLat, lng: anim.toLng })
        animMap.current.delete(id)
      }
    })

    rafRef.current = hasMore ? requestAnimationFrame(tick) : null
  }, [])

  // Materials computed once per theme change
  const globeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: isDark ? '#141416' : '#f4f4f5' }),
    [isDark]
  )

  // ─── Pulsating dot marker renderer ──────────────────────────────────────────
  const disegnaMarkerGlobo = useCallback((item: Chat): HTMLElement => {
    let el = elCache.current.get(String(item.id))

    if (!el) {
      el = document.createElement('div')
      el.style.position = 'relative'
      el.addEventListener('wheel', (e: Event) => e.stopPropagation(), { passive: false })

      el.addEventListener('mousedown', (e: Event) => {
        e.stopPropagation()
        const data: Chat = el.__data
        if (globeRef.current) globeRef.current.pointOfView({ lat: data.lat, lng: data.lng, altitude: 1.8 }, 800)
        onMarkerClick(data)
      })
      el.addEventListener('touchstart', (e: Event) => {
        e.stopPropagation()
        const data: Chat = el.__data
        if (globeRef.current) globeRef.current.pointOfView({ lat: data.lat, lng: data.lng, altitude: 1.8 }, 800)
        onMarkerClick(data)
      }, { passive: false })

      elCache.current.set(String(item.id), el)
    }

    el.__data = item
    markerLatLng.current.set(String(item.id), { lat: item.lat ?? 0, lng: item.lng ?? 0 })

    const stato = calcolaStatoVitale(item)

    if (stato === 'archivio') {
      el.dataset.archived = 'true'
      el.style.display = 'none'
      return el
    }
    el.dataset.archived = 'false'
    el.style.display = ''

    // Map lifecycle state to CSS class
    const stateClass = stato === 'foglia_secca' ? 'tk-foglia' : `tk-${stato}`

    // mix-blend-mode: screen only in dark mode (light bg makes screen blend invisible)
    const blendStyle = isDark ? 'mix-blend-mode: screen;' : ''

    el.innerHTML = `
      <div class="tk-marker ${stateClass}" style="${blendStyle}">
        <div class="tk-ring tk-ring-1"></div>
        <div class="tk-ring tk-ring-2"></div>
        <div class="tk-dot"></div>
      </div>`

    return el
  // isDark changes theme; onMarkerClick is stable
  }, [isDark, onMarkerClick])

  return (
    <div className={`absolute top-0 right-0 transition-[left] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${sidebarOpen ? "lg:left-[420px]" : "left-0"} max-lg:left-0 lg:bottom-0 max-lg:bottom-[12dvh]`}>
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        showGlobe={true}
        globeMaterial={globeMaterial}
        showAtmosphere={false}
        showGraticules={false}
        polygonsData={countries.features}
        polygonCapColor={() => isDark ? '#27272a' : '#dfe1e5'}
        polygonSideColor={() => isDark ? '#1e1e20' : '#d2d4d9'}
        polygonStrokeColor={() => isDark ? '#52525b' : '#a1a1aa'}
        polygonAltitude={0.025}
        
        pathsData={graticuleLines}
        pathPoints={(d: unknown) => d as [number, number][]}
        pathPointLat={(p: unknown) => (p as [number, number])[0]}
        pathPointLng={(p: unknown) => (p as [number, number])[1]}
        pathColor={() => isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.15)'}
        pathDashLength={0}
        pathResolution={2}
        pathStroke={0.5}

        htmlElementsData={spreadChats}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={(d: object) => disegnaMarkerGlobo(d as Chat)}
        htmlTransitionDuration={8000}

        arcsData={arcsViaggio}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => isDark
          ? ['rgba(96,165,250,0)', 'rgba(96,165,250,0.9)', 'rgba(96,165,250,0)']
          : ['rgba(37,99,235,0)', 'rgba(37,99,235,0.8)', 'rgba(37,99,235,0)']}
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={30000}
        arcStroke={0.5}
        arcAltitudeAutoScale={0.4}
      />

      <div className="absolute top-6 right-6 z-10 hidden sm:flex items-center glass-panel p-2 rounded-xl text-[var(--color-text-muted)] text-xs font-semibold shadow-lg backdrop-blur-3xl">
        <MapPin className="w-4 h-4 mr-2 ml-1" />
        <select 
          className="bg-transparent border-none outline-none cursor-pointer pr-2 font-bold text-[var(--color-text-main)] appearance-none" 
          value={gpsSimulato} 
          onChange={(e) => setGpsSimulato(e.target.value)}
        >
          {cittaTest.map(c => <option key={c.id} value={c.id} className="bg-[var(--color-bg-base)] text-[var(--color-text-main)]">{c.nome}</option>)}
        </select>
      </div>
    </div>
  )
}
