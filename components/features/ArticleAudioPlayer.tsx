"use client"

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, FastForward, RotateCcw } from 'lucide-react'

export default function ArticleAudioPlayer({ testata, text, lang = 'it' }: { testata?: string, text: string, lang?: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isSupported, setIsSupported] = useState(true)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false)
      return
    }

    const unmounted = false
    const synth = window.speechSynthesis

    const setupUtterance = () => {
      // Clean string from markdown or double line breaks for smoother reading
      const cleanText = text.replace(/\n/g, '. ').replace(/\\n/g, '. ')
      
      const utterance = new SpeechSynthesisUtterance(`${testata ? testata + '. ' : ''}${cleanText}`)
      // Try to mapping lang to BCP 47
      utterance.lang = lang === 'en' ? 'en-US' : lang === 'it' ? 'it-IT' : lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'de-DE'
      
      utterance.onend = () => {
        if (!unmounted) setIsPlaying(false)
      }
      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e)
        if (!unmounted) setIsPlaying(false)
      }
      
      utteranceRef.current = utterance
    }

    setupUtterance()

    return () => {
      if (synth.speaking) {
        synth.cancel()
      }
    }
  }, [text, lang, testata])

  // Sync rate if changed while speaking
  useEffect(() => {
    if (utteranceRef.current && isPlaying) {
      // Standard SpeechSynthesis requires restart to change pitch/rate mid-speech on many browsers
      // So we just rely on restarting manually if needed, or taking effect on next play
      // But we can try assigning it directly
      utteranceRef.current.rate = playbackRate
      // window.speechSynthesis.cancel()
      // window.speechSynthesis.speak(utteranceRef.current)
    }
  }, [playbackRate, isPlaying])

  const togglePlay = () => {
    if (!window.speechSynthesis || !utteranceRef.current) return

    if (isPlaying) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
    } else {
      utteranceRef.current.rate = playbackRate
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      } else {
        window.speechSynthesis.speak(utteranceRef.current)
      }
      setIsPlaying(true)
    }
  }

  const cycleSpeed = () => {
    setPlaybackRate(r => r === 1 ? 1.5 : r === 1.5 ? 2 : 1)
  }

  const restart = () => {
    if (!window.speechSynthesis || !utteranceRef.current) return
    window.speechSynthesis.cancel()
    if (isPlaying) {
      window.speechSynthesis.speak(utteranceRef.current)
    } else {
      setIsPlaying(false)
    }
  }

  if (!isSupported) return null

  return (
    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 pr-4 rounded-[2rem] border border-zinc-200 dark:border-zinc-700/50 w-fit mb-8 shadow-sm">
      <button 
        onClick={togglePlay}
        className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 hover:scale-105 active:scale-95 transition-all shadow-md"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
      </button>

      <div className="flex flex-col pr-4 border-r border-zinc-200 dark:border-zinc-700">
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-none mb-1">
          Listen to Article
        </span>
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          AI TTS
        </span>
      </div>

      <div className="flex items-center gap-1 pl-1">
        <button 
          onClick={restart}
          className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button 
          onClick={cycleSpeed}
          className="px-3 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-black transition-colors w-12 text-center"
          title="Playback speed"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  )
}
