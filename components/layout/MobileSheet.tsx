"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

type SheetPosition = "hidden" | "partial" | "expanded"

interface MobileSheetProps {
  children: React.ReactNode
  footer?: React.ReactNode
  isOpen: boolean
  onClose: () => void
  initialPosition?: "partial" | "expanded"
}

export function MobileSheet({
  children,
  footer,
  isOpen,
  onClose,
  initialPosition = "partial",
}: MobileSheetProps) {
  const [position, setPosition] = useState<SheetPosition>("hidden")
  const [dragDelta, setDragDelta] = useState(0)
  const [mounted, setMounted] = useState(false)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const prevOpen = useRef(false)

  // Manage open/close transitions
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      // Opening: mount → hidden → animate to initialPosition
      setMounted(true)
      setPosition("hidden")
      setDragDelta(0)
      const t = setTimeout(() => setPosition(initialPosition), 30)
      prevOpen.current = true
      return () => clearTimeout(t)
    } else if (!isOpen && prevOpen.current) {
      // Closing: animate to hidden, then unmount
      setPosition("hidden")
      setDragDelta(0)
      const t = setTimeout(() => {
        setMounted(false)
        prevOpen.current = false
      }, 500)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // When initialPosition changes while open, stay open and update
  useEffect(() => {
    if (isOpen && position !== "hidden") {
      setPosition(initialPosition)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition])

  const close = useCallback(() => {
    setPosition("hidden")
    setDragDelta(0)
    // After animation completes, call onClose to update parent state
    setTimeout(() => {
      setMounted(false)
      prevOpen.current = false
      onClose()
    }, 500)
  }, [onClose])

  // Drag gesture on the handle
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientY - startY.current
    // allow drag only downward
    if (delta > 0) setDragDelta(delta)
    // upward drag: expand
    else if (position === "partial" && delta < -80) {
      setDragDelta(0)
      setPosition("expanded")
      isDragging.current = false
    }
  }

  const onTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (dragDelta > 100) {
      if (position === "expanded") {
        setPosition("partial")
        setDragDelta(0)
      } else {
        close()
      }
    } else {
      setDragDelta(0)
    }
  }


  if (!mounted) return null

  return (
    <>
      {/* Click proxy upper 25vh to close sheet when partial */}
      {position === "partial" && (
        <div 
          className="fixed inset-x-0 top-0 h-[25vh] z-[54] lg:hidden"
          onClick={close}
        />
      )}

      <div
        className={cn(
          "fixed lg:hidden inset-x-0 bottom-0 z-[55] glass-panel flex flex-col",
          "rounded-t-[2.5rem]",
          "shadow-[0_-20px_60px_rgba(0,0,0,0.15)]",
          !isDragging.current && "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          position === "hidden" && "translate-y-full",
          position === "partial" && "h-[75vh] translate-y-0",
          position === "expanded" && "h-[100dvh] translate-y-0 !rounded-none",
        )}
        style={{
          borderBottom: "none",
          touchAction: "none",
          transform: position === "hidden" 
            ? "translateY(100%)" 
            : dragDelta > 0 
              ? `translateY(${dragDelta}px)` 
              : undefined,
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div
          className="w-full flex justify-center pt-5 pb-3 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none relative z-20"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-12 h-1.5 bg-[var(--color-border-strong)] rounded-full opacity-40" />
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 px-5 overflow-y-auto overflow-x-hidden scrollbar-hide min-h-0 pb-4 relative z-10"
          style={{ 
            maskImage: "linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent)", 
            WebkitMaskImage: "-webkit-linear-gradient(top, transparent, black 16px, black calc(100% - 16px), transparent)",
            touchAction: "pan-y",
            overscrollBehavior: "contain",
          }}
        >
          <div className="pt-2">
            {children}
          </div>
        </div>

        {/* Pinned Footer */}
        {footer && (
          <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-[var(--color-border-subtle)] relative z-20 bg-[var(--color-bg-panel)]">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
