import React from "react"

interface ChatCardSkeletonProps {
  count?: number
}

/**
 * Skeleton loading placeholder per le ChatCard nel feed.
 * Mostra un'animazione shimmer mentre i dati vengono caricati.
 */
function SingleSkeleton() {
  return (
    <div className="relative mb-4 rounded-[1.5rem] overflow-hidden glass-panel p-5 flex flex-col gap-3 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[var(--color-text-muted)]/10" />
          <div className="h-3 w-24 rounded-full bg-[var(--color-text-muted)]/10" />
        </div>
        <div className="w-6 h-6 rounded-lg bg-[var(--color-text-muted)]/10" />
      </div>

      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded-full bg-[var(--color-text-muted)]/10" />
        <div className="h-4 w-4/5 rounded-full bg-[var(--color-text-muted)]/10" />
        <div className="h-4 w-3/5 rounded-full bg-[var(--color-text-muted)]/10" />
      </div>

      {/* Geo row */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-[var(--color-text-muted)]/10" />
        <div className="h-3 w-20 rounded-full bg-[var(--color-text-muted)]/10" />
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[var(--color-text-muted)]/5" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-lg bg-[var(--color-text-muted)]/10" />
          <div className="h-6 w-14 rounded-lg bg-[var(--color-text-muted)]/10" />
        </div>
        <div className="h-3 w-16 rounded-full bg-[var(--color-text-muted)]/10" />
      </div>

      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 skeleton-shimmer pointer-events-none"
        aria-hidden="true"
      />
    </div>
  )
}

export function ChatCardSkeleton({ count = 4 }: ChatCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  )
}

export default ChatCardSkeleton
