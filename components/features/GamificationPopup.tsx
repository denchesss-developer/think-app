"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Star, TrendingUp, Zap, Award, Leaf } from "lucide-react"

// ─── Configurazione tipo popup ────────────────────────────────────────────
interface PopupConfig {
  gradient: string
  accentColor: string
  glowColor: string
  icon: React.ReactNode
  label: string
}

function getPopupConfig(item: GamificationPopupItem): PopupConfig {
  switch (item.type) {
    case "challenge_completed":
      return {
        gradient: "from-violet-600/20 via-purple-600/10 to-transparent",
        accentColor: "text-violet-400",
        glowColor: "rgba(139, 92, 246, 0.3)",
        icon: <span className="text-3xl">{item.challengeIcon || "🎯"}</span>,
        label: "SFIDA COMPLETATA",
      }
    case "challenge_progress":
      return {
        gradient: "from-amber-600/20 via-orange-600/10 to-transparent",
        accentColor: "text-amber-400",
        glowColor: "rgba(251, 191, 36, 0.3)",
        icon: <span className="text-3xl">{item.challengeIcon || "📰"}</span>,
        label: "PROGRESSO",
      }
    case "depth_up":
      return {
        gradient: "from-emerald-600/20 via-green-600/10 to-transparent",
        accentColor: "text-emerald-400",
        glowColor: "rgba(52, 211, 153, 0.3)",
        icon: <Leaf className="w-7 h-7 text-emerald-400" />,
        label: "NUOVO LIVELLO",
      }
    case "think_points":
      return {
        gradient: "from-amber-600/20 via-yellow-600/10 to-transparent",
        accentColor: "text-amber-400",
        glowColor: "rgba(251, 191, 36, 0.3)",
        icon: <Zap className="w-7 h-7 text-amber-400" />,
        label: "THINK POINTS",
      }
    case "recognition":
      return {
        gradient: "from-blue-600/20 via-cyan-600/10 to-transparent",
        accentColor: "text-blue-400",
        glowColor: "rgba(59, 130, 246, 0.3)",
        icon: <Award className="w-7 h-7 text-blue-400" />,
        label: "RECOGNITION SBLOCCATA",
      }
    case "anon_notice":
      return {
        gradient: "from-blue-600/20 via-cyan-600/10 to-transparent",
        accentColor: "text-blue-400",
        glowColor: "rgba(59, 130, 246, 0.3)",
        icon: <span className="text-3xl">{item.challengeIcon || "🔐"}</span>,
        label: "SALVA I PROGRESSI",
      }
  }
}

// ─── Contenuto popup per tipo ────────────────────────────────────────────
function PopupContent({ item, config }: { item: GamificationPopupItem; config: PopupConfig }) {
  switch (item.type) {
    case "challenge_completed":
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-1">
            {config.label}
          </p>
          <h3 className="text-lg font-black text-[var(--color-text-main)] leading-tight mb-1">
            {item.challengeTitle}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-amber-400">
              +{item.points} ThinkPoints
            </span>
          </div>
        </>
      )
    case "challenge_progress":
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-1">
            {config.label}
          </p>
          <h3 className="text-lg font-black text-[var(--color-text-main)] leading-tight mb-1">
            {item.challengeTitle}
          </h3>
          <p className="text-[12px] font-bold text-amber-400 mt-2">{item.counterText}</p>
          {item.description && (
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-medium">
              {item.description}
            </p>
          )}
        </>
      )

    case "depth_up":
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-1">
            {config.label}
          </p>
          <h3 className="text-lg font-black text-[var(--color-text-main)] leading-tight mb-1">
            Sei diventato <span className={config.accentColor}>{item.depthName}</span>
          </h3>
          {item.recognitionName && (
            <div className="flex items-center gap-2 mt-2">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-blue-400">
                {item.recognitionName} sbloccata!
              </span>
            </div>
          )}
        </>
      )

    case "think_points":
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-1">
            {config.label}
          </p>
          <h3 className="text-lg font-black text-[var(--color-text-main)] leading-tight mb-1">
            <span className={config.accentColor}>+{item.points}</span> punti guadagnati
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-medium">
            Continua così per salire di livello!
          </p>
        </>
      )

    case "recognition":
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-1">
            {config.label}
          </p>
          <h3 className="text-lg font-black text-[var(--color-text-main)] leading-tight mb-1">
            {item.recognitionName}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-medium">
            Vai al profilo per scoprire il tuo premio
          </p>
        </>
      )
    case "anon_notice":
      return (
        <>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)] mb-1">
            {config.label}
          </p>
          <h3 className="text-lg font-black text-[var(--color-text-main)] leading-tight mb-1">
            {item.challengeTitle || "Accedi per non perdere le sfide"}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-medium">
            {item.description || "Con il login i tuoi progressi restano salvati per sempre."}
          </p>
        </>
      )
  }
}

// ─── Componente popup singolo ─────────────────────────────────────────────
interface SinglePopupProps {
  item: GamificationPopupItem
  onDismiss: (key: string) => void
  onGoToProfile: () => void
}

function SinglePopup({ item, onDismiss, onGoToProfile }: SinglePopupProps) {
  const config = getPopupConfig(item)
  const [progress, setProgress] = useState(100)

  // Auto-dismiss con barra di progresso (8 secondi)
  useEffect(() => {
    const total = 8000
    const interval = 50
    const step = (interval / total) * 100
    const timer = setInterval(() => {
      setProgress(p => {
        if (p <= 0) {
          clearInterval(timer)
          onDismiss(item.popupKey)
          return 0
        }
        return p - step
      })
    }, interval)
    return () => clearInterval(timer)
  }, [item.popupKey, onDismiss])

  return (
    <motion.div
      key={item.popupKey}
      initial={{ opacity: 0, y: -40, scale: 0.92, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative w-full sm:max-w-[380px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl"
      style={{
        background: "var(--color-bg-panel)",
        backdropFilter: "blur(40px) saturate(160%)",
        boxShadow: `0 25px 50px -12px ${config.glowColor}, 0 0 0 1px var(--glass-border)`,
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />

      {/* Contenuto */}
      <div className="relative p-5 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Icona */}
          <div
            className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center"
            style={{
              background: `${config.glowColor.replace("0.3", "0.2")}`,
              boxShadow: `0 0 20px ${config.glowColor}`,
            }}
          >
            {config.icon}
          </div>

          {/* Chiudi */}
          <button
            onClick={() => onDismiss(item.popupKey)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4 text-[var(--color-text-main)]" />
          </button>
        </div>

        {/* Testo */}
        <PopupContent item={item} config={config} />

        {/* Link profilo */}
        {item.type !== "anon_notice" && (
          <button
            onClick={() => { onGoToProfile(); onDismiss(item.popupKey) }}
            className={`mt-5 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-[0.2em] ${config.accentColor} transition-colors flex items-center justify-center gap-2 w-full`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Vai al profilo
          </button>
        )}
      </div>

      {/* Barra progresso auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
        <motion.div
          className={`h-full ${config.accentColor.replace("text-", "bg-")}`}
          style={{ width: `${progress}%`, transition: "width 50ms linear" }}
        />
      </div>
    </motion.div>
  )
}

// ─── Container principale: mostra UNO popup alla volta ───────────────────
interface GamificationPopupProps {
  popupQueue: GamificationPopupItem[]
  onDismiss: (key: string) => void
  onGoToProfile: () => void
}

export function GamificationPopup({ popupQueue, onDismiss, onGoToProfile }: GamificationPopupProps) {
  const current = popupQueue[0] ?? null

  return (
    <div className="fixed top-2 mt-safe left-1/2 -translate-x-1/2 z-[200] w-full px-2 flex justify-center pointer-events-none md:top-6 lg:top-8 lg:left-auto lg:right-8 lg:translate-x-0 lg:w-auto lg:px-0">
      <div className="pointer-events-auto w-full flex justify-center lg:justify-end">
        <AnimatePresence mode="wait">
          {current && (
            <SinglePopup
              key={current.popupKey}
              item={current}
              onDismiss={onDismiss}
              onGoToProfile={onGoToProfile}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
