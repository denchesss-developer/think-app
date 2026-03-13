"use client"

import dynamic from 'next/dynamic'
import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import * as THREE from 'three'
import Supercluster from 'supercluster'

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
  onMarkerClick: (chat: Chat) => void
  arcsViaggio?: { id: string, startLat: number, startLng: number, endLat: number, endLng: number }[]
}

// ─── Tipo per elementi visualizzati (Marker o Cluster) ───────────────────────
type VisualElement = 
  | { type: 'chat'; id: string; lat: number; lng: number; chat: Chat }
  | { type: 'cluster'; id: string; lat: number; lng: number; count: number; clusterId: number }

// ─── Utility: Mappa Altitudine -> Zoom (0-20) ────────────────────────────────
function altitudeToZoom(altitude: number): number {
  const z = Math.round(Math.log2(3 / altitude) + 1)
  return Math.max(0, Math.min(20, z))
}

// ─── Graticola ────────────────────────────────────────────────────────────────
// Computed once at module level (never changes) → zero re-render flicker
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

// ─── Component ────────────────────────────────────────────────────────────────
export function MapGlobe({
  countries,
  chats,
  sidebarOpen,
  isDark,
  onMarkerClick,
  arcsViaggio = []
}: MapGlobeProps) {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef    = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elCache     = useRef<Map<string, any>>(new Map())
  const horizonRafRef = useRef<number | null>(null)
  // Per-marker lat/lng used by the horizon loop (stable reference)
  const markerLatLng = useRef<Map<string, { lat: number, lng: number }>>(new Map())

  const [zoom, setZoom] = useState(2)
  const [visualElements, setVisualElements] = useState<VisualElement[]>([])

  // Istanza Supercluster memoizzata
  const clusterIdx = useMemo(() => {
    const si = new Supercluster({
      radius: 35, // Reduced from 60 for better separation
      maxZoom: 17 // Increased from 15
    })
    
    const points = chats.map(chat => ({
      type: 'Feature' as const,
      properties: { chat, cluster: false, chatId: chat.id },
      geometry: {
        type: 'Point' as const,
        coordinates: [chat.lng, chat.lat]
      }
    }))
    
    si.load(points)
    return si
  }, [chats])

  // Aggiorna gli elementi visuali quando cambiano i dati o lo zoom
  useEffect(() => {
    const clusters = clusterIdx.getClusters([-180, -90, 180, 90], zoom)
    
    const elements: VisualElement[] = []
    
    clusters.forEach(c => {
      const [lng, lat] = c.geometry.coordinates
      const clusterId = c.id as number
      
      if (c.properties.cluster) {
        // Logica Automatica: Espandi se siamo vicini al limite di zoom o se il cluster è "bloccato"
        const expansionZoom = clusterIdx.getClusterExpansionZoom(clusterId)
        
        // Se siamo vicini (zoom>=15) o se il cluster non si romperebbe mai (expansionZoom > maxZoom)
        if (zoom >= 15 || expansionZoom > 17) {
          const leaves = clusterIdx.getLeaves(clusterId, Infinity)
          const count = leaves.length
          
          // Raggio che si riduce mentre zoomi per mantenere i marker vicini ma distinti
          const radius = 1.0 / Math.pow(2, zoom - 14) 
          
          leaves.forEach((leaf, i) => {
            const angle = (i / count) * Math.PI * 2
            const offsetLat = Math.cos(angle) * radius
            const offsetLng = Math.sin(angle) * radius
            
            elements.push({
              type: 'chat',
              id: leaf.properties.chatId,
              lat: lat + offsetLat,
              lng: lng + offsetLng,
              chat: leaf.properties.chat
            })
          })
        } else {
          elements.push({
            type: 'cluster',
            id: `cluster-${clusterId}`,
            clusterId,
            lat,
            lng,
            count: c.properties.point_count
          })
        }
      } else {
        elements.push({
          type: 'chat',
          id: String(c.properties.chat.id),
          lat,
          lng,
          chat: c.properties.chat
        })
      }
    })
    
    setVisualElements(elements)
  }, [clusterIdx, zoom])

  // Reset espansioni non più necessario in quanto automatizzato dal calcolo visualElements

  // Initial camera
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 30, lng: 10, altitude: 2.5 }, 0)
    }
  }, [])

  // ─── Horizon Fade Loop ──────────────────────────────────────────────────────
  // Converts each marker's lat/lng to a unit 3D vector, then computes the dot
  // product against the camera view direction. When dot→0 (horizon) the marker
  // fades smoothly out; when dot<0 (back-face) it is completely hidden.
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
      // Standard spherical → Cartesian (matches Three.js Y-up globe convention)
      const mx = Math.cos(latR) * Math.sin(lngR)
      const my = Math.sin(latR)
      const mz = Math.cos(latR) * Math.cos(lngR)

      const dot = mx * camPos.x + my * camPos.y + mz * camPos.z

      // Wide fade zone (~45°): fully visible at dot>=0.7, fully hidden at dot<=0
      const FADE_START = 0.7
      const horizonFactor = dot <= 0 ? 0 : Math.min(1, dot / FADE_START)

      // Read base opacity (0.3 for foglia_secca, 1 otherwise)
      const inner = el.firstElementChild as HTMLElement | null
      const baseOpacity = parseFloat(inner?.dataset.baseOpacity ?? '1')
      const finalOpacity = horizonFactor * baseOpacity

      // ── Key fix: override the library's instant display:none at the horizon ──
      // Force the element visible and control visibility purely via opacity.
      el.style.display = ''
      el.style.opacity = String(finalOpacity)
      // Disable pointer events when fully transparent so invisible markers
      // don't intercept clicks.
      el.style.pointerEvents = finalOpacity < 0.05 ? 'none' : 'auto'
    })

    horizonRafRef.current = requestAnimationFrame(horizonLoop)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start / stop the horizon loop
  useEffect(() => {
    horizonRafRef.current = requestAnimationFrame(horizonLoop)
    return () => {
      if (horizonRafRef.current) cancelAnimationFrame(horizonRafRef.current)
    }
  }, [horizonLoop])

  // Manage stale entries in the cache
  useEffect(() => {
    const ids = new Set(visualElements.map(c => c.id))
    elCache.current.forEach((_, id) => { if (!ids.has(id)) elCache.current.delete(id) })
    markerLatLng.current.forEach((_, id) => { if (!ids.has(id)) markerLatLng.current.delete(id) })
  }, [visualElements])

  // Materials computed once per theme change (not every render)
  const globeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: isDark ? '#141416' : '#f4f4f5' }),
    [isDark]
  )

  // Stable marker renderer — handles both single chats and clusters
  const disegnaMarkerGlobo = useCallback((elData: VisualElement): HTMLElement => {
    let el = elCache.current.get(elData.id)

    if (!el) {
      el = document.createElement('div')
      el.addEventListener('wheel', (e: Event) => e.stopPropagation(), { passive: false })
      
      const handleClick = (e: Event) => {
        e.stopPropagation()
        const data = (el as any).__data as VisualElement
        
        if (data.type === 'chat') {
          if (globeRef.current) globeRef.current.pointOfView({ lat: data.lat, lng: data.lng, altitude: 1.8 }, 800)
          onMarkerClick(data.chat)
        } else {
          // Cluster click: zoom in
          const expansionZoom = clusterIdx.getClusterExpansionZoom(data.clusterId)
          const newAltitude = 3 / Math.pow(2, expansionZoom - 1)
          if (globeRef.current) globeRef.current.pointOfView({ lat: data.lat, lng: data.lng, altitude: Math.max(0.1, newAltitude) }, 1000)
        }
      }

      el.addEventListener('mousedown', handleClick)
      el.addEventListener('touchstart', handleClick, { passive: false })

      elCache.current.set(elData.id, el)
    }

    (el as any).__data = elData
    // Keep lat/lng current for the horizon-fade RAF loop
    markerLatLng.current.set(elData.id, { lat: elData.lat, lng: elData.lng })

    if (elData.type === 'cluster') {
      el.dataset.archived = 'false'
      el.style.display = ''
      
      const size = Math.min(64, 40 + Math.log10(elData.count) * 20)
      const bgColor = isDark 
        ? 'rgba(37, 99, 235, 0.85)' 
        : 'rgba(37, 99, 235, 0.9)'
      const shadow = isDark ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 20px rgba(37, 99, 235, 0.4)'

      // Inject pulse animation if not exists
      if (!document.getElementById('globe-cluster-styles')) {
        const style = document.createElement('style')
        style.id = 'globe-cluster-styles'
        style.innerHTML = `
          @keyframes clusterPulse {
            0% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0px rgba(59, 130, 246, 0); }
          }
          .cluster-inner { animation: clusterPulse 2s infinite; }
        `
        document.head.appendChild(style)
      }

      el.innerHTML = `
        <div class="cluster-inner" style="
          width: ${size}px;
          height: ${size}px;
          background: ${bgColor};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
          box-shadow: ${shadow};
          border: 2px solid rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(12px);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        " onmouseover="this.style.transform='scale(1.15)'; this.style.filter='brightness(1.1)'" onmouseout="this.style.transform='scale(1)'; this.style.filter='brightness(1)'">
          ${elData.count}
        </div>`
      return el
    }

    // Single chat marker logic
    const item = elData.chat
    const stato = calcolaStatoVitale(item)
    if (stato === 'archivio') {
      el.dataset.archived = 'true'
      el.style.display = 'none'
      return el
    }
    el.dataset.archived = 'false'
    el.style.display = ''

    const isSbiadita = stato === 'foglia_secca'
    const stile = STILI_STATO[stato]
    const bgColor   = isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(24, 24, 27, 0.95)'
    const textColor = isDark ? 'black' : 'white'
    const shadow    = isDark ? '0 8px 32px rgba(255,255,255,0.2)' : '0 8px 32px rgba(0,0,0,0.3)'

    const baseOpacity = isSbiadita ? 0.3 : 1

    el.innerHTML = `
      <div 
        data-base-opacity="${baseOpacity}"
        style="
          background: ${bgColor};
          padding: 6px 14px; 
          border-radius: 24px;
          box-shadow: ${shadow};
          color: ${textColor};
          font-size: 13px; 
          font-weight: 800; 
          cursor: pointer; 
          pointer-events: auto;
          opacity: ${baseOpacity};
          transform: scale(${stile.globoScale}); 
          backdrop-filter: blur(10px);
          border: 1px solid rgba(128,128,128,0.2);
          display: flex;
          align-items: center;
          gap: 6px;
          transition: transform 0.3s ease;
      " onmouseover="this.style.transform='scale(${stile.globoScale * 1.1})'" onmouseout="this.style.transform='scale(${stile.globoScale})'">
        <span style="font-size: 1.1em; opacity: 0.9; transform: translateY(-1px); display: inline-block;">${stile.icona}</span> 
        <span>${item.risposte_count > 0 ? item.risposte_count : 'New'}</span>
      </div>`

    return el
  }, [isDark, onMarkerClick, clusterIdx])

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
 
        onZoom={(pov) => setZoom(altitudeToZoom(pov.altitude))}

        htmlElementsData={visualElements}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={(d: any) => disegnaMarkerGlobo(d as VisualElement)}
        htmlTransitionDuration={2000}

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
    </div>
  )
}
