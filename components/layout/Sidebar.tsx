"use client"

import React from "react"
import { Sun, Moon, X, Menu, MapPin, Compass, Bookmark, User, Plus, SendHorizontal, Bell, Pencil } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

import Logo from "@/components/ui/Logo"

interface SidebarProps {
  isOpen: boolean
  isDark: boolean
  onToggleOpen: () => void
  onToggleTheme: () => void
  onLogoClick: () => void
  // Navigation (replaced by standalone bottom component)
  bottomNavigation?: React.ReactNode
  // Notification bell
  // Notification bell
  notificationBell?: React.ReactNode
  // Nickname & Level
  nickname: string
  level?: number
  progressToNext?: number
  onEditNickname: () => void
  onOpenProfile?: () => void
  // Content
  children: React.ReactNode
}

const NAV_TABS = [
  { id: "home",     icon: <MapPin  className="w-[22px] h-[22px]" />, label: "Globe"    },
  { id: "esplora",  icon: <Compass className="w-[22px] h-[22px]" />, label: "Feed"     },
  { id: "attivita", icon: <Bookmark className="w-[22px] h-[22px]" />, label: "Attività" },
  { id: "account",  icon: <User    className="w-[22px] h-[22px]" />, label: "Account"  },
]

export function Sidebar({
  isOpen,
  isDark,
  onToggleOpen,
  onToggleTheme,
  onLogoClick,
  bottomNavigation,
  notificationBell,
  nickname,
  level,
  progressToNext,
  onEditNickname,
  onOpenProfile,
  children,
}: SidebarProps) {
  return (
    <>
      {/* Toggle button — always visible outside sidebar */}
      <button
        onClick={onToggleOpen}
        className={`hidden lg:flex fixed top-6 left-6 z-50 p-3 rounded-2xl glass-card text-[var(--color-text-main)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95 shadow-xl ${
          isOpen ? "translate-x-[calc(400px+1.25rem)]" : "translate-x-0"
        }`}
        title={isOpen ? "Chiudi" : "Apri"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar panel */}
      <div
        className={`hidden lg:flex fixed left-6 top-6 bottom-6 flex-col bg-[var(--color-bg-panel)] backdrop-blur-3xl rounded-[2rem] border border-[var(--glass-border,rgba(255,255,255,0.08))] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 w-[400px] shadow-[30px_0_60px_rgba(0,0,0,0.25)] ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-[115%] opacity-0 pointer-events-none"
        }`}
      >
        {/* ── TOP HEADER (Unified Clean Header) ── */}
        <div className="flex-shrink-0 px-6 pt-3 pb-1">
          <div className="flex items-center justify-between">
            <button onClick={onLogoClick} className="group pointer-events-auto -mt-2 shrink-0">
              <Logo isDark={isDark} className="h-28 w-auto drop-shadow-md -ml-4" />
            </button>

            <div className="flex items-center gap-2 pointer-events-auto mt-2 min-w-0 justify-end">
              {/* Pillola Profilo (Nome + Livello) */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 h-10 pl-1 pr-4 rounded-full bg-[var(--color-bg-panel)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-all shrink min-w-0 max-w-[220px]"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                   <span className="text-[13px] font-black text-white">{nickname ? nickname[0].toUpperCase() : 'T'}</span>
                </div>
                <div className="flex flex-col items-start min-w-0 justify-center">
                   <span className="text-[12px] font-black text-[var(--color-text-main)] truncate max-w-full leading-[1.2]">
                     {nickname || 'Thinker'}
                   </span>
                   {level !== undefined && (
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-[1.2]">
                       Lv. {level}
                     </span>
                   )}
                </div>
              </button>

              {/* Notifiche */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-bg-panel)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[var(--glass-border)] hover:bg-[var(--color-bg-hover)] transition-colors shrink-0">
                {notificationBell}
              </div>
            </div>
          </div>
        </div>

        {/* ── MIDDLE CONTENT (scrollable, always shown) ── */}
        <div
          className="flex-1 overflow-y-auto px-6 pb-24 relative z-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>

        {/* ── BOTTOM NAV (mobile bottom bar equivalent) ── */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
          <div className="pointer-events-auto w-full flex justify-center">
            {bottomNavigation}
          </div>
        </div>
      </div>
    </>
  )
}
