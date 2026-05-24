"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Leaf, Lock, CheckCircle2, Star, Award,
  Flame, ChevronRight
} from "lucide-react"

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  attivita: { bg: "bg-blue-500/10",   text: "text-blue-400",   glow: "rgba(59,130,246,0.2)" },
  sociale:  { bg: "bg-violet-500/10", text: "text-violet-400", glow: "rgba(139,92,246,0.2)" },
  pensiero: { bg: "bg-amber-500/10",  text: "text-amber-400",  glow: "rgba(251,191,36,0.2)" },
  lettura:  { bg: "bg-emerald-500/10",text: "text-emerald-400",glow: "rgba(52,211,153,0.2)" },
}

// ─── Singola Challenge Card ───────────────────────────────────────────────
interface ChallengeCardProps {
  challenge: Challenge
  userChallenge?: UserChallengeProgress
  isAnonymous: boolean
}

function ChallengeCard({ challenge, userChallenge, isAnonymous }: ChallengeCardProps) {
  const done = userChallenge?.completed === true
  const colors = CATEGORIA_COLORS[challenge.categoria] || CATEGORIA_COLORS.attivita
  const isCounter = challenge.progress_target > 1
  const progressValue = Math.min(challenge.progress_target, userChallenge?.current_value || 0)
  const progressPct = Math.round((progressValue / challenge.progress_target) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-[1.5rem] p-4 border transition-all ${
        !done
          ? "border-transparent bg-white/2 opacity-60"
          : done
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-transparent bg-[var(--color-bg-panel)]"
      }`}
      style={
        !done
          ? { backdropFilter: "blur(20px)", boxShadow: `0 4px 20px ${colors.glow}` }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {/* Icona / stato */}
        <div
          className={`w-10 h-10 rounded-[0.875rem] flex items-center justify-center flex-shrink-0 ${
            done
              ? "bg-emerald-500/20"
              : !done
              ? "bg-white/5"
              : colors.bg
          }`}
        >
          {!done ? (
            <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : done ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <span className="text-lg leading-none">{challenge.icona}</span>
          )}
        </div>

        {/* Testo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[13px] font-bold leading-tight ${
                !done ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-main)]"
              }`}
            >
              {challenge.title}
            </span>
            {isCounter && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {progressValue}/{challenge.progress_target}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-snug">
            {challenge.description}
          </p>
          {isAnonymous && (
            <p className="text-[10px] text-blue-400/80 mt-2 font-semibold">
              Accedi per salvare questa sfida per sempre.
            </p>
          )}
        </div>

        {/* Punti */}
        <div className={`flex items-center gap-1 flex-shrink-0 ${done ? "text-emerald-400" : "text-amber-400"}`}>
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[11px] font-black">{challenge.xp_reward}</span>
          </div>
      </div>

      {/* Progress bar se ha progresso non completo */}
      {!done && isCounter && progressValue > 0 && (
        <div className="mt-3 h-1 rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ─── Recognition Archive ──────────────────────────────────────────────────
function RecognitionArchive({ depthLevels, currentDepthId }: { depthLevels: DepthLevel[]; currentDepthId: number }) {
  const unlocked = depthLevels.filter(d => d.id <= currentDepthId && d.recognition_nome)
  if (unlocked.length === 0) return null

  return (
    <div className="space-y-3">
      {unlocked.map(level => (
        <div
          key={level.id}
          className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15"
        >
          <div className="w-10 h-10 rounded-[0.875rem] bg-amber-500/15 flex items-center justify-center flex-shrink-0"
               style={{ boxShadow: "0 0 12px rgba(251,191,36,0.2)" }}>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-[var(--color-text-main)]">{level.recognition_nome}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-snug">{level.recognition_descrizione}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400/50 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────
interface GamificationViewProps {
  gamification: UserGamification | null
  depthLevels: DepthLevel[]
  challenges: Challenge[]
  userChallenges: UserChallengeProgress[]
  currentDepth: DepthLevel | undefined
  nextDepth: DepthLevel | undefined
  progressToNext: number
  loading: boolean
  isAnonymous?: boolean
}

export function GamificationView({
  gamification,
  depthLevels,
  challenges,
  userChallenges,
  currentDepth,
  nextDepth,
  progressToNext,
  loading,
  isAnonymous = false,
}: GamificationViewProps) {
  const [activeTab, setActiveTab] = useState<"sfide" | "premi">("sfide")
  const [sfideAperte, setSfideAperte] = useState(false)

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-[1.5rem] bg-white/4 animate-pulse" />
        ))}
      </div>
    )
  }

  const currentDepthId = gamification?.depth_level ?? 1
  const thinkPoints    = gamification?.think_points ?? 0
  const streakDays     = gamification?.streak_days ?? 0

  const orderedChallenges = [...challenges].sort((a, b) => a.difficulty_order - b.difficulty_order)

  return (
    <div className="space-y-10 w-full">
      
      {/* ── SEZIONE SFIDE ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-4 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Missioni & Sfide
          </h4>
        </div>
        
        <div className="glass-monolith rounded-[2.5rem] shadow-xl shadow-black/5 border border-white/10 dark:border-white/5 overflow-hidden">
          <button
            onClick={() => setSfideAperte(v => !v)}
            className="w-full flex items-center justify-between p-6 group hover:bg-[var(--color-bg-hover)] transition-colors text-left"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-colors ${sfideAperte ? 'bg-blue-500/10' : 'bg-black/5 dark:bg-white/5'}`}>
                <Flame className={`w-6 h-6 ${sfideAperte ? 'text-blue-500' : 'text-[var(--color-text-muted)]'}`} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-main)]">Le tue Sfide</h3>
                <p className="text-[12px] text-[var(--color-text-muted)] leading-snug mt-1">
                  Completa le missioni per guadagnare punti ed esperienza.
                </p>
                {isAnonymous && (
                  <p className="text-[11px] text-blue-400 mt-2 font-semibold">
                    Accedi per salvare i progressi di queste sfide.
                  </p>
                )}
              </div>
            </div>
            <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-[var(--color-text-muted)] transition-transform duration-300 ${sfideAperte ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>

          {sfideAperte && (
            <div className="px-6 pb-6 space-y-3 pt-2 border-t border-transparent bg-[var(--color-bg-base)]/30">
              {orderedChallenges.map((challenge) => {
                const progress = userChallenges.find((item) => item.challenge_id === challenge.id)
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userChallenge={progress}
                    isAnonymous={isAnonymous}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SEZIONE PREMI (IN ARRIVO) ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between ml-4 mb-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Ricompense
          </h4>
        </div>

        <div className="glass-monolith rounded-[2.5rem] p-6 shadow-xl shadow-black/5 relative overflow-hidden border border-white/10 dark:border-white/5">

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--color-text-main)]">Premi Sbloccabili</h3>
              <p className="text-[12px] text-[var(--color-text-muted)] leading-snug mt-1 max-w-[200px]">
                Presto potrai riscattare badge esclusivi e vantaggi unici.
              </p>
            </div>
          </div>

          <div className="opacity-40 pointer-events-none filter blur-[1px]">
            {currentDepthId === 1 ? (
              <div className="text-center py-6 border border-dashed border-[var(--glass-border)] rounded-2xl">
                <p className="text-3xl mb-2">🌱</p>
                <p className="text-[13px] font-bold text-[var(--color-text-main)]">Premi non ancora visibili</p>
              </div>
            ) : (
              <RecognitionArchive depthLevels={depthLevels} currentDepthId={currentDepthId} />
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}
