"use client"

import dynamic from 'next/dynamic'
import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import * as THREE from 'three'
import { Globe as GlobeIcon } from 'lucide-react'
import Supercluster from 'supercluster'

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false })
const AUTO_ROTATE_IDLE_DELAY_MS = 8000
const AUTO_ROTATE_SPEED = 0.18
const MAX_CLUSTER_ZOOM = 15
const MIN_SINGLE_PIN_ZOOM = 10
const OVERVIEW_ALTITUDE = 1.7
const OVERVIEW_DURATION_MS = 1100
const DIRECT_FOCUS_DURATION_MS = 2400

export const STILI_STATO: Record<string, { icona: string, svg: string, nome: string, globoScale: number }> = {
  seme:           { icona: '🌱', svg: '', nome: 'Nuova',    globoScale: 0.8 },
  germoglio:      { icona: '🌿', svg: '', nome: 'Crescita', globoScale: 1.0 },
  albero:         { icona: '🌳', svg: '', nome: 'Popolare', globoScale: 1.2 },
  foglia_secca:   { icona: '🍂', svg: '', nome: 'Inattiva', globoScale: 0.9 },
  archivio:       { icona: '📦', svg: '', nome: 'Archivio', globoScale: 0.8 },
  domanda_notizia: {
    icona: '📰',
    svg: `<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>`,
    nome: 'News', globoScale: 1.0
  },
  domanda_trending: {
    icona: '❔',
    svg: `<path d="M7.34 7.2a4.8 4.8 0 0 1 9.33 1.6c0 3.2-4.8 4.8-4.8 4.8"/><line x1="12" y1="20" x2="12.01" y2="20"/>`,
    nome: 'Trending', globoScale: 1.0
  },
}

export function calcolaStatoVitale(chat: any) {
  const dataCreazione = new Date(chat.created_at).getTime()
  const dataAttivita = new Date(chat.ultima_attivita || chat.created_at).getTime()
  const oreDallaCreazione = (Date.now() - dataCreazione) / (1000 * 60 * 60)
  const oreDallUltimaAttivita = (Date.now() - dataAttivita) / (1000 * 60 * 60)
  const risposte = chat.risposte_count || 0

  if (chat.tipo === 'domanda_notizia') {
    if (risposte === 0 && oreDallaCreazione > 48) return 'archivio'
  }
  if (chat.tipo === 'domanda_trending') {
    if (risposte === 0 && oreDallaCreazione > 24) return 'archivio'
  }
  if (oreDallUltimaAttivita > 720) return 'archivio'
  if (oreDallUltimaAttivita > 336 || (risposte === 0 && oreDallaCreazione > 72)) return 'foglia_secca'
  if (oreDallaCreazione > 72 && risposte >= 5 && oreDallUltimaAttivita <= 168) return 'albero'
  if (risposte >= 2 || (oreDallaCreazione > 24 && risposte > 0)) return 'germoglio'
  return 'seme'
}

interface MapGlobeProps {
  countries: { features: Record<string, unknown>[] }
  chats: any[]
  sidebarOpen: boolean
  isDark: boolean
  onMarkerClick: (chat: any) => void
  arcsViaggio?: { id: string, startLat: number, startLng: number, endLat: number, endLng: number }[]
  autoRotate?: boolean
  filtroAttivo?: string
}

type VisualElement = 
  | { type: 'chat'; id: string; lat: number; lng: number; chat: any }
  | { type: 'cluster'; id: string; lat: number; lng: number; count: number; clusterId: number; properties?: any }

function altitudeToZoom(altitude: number): number {
  return Math.max(0, Math.min(20, Math.round(Math.log2(3 / altitude) + 1)))
}

function zoomToAltitude(zoomLevel: number): number {
  return 3 / Math.pow(2, zoomLevel)
}

export function MapGlobe({
  countries,
  chats,
  sidebarOpen,
  isDark,
  onMarkerClick,
  arcsViaggio = [],
  autoRotate = false,
  filtroAttivo
}: MapGlobeProps) {

  const globeRef = useRef<any>(null)
  const elCache = useRef<Map<string, any>>(new Map())
  const horizonRafRef = useRef<number | null>(null)
  const markerLatLng = useRef<Map<string, { lat: number, lng: number }>>(new Map())
  const focusTransitionTimeoutRef = useRef<number | null>(null)

  const [zoom, setZoom] = useState(2)
  const [visualElements, setVisualElements] = useState<VisualElement[]>([])
  const [globeReady, setGlobeReady] = useState(false)
  const [isZooming, setIsZooming] = useState(false)

  // LOGICA INACTIVITY RESUME
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [internalRotation, setInternalRotation] = useState(autoRotate)

  const clearRotationTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const pauseRotationWithResume = useCallback(() => {
    clearRotationTimer()
    setInternalRotation(false) // Ferma durante l'interazione

    timeoutRef.current = setTimeout(() => {
      if (autoRotate) setInternalRotation(true)
    }, AUTO_ROTATE_IDLE_DELAY_MS)
  }, [autoRotate, clearRotationTimer])

  useEffect(() => {
    if (autoRotate) {
      setInternalRotation(true)
      return
    }

    clearRotationTimer()
    setInternalRotation(false)
  }, [autoRotate, clearRotationTimer])

  useEffect(() => {
    return () => {
      clearRotationTimer()
      if (focusTransitionTimeoutRef.current) {
        window.clearTimeout(focusTransitionTimeoutRef.current)
      }
    }
  }, [clearRotationTimer])

  const MIN_ZOOM = 0
  const MAX_ZOOM = 20

  const handleZoomIn = useCallback(() => {
    if (!globeRef.current || isZooming) return
    setIsZooming(true)
    pauseRotationWithResume()
    const pov = globeRef.current.pointOfView()
    const currentAltitude = pov?.altitude || 3
    const newAltitude = Math.max(0.01, currentAltitude * 0.6)
    globeRef.current.pointOfView({ altitude: newAltitude }, 400)
    setTimeout(() => setIsZooming(false), 450)
  }, [isZooming, pauseRotationWithResume])

  const handleZoomOut = useCallback(() => {
    if (!globeRef.current || isZooming) return
    setIsZooming(true)
    pauseRotationWithResume()
    const pov = globeRef.current.pointOfView()
    const currentAltitude = pov?.altitude || 3
    const newAltitude = Math.min(3, currentAltitude * 1.66)
    globeRef.current.pointOfView({ altitude: newAltitude }, 400)
    setTimeout(() => setIsZooming(false), 450)
  }, [isZooming, pauseRotationWithResume])

  const handleResetView = useCallback(() => {
    if (!globeRef.current || isZooming) return
    setIsZooming(true)
    pauseRotationWithResume()
    globeRef.current.pointOfView({ altitude: OVERVIEW_ALTITUDE }, OVERVIEW_DURATION_MS)
    setZoom(altitudeToZoom(OVERVIEW_ALTITUDE))
    setTimeout(() => setIsZooming(false), OVERVIEW_DURATION_MS)
  }, [isZooming, pauseRotationWithResume])

  // 1. Inizializzazione Supercluster (rimossa la confusione delle onde)
  const clusterIdx = useMemo(() => {
    const si = new Supercluster({ 
      radius: 60, 
      maxZoom: 15,
      map: (props: any) => ({
        news: props.chat?.tipo === 'domanda_notizia' ? 1 : 0,
        trending: props.chat?.tipo === 'domanda_trending' ? 1 : 0,
        standard: (props.chat?.tipo !== 'domanda_notizia' && props.chat?.tipo !== 'domanda_trending') ? 1 : 0
      }),
      reduce: (accumulated: any, props: any) => {
        accumulated.news += props.news;
        accumulated.trending += props.trending;
        accumulated.standard += props.standard;
      }
    }) // Raggio bilanciato
    
    // Escludiamo totalmente i pin in stato 'archivio' e 'foglia_secca' in modo che 
    // le notizie/pensieri "spenti" spariscano dal globo e rimangano solo nel feed
    // A MENO CHE non siamo espressamente nel tab Archivio
    const activeChats = (chats || []).filter(chat => {
      if (filtroAttivo === 'Archivio') return true;
      const stato = calcolaStatoVitale(chat);
      return stato !== 'archivio' && stato !== 'foglia_secca';
    });

    const points = activeChats.map(chat => ({
      type: 'Feature' as const,
      properties: { chat, cluster: false, chatId: chat.id },
      geometry: { type: 'Point' as const, coordinates: [chat.lng, chat.lat] }
    }))
    si.load(points)
    return si
  }, [chats, filtroAttivo])

  // 2. Logica di scompattamento (Spiderfier) quando lo zoom è alto
  useEffect(() => {
    const clusters = clusterIdx.getClusters([-180, -90, 180, 90], zoom)
    const elements: VisualElement[] = []
    
    clusters.forEach(c => {
      const [lng, lat] = c.geometry.coordinates
      const clusterId = c.id as number
      
      // Se siamo vicini (zoom > 9), forziamo l'apertura anche se i pin sono sovrapposti
      if (c.properties.cluster && zoom > 9) {
        const leaves = clusterIdx.getLeaves(clusterId, Infinity)
        leaves.forEach((leaf, index) => {
          // Disponiamo i pin identici in un piccolo cerchio (effetto spirale)
          const angle = (index / leaves.length) * 2 * Math.PI
          const radius = 0.15 / (zoom / 2) // Il raggio si stringe mentre zoommiamo
          
          elements.push({
            type: 'chat',
            id: String(leaf.properties.chat.id),
            lat: leaf.geometry.coordinates[1] + Math.sin(angle) * radius,
            lng: leaf.geometry.coordinates[0] + Math.cos(angle) * radius,
            chat: leaf.properties.chat
          })
        })
      } else if (c.properties.cluster) {
        elements.push({ type: 'cluster', id: `cluster-${clusterId}`, clusterId, lat, lng, count: c.properties.point_count, properties: c.properties })
      } else {
        elements.push({ type: 'chat', id: String(c.properties.chat.id), lat, lng, chat: c.properties.chat })
      }
    })
    setVisualElements(elements)
  }, [clusterIdx, zoom])

  const findClusterContainingChat = useCallback((chatId: number | string, zoomLevel: number) => {
    const clusters = clusterIdx.getClusters([-180, -90, 180, 90], zoomLevel)
    return clusters.find(cluster => {
      if (!cluster.properties.cluster) return false
      const leaves = clusterIdx.getLeaves(cluster.id as number, Infinity)
      return leaves.some(leaf => leaf.properties.chat?.id === chatId)
    }) ?? null
  }, [clusterIdx])

  const focusChatOnGlobe = useCallback((chat: any) => {
    if (!globeRef.current || chat?.lat == null || chat?.lng == null) return

    pauseRotationWithResume()

    if (focusTransitionTimeoutRef.current) {
      window.clearTimeout(focusTransitionTimeoutRef.current)
      focusTransitionTimeoutRef.current = null
    }

    const currentPov = globeRef.current.pointOfView()
    const currentZoomLevel = currentPov?.altitude ? altitudeToZoom(currentPov.altitude) : zoom
    const currentLat = currentPov?.lat ?? Number(chat.lat)
    const currentLng = currentPov?.lng ?? Number(chat.lng)
    const renderedMarkerPosition = markerLatLng.current.get(String(chat.id))
    const targetLat = renderedMarkerPosition?.lat ?? Number(chat.lat)
    const targetLng = renderedMarkerPosition?.lng ?? Number(chat.lng)
    const cluster = findClusterContainingChat(chat.id, Math.min(currentZoomLevel, MAX_CLUSTER_ZOOM))
    const expansionZoom = cluster?.properties.cluster
      ? clusterIdx.getClusterExpansionZoom(cluster.id as number)
      : MIN_SINGLE_PIN_ZOOM
    const finalZoom = Math.max(MIN_SINGLE_PIN_ZOOM, Math.min(expansionZoom + 1, MAX_CLUSTER_ZOOM))
    const finalAltitude = zoomToAltitude(finalZoom)
    const isSwitchingPin = Math.abs(currentLat - targetLat) > 0.2 || Math.abs(currentLng - targetLng) > 0.2

    const startDirectFocus = () => {
      if (!globeRef.current) return
      globeRef.current.pointOfView({
        lat: targetLat,
        lng: targetLng,
        altitude: finalAltitude
      }, DIRECT_FOCUS_DURATION_MS)
    }

    if (isSwitchingPin) {
      globeRef.current.pointOfView({
        lat: currentLat,
        lng: currentLng,
        altitude: OVERVIEW_ALTITUDE
      }, OVERVIEW_DURATION_MS)

      focusTransitionTimeoutRef.current = window.setTimeout(() => {
        focusTransitionTimeoutRef.current = null
        startDirectFocus()
      }, OVERVIEW_DURATION_MS * 0.72)
      return
    }

    startDirectFocus()
  }, [clusterIdx, findClusterContainingChat, pauseRotationWithResume, zoom])

  const horizonLoop = useCallback(function runHorizonLoop() {
    if (!globeRef.current) { horizonRafRef.current = requestAnimationFrame(runHorizonLoop); return; }
    const camera = globeRef.current.camera?.() as THREE.Camera | undefined
    if (!camera) { horizonRafRef.current = requestAnimationFrame(runHorizonLoop); return; }
    const camPos = camera.position.clone().normalize()
    elCache.current.forEach((el, id) => {
      const pos = markerLatLng.current.get(id)
      if (!pos || el.dataset.archived === 'true') return
      const latR = (pos.lat * Math.PI) / 180
      const lngR = (pos.lng * Math.PI) / 180
      const mx = Math.cos(latR) * Math.sin(lngR)
      const my = Math.sin(latR)
      const mz = Math.cos(latR) * Math.cos(lngR)
      const dot = mx * camPos.x + my * camPos.y + mz * camPos.z
      const finalOpacity = dot <= 0 ? 0 : Math.min(1, dot / 0.2)
      el.style.opacity = String(finalOpacity)
      el.style.pointerEvents = finalOpacity < 0.1 ? 'none' : 'auto'
    })
    horizonRafRef.current = requestAnimationFrame(runHorizonLoop)
  }, [])

  useEffect(() => {
    horizonRafRef.current = requestAnimationFrame(horizonLoop)
    return () => { if (horizonRafRef.current) cancelAnimationFrame(horizonRafRef.current) }
  }, [horizonLoop])

  const globeMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: isDark ? '#141416' : '#f4f4f5' }),
    [isDark]
  )

  const disegnaMarkerGlobo = useCallback((elData: VisualElement): HTMLElement => {
    let el = elCache.current.get(elData.id)
    if (!el) {
      el = document.createElement('div')
      const handleClick = (e: Event) => {
        e.stopPropagation()
        pauseRotationWithResume()
        const data = (el as any).__data as VisualElement
        if (data.type === 'chat') {
          onMarkerClick(data.chat)
        } else {
          // Zoom fluido nel cluster
          const expansionZoom = clusterIdx.getClusterExpansionZoom(data.clusterId)
          if (globeRef.current) globeRef.current.pointOfView({ lat: data.lat, lng: data.lng, altitude: 3 / Math.pow(2, expansionZoom) }, 800)
        }
      }
      el.addEventListener('mousedown', handleClick)
      el.addEventListener('touchstart', handleClick, { passive: false })
      elCache.current.set(elData.id, el)
    }

    (el as any).__data = elData
    markerLatLng.current.set(elData.id, { lat: elData.lat, lng: elData.lng })

    if (elData.type === 'cluster') {
      const size = 32 + Math.min(elData.count, 20) // Cluster più piccoli e discreti
      const bgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
      const textColor = isDark ? '#fff' : '#000'

      // Calcola composizione del cluster
      const newsCount = elData.properties?.news || 0;
      const trendingCount = elData.properties?.trending || 0;
      const standardCount = elData.properties?.standard || 0;
      const total = elData.count || 1;

      // ============================================
      // CLUSTER UNIFICATO (Misto o Puro con pillole interne nere e icone colorate)
      // ============================================
      const present = [];
      if (newsCount > 0) present.push({ type: 'news', count: newsCount, bg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', contentHtml: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>` });
      if (trendingCount > 0) present.push({ type: 'trend', count: trendingCount, bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', contentHtml: `<span style="font-weight: 700; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px; color: #fff; line-height: 1; display: inline-flex; align-items: center; justify-content: center; width: 11px; height: 11px; transform: translateY(-0.5px);">?</span>` });
      if (standardCount > 0) present.push({ type: 'std', count: standardCount, bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', contentHtml: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>` });

      let dominantColor = 'rgba(0,0,0,0.15)';
      if (newsCount > 0 && newsCount >= trendingCount) dominantColor = 'rgba(245, 158, 11, 0.4)';
      else if (trendingCount > 0) dominantColor = 'rgba(168, 85, 247, 0.4)';
      else if (standardCount > 0) dominantColor = 'rgba(16, 185, 129, 0.3)';

      if (present.length === 1) {
        const item = present[0];
        el.innerHTML = `
          <div style="transform: scale(1.05); transition: all 0.3s ease; cursor: pointer;">
            <div class="pure-cluster-pulse" style="display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.85); padding: 4px 9px 4px 4px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px);">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: ${item.bg}; display: flex; align-items: center; justify-content: center;">
                ${item.contentHtml}
              </div>
              <span style="font-size: 11px; font-weight: 800; color: #fff;">${item.count}</span>
            </div>
          </div>
          <style>
            @keyframes purePulse {
              0% { box-shadow: 0 0 0 0 ${dominantColor}; }
              70% { box-shadow: 0 0 0 8px ${dominantColor.replace('0.4)', '0)').replace('0.3)', '0)')}; }
              100% { box-shadow: 0 0 0 0 ${dominantColor.replace('0.4)', '0)').replace('0.3)', '0)')}; }
            }
            .pure-cluster-pulse { animation: purePulse 2.5s infinite; }
          </style>
        `;
        return el;
      }

      // Cluster misto → pillola orizzontale compatta
      const pulseFade = dominantColor.replace('0.4)', '0)').replace('0.3)', '0)');
      const clusterAnimId = `cp${elData.clusterId}`;

      const sections = present.map((item, i) => {
        const sep = i < present.length - 1
          ? `<span style="color: rgba(255,255,255,0.25); font-size: 10px; margin: 0 2px;">|</span>`
          : '';
        return `
          <div style="display: flex; align-items: center; gap: 4px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: ${item.bg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${item.contentHtml}
            </div>
            <span style="font-size: 11px; font-weight: 800; color: #fff;">${item.count}</span>
          </div>${sep}`;
      }).join('');

      el.innerHTML = `
        <div style="transform: scale(1.05); transition: transform 0.2s ease; cursor: pointer;">
          <div class="${clusterAnimId}" style="
            display: flex; align-items: center; gap: 3px;
            background: rgba(0,0,0,0.88);
            padding: 3px 8px 3px 4px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.18);
            backdrop-filter: blur(10px);
            white-space: nowrap;
          ">${sections}</div>
        </div>
        <style>
          @keyframes ${clusterAnimId}-a {
            0%  { box-shadow: 0 0 0 0 ${dominantColor}; }
            70% { box-shadow: 0 0 0 7px ${pulseFade}; }
            100%{ box-shadow: 0 0 0 0 ${pulseFade}; }
          }
          .${clusterAnimId} { animation: ${clusterAnimId}-a 2.5s infinite; }
        </style>
      `
      return el
    }

    // Marker Singolo
    const item = elData.chat
    const stato = calcolaStatoVitale(item)
    const stile = STILI_STATO[stato]
    if (stato === 'archivio' && filtroAttivo !== 'Archivio') { el.style.display = 'none'; return el; }

    // Marker Singolo (Unificato per News, Trend e Utenti)
    let pinBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    let iconaHtml = `<span style="font-size: 14px; line-height:1;">${stile.icona}</span>`;
    let shadowColor = 'rgba(16, 185, 129, 0.6)';
    let shadowFade = 'rgba(16, 185, 129, 0)';

    if (item.tipo === 'domanda_notizia') {
      pinBg = 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';
      iconaHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`;
      shadowColor = 'rgba(245, 158, 11, 0.6)';
      shadowFade = 'rgba(245, 158, 11, 0)';
    } else if (item.tipo === 'domanda_trending') {
      pinBg = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)';
      iconaHtml = `<span style="font-weight: 700; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 17px; color: #fff; line-height: 1; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; transform: translateY(-0.5px);">?</span>`;
      shadowColor = 'rgba(124, 58, 237, 0.6)';
      shadowFade = 'rgba(124, 58, 237, 0)';
    }

    const hasCount = item.risposte_count > 0;
    const countHtml = hasCount ? `<span style="font-size: 11px; font-weight: 800;">${item.risposte_count}</span>` : '';
    const borderColor = 'rgba(255, 255, 255, 0.3)';
    const animName = `pulse-${item.id}`;

    // Cerchio se non ci sono risposte, pillola se ci sono
    const shapeStyle = hasCount
      ? `padding: 4px 9px 4px 7px; border-radius: 20px; gap: 4px;`
      : `width: 30px; height: 30px; border-radius: 50%;`;

    el.innerHTML = `
      <div style="transform: scale(${stile.globoScale}); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative; z-index: 1;" 
           onmouseover="this.style.transform='scale(${stile.globoScale * 1.1}) translateY(-2px)'" 
           onmouseout="this.style.transform='scale(${stile.globoScale}) translateY(0)'">
           
        <div style="
          background: ${pinBg}; 
          color: #fff;
          ${shapeStyle}
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${borderColor};
          animation: ${animName} 2.3s infinite;
        ">
          ${iconaHtml}${countHtml}
        </div>
      </div>
      <style>
        @keyframes ${animName} {
          0% { box-shadow: 0 0 0 0 ${shadowColor}; }
          70% { box-shadow: 0 0 0 8px ${shadowFade}; }
          100% { box-shadow: 0 0 0 0 ${shadowFade}; }
        }
      </style>`
    return el
  }, [isDark, onMarkerClick, clusterIdx, pauseRotationWithResume])

  // 3. Configurazione Camera & Auto-Rotazione intelligente
  useEffect(() => {
    if (!globeReady || !globeRef.current) return

    // Esposizione globale per animazioni camera esterne
    ;(window as any).THINK_GLOBE_REF = globeRef.current
    ;(window as any).__THINK_FOCUS_CHAT__ = focusChatOnGlobe

    const controls = globeRef.current.controls()
    controls.autoRotate = internalRotation
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED
    controls.update?.()

    // Listener per l'interazione utente
    const handleStart = () => {
      clearRotationTimer()
      setInternalRotation(false)
    }
    
    const handleEnd = () => {
      pauseRotationWithResume()
    }

    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)
    
    return () => {
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
      if ((window as any).__THINK_FOCUS_CHAT__ === focusChatOnGlobe) {
        delete (window as any).__THINK_FOCUS_CHAT__
      }
    }
  }, [clearRotationTimer, focusChatOnGlobe, globeReady, internalRotation, pauseRotationWithResume])

  return (
    <div
      className={`absolute top-0 right-0 transition-[left] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${sidebarOpen ? "lg:left-[420px]" : "left-0"} max-lg:left-0 lg:bottom-0 max-lg:bottom-[12dvh]`}
      onPointerDownCapture={pauseRotationWithResume}
      onWheelCapture={pauseRotationWithResume}
      onTouchStartCapture={pauseRotationWithResume}
    >
      <Globe
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor={isDark ? "#2563eb" : "#bfdbfe"}
        atmosphereAltitude={0.15}
        globeMaterial={globeMaterial}
        
        polygonsData={countries.features}
        polygonCapColor={() => isDark ? '#27272a' : '#dfe1e5'}
        polygonSideColor={() => isDark ? '#1e1e20' : '#d2d4d9'}
        polygonStrokeColor={() => isDark ? '#52525b' : '#a1a1aa'}
        polygonAltitude={0.025}
        
        onZoom={(pov) => {
          setZoom(altitudeToZoom(pov.altitude))
        }}
        
        htmlElementsData={visualElements}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={(d: any) => disegnaMarkerGlobo(d)}
        htmlTransitionDuration={1200}

        arcsData={arcsViaggio}
        arcColor={() => isDark ? ['rgba(59,130,246,0)', '#3b82f6', 'rgba(59,130,246,0)'] : ['rgba(37,99,235,0)', '#2563eb', 'rgba(37,99,235,0)']}
        arcDashLength={0.4}
        arcDashAnimateTime={15000}
        arcStroke={0.3}
      />

      <div
        className="absolute bottom-6 right-6 hidden lg:flex flex-col gap-2 z-50"
        style={{
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={handleResetView}
          disabled={isZooming}
          className={`
            w-11 h-11 rounded-xl border flex items-center justify-center
            transition-all duration-300 animate-spring active:scale-95
            disabled:opacity-40 disabled:pointer-events-none
            backdrop-blur-xl
            ${isDark 
              ? 'bg-[rgba(20,20,24,0.85)] border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(30,30,38,0.9)] shadow-[0_4px_14px_rgba(0,0,0,0.5)]' 
              : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.1)] text-gray-900 hover:bg-[rgba(255,255,255,0.95)] shadow-[0_4px_14px_rgba(0,0,0,0.15)]'
            }
          `}
          title="Ripristina Vista Globale"
          aria-label="Ripristina Vista"
        >
          <GlobeIcon className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <button
          onClick={handleZoomIn}
          disabled={isZooming || zoom >= MAX_ZOOM}
          className={`
            w-11 h-11 rounded-xl border flex items-center justify-center
            transition-all duration-300 animate-spring active:scale-95
            disabled:opacity-40 disabled:pointer-events-none
            backdrop-blur-xl
            ${isDark 
              ? 'bg-[rgba(20,20,24,0.85)] border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(30,30,38,0.9)] shadow-[0_4px_14px_rgba(0,0,0,0.5)]' 
              : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.1)] text-gray-900 hover:bg-[rgba(255,255,255,0.95)] shadow-[0_4px_14px_rgba(0,0,0,0.15)]'
            }
          `}
          aria-label="Zoom in"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        
        <button
          onClick={handleZoomOut}
          disabled={isZooming || zoom <= MIN_ZOOM}
          className={`
            w-11 h-11 rounded-xl border flex items-center justify-center
            transition-all duration-300 animate-spring active:scale-95
            disabled:opacity-40 disabled:pointer-events-none
            backdrop-blur-xl
            ${isDark 
              ? 'bg-[rgba(20,20,24,0.85)] border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(30,30,38,0.9)] shadow-[0_4px_14px_rgba(0,0,0,0.5)]' 
              : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.1)] text-gray-900 hover:bg-[rgba(255,255,255,0.95)] shadow-[0_4px_14px_rgba(0,0,0,0.15)]'
            }
          `}
          aria-label="Zoom out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
