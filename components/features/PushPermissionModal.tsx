"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, ShieldCheck, Zap, X } from "lucide-react"
import { GlassPanel } from "@/components/ui/Glass"
import { Button } from "@/components/ui/Button"
import { useLang } from "@/lib/i18n"

interface PushPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function PushPermissionModal({ isOpen, onClose, onConfirm }: PushPermissionModalProps) {
  const { t } = useLang()
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            <GlassPanel className="p-8 relative overflow-hidden flex flex-col items-center text-center">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-brand-blue)] to-transparent opacity-50" />
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>

              <div className="w-20 h-20 bg-[var(--color-brand-blue)]/20 rounded-3xl flex items-center justify-center mb-6 relative">
                 <Bell size={40} className="text-[var(--color-brand-blue)] animate-spring" />
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1] }} 
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[var(--color-bg-card)]" 
                 />
              </div>

              <h2 className="text-2xl font-black mb-3 leading-tight">
                {t('attiva_notifiche') || 'Attiva le Notifiche'}
              </h2>
              <p className="text-[var(--color-text-sub)] text-sm mb-8 leading-relaxed">
                {t('notifiche_desc') || 'Resta connesso con il mondo. Ricevi avvisi istantanei quando qualcuno risponde ai tuoi pensieri o quando nuove idee nascono vicino a te.'}
              </p>

              <div className="grid grid-cols-1 gap-4 w-full mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-xs">
                  <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold opacity-90">{t('privacy_protetta') || 'Privacy Protetta'}</h4>
                    <p className="opacity-50">{t('privacy_desc') || 'Puoi disattivarle in ogni momento dalle impostazioni.'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-xs">
                  <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-lg">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold opacity-90">{t('realtime_veloce') || 'Tempo Reale'}</h4>
                    <p className="opacity-50">{t('realtime_desc') || 'Niente ritardi, ricevi le risposte mentre accadono.'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={handleConfirm} 
                  disabled={loading}
                  className="w-full py-4 text-base"
                >
                  {loading ? t('elaborazione') || 'Attivazione...' : (t('conferma_attivazione') || 'Sì, attiva notifiche')}
                </Button>
                <button 
                  onClick={onClose}
                  className="text-xs opacity-50 hover:opacity-100 py-2 transition-opacity"
                >
                  {t('piu_tardi') || 'Non ora, magari più tardi'}
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
