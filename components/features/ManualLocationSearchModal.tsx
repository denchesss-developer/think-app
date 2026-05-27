"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Search, Loader2, MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/Input"

interface ManualLocationSearchModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  results: any[]
  searchLoading: boolean
  onSearchCity: (q: string) => void
  onSelectCity: (item: any) => void
}

export default function ManualLocationSearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  results,
  searchLoading,
  onSearchCity,
  onSelectCity,
}: ManualLocationSearchModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[var(--color-bg-panel)] rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] z-10 overflow-hidden"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold mb-4 pr-8 text-[var(--color-text-main)] flex items-center gap-2">
              <Search className="w-5 h-5 text-[var(--color-brand-cyan)]" />
              Cerca Città
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  className="w-full bg-[var(--color-bg-hover)] border-none h-12 pl-12 pr-4 rounded-xl text-[16px] focus-visible:ring-1 focus-visible:ring-[var(--color-brand-cyan)]/50 placeholder:text-[var(--color-text-faint)]"
                  placeholder="Es. Roma, Kyoto, New York..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    onSearchCity(e.target.value)
                  }}
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]" />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 -mr-2">
                {searchLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-cyan)] text-opacity-50" />
                  </div>
                ) : results.length > 0 ? (
                  results.map((item: any) => {
                    const cityName = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.address?.suburb || 'Think'
                    const stateName = item.address?.state || ''
                    return (
                      <button
                        key={item.place_id}
                        type="button"
                        onClick={() => {
                          onSelectCity(item)
                          onClose()
                        }}
                        className="w-full text-left p-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors group flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-base)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-brand-cyan)]/10 transition-colors">
                          {item.address?.country_code ? (
                            <img src={`https://flagcdn.com/w20/${item.address.country_code.toLowerCase()}.png`} alt={item.address.country_code} className="w-[18px] h-auto rounded-[2px] shadow-sm" />
                          ) : (
                            <MapPin className="w-4 h-4 text-[var(--color-text-faint)] group-hover:text-[var(--color-brand-cyan)] transition-colors" />
                          )}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-brand-cyan)] transition-colors">
                            {cityName}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                            {stateName ? `${stateName}, ` : ""}{item.display_name}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : searchQuery.length >= 3 ? (
                  <div className="text-center p-4 text-[13px] text-[var(--color-text-muted)] font-medium">
                    Nessun risultato trovato.
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
