"use client"

import dynamic from 'next/dynamic'
import { useRef, useEffect } from 'react'
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

  // Archivio Globale: nessuna attività per 30 giorni (720 ore)
  if (oreDallUltimaAttivita > 720) return 'archivio'

  // Foglia Secca: Inattività per > 14 giorni (336 ore) OPPURE 0 risposte dopo i primi 3 giorni (72 ore) di vita
  if (oreDallUltimaAttivita > 336 || (risposte === 0 && oreDallaCreazione > 72)) return 'foglia_secca'

  // Albero: più di 72 ore (3 giorni) di vita, almeno 5 risposte, e attività recente (< 7 giorni / 168 ore)
  if (oreDallaCreazione > 72 && risposte >= 5 && oreDallUltimaAttivita <= 168) return 'albero'

  // Germoglio: Crescita anticipata (>= 2 risposte) OPPURE ha superato le 24h con almeno 1 risposta
  if (risposte >= 2 || (oreDallaCreazione > 24 && risposte > 0)) return 'germoglio'

  // Seme: Default (0-72 ore, < 2 risposte)
  return 'seme'
}

interface MapGlobeProps {
  countries: { features: Record<string, unknown>[] }
  chats: Chat[]
  sidebarOpen: boolean
  isDark: boolean
  gpsSimulato: string
  cittaTest: { id: string, nome: string }[]
  setGpsSimulato: (v: string) => void
  onMarkerClick: (chat: Chat) => void
}

export function MapGlobe({
  countries,
  chats,
  sidebarOpen,
  isDark,
  gpsSimulato,
  cittaTest,
  setGpsSimulato,
  onMarkerClick
}: MapGlobeProps) {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)

  useEffect(() => {
    if (globeRef.current) {
      // De-zoom and center the globe
      globeRef.current.pointOfView({ lat: 30, lng: 10, altitude: 2.5 }, 0)
    }
  }, [])

  const disegnaMarkerGlobo = (item: Chat) => {
    const el = document.createElement('div')
    // Stop wheel events to allow map scrolling
    el.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false })

    const stato = calcolaStatoVitale(item)
    if (stato === 'archivio') return document.createElement('div') // Hidden

    const isSbiadita = stato === 'foglia_secca'
    const stile = STILI_STATO[stato]
    
    const bgColor = isDark 
      ? 'rgba(255, 255, 255, 0.95)' 
      : 'rgba(24, 24, 27, 0.95)'
    
    const textColor = isDark ? 'black' : 'white'
    const shadow = isDark 
      ? '0 8px 32px rgba(255,255,255,0.2)' 
      : '0 8px 32px rgba(0,0,0,0.3)'

    el.innerHTML = `
      <div 
        class="transition-all duration-300 ease-out hover:scale-110 active:scale-95"
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
          opacity: ${isSbiadita ? '0.3' : '1'};
          transform: scale(${stile.globoScale}); 
          backdrop-filter: blur(10px);
          border: 1px solid rgba(128,128,128,0.2);
          display: flex;
          align-items: center;
          gap: 6px;
      ">
        <span style="font-size: 1.1em; opacity: 0.9; transform: translateY(-1px); display: inline-block;">${stile.icona}</span> 
        <span>${item.risposte_count > 0 ? item.risposte_count : 'New'}</span>
      </div>`

    el.addEventListener('mousedown', (e) => { 
      e.stopPropagation()
      onMarkerClick(item)
    })
    
    // Support touch devices
    el.addEventListener('touchstart', (e) => {
      e.stopPropagation()
      onMarkerClick(item)
    }, { passive: false })
    
    return el
  }

  // Generazione Manuale Graticola in stile "nativo" (step a 10 gradi)
  const GRATICULE_STEP = 10;
  const graticuleLines = [];
  
  // Paralleli
  for (let lat = -90; lat <= 90; lat += GRATICULE_STEP) {
    const coords = [];
    for (let lng = -180; lng <= 180; lng += 2.5) { // Risoluzione più alta per sfericità perfetta
      coords.push([lat, lng]);
    }
    graticuleLines.push(coords);
  }
  
  // Meridiani
  for (let lng = -180; lng <= 180; lng += GRATICULE_STEP) {
    const coords = [];
    for (let lat = -90; lat <= 90; lat += 2.5) {
      coords.push([lat, lng]);
    }
    graticuleLines.push(coords);
  }

  return (
    <div className={`absolute top-0 right-0 transition-[left] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center ${sidebarOpen ? "lg:left-[420px]" : "left-0"} max-lg:left-0 lg:bottom-0 max-lg:bottom-[12dvh]`}>
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        showGlobe={true}
        globeMaterial={
          new THREE.MeshBasicMaterial({ 
            color: isDark ? '#141416' : '#f4f4f5',
          })
        }
        showAtmosphere={false}
        showGraticules={false} // Usiamo esclusivamente quella custom per entrambi per avere 100% simmetria di design
        polygonsData={countries.features}
        polygonCapColor={() => isDark ? '#27272a' : '#dfe1e5'}
        polygonSideColor={() => isDark ? '#1e1e20' : '#d2d4d9'} // Colore laterale per creare ombra 3D
        polygonStrokeColor={() => isDark ? '#52525b' : '#a1a1aa'} // Confini nazioni
        polygonAltitude={0.025}
        
        // Graticola Geografica Custom fedele al preset nativo nero
        pathsData={graticuleLines}
        pathPoints={(d: any) => d}
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathColor={() => isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.15)'} // Griglia chiara notevolmente più scura e definita (slate-900 15%)
        pathDashLength={0}
        pathResolution={2} // Altissima risoluzione di curva
        pathStroke={0.5} // Linea morbidissima e sottile

        htmlElementsData={chats} 
        htmlLat="lat" 
        htmlLng="lng" 
        htmlElement={(d: object) => disegnaMarkerGlobo(d as Chat)}
        htmlTransitionDuration={1000}
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
