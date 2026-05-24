"use client"

import { useState, useCallback } from "react"
import { useLang } from "@/lib/i18n"

// Utility to convert ISO country code to Emoji Flag
export function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function useLocationManager() {
  const { t, lang } = useLang()

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; regione: string } | null>(null)
  const isLocationActive = !!userLocation?.regione && userLocation.regione !== t('il_tuo_angolo')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showLocationGuide, setShowLocationGuide] = useState(false)

  // Manual Location Selection Logic
  const [manualSearchQuery, setManualSearchQuery] = useState('')
  const [manualResults, setManualResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [mostraRicercaManualeChat, setMostraRicercaManualeChat] = useState(false)

  const ottieniCoordinate = useCallback(async (): Promise<{ lat: number; lng: number; regione: string } | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          // Reverse geocode with Nominatim using current app language
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
              { headers: { 'Accept-Language': lang } }
            )
            const data = await res.json()
            const addr = data.address || {}

            const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || addr.state || 'Think'
            const countryCode = addr.country_code ? addr.country_code.toUpperCase() : 'IT'
            const flag = getFlagEmoji(countryCode)
            const regione = `${cityName} ${flag}`

            resolve({ lat, lng, regione })
          } catch {
            resolve(null)
          }
        },
        () => {
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }, [lang])

  const updateLocation = useCallback(async (showErrors = false) => {
    setLocationLoading(true)
    setLocationError(null)

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      if (showErrors) alert("Attenzione: La geolocalizzazione richiede una connessione sicura (HTTPS). La tua connessione attuale non permette l'accesso al GPS.")
      setLocationLoading(false)
      return
    }

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
        if (status.state === 'denied') {
          if (showErrors) alert("Hai bloccato l'accesso alla posizione per questo sito.\n\nPer abilitarla, clicca sull'icona della posizione o del lucchetto nella barra degli indirizzi in alto (o nelle impostazioni del browser su smartphone) e consenti l'accesso alla posizione, poi riprova.")
          setLocationError("Permesso negato. Riabilita la posizione nelle impostazioni del browser.")
          setLocationLoading(false)
          return
        }
      } catch (e) {
        // Permissions API might not support 'geolocation' in all browsers
      }
    }

    try {
      const loc = await ottieniCoordinate()
      if (loc) {
        setUserLocation(loc)
      } else {
        if (showErrors) alert("Impossibile recuperare la posizione. Verifica che il tuo segnale GPS sia attivo o utilizza la ricerca manuale.")
        setLocationError("Impossibile recuperare la posizione.")
        setUserLocation(null)
      }
    } catch {
      if (showErrors) alert("Si è verificato un errore durante il recupero della posizione.")
      setLocationError("Impossibile recuperare la posizione.")
      setUserLocation(null)
    } finally {
      setLocationLoading(false)
    }
  }, [ottieniCoordinate])

  const cercaCitta = useCallback(async (query: string) => {
    if (!query || query.length < 3) return
    setSearchLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'it' } }
      )
      const data = await res.json()
      setManualResults(data)
    } catch {
      // Ricerca manuale fallita silenziosamente
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const selezionaCittaManuale = useCallback((item: any) => {
    const addr = item.address || {}
    const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || addr.state || 'Think'
    const countryCode = addr.country_code ? addr.country_code.toUpperCase() : 'IT'
    const flag = getFlagEmoji(countryCode)
    const regione = `${cityName} ${flag}`

    setUserLocation({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      regione
    })
    setManualResults([])
    setManualSearchQuery('')
    setMostraRicercaManualeChat(false)
  }, [])

  const getEffectiveCoords = useCallback(async () => {
    if (userLocation && userLocation.regione) {
      return userLocation
    }
    const loc = await ottieniCoordinate()
    if (loc) setUserLocation(loc)
    return loc
  }, [userLocation, ottieniCoordinate])

  return {
    userLocation,
    setUserLocation,
    isLocationActive,
    locationLoading,
    setLocationLoading,
    locationError,
    setLocationError,
    showLocationGuide,
    setShowLocationGuide,
    manualSearchQuery,
    setManualSearchQuery,
    manualResults,
    setManualResults,
    searchLoading,
    setSearchLoading,
    mostraRicercaManualeChat,
    setMostraRicercaManualeChat,
    ottieniCoordinate,
    updateLocation,
    cercaCitta,
    selezionaCittaManuale,
    getEffectiveCoords,
    getFlagEmoji
  }
}
